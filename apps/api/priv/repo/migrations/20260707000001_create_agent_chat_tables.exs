defmodule Mokaid.Repo.Migrations.CreateAgentChatTables do
  use Ecto.Migration

  def change do
    # Direct conversation between workspace members and an AI agent — the
    # agent-level DM thread behind the floating chat dock (task threads stay
    # in task_comments).
    create table(:agent_chat_messages) do
      add :workspace_id, references(:workspaces, on_delete: :delete_all), null: false
      add :agent_id, references(:agents, on_delete: :delete_all), null: false
      add :author_kind, :string, null: false
      add :author_member_id, references(:workspace_members, on_delete: :nilify_all)
      add :body, :text, null: false

      timestamps()
    end

    create index(:agent_chat_messages, [:workspace_id, :agent_id, :inserted_at])

    # Per-member read cursor on an agent conversation (unread badge = messages
    # authored by the agent after last_read_at).
    create table(:agent_chat_reads) do
      add :workspace_id, references(:workspaces, on_delete: :delete_all), null: false
      add :agent_id, references(:agents, on_delete: :delete_all), null: false
      add :member_id, references(:workspace_members, on_delete: :delete_all), null: false
      add :last_read_at, :utc_datetime_usec, null: false

      timestamps()
    end

    create unique_index(:agent_chat_reads, [:agent_id, :member_id])
    create index(:agent_chat_reads, [:workspace_id, :member_id])
  end
end
