"""Unit tests for web_search tool helpers."""

from __future__ import annotations

from typing import Any

import pytest

import app.tools.web  # noqa: F401 — register tool
from app.tools.registry import RunContext, get_tool
from app.tools.web import format_results_for_llm


def _ctx() -> RunContext:
    return RunContext(run_id="t", workspace_id="w", task_id="task", task_title="BNG CPA")


@pytest.mark.asyncio
async def test_web_search_registered():
    assert get_tool("web_search") is not None


@pytest.mark.asyncio
async def test_web_search_empty_query():
    fn = get_tool("web_search")
    assert fn is not None
    out = await fn({"query": ""}, RunContext(run_id="t", workspace_id="w", task_id=""))
    assert out["results"] == []
    assert "error" in out


@pytest.mark.asyncio
async def test_web_search_duckduckgo_mocked(monkeypatch):
    async def fake_search(query: str, max_results: int) -> dict[str, Any]:
        assert query == "BNG CPA Israel"
        assert max_results == 3
        return {
            "provider": "duckduckgo",
            "results": [
                {
                    "title": "BNG CPA",
                    "url": "https://example.com/bng",
                    "snippet": "Accounting firm",
                }
            ],
        }

    monkeypatch.setattr("app.tools.web._search", fake_search)
    fn = get_tool("web_search")
    assert fn is not None
    out = await fn({"query": "BNG CPA Israel", "max_results": 3}, _ctx())
    assert out["provider"] == "duckduckgo"
    assert len(out["results"]) == 1
    assert out["results"][0]["url"] == "https://example.com/bng"


@pytest.mark.asyncio
async def test_web_search_failure_returns_error(monkeypatch):
    async def boom(_query: str, _max: int) -> dict[str, Any]:
        raise RuntimeError("network down")

    monkeypatch.setattr("app.tools.web._search", boom)
    fn = get_tool("web_search")
    assert fn is not None
    out = await fn({"query": "x"}, _ctx())
    assert out["results"] == []
    assert "unavailable" in out["error"]


def test_format_results_for_llm():
    text = format_results_for_llm(
        {
            "results": [
                {"title": "A", "url": "https://a.test", "snippet": "hello"},
            ]
        }
    )
    assert "https://a.test" in text
    assert "hello" in text


def test_format_results_empty():
    assert "nothing" in format_results_for_llm({"results": [], "error": "oops"})


@pytest.mark.asyncio
async def test_web_search_falls_back_when_tavily_missing(monkeypatch):
    """Without TAVILY_API_KEY, production path must still use DuckDuckGo."""

    class _Settings:
        tavily_api_key = ""

    async def fake_ddg(query: str, max_results: int) -> dict[str, Any]:
        assert query == "Argentina England match"
        assert max_results == 5
        return {
            "provider": "duckduckgo",
            "results": [
                {
                    "title": "Match report",
                    "url": "https://example.com/match",
                    "snippet": "Argentina won",
                }
            ],
        }

    monkeypatch.setattr("app.tools.web.get_settings", lambda: _Settings())
    monkeypatch.setattr("app.tools.web._search_duckduckgo", fake_ddg)
    fn = get_tool("web_search")
    assert fn is not None
    out = await fn({"query": "Argentina England match"}, _ctx())
    assert out["provider"] == "duckduckgo"
    assert out["results"][0]["title"] == "Match report"
