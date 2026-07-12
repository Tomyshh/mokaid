defmodule MokaidWeb.Asset3dController do
  @moduledoc "3D asset catalog (characters, environments, accessories…)."

  use MokaidWeb, :controller

  alias Mokaid.Assets3d
  alias MokaidWeb.JSON, as: Serializer

  def index(conn, params) do
    opts = if params["kind"], do: [kind: params["kind"]], else: []
    assets = Assets3d.list_assets(opts)
    json(conn, %{data: Enum.map(assets, &Serializer.asset_3d/1)})
  end

  def show(conn, %{"id" => id}) do
    case Assets3d.get_asset(id) do
      nil -> {:error, :not_found}
      asset -> json(conn, %{data: Serializer.asset_3d(asset)})
    end
  end
end
