defmodule Mokaid.AgentChat.ChatRead do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "agent_chat_reads" do
    belongs_to :workspace, Mokaid.Workspaces.Workspace
    belongs_to :agent, Mokaid.Agents.Agent
    belongs_to :member, Mokaid.Members.Member

    field :last_read_at, :utc_datetime_usec

    timestamps()
  end

  def changeset(read, attrs) do
    read
    |> cast(attrs, [:workspace_id, :agent_id, :member_id, :last_read_at])
    |> validate_required([:workspace_id, :agent_id, :member_id, :last_read_at])
    |> unique_constraint([:agent_id, :member_id])
  end
end
