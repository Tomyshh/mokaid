defmodule Mokaid.Assets3d do
  @moduledoc """
  Catalog of 3D assets (characters, environments, accessories…).

  Binary GLBs live on S3 (`mokaid-assets-3d-*`); only metadata is stored here.
  """

  import Ecto.Query

  alias Mokaid.Assets3d.Asset
  alias Mokaid.Repo

  @avatar_male_clips ~w(
    idle walking typing working thinking talking waiting blocked
    celebrating away offline reviewing learning requesting_approval
  )

  # sha256 of apps/web/public/assets3d/avatar_male.e84cdc437276.glb
  @avatar_male_sha256 "e84cdc4372762e99f23edeac77299fd8d6557e7abfdb225fad8f5ecb4104ec2c"
  @avatar_male_bytes 3_665_504
  @avatar_male_file "avatar_male.e84cdc437276.glb"

  @doc "Idempotent upsert of the default male avatar (safe to rerun from seeds)."
  def seed_catalog do
    attrs = %{
      "slug" => "avatar_male",
      "kind" => "character",
      "storage_key" => "assets3d/#{@avatar_male_file}",
      "cdn_path" => "/assets3d/#{@avatar_male_file}",
      "sha256" => @avatar_male_sha256,
      "byte_size" => @avatar_male_bytes,
      "animation_clips" => @avatar_male_clips,
      "metadata" => %{
        "display_name" => "Male character",
        "target_height_m" => 1.75,
        "source" => "fiverr + procedural bake"
      }
    }

    case Repo.get_by(Asset, slug: attrs["slug"]) do
      nil -> %Asset{} |> Asset.changeset(attrs) |> Repo.insert!()
      asset -> asset |> Asset.changeset(attrs) |> Repo.update!()
    end

    backfill_agent_avatar_ids()
    :ok
  end

  defp backfill_agent_avatar_ids do
    case default_character() do
      %{id: id} ->
        from(a in Mokaid.Agents.Agent, where: is_nil(a.avatar_asset_id) or a.avatar_asset_id == "")
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
