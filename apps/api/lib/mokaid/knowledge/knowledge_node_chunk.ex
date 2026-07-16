defmodule Mokaid.Knowledge.KnowledgeNodeChunk do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "knowledge_node_chunks" do
    belongs_to :workspace, Mokaid.Workspaces.Workspace
    belongs_to :node, Mokaid.Knowledge.KnowledgeNode
    belongs_to :chunk, Mokaid.Knowledge.KnowledgeChunk

    field :relevance, :float, default: 1.0

    timestamps()
  end

  def changeset(link, attrs) do
    link
    |> cast(attrs, [:workspace_id, :node_id, :chunk_id, :relevance])
    |> validate_required([:workspace_id, :node_id, :chunk_id])
    |> unique_constraint([:node_id, :chunk_id])
  end
end
