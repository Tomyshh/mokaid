defmodule Mokaid.Knowledge.KnowledgeGraphOutcome do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]

  schema "knowledge_graph_outcomes" do
    belongs_to :workspace, Mokaid.Workspaces.Workspace
    belongs_to :agent, Mokaid.Agents.Agent
    belongs_to :task, Mokaid.Tasks.Task

    field :question, :string
    field :answer_summary, :string
    field :outcome, :string, default: "useful"
    field :node_ids, {:array, :binary_id}, default: []
    field :metadata, :map, default: %{}

    timestamps()
  end

  @outcomes ~w(useful dead_end corrected)

  def changeset(row, attrs) do
    row
    |> cast(attrs, [
      :workspace_id,
      :agent_id,
      :task_id,
      :question,
      :answer_summary,
      :outcome,
      :node_ids,
      :metadata
    ])
    |> validate_required([:workspace_id, :outcome])
    |> validate_inclusion(:outcome, @outcomes)
  end
end
