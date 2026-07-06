defmodule Mokaid.Repo.Migrations.AddDispatchedAtToTaskExecutionRuns do
  use Ecto.Migration

  def change do
    alter table(:task_execution_runs) do
      # Set when the run is actually sent to the AI worker. A "queued" run
      # with dispatched_at nil is waiting in its agent's serial queue.
      add :dispatched_at, :utc_datetime_usec
    end

    create index(:task_execution_runs, [:agent_id, :status])
  end
end
