defmodule Mokaid.Agents do
  @moduledoc "Agents: AI-only, human-linked and hybrid work actors."

  import Ecto.Query

  alias Mokaid.Agents.{Agent, AgentStatusEvent, Archetypes, DomainPacks}
  alias Mokaid.Audit
  alias Mokaid.Billing
  alias Mokaid.Billing.Credits
  alias Mokaid.Realtime
  alias Mokaid.Repo

  # Public create/update must never accept progression or ownership fields.
  # linked_user_id may still be provided when creating a human_linked agent.
  @client_forbidden ~w(
    skills level xp xp_for_next_level missions_completed performance_score
    capabilities access_scope seat_index workspace_id created_by_member_id
    manager_agent_id current_task_id archived_at last_active_at
    ai_enabled control_mode status presence_status
  )

  @public_update_drop ~w(
    skills level xp xp_for_next_level missions_completed performance_score
    capabilities access_scope seat_index workspace_id created_by_member_id
    kind linked_user_id linked_member_id manager_agent_id
  )

  def get_agent(workspace_id, id) do
    Repo.one(
      from a in Agent,
        where: a.workspace_id == ^workspace_id and a.id == ^id,
        preload: [:linked_user, linked_member: :user]
    )
  end

  def list_agents(workspace_id, filters \\ %{}) do
    from(a in Agent,
      where: a.workspace_id == ^workspace_id and is_nil(a.archived_at),
      preload: [:linked_user, linked_member: :user],
      order_by: [asc: a.inserted_at]
    )
    |> maybe_filter(:kind, filters["kind"])
    |> maybe_filter(:status, filters["status"])
    |> maybe_filter(:department, filters["department"])
    |> Repo.all()
  end

  defp maybe_filter(query, _field, nil), do: query
  defp maybe_filter(query, _field, ""), do: query
  defp maybe_filter(query, field, value), do: where(query, [a], field(a, ^field) == ^value)

  @max_office_seats 9

  def create_agent(workspace_id, attrs, created_by \\ nil) do
    attrs = stringify_attrs(attrs)
    archetype_key = attrs["archetype_key"] || "blank"
    boost_key = attrs["boost_key"]
    knowledge_brief = attrs["knowledge_brief"]

    with {:ok, prepared, archetype, boost} <-
           Archetypes.build_create_attrs(sanitize_client_attrs(attrs), archetype_key, boost_key) do
      prepared =
        if blank?(prepared["avatar_asset_id"]) do
          case Mokaid.Assets3d.default_character() do
            %{id: id} -> Map.put(prepared, "avatar_asset_id", id)
            _ -> prepared
          end
        else
          prepared
        end

      result =
        Repo.transaction(fn ->
          # Same advisory lock as seat allocation — quota + seat stay consistent.
          Repo.query!("SELECT pg_advisory_xact_lock(hashtext($1::text))", [
            to_string(workspace_id)
          ])

          active = active_agent_count(workspace_id)
          limit = Billing.agent_limit(workspace_id)

          if active >= limit do
            Repo.rollback(:agent_limit_reached)
          end

          seat =
            case find_free_seat(workspace_id) do
              nil -> Repo.rollback(:office_full)
              s -> s
            end

          case %Agent{}
               |> Agent.create_changeset(
                 Map.merge(prepared, %{
                   "presence_status" => "online",
                   "seat_index" => seat,
                   "workspace_id" => workspace_id,
                   "created_by_member_id" => created_by && created_by.id
                 })
               )
               |> Repo.insert() do
            {:ok, agent} ->
              if boost do
                case Credits.charge_strict(workspace_id, boost.credits,
                       kind: "agent_boost",
                       agent_id: agent.id,
                       description: "Agent boost: #{boost.name}"
                     ) do
                  {:ok, _sub, _credits} -> agent
                  {:error, reason} -> Repo.rollback(reason)
                end
              else
                agent
              end

            {:error, changeset} ->
              Repo.rollback(changeset)
          end
        end)

      case result do
        {:ok, agent} ->
          if boost_key not in [nil, ""], do: Credits.broadcast_balance(workspace_id)

          agent =
            if boost && boost.key == "boost_l10" do
              case DomainPacks.seed_for_agent(workspace_id, agent,
                     archetype_key: archetype.key,
                     brief: knowledge_brief,
                     suggested_mcp: Map.get(archetype, :suggested_mcp) || [],
                     member: created_by
                   ) do
                {:ok, _count, updated} -> updated
              end
            else
              agent
            end

          Realtime.broadcast_workspace(workspace_id, "agent.created", %{agent_id: agent.id})
          {:ok, agent}

        {:error, reason} when is_atom(reason) ->
          {:error, reason}

        {:error, changeset} ->
          {:error, changeset}
      end
    end
  end

  @doc "First free desk index 0..8 for the workspace, or :office_full."
  def next_free_seat(workspace_id) do
    Repo.query!("SELECT pg_advisory_xact_lock(hashtext($1::text))", [to_string(workspace_id)])

    case find_free_seat(workspace_id) do
      nil -> {:error, :office_full}
      seat -> {:ok, seat}
    end
  end

  defp find_free_seat(workspace_id) do
    taken =
      from(a in Agent,
        where:
          a.workspace_id == ^workspace_id and is_nil(a.archived_at) and not is_nil(a.seat_index),
        select: a.seat_index
      )
      |> Repo.all()
      |> MapSet.new()

    Enum.find(0..(@max_office_seats - 1), &(not MapSet.member?(taken, &1)))
  end

  def active_agent_count(workspace_id) do
    from(a in Agent, where: a.workspace_id == ^workspace_id and is_nil(a.archived_at))
    |> Repo.aggregate(:count)
  end

  defp blank?(nil), do: true
  defp blank?(""), do: true
  defp blank?(_), do: false

  defp sanitize_client_attrs(attrs) do
    Map.drop(attrs, @client_forbidden ++ Enum.map(@client_forbidden, &String.to_atom/1))
  end

  defp stringify_attrs(attrs) when is_map(attrs) do
    Map.new(attrs, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end

  def update_agent(%Agent{} = agent, attrs) do
    attrs =
      attrs
      |> stringify_attrs()
      |> Map.drop(@public_update_drop ++ Enum.map(@public_update_drop, &String.to_atom/1))

    result =
      agent
      |> Agent.update_changeset(Map.put(attrs, "workspace_id", agent.workspace_id))
      |> Repo.update()

    with {:ok, updated} <- result do
      Realtime.broadcast_workspace(agent.workspace_id, "agent.updated", %{agent_id: updated.id})
      {:ok, updated}
    end
  end

  @doc """
  Internal update used by progression and skill learning — may write level,
  XP, skills and capabilities that clients cannot set.
  """
  def apply_internal_update(%Agent{} = agent, attrs) do
    attrs = stringify_attrs(attrs)

    result =
      agent
      |> Agent.internal_changeset(Map.put(attrs, "workspace_id", agent.workspace_id))
      |> Repo.update()

    with {:ok, updated} <- result do
      Realtime.broadcast_workspace(agent.workspace_id, "agent.updated", %{agent_id: updated.id})
      {:ok, updated}
    end
  end

  def archive_agent(%Agent{} = agent) do
    result =
      agent
      |> Ecto.Changeset.change(
        archived_at: DateTime.utc_now(),
        status: "archived",
        seat_index: nil,
        office_activity: nil,
        office_poi_id: nil,
        office_slot_id: nil,
        office_activity_phase: nil,
        office_activity_ends_at: nil
      )
      |> Repo.update()

    with {:ok, updated} <- result do
      Realtime.broadcast_workspace(agent.workspace_id, "agent.updated", %{agent_id: updated.id})
      {:ok, updated}
    end
  end

  @doc "Set or clear a synchronized office POI activity for an idle agent."
  def set_office_activity(%Agent{} = agent, attrs) when is_map(attrs) do
    result =
      agent
      |> Agent.office_activity_changeset(attrs)
      |> Repo.update()

    with {:ok, updated} <- result do
      broadcast_office_activity(updated)
      {:ok, updated}
    end
  end

  def clear_office_activity(%Agent{} = agent) do
    set_office_activity(agent, %{
      "office_activity" => nil,
      "office_poi_id" => nil,
      "office_slot_id" => nil,
      "office_activity_phase" => nil,
      "office_activity_ends_at" => nil
    })
  end

  defp broadcast_office_activity(agent) do
    Realtime.broadcast_workspace(agent.workspace_id, "agent.office_activity", %{
      agent_id: agent.id,
      office_activity: agent.office_activity,
      office_poi_id: agent.office_poi_id,
      office_slot_id: agent.office_slot_id,
      office_activity_phase: agent.office_activity_phase,
      office_activity_ends_at: agent.office_activity_ends_at
    })
  end

  @doc "Transitions an agent's status, records the event, broadcasts realtime update."
  def change_status(%Agent{} = agent, new_status, opts \\ []) do
    result =
      Repo.transaction(fn ->
        {:ok, updated} =
          agent
          |> Agent.status_changeset(%{
            "status" => new_status,
            "current_task_id" => Keyword.get(opts, :current_task_id, agent.current_task_id),
            "last_active_at" => DateTime.utc_now()
          })
          |> Repo.update()

        updated =
          if new_status in ["busy", "blocked", "archived", "offline"] do
            {:ok, cleared} =
              updated
              |> Agent.office_activity_changeset(%{
                "office_activity" => nil,
                "office_poi_id" => nil,
                "office_slot_id" => nil,
                "office_activity_phase" => nil,
                "office_activity_ends_at" => nil
              })
              |> Repo.update()

            cleared
          else
            updated
          end

        %AgentStatusEvent{}
        |> AgentStatusEvent.changeset(%{
          "workspace_id" => agent.workspace_id,
          "agent_id" => agent.id,
          "from_status" => agent.status,
          "to_status" => new_status,
          "reason" => Keyword.get(opts, :reason)
        })
        |> Repo.insert!()

        updated
      end)

    with {:ok, updated} <- result do
      Realtime.broadcast_workspace(updated.workspace_id, "agent.status_changed", %{
        agent_id: agent.id,
        status: new_status,
        presence_status: public_presence(updated),
        current_task_id: updated.current_task_id,
        office_activity: updated.office_activity,
        office_poi_id: updated.office_poi_id,
        office_slot_id: updated.office_slot_id,
        office_activity_phase: updated.office_activity_phase
      })

      {:ok, updated}
    end
  end

  defp public_presence(%Agent{status: "archived"}), do: "offline"
  defp public_presence(%Agent{kind: "human_linked", presence_status: p}), do: p
  defp public_presence(%Agent{kind: kind}) when kind in ["ai", "hybrid"], do: "online"
  defp public_presence(%Agent{presence_status: p}), do: p || "online"

  def link_user(%Agent{} = agent, user_id, member_id, actor) do
    if agent.kind == "ai" do
      {:error, :cannot_link_ai_agent}
    else
      result =
        agent
        |> Ecto.Changeset.change(linked_user_id: user_id, linked_member_id: member_id)
        |> Repo.update()

      with {:ok, updated} <- result do
        Audit.log(agent.workspace_id, actor, "agent.link_user", "agent", agent.id, %{
          user_id: user_id
        })

        Realtime.broadcast_workspace(agent.workspace_id, "agent.linked_user_changed", %{
          agent_id: agent.id,
          linked_user_id: user_id
        })

        {:ok, updated}
      end
    end
  end

  def unlink_user(%Agent{} = agent, actor) do
    if agent.kind == "human_linked" do
      {:error, :human_linked_requires_user}
    else
      result =
        agent
        |> Ecto.Changeset.change(linked_user_id: nil, linked_member_id: nil)
        |> Repo.update()

      with {:ok, updated} <- result do
        Audit.log(agent.workspace_id, actor, "agent.unlink_user", "agent", agent.id, %{})

        Realtime.broadcast_workspace(agent.workspace_id, "agent.linked_user_changed", %{
          agent_id: agent.id,
          linked_user_id: nil
        })

        {:ok, updated}
      end
    end
  end

  def counts(workspace_id) do
    base = from a in Agent, where: a.workspace_id == ^workspace_id and is_nil(a.archived_at)
    limit = Billing.agent_limit(workspace_id)

    %{
      total: Repo.aggregate(base, :count),
      ai: Repo.aggregate(where(base, [a], a.kind == "ai"), :count),
      human_linked: Repo.aggregate(where(base, [a], a.kind == "human_linked"), :count),
      hybrid: Repo.aggregate(where(base, [a], a.kind == "hybrid"), :count),
      active: Repo.aggregate(where(base, [a], a.status in ["active", "busy"]), :count),
      offline: Repo.aggregate(where(base, [a], a.status == "offline"), :count),
      limit: limit
    }
  end
end
