defmodule Mokaid.Tasks.Workers.StaleRunWorker do
  @moduledoc """
  Fails AI runs that stopped making progress so tasks and agents never stay
  stuck forever:

    * `queued` / `running` runs with no update for #{15} minutes — the worker
      died or never picked them up;
    * `waiting_for_approval` runs that have no pending approval request —
      nothing exists for a human to decide on, so nobody can ever unblock them.
  """

  use Oban.Worker, queue: :default, max_attempts: 3

  import Ecto.Query

  alias Mokaid.Agents
  alias Mokaid.Realtime
  alias Mokaid.Repo
  alias Mokaid.Tasks
  alias Mokaid.Tasks.TaskApprovalRequest
  alias Mokaid.Tasks.TaskExecutionRun

  @stale_after_minutes 15

  @impl Oban.Worker
  def perform(_job) do
    cutoff = DateTime.add(DateTime.utc_now(), -@stale_after_minutes * 60, :second)

    stalled =
      Repo.all(
        from r in TaskExecutionRun,
          where: r.status in ["queued", "running"] and r.updated_at < ^cutoff
      )

    orphaned_waiting =
      Repo.all(
        from r in TaskExecutionRun,
          left_join: a in TaskApprovalRequest,
          on: a.run_id == r.id and a.status == "pending",
          where: r.status == "waiting_for_approval" and r.updated_at < ^cutoff and is_nil(a.id)
      )

    Enum.each(
      stalled,
      &fail_run(&1, "Run stalled: no progress for #{@stale_after_minutes} minutes.")
    )

    Enum.each(
      orphaned_waiting,
      &fail_run(&1, "Run was waiting for an approval request that was never created.")
    )

    :ok
  end

  defp fail_run(run, reason) do
    Tasks.update_run_progress(run, %{"status" => "failed", "error" => reason})

    if run.agent_id do
      case Agents.get_agent(run.workspace_id, run.agent_id) do
        nil -> :ok
        agent -> Agents.change_status(agent, "idle", reason: "stale_run")
      end
    end

    task = Tasks.get_task(run.workspace_id, run.task_id)

    if task && task.status in ["waiting", "in_progress"] do
      Tasks.update_task(task, %{"status" => "to_do", "progress_percent" => 0})
    end

    Realtime.broadcast_workspace(run.workspace_id, "task.progress_changed", %{
      task_id: run.task_id,
      run_id: run.id,
      status: "failed",
      error: reason,
      agent_id: run.agent_id
    })

    # A dead run must not block the agent's queue.
    Mokaid.AI.dispatch_next(run.workspace_id, run.agent_id)
  end
end
