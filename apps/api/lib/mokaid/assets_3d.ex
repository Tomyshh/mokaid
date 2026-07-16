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
      "storage_key" => "assets3d/avatar_male.342ae6ded162.glb",
      "cdn_path" => "/assets3d/avatar_male.342ae6ded162.glb",
      "sha256" => "342ae6ded162a626d97197dcd6d6dba038101de9ca235630c9bce2b08c478032",
      "byte_size" => 4_333_312,
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
      "storage_key" => "assets3d/avatar_female.7d0d7345a182.glb",
      "cdn_path" => "/assets3d/avatar_female.7d0d7345a182.glb",
      "sha256" => "7d0d7345a1826285f567eb2b7975e3f5ae921f4cb6e9def5662e089daf665007",
      "byte_size" => 684_504,
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
      "storage_key" => "assets3d/avatar_finance.826a68935f66.glb",
      "cdn_path" => "/assets3d/avatar_finance.826a68935f66.glb",
      "sha256" => "826a68935f663a53bcf9a3c831c91030b1e3ba4caac85486c2f6cec85d312760",
      "byte_size" => 1_184_088,
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
      "storage_key" => "assets3d/avatar_corporate.dd078ffb0766.glb",
      "cdn_path" => "/assets3d/avatar_corporate.dd078ffb0766.glb",
      "sha256" => "dd078ffb07669c56ac27a4081ea7f7edb33d75a72c420b5aac840a4169fb0e54",
      "byte_size" => 769_388,
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
