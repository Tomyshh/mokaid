defmodule Mokaid.AI.Workers.DispatchWorker do
  @moduledoc """
  Dispatches an AI run to the Python worker. Uses SQS in production
  and direct HTTP in development.

  After max_attempts failures the job is discarded and we call
  `cleanup_failed_run/1` to mark the run as failed and release the agent,
  so neither the task nor the agent stay stuck indefinitely.
  """

  use Oban.Worker, queue: :ai_dispatch, max_attempts: 5

  alias Mokaid.Agents
  alias Mokaid.Realtime
  alias Mokaid.Tasks

  @impl Oban.Worker
  def perform(%Oban.Job{args: %{"run_id" => run_id}, attempt: attempt, max_attempts: max_attempts}) do
    config = Application.fetch_env!(:mokaid, :ai_worker)

    case Tasks.get_run(run_id) do
      nil ->
        {:cancel, :run_not_found}

      run ->
        task = Tasks.get_task(run.workspace_id, run.task_id)

        # MCP servers this agent is explicitly allowed to use (permission
        # matrix), with decrypted credentials for the worker's MCP client.
        mcp_servers =
          if run.agent_id do
            Mokaid.MCP.authorized_servers_for_agent(run.workspace_id, run.agent_id)
          else
            []
          end

        # Files dropped/linked at dispatch time, resolved to presigned URLs
        # so the worker can actually read their content.
        attached_files =
          Mokaid.AI.Dispatcher.attached_files(
            run.workspace_id,
            (task && task.metadata["drive_item_ids"]) || run.input["drive_item_ids"] || []
          )

        payload = %{
          run_id: run.id,
          workspace_id: run.workspace_id,
          agent_id: run.agent_id,
          task_id: run.task_id,
          task_title: task && task.title,
          task_description: task && task.description,
          task_priority: task && task.priority,
          task_due_at: task && task.due_at,
          input: run.input,
          attached_files: attached_files,
          mcp_servers: mcp_servers
        }

        result = dispatch(config[:dispatch], payload, config)

        # On the final attempt clean up the run and unblock the agent.
        if result != :ok and attempt >= max_attempts do
          cleanup_failed_run(run, "AI worker unreachable after #{max_attempts} attempts")
        end

        result
    end
  end

  defp dispatch(:http, payload, config) do
    case Req.post(
           url: "#{config[:url]}/runs",
           json: payload,
           headers: [{"authorization", "Bearer #{config[:token]}"}],
           retry: false
         ) do
      {:ok, %{status: status}} when status in 200..299 -> :ok
      {:ok, %{status: status}} -> {:error, "worker returned #{status}"}
      {:error, reason} -> {:error, inspect(reason)}
    end
  end

  # Test/offline environments: the run is recorded but nothing is dispatched.
  defp dispatch(:none, _payload, _config), do: :ok

  defp dispatch(:sqs, payload, config) do
    config[:sqs_queue_url]
    |> ExAws.SQS.send_message(Jason.encode!(payload))
    |> ExAws.request()
    |> case do
      {:ok, _} -> :ok
      {:error, reason} -> {:error, inspect(reason)}
    end
  end

  defp cleanup_failed_run(run, error_message) do
    Tasks.update_run_progress(run, %{"status" => "failed", "error" => error_message})

    if run.agent_id do
      case Agents.get_agent(run.workspace_id, run.agent_id) do
        nil -> :ok
        agent -> Agents.change_status(agent, "idle", reason: "dispatch_failed")
      end
    end

    Realtime.broadcast_workspace(run.workspace_id, "task.progress_changed", %{
      task_id: run.task_id,
      run_id: run.id,
      status: "failed",
      error: error_message,
      agent_id: run.agent_id
    })
  end
end
