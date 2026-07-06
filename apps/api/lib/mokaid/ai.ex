defmodule Mokaid.AI do
  @moduledoc """
  AI run orchestration: dispatches task execution to the Python worker
  (SQS in production, direct HTTP in dev) and processes worker callbacks.
  """

  alias Mokaid.Agents
  alias Mokaid.Agents.SkillLearning
  alias Mokaid.Billing
  alias Mokaid.Notifications
  alias Mokaid.Realtime
  alias Mokaid.Tasks
  alias Mokaid.Tasks.Task, as: WorkTask

  @doc "Creates an execution run for a task and dispatches it to the AI worker."
  def start_run(%WorkTask{} = task, input \\ %{}) do
    with :ok <- validate_ai_assignable(task),
         {:ok, run} <- Tasks.create_execution_run(task, input) do
      agent = Agents.get_agent(task.workspace_id, task.assigned_agent_id)

      if agent do
        Agents.change_status(agent, "busy", current_task_id: task.id, reason: "ai_run")
      end

      # Move the task to in_progress immediately so the dashboard shows it.
      if task.status in ["to_do"] do
        Tasks.update_task(task, %{"status" => "in_progress"})
      end

      Realtime.broadcast_workspace(task.workspace_id, "task.run_started", %{
        task_id: task.id,
        run_id: run.id,
        title: task.title,
        agent_id: agent && agent.id,
        agent_name: agent && agent.display_name
      })

      Billing.record_usage(
        task.workspace_id,
        "agent",
        task.assigned_agent_id,
        "ai_request",
        1,
        "request"
      )

      %{run_id: run.id, workspace_id: task.workspace_id}
      |> Mokaid.AI.Workers.DispatchWorker.new()
      |> Oban.insert()

      {:ok, run}
    end
  end

  defp validate_ai_assignable(%WorkTask{assigned_agent_id: nil}), do: {:error, :no_agent_assigned}
  defp validate_ai_assignable(_task), do: :ok

  @doc "Handles a progress callback from the AI worker."
  def handle_progress(run_id, attrs) do
    with %{} = run <- Tasks.get_run(run_id),
         {:ok, updated_run} <- Tasks.update_run_progress(run, attrs) do
      # Sync task status when the worker signals it has actually started running.
      if attrs["status"] == "running" do
        task = Tasks.get_task(run.workspace_id, run.task_id)

        if task && task.status in ["to_do", "queued"] do
          Tasks.update_task(task, %{"status" => "in_progress"})
        end
      end

      {:ok, updated_run}
    else
      nil -> {:error, :run_not_found}
    end
  end

  def handle_approval_request(run_id, attrs) do
    with %{} = run <- Tasks.get_run(run_id),
         {:ok, run} <- Tasks.update_run_progress(run, %{"status" => "waiting_for_approval"}),
         {:ok, request} <- Tasks.create_approval_request(run, attrs) do
      case Agents.get_agent(run.workspace_id, run.agent_id) do
        nil -> :ok
        agent -> Agents.change_status(agent, "waiting", reason: "approval_requested")
      end

      task = Tasks.get_task(run.workspace_id, run.task_id)

      if task do
        Notifications.notify_member(
          run.workspace_id,
          task.created_by_member_id,
          "approval_requested",
          "Approval needed: #{task.title}",
          body: attrs["summary"] || "An agent is waiting for your approval to continue.",
          resource_type: "task",
          resource_id: task.id
        )
      end

      {:ok, request}
    else
      nil -> {:error, :run_not_found}
      error -> error
    end
  end

  def handle_completion(run_id, output, token_usage \\ %{}, cost_cents \\ 0) do
    with %{} = run <- Tasks.get_run(run_id),
         {:ok, run} <-
           Tasks.update_run_progress(run, %{
             "status" => "completed",
             "output" => output,
             "token_usage" => token_usage,
             "cost_cents" => cost_cents
           }) do
      if cost_cents > 0 do
        Billing.record_usage(run.workspace_id, "agent", run.agent_id, "ai_cost", 1, "run",
          cost_cents: cost_cents
        )
      end

      task = Tasks.get_task(run.workspace_id, run.task_id)

      if task do
        # Only transition to "in_review" when the run actually produced artifacts
        # (the output map carries an "artifacts" list from the Python worker).
        # Otherwise the agent completed but had nothing useful — keep it in_progress.
        artifacts = (output || %{})["artifacts"] || []
        has_output = length(List.wrap(artifacts)) > 0

        new_status = if has_output, do: "in_review", else: task.status
        Tasks.update_task(task, %{"status" => new_status, "progress_percent" => 100})

        # Skill learning — fire-and-forget (does not block the response).
        if run.agent_id do
          case Agents.get_agent(run.workspace_id, run.agent_id) do
            nil -> :ok
            agent -> SkillLearning.record_mission(agent, task, output || %{})
          end
        end

        if has_output do
          Notifications.notify_member(
            run.workspace_id,
            task.created_by_member_id,
            "ai_run_completed",
            "Ready for review: #{task.title}",
            body:
              "The agent finished its work. Review the output and approve or request changes.",
            resource_type: "task",
            resource_id: task.id
          )
        end
      end

      Realtime.broadcast_workspace(run.workspace_id, "task.progress_changed", %{
        task_id: run.task_id,
        run_id: run.id,
        status: "completed",
        title: task && task.title,
        agent_id: run.agent_id
      })

      {:ok, run}
    else
      nil -> {:error, :run_not_found}
      error -> error
    end
  end

  def handle_failure(run_id, error_message) do
    with %{} = run <- Tasks.get_run(run_id),
         {:ok, run} <-
           Tasks.update_run_progress(run, %{"status" => "failed", "error" => error_message}) do
      case Agents.get_agent(run.workspace_id, run.agent_id) do
        nil -> :ok
        agent -> Agents.change_status(agent, "blocked", reason: "run_failed")
      end

      task = Tasks.get_task(run.workspace_id, run.task_id)

      if task do
        # Keep the task in its current status — but store that the latest run failed.
        # The frontend reads latest_run.status == "failed" to show a red error banner.
        Tasks.update_task(task, %{"progress_percent" => 0})

        Notifications.notify_member(
          run.workspace_id,
          task.created_by_member_id,
          "ai_run_failed",
          "Task failed: #{task.title}",
          body: error_message,
          resource_type: "task",
          resource_id: task.id
        )
      end

      Realtime.broadcast_workspace(run.workspace_id, "task.progress_changed", %{
        task_id: run.task_id,
        run_id: run.id,
        status: "failed",
        error: error_message,
        title: task && task.title,
        agent_id: run.agent_id
      })

      {:ok, run}
    else
      nil -> {:error, :run_not_found}
      error -> error
    end
  end

  @doc "Resumes a paused run after a human decision on an approval request."
  def resume_after_approval(run_id, decision) do
    config = Application.fetch_env!(:mokaid, :ai_worker)
    body = %{run_id: run_id, decision: decision}

    case config[:dispatch] do
      :sqs ->
        config[:sqs_queue_url]
        |> ExAws.SQS.send_message(Jason.encode!(Map.put(body, :type, "resume")))
        |> ExAws.request()

      _http ->
        Req.post(
          url: "#{config[:url]}/runs/#{run_id}/resume",
          json: body,
          headers: [{"authorization", "Bearer #{config[:token]}"}],
          retry: false
        )
    end
  end
end
