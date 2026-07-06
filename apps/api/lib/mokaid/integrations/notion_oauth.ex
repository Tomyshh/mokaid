defmodule Mokaid.Integrations.NotionOAuth do
  @moduledoc """
  Notion OAuth2 for workspace Notion integration + MCP Hub.

  Credentials come from `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET`
  (AWS Secrets Manager in deployed environments).
  """

  @authorize_endpoint "https://api.notion.com/v1/oauth/authorize"
  @token_endpoint "https://api.notion.com/v1/oauth/token"
  @state_salt "integrations_notion_oauth"
  @state_max_age 600
  @provider_key "notion"

  def provider_key, do: @provider_key

  def notion_provider?(key) when is_binary(key), do: key == @provider_key
  def notion_provider?(_), do: false

  def configured? do
    config = config()

    is_binary(config[:client_id]) and config[:client_id] != "" and
      is_binary(config[:client_secret]) and config[:client_secret] != ""
  end

  def authorize_url(workspace_id, member_id, redirect_uri) do
    with :ok <- ensure_configured(),
         :ok <- validate_redirect_uri(redirect_uri) do
      state =
        Phoenix.Token.sign(MokaidWeb.Endpoint, @state_salt, %{
          workspace_id: workspace_id,
          member_id: member_id
        })

      query =
        URI.encode_query(%{
          "client_id" => config()[:client_id],
          "response_type" => "code",
          "owner" => "user",
          "redirect_uri" => redirect_uri,
          "state" => state
        })

      {:ok, "#{@authorize_endpoint}?#{query}"}
    end
  end

  def exchange_code(code, state, redirect_uri) do
    with :ok <- ensure_configured(),
         :ok <- validate_redirect_uri(redirect_uri),
         {:ok, %{workspace_id: workspace_id, member_id: member_id}} <-
           Phoenix.Token.verify(MokaidWeb.Endpoint, @state_salt, state, max_age: @state_max_age),
         {:ok, tokens} <- request_tokens(code, redirect_uri) do
      account = tokens["workspace_name"] || tokens["workspace_id"] || "Notion workspace"

      credentials = %{
        "access_token" => tokens["access_token"],
        "refresh_token" => tokens["refresh_token"],
        "token_type" => tokens["token_type"] || "bearer",
        "bot_id" => tokens["bot_id"],
        "workspace_id" => tokens["workspace_id"],
        "workspace_name" => tokens["workspace_name"],
        "owner" => tokens["owner"]
      }

      {:ok,
       %{
         workspace_id: workspace_id,
         member_id: member_id,
         credentials: credentials,
         account: account
       }}
    else
      {:error, :invalid} -> {:error, :invalid_state}
      {:error, :expired} -> {:error, :invalid_state}
      other -> other
    end
  end

  defp request_tokens(code, redirect_uri) do
    config = config()
    basic = Base.encode64("#{config[:client_id]}:#{config[:client_secret]}")

    response =
      Req.post(@token_endpoint,
        headers: [
          {"authorization", "Basic #{basic}"},
          {"content-type", "application/json"},
          {"notion-version", "2022-06-28"}
        ],
        json: %{
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirect_uri
        }
      )

    case response do
      {:ok, %Req.Response{status: 200, body: %{"access_token" => _} = body}} ->
        {:ok, body}

      {:ok, %Req.Response{status: status, body: body}} ->
        {:error, {:token_exchange_failed, status, inspect(body)}}

      {:error, exception} ->
        {:error, {:token_exchange_failed, :network, Exception.message(exception)}}
    end
  end

  defp validate_redirect_uri(redirect_uri) do
    if redirect_uri in (config()[:redirect_uris] || []) do
      :ok
    else
      {:error, :invalid_redirect_uri}
    end
  end

  defp ensure_configured do
    if configured?(), do: :ok, else: {:error, :oauth_not_configured}
  end

  defp config, do: Application.get_env(:mokaid, :notion_oauth, [])
end
