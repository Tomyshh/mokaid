defmodule Mokaid.Knowledge.GraphTest do
  use Mokaid.DataCase, async: true

  alias Mokaid.Knowledge
  alias Mokaid.Knowledge.Graph
  alias Mokaid.Billing

  setup do
    {workspace, _owner} = workspace_fixture()
    Billing.seed_plans()
    {:ok, _} = Billing.change_plan(workspace.id, "starter")
    %{workspace: workspace}
  end

  test "replace_item_graph + path + explain", %{workspace: workspace} do
    {:ok, item} =
      Knowledge.create_item(workspace.id, %{
        "title" => "Refund Policy",
        "type" => "note",
        "status" => "published"
      })

    assert {:ok, 3} =
             Graph.replace_item_graph(item, %{
               "nodes" => [
                 %{"key" => "refund-policy", "label" => "Refund Policy", "kind" => "document"},
                 %{"key" => "acme-corp", "label" => "Acme Corp", "kind" => "org"},
                 %{"key" => "thirty-days", "label" => "30 days", "kind" => "term"}
               ],
               "edges" => [
                 %{
                   "source" => "refund-policy",
                   "target" => "acme-corp",
                   "relation" => "applies_to",
                   "confidence" => "EXTRACTED"
                 },
                 %{
                   "source" => "refund-policy",
                   "target" => "thirty-days",
                   "relation" => "defines",
                   "confidence" => "EXTRACTED"
                 }
               ]
             })

    assert Graph.enabled?(workspace.id)

    path = Graph.shortest_path(workspace.id, "Acme Corp", "30 days")
    assert path.hops >= 1
    assert length(path.path) >= 2

    explained = Graph.explain(workspace.id, "Refund Policy")
    assert explained.node.label == "Refund Policy"
    assert length(explained.connections) == 2

    assert {:ok, count} = Graph.rebuild_communities(workspace.id)
    assert count >= 1

    snapshot = Graph.snapshot(workspace.id)
    assert snapshot.node_count >= 3
    assert snapshot.community_count >= 1
  end

  test "save_outcome tags preferred lessons", %{workspace: workspace} do
    {:ok, item} =
      Knowledge.create_item(workspace.id, %{
        "title" => "Billing",
        "type" => "note",
        "status" => "published"
      })

    assert {:ok, _} =
             Graph.replace_item_graph(item, %{
               "nodes" => [%{"key" => "credits", "label" => "Credits", "kind" => "concept"}],
               "edges" => []
             })

    node = hd(Graph.snapshot(workspace.id).nodes)

    assert {:ok, _} =
             Graph.save_outcome(workspace.id, %{
               "outcome" => "useful",
               "question" => "What are credits?",
               "node_ids" => [node.id]
             })

    reflect = Graph.reflect(workspace.id)
    assert reflect.preferred >= 1
  end
end
