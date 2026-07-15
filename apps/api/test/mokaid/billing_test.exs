defmodule Mokaid.BillingTest do
  use Mokaid.DataCase, async: true

  alias Mokaid.Agents
  alias Mokaid.Billing
  alias Mokaid.Billing.Credits

  setup do
    Billing.seed_plans()
    :ok
  end

  test "catalog only exposes free, starter and professional" do
    keys = Billing.list_plans() |> Enum.map(& &1.key) |> Enum.sort()
    assert keys == ["free", "professional", "starter"]

    pro = Billing.get_plan_by_key("professional")
    assert pro.limits["agents"] == 9
  end

  test "agent_limit defaults to free without a subscription" do
    {workspace, _} = workspace_fixture()
    assert Billing.agent_limit(workspace.id) == 1
  end

  test "change_plan refreshes included credits and preserves purchased balance" do
    {workspace, _} = workspace_fixture()
    assert {:ok, free} = Billing.change_plan(workspace.id, "free")
    assert free.included_credits_remaining == 500

    assert {:ok, _} = Credits.add_purchased(workspace.id, 1_000, description: "pack")
    assert {:ok, starter} = Billing.change_plan(workspace.id, "starter")

    assert starter.included_credits_remaining == 5_000
    assert starter.credits_balance == 1_000
    assert Billing.agent_limit(workspace.id) == 3
  end

  test "downgrade does not archive agents but blocks new creations over quota" do
    {workspace, _} = workspace_fixture()
    assert {:ok, _} = Billing.change_plan(workspace.id, "starter")

    for i <- 1..3 do
      assert {:ok, _} =
               Agents.create_agent(workspace.id, %{
                 "kind" => "ai",
                 "display_name" => "Agent #{i}"
               })
    end

    assert {:ok, _} = Billing.change_plan(workspace.id, "free")
    assert length(Agents.list_agents(workspace.id)) == 3
    assert Billing.agent_limit(workspace.id) == 1

    assert {:error, :agent_limit_reached} =
             Agents.create_agent(workspace.id, %{
               "kind" => "ai",
               "display_name" => "Too many"
             })
  end

  test "charge_strict refuses insufficient balance and records agent_boost" do
    {workspace, _} = workspace_fixture()
    assert {:ok, _} = Billing.change_plan(workspace.id, "free")

    assert {:error, :insufficient_credits} =
             Repo.transaction(fn ->
               case Credits.charge_strict(workspace.id, 1_500,
                      kind: "agent_boost",
                      description: "test"
                    ) do
                 {:ok, _, _} = ok -> ok
                 {:error, reason} -> Repo.rollback(reason)
               end
             end)

    assert {:ok, _} = Credits.add_purchased(workspace.id, 1_500, description: "pack")

    assert {:ok, {_sub, 1_500}} =
             Repo.transaction(fn ->
               case Credits.charge_strict(workspace.id, 1_500,
                      kind: "agent_boost",
                      description: "Agent boost"
                    ) do
                 {:ok, sub, credits} -> {sub, credits}
                 {:error, reason} -> Repo.rollback(reason)
               end
             end)

    [txn | _] = Credits.recent_transactions(workspace.id)
    assert txn.kind == "agent_boost"
    assert txn.amount == -1_500

    # Included monthly grant (500) untouched — charge drew from purchased first? Actually draw from included first.
    # From included min(500, 1500)=500, from balance 1000 → included 0, balance 500, spendable 500
    assert Credits.summary(workspace.id).spendable == 500
  end
end
