defmodule Mokaid.AI.DispatcherTest do
  use Mokaid.DataCase, async: true

  alias Mokaid.Agents
  alias Mokaid.AI.Dispatcher

  defp create_agent(workspace_id, name, role, skills) do
    {:ok, agent} =
      Agents.create_agent(workspace_id, %{
        "kind" => "ai",
        "display_name" => name,
        "role_title" => role,
        "skills" => Enum.map(skills, &%{"name" => &1, "level" => 80}),
        "ai_enabled" => true
      })

    agent
  end

  describe "analyze/2" do
    test "rejects an empty request" do
      {workspace, _owner} = workspace_fixture()
      assert {:error, :empty_request} = Dispatcher.analyze(workspace.id, %{"instruction" => "  "})
    end

    test "recommends the agent whose skills match the instruction" do
      {workspace, _owner} = workspace_fixture()
      designer = create_agent(workspace.id, "Mia", "Designer", ["figma", "branding", "design"])
      _writer = create_agent(workspace.id, "Leo", "Writer", ["writing", "editing"])

      assert {:ok, analysis} =
               Dispatcher.analyze(workspace.id, %{
                 "instruction" => "Review this figma design and improve the branding"
               })

      assert analysis.recommendation.mode in ["existing_agent", "user_choice"]
      assert analysis.recommendation.agent_id == designer.id
      assert analysis.task.title =~ "figma"
    end

    test "proposes a custom agent when nobody matches" do
      {workspace, _owner} = workspace_fixture()
      _writer = create_agent(workspace.id, "Leo", "Writer", ["writing"])

      assert {:ok, analysis} =
               Dispatcher.analyze(workspace.id, %{
                 "instruction" => "zzqx unmatched request",
                 "files" => [%{"name" => "dataset.csv"}]
               })

      assert analysis.recommendation.mode == "custom_agent"
      assert analysis.recommendation.custom_agent.display_name == "Data Analyst"
    end

    test "detects urgency and derives a bounded title" do
      {workspace, _owner} = workspace_fixture()
      long = String.duplicate("very long instruction ", 20)

      assert {:ok, analysis} =
               Dispatcher.analyze(workspace.id, %{"instruction" => "URGENT: " <> long})

      assert analysis.task.priority == "urgent"
      assert String.length(analysis.task.title) <= 80
    end
  end

  describe "confirm/3" do
    test "creates the task assigned to an existing agent and starts a run" do
      {workspace, owner} = workspace_fixture()
      member = owner_member(workspace, owner)
      agent = create_agent(workspace.id, "Mia", "Designer", ["design"])

      assert {:ok, %{task: task, agent: assigned, run: run}} =
               Dispatcher.confirm(workspace.id, member, %{
                 "instruction" => "Design a landing page",
                 "agent_id" => agent.id,
                 "start_now" => true
               })

      assert task.assigned_agent_id == agent.id
      assert assigned.id == agent.id
      assert task.metadata["source"] == "dispatch"
      assert run != nil
      assert run.task_id == task.id
    end

    test "creates a custom agent on demand" do
      {workspace, owner} = workspace_fixture()
      member = owner_member(workspace, owner)

      assert {:ok, %{task: task, agent: agent}} =
               Dispatcher.confirm(workspace.id, member, %{
                 "instruction" => "Analyze this dataset",
                 "custom_agent" => %{
                   "display_name" => "Data Analyst",
                   "role_title" => "Data Analysis Specialist",
                   "skills" => [%{"name" => "data-analysis", "level" => 75}]
                 }
               })

      assert agent.kind == "ai"
      assert agent.ai_enabled
      assert agent.display_name == "Data Analyst"
      assert task.assigned_agent_id == agent.id
    end

    test "rejects an agent from another workspace" do
      {workspace, owner} = workspace_fixture()
      {other_workspace, _} = workspace_fixture()
      member = owner_member(workspace, owner)
      foreign_agent = create_agent(other_workspace.id, "Spy", "Agent", [])

      assert {:error, :agent_not_found} =
               Dispatcher.confirm(workspace.id, member, %{
                 "instruction" => "Do something",
                 "agent_id" => foreign_agent.id
               })
    end
  end
end
