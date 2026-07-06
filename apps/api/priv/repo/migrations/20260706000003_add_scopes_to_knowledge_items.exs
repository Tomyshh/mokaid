defmodule Mokaid.Repo.Migrations.AddScopesToKnowledgeItems do
  use Ecto.Migration

  def change do
    alter table(:knowledge_items) do
      # Three knowledge levels: general (both nil), per-project, per-agent.
      add :project_id, references(:projects, type: :binary_id, on_delete: :nilify_all)
      add :agent_id, references(:agents, type: :binary_id, on_delete: :delete_all)
      # Governance: review cycles keep the knowledge base from rotting.
      add :last_reviewed_at, :utc_datetime_usec
    end

    create index(:knowledge_items, [:workspace_id, :project_id])
    create index(:knowledge_items, [:workspace_id, :agent_id])
  end
end
