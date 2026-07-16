defmodule Mokaid.Repo.Migrations.CreateKnowledgeGraphTables do
  use Ecto.Migration

  def change do
    create table(:knowledge_communities, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all),
        null: false

      add :project_id, references(:projects, type: :binary_id, on_delete: :nilify_all)
      add :agent_id, references(:agents, type: :binary_id, on_delete: :nilify_all)
      add :label, :string, null: false
      add :slug, :string, null: false
      add :node_count, :integer, null: false, default: 0
      add :god_score, :float, null: false, default: 0.0
      add :office_zone, :string
      add :metadata, :map, null: false, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create index(:knowledge_communities, [:workspace_id])
    create unique_index(:knowledge_communities, [:workspace_id, :slug])

    create table(:knowledge_nodes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all),
        null: false

      add :knowledge_item_id,
          references(:knowledge_items, type: :binary_id, on_delete: :delete_all),
          null: false

      add :project_id, references(:projects, type: :binary_id, on_delete: :nilify_all)
      add :agent_id, references(:agents, type: :binary_id, on_delete: :nilify_all)
      add :community_id, references(:knowledge_communities, type: :binary_id, on_delete: :nilify_all)

      add :key, :string, null: false
      add :label, :string, null: false
      add :kind, :string, null: false, default: "concept"
      add :degree, :integer, null: false, default: 0
      add :lesson_status, :string
      add :metadata, :map, null: false, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create index(:knowledge_nodes, [:workspace_id])
    create index(:knowledge_nodes, [:knowledge_item_id])
    create index(:knowledge_nodes, [:community_id])
    create index(:knowledge_nodes, [:workspace_id, :project_id])
    create index(:knowledge_nodes, [:workspace_id, :agent_id])
    create unique_index(:knowledge_nodes, [:workspace_id, :knowledge_item_id, :key])

    create table(:knowledge_edges, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all),
        null: false

      add :knowledge_item_id,
          references(:knowledge_items, type: :binary_id, on_delete: :delete_all),
          null: false

      add :source_node_id, references(:knowledge_nodes, type: :binary_id, on_delete: :delete_all),
        null: false

      add :target_node_id, references(:knowledge_nodes, type: :binary_id, on_delete: :delete_all),
        null: false

      add :relation, :string, null: false
      add :confidence, :string, null: false, default: "INFERRED"
      add :weight, :float, null: false, default: 1.0
      add :metadata, :map, null: false, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create index(:knowledge_edges, [:workspace_id])
    create index(:knowledge_edges, [:knowledge_item_id])
    create index(:knowledge_edges, [:source_node_id])
    create index(:knowledge_edges, [:target_node_id])

    create unique_index(:knowledge_edges, [
             :workspace_id,
             :source_node_id,
             :target_node_id,
             :relation
           ])

    create table(:knowledge_node_chunks, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all),
        null: false

      add :node_id, references(:knowledge_nodes, type: :binary_id, on_delete: :delete_all),
        null: false

      add :chunk_id, references(:knowledge_chunks, type: :binary_id, on_delete: :delete_all),
        null: false

      add :relevance, :float, null: false, default: 1.0

      timestamps(type: :utc_datetime_usec)
    end

    create unique_index(:knowledge_node_chunks, [:node_id, :chunk_id])
    create index(:knowledge_node_chunks, [:workspace_id])
    create index(:knowledge_node_chunks, [:chunk_id])

    create table(:knowledge_graph_outcomes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :workspace_id, references(:workspaces, type: :binary_id, on_delete: :delete_all),
        null: false

      add :agent_id, references(:agents, type: :binary_id, on_delete: :nilify_all)
      add :task_id, references(:tasks, type: :binary_id, on_delete: :nilify_all)
      add :question, :text
      add :answer_summary, :text
      add :outcome, :string, null: false, default: "useful"
      add :node_ids, {:array, :binary_id}, null: false, default: []
      add :metadata, :map, null: false, default: %{}

      timestamps(type: :utc_datetime_usec)
    end

    create index(:knowledge_graph_outcomes, [:workspace_id])
    create index(:knowledge_graph_outcomes, [:agent_id])
    create index(:knowledge_graph_outcomes, [:outcome])
  end
end
