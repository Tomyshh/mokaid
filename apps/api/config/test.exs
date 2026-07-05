import Config

config :mokaid, Mokaid.Repo,
  username: System.get_env("PGUSER", "mokaid"),
  password: System.get_env("PGPASSWORD", "mokaid_dev_password"),
  hostname: System.get_env("PGHOST", "localhost"),
  database: "mokaid_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2,
  types: Mokaid.PostgrexTypes

config :mokaid, MokaidWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "test_secret_key_base_test_secret_key_base_test_secret_key_base_12",
  server: false

config :mokaid, Oban, testing: :inline

# No AI worker in tests: the dispatcher always uses its deterministic heuristic.
config :mokaid, :ai_worker, dispatch: :none, url: nil, token: "test-token"

config :mokaid, :cors_origins, ["http://localhost:5173"]

config :bcrypt_elixir, :log_rounds, 1

config :logger, level: :warning

config :phoenix, :plug_init_mode, :runtime
