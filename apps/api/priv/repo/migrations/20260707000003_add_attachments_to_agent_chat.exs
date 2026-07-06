defmodule Mokaid.Repo.Migrations.AddAttachmentsToAgentChat do
  use Ecto.Migration

  def change do
    alter table(:agent_chat_messages) do
      # File references delivered with a message (agent outputs, or files a
      # member dropped into the chat). Each entry:
      # %{"drive_item_id" => id, "name" => .., "mime_type" => .., "size_bytes" => ..}
      add :attachments, {:array, :map}, null: false, default: []
      # When a message kicked off (or resulted from) a task, link it so the
      # chat can show "View task" and the run can post back to this thread.
      add :task_id, references(:tasks, on_delete: :nilify_all)
    end
  end
end
