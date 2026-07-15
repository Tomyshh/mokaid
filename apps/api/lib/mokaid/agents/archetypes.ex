defmodule Mokaid.Agents.Archetypes do
  @moduledoc """
  Catalog of free agent archetypes and paid creation boosts.

  Clients may only send archetype/boost keys — all skill levels, roles and
  credit prices are owned by this module.
  """

  alias Mokaid.Agents.Progression

  @skill_seed_level 40
  @generalist_skills ~w(research planning)

  @archetypes [
    %{
      key: "generalist",
      name: "Generalist",
      domain: nil,
      description: "Starts from scratch and learns from every mission.",
      role_title: "Generalist",
      department: "Operations",
      skills: @generalist_skills
    },
    %{
      key: "developer",
      name: "Developer",
      domain: "code",
      description: "Oriented toward coding, debugging and code review.",
      role_title: "Software Engineer",
      department: "Engineering",
      skills: ~w(coding debugging code-review)
    },
    %{
      key: "designer",
      name: "Designer",
      domain: "design",
      description: "Oriented toward UI, Figma and branding.",
      role_title: "Designer",
      department: "Design",
      skills: ~w(ui-design figma branding)
    },
    %{
      key: "data_analyst",
      name: "Data Analyst",
      domain: "data",
      description: "Oriented toward analysis, spreadsheets and reporting.",
      role_title: "Data Analyst",
      department: "Data",
      skills: ~w(data-analysis spreadsheets reporting)
    },
    %{
      key: "writer",
      name: "Writer",
      domain: "document",
      description: "Oriented toward writing, editing and research.",
      role_title: "Content Specialist",
      department: "Content",
      skills: ~w(writing editing research)
    },
    %{
      key: "media",
      name: "Media Creator",
      domain: "media",
      description: "Oriented toward images, video and content.",
      role_title: "Media Specialist",
      department: "Marketing",
      skills: ~w(image-editing video content)
    },
    %{
      key: "presenter",
      name: "Presenter",
      domain: "slides",
      description: "Oriented toward decks, storytelling and design.",
      role_title: "Presentation Specialist",
      department: "Content",
      skills: ~w(presentations storytelling design)
    }
  ]

  @domain_to_archetype %{
    "code" => "developer",
    "design" => "designer",
    "data" => "data_analyst",
    "document" => "writer",
    "media" => "media",
    "slides" => "presenter"
  }

  # Boost keys are billed in credits and applied only server-side.
  @boosts [
    %{
      key: "boost_l3",
      name: "Head start",
      description: "Start at level 3 with a +15 skill bump.",
      credits: 500,
      target_level: 3,
      skill_bonus: 15
    },
    %{
      key: "boost_l5",
      name: "Strong head start",
      description: "Start at level 5 with a +30 skill bump.",
      credits: 1_500,
      target_level: 5,
      skill_bonus: 30
    }
  ]

  def list_archetypes, do: @archetypes

  def list_boosts, do: @boosts

  def get_archetype(nil), do: get_archetype("generalist")
  def get_archetype(""), do: get_archetype("generalist")

  def get_archetype(key) when is_binary(key) do
    Enum.find(@archetypes, &(&1.key == key))
  end

  def get_archetype(_), do: nil

  def get_boost(nil), do: nil
  def get_boost(""), do: nil

  def get_boost(key) when is_binary(key) do
    Enum.find(@boosts, &(&1.key == key))
  end

  def get_boost(_), do: nil

  @doc "Maps a detected mission domain to an archetype key."
  def archetype_key_for_domain(domain) when is_binary(domain) do
    Map.get(@domain_to_archetype, domain, "generalist")
  end

  def archetype_key_for_domain(_), do: "generalist"

  @doc """
  Builds create attrs from an archetype (+ optional boost). Role/department
  from the client are kept when present; skills/level are always server-owned.
  """
  def build_create_attrs(attrs, archetype_key, boost_key \\ nil) do
    with {:ok, archetype} <- fetch_archetype(archetype_key),
         {:ok, boost} <- fetch_boost(boost_key) do
      skill_bonus = if boost, do: boost.skill_bonus, else: 0
      target_level = if boost, do: boost.target_level, else: 1
      {level, xp, next} = starting_progression(target_level)
      kind = resolve_kind(attrs)

      skills =
        Enum.map(archetype.skills, fn name ->
          %{"name" => name, "level" => min(@skill_seed_level + skill_bonus, 100)}
        end)

      base_caps =
        case attrs do
          %{"capabilities" => caps} when is_map(caps) -> caps
          %{capabilities: caps} when is_map(caps) -> stringify_keys(caps)
          _ -> %{}
        end

      brief = attrs["knowledge_brief"] || attrs[:knowledge_brief]

      capabilities =
        base_caps
        |> maybe_put_brief(brief)
        |> Map.put("learning", %{
          "missions_total" => 0,
          "domain_counts" => %{},
          "specialty" => nil,
          "specialized_at" => nil,
          "role_source" => "archetype",
          "archetype" => archetype.key
        })

      created =
        attrs
        |> stringify_keys()
        |> Map.drop([
          "skills",
          "level",
          "xp",
          "xp_for_next_level",
          "missions_completed",
          "performance_score",
          "access_scope",
          "archetype_key",
          "boost_key",
          "knowledge_brief"
        ])
        |> Map.merge(%{
          "kind" => kind,
          "role_title" =>
            blank_to_nil(attrs["role_title"] || attrs[:role_title]) || archetype.role_title,
          "department" =>
            blank_to_nil(attrs["department"] || attrs[:department]) || archetype.department,
          "skills" => skills,
          "capabilities" => capabilities,
          "level" => level,
          "xp" => xp,
          "xp_for_next_level" => next,
          "missions_completed" => 0,
          "ai_enabled" => kind in ["ai", "hybrid"],
          "control_mode" =>
            if(kind == "human_linked", do: "human_controlled", else: "ai_controlled"),
          "status" => "idle"
        })

      {:ok, created, archetype, boost}
    end
  end

  defp resolve_kind(attrs) do
    case attrs["kind"] || attrs[:kind] || "ai" do
      kind when kind in ["ai", "human_linked", "hybrid"] -> kind
      _ -> "ai"
    end
  end

  @doc "Public catalog for the API/UI."
  def catalog do
    %{
      archetypes:
        Enum.map(@archetypes, fn a ->
          %{
            key: a.key,
            name: a.name,
            domain: a.domain,
            description: a.description,
            role_title: a.role_title,
            department: a.department,
            skills: Enum.map(a.skills, &%{name: &1, level: @skill_seed_level})
          }
        end),
      boosts:
        Enum.map(@boosts, fn b ->
          %{
            key: b.key,
            name: b.name,
            description: b.description,
            credits: b.credits,
            target_level: b.target_level,
            skill_bonus: b.skill_bonus
          }
        end)
    }
  end

  defp fetch_archetype(key) do
    case get_archetype(key || "generalist") do
      nil -> {:error, :invalid_archetype}
      archetype -> {:ok, archetype}
    end
  end

  defp fetch_boost(nil), do: {:ok, nil}
  defp fetch_boost(""), do: {:ok, nil}

  defp fetch_boost(key) do
    case get_boost(key) do
      nil -> {:error, :invalid_boost}
      boost -> {:ok, boost}
    end
  end

  # Cumulative XP to reach `target_level` with 0 XP into the next bar.
  defp starting_progression(1), do: {1, 0, Progression.xp_required(1)}

  defp starting_progression(target_level) when target_level > 1 do
    xp_spent =
      1..(target_level - 1)
      |> Enum.map(&Progression.xp_required/1)
      |> Enum.sum()

    # Store at the target level with an empty bar; xp field is into-current-level.
    _ = xp_spent
    {target_level, 0, Progression.xp_required(target_level)}
  end

  defp maybe_put_brief(caps, brief) when is_binary(brief) and brief != "" do
    Map.put(caps, "knowledge_brief", brief)
  end

  defp maybe_put_brief(caps, _), do: caps

  defp blank_to_nil(nil), do: nil
  defp blank_to_nil(""), do: nil
  defp blank_to_nil(value), do: value

  defp stringify_keys(map) when is_map(map) do
    Map.new(map, fn
      {k, v} when is_atom(k) -> {Atom.to_string(k), v}
      {k, v} -> {k, v}
    end)
  end
end
