defmodule Mokaid.Integrations.LinearOAuth do
  @moduledoc """
  Linear OAuth2 for workspace Linear integration + MCP Hub.

  Credentials come from `LINEAR_CLIENT_ID` / `LINEAR_CLIENT_SECRET`
  (AWS Secrets Manager in deployed environments).
  """

  @authorize_endpoint "https://linear.app/oauth/authorize"
  @token_endpoint "https://api.linear.app/oauth/token"
  @graphql_endpoint "https://api.linear.app/graphql"
  @state_salt "integrations_linear_oauth"
  @state_max_age 600
  @provider_key "linear"

  @scopes ~w(read write issues:create comments:create)

  def provider_key, do: @provider_key

  def linear_provider?(key) when is_binary(key), do: key == @provider_key
  def linear_provider?(_), do: false

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
          "response_type" => "code",
          "scope" => Enum.join(@scopes, ","),
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
      account = fetch_account(tokens["access_token"])

      credentials = %{
        "access_token" => tokens["access_token"],
        "refresh_token" => tokens["refresh_token"],
        "token_type" => tokens["token_type"] || "Bearer",
        "scope" => tokens["scope"],
        "expires_at" =>
          if(tokens["expires_in"],
            do:
              DateTime.utc_now()
              |> DateTime.add(tokens["expires_in"], :second)
              |> DateTime.to_iso8601(),
            else: nil
          )
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
          grant_type: "authorization_code",
          client_id: config[:client_id],
          client_secret: config[:client_secret],
          code: code,
          redirect_uri: redirect_uri
        ]
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

  defp fetch_account(access_token) do
    case Req.post(@graphql_endpoint,
           headers: [
             {"authorization", "Bearer #{access_token}"},
             {"content-type", "application/json"}
           ],
           json: %{query: "{ viewer { name email } }"}
         ) do
      {:ok, %Req.Response{status: 200, body: %{"data" => %{"viewer" => viewer}}}}
      when is_map(viewer) ->
        viewer["email"] || viewer["name"]

      _ ->
        nil
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

  defp config, do: Application.get_env(:mokaid, :linear_oauth, [])
end
