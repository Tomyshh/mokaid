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
      "storage_key" => "assets3d/avatar_male.fb08cdc0ddf0.glb",
      "cdn_path" => "/assets3d/avatar_male.fb08cdc0ddf0.glb",
      "sha256" => "fb08cdc0ddf095d0507bcf215ca0cac8450e17dc441ee46a985aa0fde63cb4fc",
      "byte_size" => 4_233_500,
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
      "storage_key" => "assets3d/avatar_female.c8ff304eeb2a.glb",
      "cdn_path" => "/assets3d/avatar_female.c8ff304eeb2a.glb",
      "sha256" => "c8ff304eeb2a2577ce5564384a3020e46fe650923032096a64e1714befa4197c",
      "byte_size" => 628_520,
      "animation_clips" => @all_clips,
      "metadata" => %{
        "display_name" => "Female character",
        "target_height_m" => 1.65,
        "source" => "fiverr walking + procedural bake + POI clips",
        "skeleton" => "mixamo_biped"
      }
    },
    %{
      "slug" => "avatar_finance",
      "kind" => "character",
      "storage_key" => "assets3d/avatar_finance.dc620edbd8c2.glb",
      "cdn_path" => "/assets3d/avatar_finance.dc620edbd8c2.glb",
      "sha256" => "dc620edbd8c2f7b8cd59a20de0e3bebf40f0fd1a2d220bd43e0f95e0a3bd3b05",
      "byte_size" => 998_532,
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
      "storage_key" => "assets3d/avatar_corporate.95f6a0768673.glb",
      "cdn_path" => "/assets3d/avatar_corporate.95f6a0768673.glb",
      "sha256" => "95f6a0768673f437a6fbdfecab7747b8d259006ae1d95e7675c2ce20576ccd9a",
      "byte_size" => 713_404,
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
