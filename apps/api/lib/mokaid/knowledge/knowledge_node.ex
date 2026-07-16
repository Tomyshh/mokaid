defmodule Mokaid.Knowledge.KnowledgeNode do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "knowledge_nodes" do
    belongs_to :workspace, Mokaid.Workspaces.Workspace
    belongs_to :knowledge_item, Mokaid.Knowledge.KnowledgeItem
    belongs_to :project, Mokaid.Projects.Project
    belongs_to :agent, Mokaid.Agents.Agent
    belongs_to :community, Mokaid.Knowledge.KnowledgeCommunity

    field :key, :string
    field :label, :string
    field :kind, :string, default: "concept"
    field :degree, :integer, default: 0
    field :lesson_status, :string
    field :metadata, :map, default: %{}

    timestamps()
  end

  @kinds ~w(concept entity person org product process document term)
  @lesson_statuses ~w(preferred tentative contested)

  def changeset(node, attrs) do
    node
    |> cast(attrs, [
      :workspace_id,
      :knowledge_item_id,
      :project_id,
      :agent_id,
      :community_id,
      :key,
      :label,
      :kind,
      :degree,
      :lesson_status,
      :metadata
    ])
    |> validate_required([:workspace_id, :knowledge_item_id, :key, :label])
    |> validate_inclusion(:kind, @kinds)
    |> maybe_validate_lesson_status()
    |> unique_constraint([:workspace_id, :knowledge_item_id, :key])
  end

  defp maybe_validate_lesson_status(changeset) do
    case get_change(changeset, :lesson_status) do
      nil -> changeset
      status when status in @lesson_statuses -> changeset
      _ -> add_error(changeset, :lesson_status, "is invalid")
    end
  end
end
