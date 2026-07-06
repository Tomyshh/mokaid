"""Direct chat replies: the agent's DM thread with a teammate.

The chat is a work surface: the agent answers conversationally, but when the
teammate actually asks for a deliverable ("build me a landing page", "turn
this into a report"), it acknowledges and asks Phoenix to spin up a real task
assigned to it — the run's output later lands back in this thread.

Files dropped into the chat always start a task (handled on the Phoenix side);
this module only decides chat-vs-work for text-only messages.
"""

from typing import Any

import structlog

from app import llm
from app.clients.phoenix import PhoenixClient

log = structlog.get_logger()

_SYSTEM = """You are {name}, an AI employee in your team's workspace, chatting
one-on-one with a teammate in a direct-message thread (like Slack DMs).

Your profile:
- Role: {role}
- Department: {department}
- Skills: {skills}
- Current status: {status}

Your current workload:
{tasks}

The teammate just wrote to you. Decide whether their latest message is:
(a) conversation — a question, a status check, small talk, a clarification; or
(b) an actionable work request — they want you to PRODUCE something (a
    document, a report, a website/landing page, an analysis, an edited image,
    a transcription…).

Respond with a JSON object:
{{
  "reply": string,        // your chat message, 1-4 sentences, first person,
                          // warm and human, no markdown, SAME LANGUAGE as the
                          // teammate. For work requests, confirm what you'll
                          // do and say you'll share the result here shortly.
  "start_task": boolean,  // true only for a clear work request you can act on
  "task_instruction": string  // if start_task: a clean, self-contained brief
                              // capturing everything they asked for. Else "".
}}

Rules:
- Only set start_task=true when they clearly want a deliverable AND it's within
  what an AI employee can produce. A vague idea or a question is start_task=false.
- Never invent tasks or results. Never repeat your previous message.
- Answer questions about your workload concretely using the list above.
"""


def _format_tasks(tasks: list[dict[str, Any]]) -> str:
    if not tasks:
        return "- (no active tasks right now)"
    lines = []
    for task in tasks[:5]:
        title = task.get("title") or "Untitled"
        status = task.get("status") or "unknown"
        progress = task.get("progress_percent")
        suffix = f", {progress}% done" if isinstance(progress, (int, float)) else ""
        lines.append(f"- {title} ({status}{suffix})")
    return "\n".join(lines)


async def reply(payload: dict[str, Any], phoenix: PhoenixClient | None = None) -> bool:
    """Generates the agent's DM reply (and possibly starts a task) via Phoenix."""
    if not llm.is_configured():
        return False

    phoenix = phoenix or PhoenixClient()
    agent = payload.get("agent") or {}
    conversation = payload.get("conversation") or []

    thread = "\n".join(
        f"- {entry.get('author', '?')}: {entry.get('body', '')}"
        for entry in conversation[-14:]
        if isinstance(entry, dict)
    )

    system = _SYSTEM.format(
        name=agent.get("display_name") or "an AI agent",
        role=agent.get("role_title") or "Generalist",
        department=agent.get("department") or "—",
        skills=", ".join(agent.get("skills") or []) or "generalist",
        status=agent.get("status") or "available",
        tasks=_format_tasks(payload.get("current_tasks") or []),
    )

    try:
        result = await llm.chat_json(
            system=system,
            user=(
                "DM thread (most recent last — 'you' lines are your own "
                f"previous messages; reply to the last teammate message):\n{thread}"
            ),
            max_tokens=500,
        )
    except Exception as exc:  # noqa: BLE001 — a missing reply is acceptable
        log.warning("direct_chat_llm_failed", error=str(exc))
        return False

    text = (result.get("reply") or "").strip()
    if not text:
        return False

    start_task = bool(result.get("start_task"))
    instruction = (result.get("task_instruction") or "").strip()

    posted = await phoenix.post_agent_chat_message(
        payload["workspace_id"],
        payload["agent_id"],
        text,
        start_task=start_task and bool(instruction),
        instruction=instruction,
        member_id=payload.get("member_id"),
    )
    if posted:
        log.info(
            "direct_chat_replied",
            agent_id=payload["agent_id"],
            started_task=start_task and bool(instruction),
        )
    return posted
