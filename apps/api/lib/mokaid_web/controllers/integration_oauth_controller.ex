defmodule MokaidWeb.IntegrationOAuthController do
  @moduledoc """
  OAuth flows for workspace integrations (Google, GitHub…).
  """

  use MokaidWeb, :controller

  alias Mokaid.Integrations
  alias Mokaid.Integrations.{GitHubOAuth, GoogleOAuth}
  alias MokaidWeb.JSON, as: Serializer

  def google_start(conn, params) do
    redirect_uri = params["redirect_uri"] || default_google_redirect_uri()
    provider_key = params["provider_key"] || "google_drive"

    with :ok <- Permissions.authorize(current_member(conn), "integrations.connect"),
         {:ok, url} <-
           GoogleOAuth.authorize_url(
             workspace_id(conn),
             current_member(conn).id,
             redirect_uri,
             provider_key
           ) do
      json(conn, %{data: %{authorize_url: url}})
    else
      {:error, :oauth_not_configured} ->
        oauth_not_configured(conn, "Google")

      {:error, :invalid_redirect_uri} ->
        invalid_redirect_uri(conn)

      other ->
        other
    end
  end

  def google_callback(conn, %{"code" => code, "state" => state} = params) do
    redirect_uri = params["redirect_uri"] || default_google_redirect_uri()

    with :ok <- Permissions.authorize(current_member(conn), "integrations.connect"),
         {:ok, result} <- GoogleOAuth.exchange_code(code, state, redirect_uri),
         :ok <- ensure_same_workspace(conn, result.workspace_id),
         {:ok, connections} <-
           Integrations.connect_google_providers(
             result.workspace_id,
             current_member(conn),
             result.credentials,
             result.account
           ),
         {:ok, _} <-
           Integrations.sync_google_mcp_installations(
             result.workspace_id,
             current_member(conn),
             result.credentials,
             result.account
           ) do
      json(conn, %{
        data: %{
          connections: Enum.map(connections, &Serializer.integration_connection/1),
          connected_account: result.account,
          provider_key: result.provider_key
        }
      })
    else
      {:error, :invalid_state} -> invalid_state(conn)
      {:error, {:token_exchange_failed, _, _}} -> token_exchange_failed(conn, "Google")
      other -> other
    end
  end

  def github_start(conn, params) do
    redirect_uri = params["redirect_uri"] || default_github_redirect_uri()

    with :ok <- Permissions.authorize(current_member(conn), "integrations.connect"),
         {:ok, url} <-
           GitHubOAuth.authorize_url(
             workspace_id(conn),
             current_member(conn).id,
             redirect_uri
           ) do
      json(conn, %{data: %{authorize_url: url}})
    else
      {:error, :oauth_not_configured} ->
        oauth_not_configured(conn, "GitHub")

      other ->
        other
    end
  end

  def github_callback(conn, %{"code" => code, "state" => state} = params) do
    redirect_uri = params["redirect_uri"] || default_github_redirect_uri()

    with :ok <- Permissions.authorize(current_member(conn), "integrations.connect"),
         {:ok, result} <- GitHubOAuth.exchange_code(code, state, redirect_uri),
         :ok <- ensure_same_workspace(conn, result.workspace_id),
         {:ok, connection} <-
           Integrations.connect_github_provider(
             result.workspace_id,
             current_member(conn),
             result.credentials,
             result.account
           ),
         {:ok, _} <-
           Integrations.sync_github_mcp_installation(
             result.workspace_id,
             current_member(conn),
             result.credentials,
             result.account
           ) do
      json(conn, %{
        data: %{
          connection: Serializer.integration_connection(connection),
          connected_account: result.account,
          provider_key: GitHubOAuth.provider_key()
        }
      })
    else
      {:error, :invalid_state} -> invalid_state(conn)
      {:error, {:token_exchange_failed, _, _}} -> token_exchange_failed(conn, "GitHub")
      {:error, :forbidden} -> forbidden(conn)
      other -> other
    end
  end

  defp ensure_same_workspace(conn, state_workspace_id) do
    if workspace_id(conn) == state_workspace_id, do: :ok, else: {:error, :forbidden}
  end

  defp forbidden(conn) do
    conn
    |> put_status(:forbidden)
    |> json(%{error: %{code: "forbidden", message: "Workspace mismatch"}})
  end

  defp default_google_redirect_uri do
    Application.get_env(:mokaid, :google_oauth, [])
    |> Keyword.get(:redirect_uris, [])
    |> List.first()
  end

  defp default_github_redirect_uri do
    Application.get_env(:mokaid, :github_oauth, [])
    |> Keyword.get(:redirect_uris, [])
    |> List.first()
  end

  defp oauth_not_configured(conn, provider) do
    conn
    |> put_status(:service_unavailable)
    |> json(%{
      error: %{
        code: "oauth_not_configured",
        message: "#{provider} OAuth is not configured on this environment"
      }
    })
  end

  defp invalid_state(conn) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: %{code: "invalid_state", message: "OAuth state is invalid or expired"}})
  end

  defp invalid_redirect_uri(conn) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{
      error: %{
        code: "invalid_redirect_uri",
        message: "Redirect URI is not allowed for this environment"
      }
    })
  end

  defp token_exchange_failed(conn, provider) do
    conn
    |> put_status(:bad_gateway)
    |> json(%{
      error: %{
        code: "token_exchange_failed",
        message: "#{provider} rejected the authorization code"
      }
    })
  end
end
