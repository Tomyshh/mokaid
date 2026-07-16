defmodule Mokaid.Knowledge.KnowledgeEdge do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "knowledge_edges" do
    belongs_to :workspace, Mokaid.Workspaces.Workspace
    belongs_to :knowledge_item, Mokaid.Knowledge.KnowledgeItem
    belongs_to :source_node, Mokaid.Knowledge.KnowledgeNode
    belongs_to :target_node, Mokaid.Knowledge.KnowledgeNode

    field :relation, :string
    field :confidence, :string, default: "INFERRED"
    field :weight, :float, default: 1.0
    field :metadata, :map, default: %{}

    timestamps()
  end

  @confidences ~w(EXTRACTED INFERRED AMBIGUOUS)

  def changeset(edge, attrs) do
    edge
    |> cast(attrs, [
      :workspace_id,
      :knowledge_item_id,
      :source_node_id,
      :target_node_id,
      :relation,
      :confidence,
      :weight,
      :metadata
    ])
    |> validate_required([
      :workspace_id,
      :knowledge_item_id,
      :source_node_id,
      :target_node_id,
      :relation
    ])
    |> validate_inclusion(:confidence, @confidences)
    |> unique_constraint([:workspace_id, :source_node_id, :target_node_id, :relation])
  end
end
