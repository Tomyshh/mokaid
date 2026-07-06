defmodule Mokaid.Integrations.SlackOAuth do
  @moduledoc """
  Slack OAuth v2 for workspace Slack integration + MCP Hub.

  Credentials come from `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET`
  (AWS Secrets Manager in deployed environments).
  """

  @authorize_endpoint "https://slack.com/oauth/v2/authorize"
  @token_endpoint "https://slack.com/api/oauth.v2.access"
  @state_salt "integrations_slack_oauth"
  @state_max_age 600
  @provider_key "slack"

  @bot_scopes ~w(
    channels:read
    channels:history
    chat:write
    groups:read
    groups:history
    im:read
    im:history
    mpim:read
    users:read
  )

  def provider_key, do: @provider_key

  def slack_provider?(key) when is_binary(key), do: key == @provider_key
  def slack_provider?(_), do: false

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
          "redirect_uri" => redirect_uri,
          "scope" => Enum.join(@bot_scopes, ","),
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
      team = tokens["team"] || %{}
      account = team["name"] || team["id"]

      credentials = %{
        "access_token" => tokens["access_token"],
        "token_type" => tokens["token_type"] || "bot",
        "scope" => tokens["scope"],
        "bot_user_id" => tokens["bot_user_id"],
        "app_id" => tokens["app_id"] || config()[:app_id],
        "team_id" => team["id"],
        "team_name" => team["name"],
        "refresh_token" => tokens["refresh_token"],
        "expires_at" =>
          if(tokens["expires_in"],
            do:
              DateTime.utc_now()
              |> DateTime.add(tokens["expires_in"], :second)
              |> DateTime.to_iso8601(),
            else: nil
          ),
        "authed_user" => tokens["authed_user"]
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

    response =
      Req.post(@token_endpoint,
        form: [
          code: code,
          client_id: config[:client_id],
          client_secret: config[:client_secret],
          redirect_uri: redirect_uri
        ]
      )

    case response do
      {:ok, %Req.Response{status: 200, body: %{"ok" => true} = body}} ->
        {:ok, body}

      {:ok, %Req.Response{status: 200, body: %{"ok" => false, "error" => error} = body}} ->
        {:error, {:token_exchange_failed, error, inspect(body)}}

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

  defp config, do: Application.get_env(:mokaid, :slack_oauth, [])
end
