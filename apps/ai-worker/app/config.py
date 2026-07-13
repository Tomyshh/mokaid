from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    phoenix_api_url: str = "http://localhost:4000"
    worker_auth_token: str = "dev-worker-token"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    # Image editing model (images.edit). Falls back to gpt-image-1 at runtime
    # when unavailable on the account.
    openai_image_model: str = "gpt-image-2"

    # Anthropic (preferred text provider when configured). Two tiers keep the
    # margin healthy: "fast" for conversational replies and triage, "smart"
    # for planning and customer-visible deliverables.
    anthropic_api_key: str = ""
    anthropic_fast_model: str = "claude-haiku-4-5"
    anthropic_smart_model: str = "claude-sonnet-5"

    # DeepSeek — cheapest tier for bulk/background work (extraction,
    # summaries, classification) via the OpenAI-compatible API. V4-Flash is
    # ~50× cheaper than Claude on output tokens.
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_fast_model: str = "deepseek-v4-flash"
    deepseek_smart_model: str = "deepseek-v4-pro"

    # Optional Tavily key — when set, web_search prefers Tavily over DuckDuckGo.
    tavily_api_key: str = ""

    s3_endpoint: str = "http://localhost:9000"
    s3_access_key_id: str = "mokaid"
    s3_secret_access_key: str = "mokaid_dev_password"

    # Postgres DSN for run persistence (LangGraph checkpointer + saved run
    # requests). Empty = in-memory only (runs don't survive a worker restart).
    database_url: str = ""

    # LangSmith tracing — set langsmith_api_key (and optionally
    # langsmith_project) to trace every agent run. Fully off otherwise.
    langsmith_api_key: str = ""
    langsmith_project: str = "mokaid-ai-worker"

    # SQS consumption (production). Empty in dev: dispatch happens over HTTP.
    ai_runs_queue_url: str = ""
    aws_region: str = ""

    max_steps_per_run: int = 20
    run_timeout_seconds: int = 600


@lru_cache
def get_settings() -> Settings:
    return Settings()
