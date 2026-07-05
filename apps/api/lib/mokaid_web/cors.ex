defmodule MokaidWeb.Cors do
  @moduledoc "CORS origin allowlist sourced from configuration."

  # Corsica 2.x calls this with (conn, origin).
  def allowed_origin?(_conn, origin) when is_binary(origin) do
    origin in Application.get_env(:mokaid, :cors_origins, [])
  end

  def allowed_origin?(_conn, _origin), do: false
end
