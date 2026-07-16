defmodule Mokaid.Assets3d do
  @moduledoc """
  Catalog of 3D assets (characters, environments, accessories…).

  Binary GLBs live on S3 (`mokaid-assets-3d-*`); only metadata is stored here.
  """

  import Ecto.Query

  alias Mokaid.Assets3d.Asset
  alias Mokaid.Repo

  @all_clips ~w(
    idle walking typing working thinking talking waiting blocked
    celebrating away offline reviewing learning requesting_approval
    sitting preparing_coffee playing_foosball
  )

  @catalog [
    %{
      "slug" => "avatar_male",
      "kind" => "character",
      "storage_key" => "assets3d/avatar_male.998219f3a783.glb",
      "cdn_path" => "/assets3d/avatar_male.998219f3a783.glb",
      "sha256" => "998219f3a7831976a371f952aaf69d05acc435f93ed215af5a2f35d0d6369819",
      "byte_size" => 4_284_988,
      "animation_clips" => @all_clips,
      "metadata" => %{
        "display_name" => "Male character",
        "target_height_m" => 1.75,
        "source" => "fiverr + procedural bake + POI clips"
      }
    },
    %{
      "slug" => "avatar_female",
      "kind" => "character",
      "storage_key" => "assets3d/avatar_female.82b9e76943a3.glb",
      "cdn_path" => "/assets3d/avatar_female.82b9e76943a3.glb",
      "sha256" => "82b9e76943a3f43988a4f7be29aab6d351dc57246a7800c81cd684826481fbe9",
      "byte_size" => 678_052,
      "animation_clips" => @all_clips,
      "metadata" => %{
        "display_name" => "Female character",
        "target_height_m" => 1.65,
        "source" => "fiverr walking + procedural bake + POI clips (Mixamo cm-scale sit)",
        "skeleton" => "mixamo_biped"
      }
    },
    %{
      "slug" => "avatar_finance",
      "kind" => "character",
      "storage_key" => "assets3d/avatar_finance.66a811ac49e8.glb",
      "cdn_path" => "/assets3d/avatar_finance.66a811ac49e8.glb",
      "sha256" => "66a811ac49e87a20187006c2af1d74d6182367d922487dd03a2e1631bbd7d058",
      "byte_size" => 1_087_824,
      "animation_clips" => @all_clips,
      "metadata" => %{
        "display_name" => "Female finance",
        "target_height_m" => 1.65,
        "source" => "meshy biped + mapped AgentVisualState clips + POI clips",
        "skeleton" => "mixamo_biped"
      }
    },
    %{
      "slug" => "avatar_corporate",
      "kind" => "character",
      "storage_key" => "assets3d/avatar_corporate.64d711270be7.glb",
      "cdn_path" => "/assets3d/avatar_corporate.64d711270be7.glb",
      "sha256" => "64d711270be7722517cf3b1fd8663605af2ffb0e9763c7af0d4bbc7e5a210535",
      "byte_size" => 762_936,
      "animation_clips" => @all_clips,
      "metadata" => %{
        "display_name" => "Corporate",
        "target_height_m" => 1.70,
        "source" => "meshy corporate walking + procedural bake + POI clips",
        "skeleton" => "mixamo_biped"
      }
    }
  ]

  @doc "Idempotent upsert of catalog characters (safe to rerun from seeds)."
  def seed_catalog do
    Enum.each(@catalog, fn attrs ->
      case Repo.get_by(Asset, slug: attrs["slug"]) do
        nil -> %Asset{} |> Asset.changeset(attrs) |> Repo.insert!()
        asset -> asset |> Asset.changeset(attrs) |> Repo.update!()
      end
    end)

    backfill_agent_avatar_ids()
    :ok
  end

  defp backfill_agent_avatar_ids do
    case default_character() do
      %{id: id} ->
        from(a in Mokaid.Agents.Agent,
          where: is_nil(a.avatar_asset_id) or a.avatar_asset_id == ""
        )
        |> Repo.update_all(set: [avatar_asset_id: id])

      _ ->
        {0, nil}
    end
  end

  def list_assets(opts \\ []) do
    kind = Keyword.get(opts, :kind)

    Asset
    |> then(fn q -> if kind, do: where(q, [a], a.kind == ^kind), else: q end)
    |> order_by([a], asc: a.kind, asc: a.slug)
    |> Repo.all()
  end

  def get_asset(id), do: Repo.get(Asset, id)

  def get_asset_by_slug(slug), do: Repo.get_by(Asset, slug: slug)

  def default_character do
    get_asset_by_slug("avatar_male")
  end

  @doc "Absolute or relative URL for an asset, using ASSETS_CDN_URL when set."
  def resolve_url(%Asset{cdn_path: path}) do
    base =
      Application.get_env(:mokaid, :assets_cdn_url, "")
      |> to_string()
      |> String.trim_trailing("/")

    cond do
      base == "" -> path
      String.starts_with?(path, "http") -> path
      true -> base <> path
    end
  end
end
