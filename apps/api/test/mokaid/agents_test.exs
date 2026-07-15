defmodule Mokaid.AgentsTest do
  use Mokaid.DataCase, async: true

  alias Mokaid.Agents
  alias Mokaid.Billing
  alias Mokaid.Billing.Credits

  setup do
    Billing.seed_plans()
    :ok
  end

  defp subscribe!(workspace_id, plan_key) do
    assert {:ok, _} = Billing.change_plan(workspace_id, plan_key)
  end

  describe "create_agent/3" do
    test "creates an AI agent without a linked user" do
      {workspace, _owner} = workspace_fixture()

      assert {:ok, agent} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "ai",
                 "display_name" => "Data Analyst",
                 "archetype_key" => "data_analyst"
               })

      assert agent.kind == "ai"
      assert agent.linked_user_id == nil
      assert agent.slug =~ "data-analyst"
      assert agent.seat_index == 0
      assert agent.level == 1
      assert Enum.any?(agent.skills, &(&1["name"] == "data-analysis"))
    end

    test "ignores forged progression fields from the client" do
      {workspace, _owner} = workspace_fixture()

      assert {:ok, agent} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "ai",
                 "display_name" => "Hacker",
                 "level" => 99,
                 "xp" => 9999,
                 "skills" => [%{"name" => "coding", "level" => 100}],
                 "performance_score" => 100,
                 "archetype_key" => "developer"
               })

      assert agent.level == 1
      assert agent.xp == 0
      refute Enum.any?(agent.skills, &(&1["level"] == 100))
    end

    test "free plan blocks the second agent" do
      {workspace, _owner} = workspace_fixture()
      subscribe!(workspace.id, "free")

      assert {:ok, _} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "ai",
                 "display_name" => "First"
               })

      assert {:error, :agent_limit_reached} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "ai",
                 "display_name" => "Second"
               })
    end

    test "starter plan allows three agents then blocks" do
      {workspace, _owner} = workspace_fixture()
      subscribe!(workspace.id, "starter")

      for i <- 1..3 do
        assert {:ok, _} =
                 Agents.create_agent(workspace.id, %{
                   "kind" => "ai",
                   "display_name" => "Bot #{i}"
                 })
      end

      assert {:error, :agent_limit_reached} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "ai",
                 "display_name" => "Overflow"
               })
    end

    test "professional assigns unique seats and blocks the tenth agent" do
      {workspace, _owner} = workspace_fixture()
      subscribe!(workspace.id, "professional")

      for i <- 0..8 do
        assert {:ok, agent} =
                 Agents.create_agent(workspace.id, %{
                   "kind" => "ai",
                   "display_name" => "Bot #{i}"
                 })

        assert agent.seat_index == i
      end

      assert {:error, :agent_limit_reached} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "ai",
                 "display_name" => "Overflow"
               })
    end

    test "rejects a human_linked agent without a linked user" do
      {workspace, _owner} = workspace_fixture()

      assert {:error, changeset} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "human_linked",
                 "display_name" => "Ava"
               })

      assert %{linked_user_id: _} = errors_on(changeset)
    end

    test "rejects an AI agent with a linked user" do
      {workspace, owner} = workspace_fixture()

      assert {:error, changeset} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "ai",
                 "display_name" => "Bot",
                 "linked_user_id" => owner.id
               })

      assert %{linked_user_id: _} = errors_on(changeset)
    end

    test "archive frees the seat and plan quota" do
      {workspace, _owner} = workspace_fixture()
      subscribe!(workspace.id, "free")

      {:ok, first} =
        Agents.create_agent(workspace.id, %{"kind" => "ai", "display_name" => "One"})

      assert first.seat_index == 0
      assert {:ok, _} = Agents.archive_agent(first)

      {:ok, again} =
        Agents.create_agent(workspace.id, %{"kind" => "ai", "display_name" => "Two"})

      assert again.seat_index == 0
    end

    test "applies a paid boost atomically and rejects insufficient credits" do
      {workspace, _owner} = workspace_fixture()
      subscribe!(workspace.id, "free")

      assert {:error, :insufficient_credits} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "ai",
                 "display_name" => "Boosted",
                 "archetype_key" => "developer",
                 "boost_key" => "boost_l5"
               })

      assert [] = Agents.list_agents(workspace.id)

      assert {:ok, _} = Credits.add_purchased(workspace.id, 1_500, description: "test pack")

      assert {:ok, agent} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "ai",
                 "display_name" => "Boosted",
                 "archetype_key" => "developer",
                 "boost_key" => "boost_l5"
               })

      assert agent.level == 5
      assert Enum.any?(agent.skills, &(&1["level"] == 70))

      # 500 included + 1500 purchased - 1500 boost = 500 remaining
      summary = Credits.summary(workspace.id)
      assert summary.spendable == 500
    end

    test "update_agent cannot forge level or skills" do
      {workspace, _owner} = workspace_fixture()

      {:ok, agent} =
        Agents.create_agent(workspace.id, %{"kind" => "ai", "display_name" => "Bot"})

      assert {:ok, updated} =
               Agents.update_agent(agent, %{
                 "level" => 50,
                 "skills" => [%{"name" => "coding", "level" => 100}],
                 "display_name" => "Bot Renamed"
               })

      assert updated.display_name == "Bot Renamed"
      assert updated.level == 1
      assert updated.skills == agent.skills
    end
  end

  describe "change_status/3" do
    test "records a status event" do
      {workspace, _owner} = workspace_fixture()

      {:ok, agent} =
        Agents.create_agent(workspace.id, %{"kind" => "ai", "display_name" => "Bot"})

      assert {:ok, updated} = Agents.change_status(agent, "busy", reason: "task_assigned")
      assert updated.status == "busy"

      events = Repo.all(Mokaid.Agents.AgentStatusEvent)
      assert Enum.any?(events, &(&1.to_status == "busy"))
    end
  end

  describe "workspace scoping" do
    test "agents are not visible across workspaces" do
      {workspace_a, _} = workspace_fixture()
      {workspace_b, _} = workspace_fixture()

      {:ok, agent} =
        Agents.create_agent(workspace_a.id, %{"kind" => "ai", "display_name" => "Bot A"})

      assert Agents.get_agent(workspace_b.id, agent.id) == nil
      assert [] = Agents.list_agents(workspace_b.id)
    end
  end

  defp errors_on(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
