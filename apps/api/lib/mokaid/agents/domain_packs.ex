defmodule Mokaid.Agents.DomainPacks do
  @moduledoc """
  Loads curated domain knowledge packs from `priv/agent_domain_packs`
  and seeds them as agent-scoped Knowledge items after a specialist purchase.

  Sync path seeds a core subset + user brief; the rest is enqueued via
  `Mokaid.Agents.Workers.DomainPackSeedWorker`.
  """

  require Logger

  alias Mokaid.Agents.Agent
  alias Mokaid.Agents.Workers.DomainPackSeedWorker
  alias Mokaid.Knowledge
  alias Mokaid.MCP
  alias Mokaid.Repo

  @core_seed_limit 40
  @index_prompt_limit 60

  @aliases %{
    "generalist" => "blank",
    "data_analyst" => "data_scientist",
    "designer" => "design",
    "writer" => "writer_content",
    "media" => "media_video",
    "presenter" => "writer_content"
  }

  @doc "Resolve legacy archetype keys to pack folder names."
  def resolve_key(nil), do: "blank"
  def resolve_key(""), do: "blank"

  def resolve_key(key) when is_binary(key) do
    Map.get(@aliases, key, key)
  end

  def resolve_key(_), do: "blank"

  def pack_dir(archetype_key) do
    Path.join([:code.priv_dir(:mokaid), "agent_domain_packs", resolve_key(archetype_key)])
  end

  @doc "Load skill_index.json for a domain (empty map for blank/missing)."
  def skill_index(archetype_key) do
    key = resolve_key(archetype_key)
    path = Path.join(pack_dir(key), "skill_index.json")

    case File.read(path) do
      {:ok, body} ->
        case Jason.decode(body) do
          {:ok, map} when is_map(map) -> map
          _ -> empty_index(key)
        end

      _ ->
        empty_index(key)
    end
  end

  def skill_count(archetype_key) do
    skill_index(archetype_key) |> Map.get("skill_count", 0)
  end

  def pack_version(archetype_key) do
    skill_index(archetype_key) |> Map.get("pack_version", "0")
  end

  @doc "Compact index for prompts/persona (name + description only)."
  def prompt_skill_index(archetype_key, limit \\ @index_prompt_limit) do
    skill_index(archetype_key)
    |> Map.get("skills", [])
    |> Enum.take(limit)
    |> Enum.map(fn s ->
      %{
        "name" => s["name"] || s[:name],
        "description" => s["description"] || s[:description] || "",
        "slug" => s["slug"] || s[:slug]
      }
    end)
  end

  @doc "Returns [%{title, body, type, path, priority}] for the pack."
  def docs_for(archetype_key) do
    key = resolve_key(archetype_key)

    if key == "blank" do
      []
    else
      dir = pack_dir(key)

      if File.dir?(dir) do
        (Path.wildcard(Path.join(dir, "**/*.md")) ++
           Path.wildcard(Path.join(dir, "**/*.markdown")))
        |> Enum.uniq()
        |> Enum.reject(&(Path.basename(&1) == "ATTRIBUTION.md"))
        |> Enum.sort()
        |> Enum.map(&read_doc/1)
        |> Enum.reject(&is_nil/1)
        |> rank_docs()
      else
        []
      end
    end
  end

  def corpus_doc_count(archetype_key) do
    case skill_count(archetype_key) do
      n when is_integer(n) and n > 0 -> n
      _ -> length(docs_for(archetype_key))
    end
  end

  @doc """
  Seeds core pack docs synchronously, attaches `capabilities.domain_pack`,
  auto-grants suggested MCP, and enqueues async seeding for the remainder.
  """
  def seed_for_agent(workspace_id, %Agent{} = agent, opts \\ []) do
    archetype_key =
      opts[:archetype_key] ||
        get_in(agent.capabilities, ["learning", "archetype"]) ||
        "blank"

    key = resolve_key(archetype_key)
    brief = opts[:brief]
    suggested_mcp = opts[:suggested_mcp] || []

    docs = docs_for(key)
    {core, rest} = Enum.split(docs, @core_seed_limit)

    brief_docs =
      case brief do
        b when is_binary(b) and b != "" ->
          [%{title: "Contexte utilisateur — besoin d'agents", body: b, type: "note", path: nil}]

        _ ->
          []
      end

    seeded = seed_docs(workspace_id, agent, key, brief_docs ++ core)

    agent =
      attach_domain_pack_capabilities(agent, key,
        seeded_count: seeded,
        pending_count: length(rest),
        brief: brief,
        suggested_mcp: suggested_mcp
      )

    maybe_grant_mcp(workspace_id, agent, suggested_mcp, opts[:member])

    if rest != [] do
      %{
        "workspace_id" => workspace_id,
        "agent_id" => agent.id,
        "archetype_key" => key,
        "offset" => @core_seed_limit
      }
      |> DomainPackSeedWorker.new()
      |> Oban.insert()
    end

    {:ok, seeded, agent}
  end

  @doc "Seed remaining docs starting at offset (async worker)."
  def seed_remaining(workspace_id, %Agent{} = agent, archetype_key, offset)
      when is_integer(offset) and offset >= 0 do
    key = resolve_key(archetype_key)
    docs = docs_for(key) |> Enum.drop(offset)
    seeded = seed_docs(workspace_id, agent, key, docs)

    caps = agent.capabilities || %{}
    domain_pack = Map.get(caps, "domain_pack", %{})

    updated_pack =
      domain_pack
      |> Map.put("seeded_count", Map.get(domain_pack, "seeded_count", 0) + seeded)
      |> Map.put("pending_count", 0)
      |> Map.put("seed_status", "complete")

    agent
    |> Agent.changeset(%{"capabilities" => Map.put(caps, "domain_pack", updated_pack)})
    |> Repo.update()

    {:ok, seeded}
  end

  @doc "Load one skill markdown by slug or name for progressive disclosure."
  def load_skill(archetype_key, name_or_slug) when is_binary(name_or_slug) do
    key = resolve_key(archetype_key)
    index = skill_index(key)
    skills = Map.get(index, "skills", [])
    needle = String.downcase(name_or_slug)

    match =
      Enum.find(skills, fn s ->
        slug = String.downcase(to_string(s["slug"] || ""))
        name = String.downcase(to_string(s["name"] || ""))
        slug == needle or name == needle or String.contains?(name, needle)
      end)

    cond do
      match == nil ->
        {:error, :not_found}

      true ->
        rel = match["path"]
        path = Path.join(pack_dir(key), rel)

        case File.read(path) do
          {:ok, body} ->
            {:ok,
             %{
               name: match["name"],
               slug: match["slug"],
               description: match["description"],
               source: match["source"],
               body: body
             }}

          _ ->
            {:error, :not_found}
        end
    end
  end

  defp seed_docs(workspace_id, agent, key, docs) do
    Enum.reduce(docs, 0, fn doc, acc ->
      attrs = %{
        "title" => doc.title,
        "type" => doc[:type] || "document",
        "body" => doc.body,
        "agent_id" => agent.id,
        "status" => "processing",
        "metadata" => %{
          "source" => "domain_pack",
          "archetype" => key,
          "pack_title" => doc.title,
          "pack_path" => doc[:path]
        }
      }

      try do
        case Knowledge.create_item(workspace_id, attrs) do
          {:ok, _} ->
            acc + 1

          {:error, reason} ->
            Logger.warning("domain_pack seed failed agent=#{agent.id}: #{inspect(reason)}")
            acc
        end
      rescue
        e ->
          Logger.warning("domain_pack seed crashed agent=#{agent.id}: #{Exception.message(e)}")
          acc
      end
    end)
  end

  defp attach_domain_pack_capabilities(%Agent{} = agent, key, opts) do
    caps = agent.capabilities || %{}
    index = prompt_skill_index(key)

    domain_pack = %{
      "archetype" => key,
      "tier" => "specialist",
      "pack_version" => pack_version(key),
      "skill_count" => skill_count(key),
      "corpus_doc_count" => corpus_doc_count(key),
      "skill_index" => index,
      "suggested_mcp" => opts[:suggested_mcp] || [],
      "seeded_count" => opts[:seeded_count] || 0,
      "pending_count" => opts[:pending_count] || 0,
      "seed_status" => if((opts[:pending_count] || 0) > 0, do: "pending", else: "complete")
    }

    caps =
      caps
      |> Map.put("domain_pack", domain_pack)
      |> maybe_put_brief(opts[:brief])

    case agent
         |> Agent.changeset(%{"capabilities" => caps})
         |> Repo.update() do
      {:ok, updated} -> updated
      {:error, _} -> agent
    end
  end

  defp maybe_put_brief(caps, brief) when is_binary(brief) and brief != "" do
    Map.put(caps, "knowledge_brief", brief)
  end

  defp maybe_put_brief(caps, _), do: caps

  defp maybe_grant_mcp(_workspace_id, _agent, [], _member), do: :ok

  defp maybe_grant_mcp(workspace_id, agent, server_keys, member) when is_list(server_keys) do
    Enum.each(server_keys, fn key ->
      case MCP.get_installation_by_server_key(workspace_id, key) do
        %{id: installation_id, status: "connected"} ->
          _ = MCP.set_grant(workspace_id, agent.id, installation_id, true, member)

        _ ->
          :ok
      end
    end)

    :ok
  end

  defp rank_docs(docs) do
    Enum.sort_by(docs, fn doc ->
      path = doc[:path] || ""
      # Prefer root playbooks, then longer skills
      playbook? = not String.contains?(path, "/skills/")
      {-bool_to_int(playbook?), -String.length(doc.body || "")}
    end)
  end

  defp bool_to_int(true), do: 1
  defp bool_to_int(false), do: 0

  defp read_doc(path) do
    case File.read(path) do
      {:ok, body} ->
        title =
          path
          |> Path.basename()
          |> Path.rootname()
          |> String.replace(~r/[-_]+/, " ")
          |> String.split()
          |> Enum.map(&String.capitalize/1)
          |> Enum.join(" ")

        rel =
          case :code.priv_dir(:mokaid) do
            dir when is_list(dir) or is_binary(dir) ->
              pack_root = Path.join(:code.priv_dir(:mokaid), "agent_domain_packs")

              case String.split(path, pack_root <> "/") do
                [_, rest] ->
                  rest
                  |> Path.split()
                  |> Enum.drop(1)
                  |> Path.join()

                _ ->
                  Path.basename(path)
              end

            _ ->
              Path.basename(path)
          end

        %{title: title, body: body, type: "document", path: rel}

      {:error, _} ->
        nil
    end
  end

  defp empty_index(key),
    do: %{"domain" => key, "pack_version" => "0", "skill_count" => 0, "skills" => []}
end
