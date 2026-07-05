defmodule Mokaid.Integrations.LogoAssets do
  @moduledoc """
  Uploads official full-color integration logos from `priv/integration-logos/`
  into S3/MinIO under `static/integration-logos/`.

  Source files are committed in the repo (Wikimedia Commons / official brand assets).
  Run via seeds or `mix mokaid.seed_integration_logos`.
  """

  alias Mokaid.Integrations.IntegrationProvider
  alias Mokaid.Repo
  alias Mokaid.Storage

  @priv_dir Path.join(:code.priv_dir(:mokaid), "integration-logos")

  @files %{
    "github" => "github.svg",
    "slack" => "slack.svg",
    "google_drive" => "google_drive.svg",
    "gmail" => "gmail.svg",
    "notion" => "notion.png",
    "linear" => "linear.svg",
    "trello" => "trello.svg",
    "jira" => "jira.svg",
    "hubspot" => "hubspot.svg",
    "zapier" => "zapier.svg",
    "microsoft_teams" => "microsoft_teams.svg",
    "dropbox" => "dropbox.svg",
    "stripe" => "stripe.svg",
    "google_calendar" => "google_calendar.svg",
    "google_sheets" => "google_sheets.svg",
    "google_meet" => "google_meet.svg"
  }

  @doc "Uploads all bundled provider logos and updates `logo_storage_key`."
  def seed_all do
    Enum.each(@files, &seed_one/1)
    :ok
  end

  defp seed_one({provider_key, filename}) do
    path = Path.join(@priv_dir, filename)

    with %IntegrationProvider{} = provider <- Repo.get_by(IntegrationProvider, key: provider_key),
         true <- File.exists?(path),
         {:ok, body} <- File.read(path),
         ext <- Path.extname(filename) |> String.trim_leading("."),
         content_type <- content_type(ext),
         storage_key <- "static/integration-logos/#{provider_key}.#{ext}",
         {:ok, _} <- Storage.upload_platform_asset(storage_key, body, content_type) do
      provider
      |> Ecto.Changeset.change(logo_storage_key: storage_key)
      |> Repo.update!()

      :ok
    else
      nil ->
        :skipped

      false ->
        require Logger
        Logger.warning("integration logo file missing for #{provider_key}: #{path}")
        :skipped

      {:error, reason} ->
        require Logger
        Logger.warning("integration logo upload failed for #{provider_key}: #{inspect(reason)}")
        :error
    end
  end

  defp content_type("png"), do: "image/png"
  defp content_type("jpg"), do: "image/jpeg"
  defp content_type("webp"), do: "image/webp"
  defp content_type(_), do: "image/svg+xml"
end
