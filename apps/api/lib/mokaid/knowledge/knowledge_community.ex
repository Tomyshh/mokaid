defmodule Mokaid.Knowledge.KnowledgeCommunity do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "knowledge_communities" do
    belongs_to :workspace, Mokaid.Workspaces.Workspace
    belongs_to :project, Mokaid.Projects.Project
    belongs_to :agent, Mokaid.Agents.Agent

    field :label, :string
    field :slug, :string
    field :node_count, :integer, default: 0
    field :god_score, :float, default: 0.0
    field :office_zone, :string
    field :metadata, :map, default: %{}

    has_many :nodes, Mokaid.Knowledge.KnowledgeNode, foreign_key: :community_id

    timestamps()
  end

  def changeset(community, attrs) do
    community
    |> cast(attrs, [
      :workspace_id,
      :project_id,
      :agent_id,
      :label,
      :slug,
      :node_count,
      :god_score,
      :office_zone,
      :metadata
    ])
    |> validate_required([:workspace_id, :label, :slug])
    |> unique_constraint([:workspace_id, :slug])
  end
end
