defmodule Mokaid.Agents.Workers.DomainPackSeedWorker do
  @moduledoc """
  Asynchronously seeds the remainder of a domain pack into agent-scoped knowledge
  after the synchronous core seed at L10 purchase.
  """

  use Oban.Worker, queue: :ingestion, max_attempts: 3

  alias Mokaid.Agents
  alias Mokaid.Agents.DomainPacks

  @impl Oban.Worker
  def perform(%Oban.Job{
        args: %{
          "workspace_id" => workspace_id,
          "agent_id" => agent_id,
          "archetype_key" => archetype_key,
          "offset" => offset
        }
      }) do
    case Agents.get_agent(workspace_id, agent_id) do
      nil ->
        {:cancel, :agent_not_found}

      agent ->
        {:ok, _count} = DomainPacks.seed_remaining(workspace_id, agent, archetype_key, offset)
        :ok
    end
  end
end
