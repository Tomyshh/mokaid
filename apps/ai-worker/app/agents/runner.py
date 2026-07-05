"""Agent run orchestration.

Executes a task as a sequence of planned steps (LLM planner when an OpenAI
key is configured, deterministic plans otherwise). Each step may invoke a
tool; HIGH/CRITICAL-risk tools pause the run in `waiting_for_approval` until
the resume endpoint is called with a human decision. Run state is kept
in-memory per worker instance (production: externalize to Redis/DB
checkpointer via LangGraph's persistence layer).
"""

import asyncio
import json
import re

import structlog

from app.agents.acknowledge import post_acknowledgement
from app.agents.planner import plan_steps
from app.clients.phoenix import PhoenixClient
from app.mcp.client import TOOL_PREFIX, McpToolbox
from app.policies.approval import requires_approval, risk_for_tool
from app.schemas import ResumeRequest, RunRequest, RunState, RunStatus, ToolCall
from app.tools.registry import RunContext, get_tool

log = structlog.get_logger()

_RUNS: dict[str, RunState] = {}
_RESUME_EVENTS: dict[str, asyncio.Event] = {}
_RESUME_DECISIONS: dict[str, ResumeRequest] = {}


def get_run(run_id: str) -> RunState | None:
    return _RUNS.get(run_id)


async def execute_run(request: RunRequest, phoenix: PhoenixClient | None = None) -> RunState:
    phoenix = phoenix or PhoenixClient()
    state = RunState(run_id=request.run_id, status=RunStatus.RUNNING)
    _RUNS[request.run_id] = state

    ctx = RunContext(
        run_id=request.run_id,
        workspace_id=request.workspace_id,
        task_id=request.task_id,
        task_title=request.task_title,
        task_description=request.task_description,
        phoenix=phoenix,
        attached_files=[f.model_dump() for f in request.attached_files],
    )

    await phoenix.update_run_status(request.run_id, RunStatus.RUNNING.value)
    log.info("run_started", run_id=request.run_id, task_id=request.task_id)

    # Granted MCP servers: discover their tools so the planner can decide,
    # on its own, whether any external tool helps with this task.
    toolbox = McpToolbox(request.mcp_servers)
    mcp_tools = await toolbox.discover() if request.mcp_servers else []

    # Conversational acknowledgement: the agent tells its teammates it is
    # picking up the task (or explains why it can't). Never blocks the run.
    await post_acknowledgement(request, phoenix, ctx.usage, mcp_tools)

    try:
        for step in await plan_steps(request, ctx.usage, mcp_tools):
            tool_name: str = step["tool"]
            tool_input: dict = step["input"]
            risk = risk_for_tool(tool_name)
            call = ToolCall(tool=tool_name, input=tool_input, risk=risk)

            if requires_approval(tool_name):
                state.status = RunStatus.WAITING_FOR_APPROVAL
                state.pending_tool = call
                await phoenix.update_run_status(request.run_id, state.status.value)
                await phoenix.request_approval(request.run_id, tool_name, tool_input, risk.value)
                log.info("run_waiting_approval", run_id=request.run_id, tool=tool_name)

                decision = await _wait_for_decision(request.run_id)
                state.pending_tool = None

                if decision.decision == "rejected":
                    call.approved = False
                    state.tool_calls.append(call)
                    log.info("tool_rejected", run_id=request.run_id, tool=tool_name)
                    continue

                call.approved = True
                if decision.decision == "edited" and decision.payload:
                    call.input = decision.payload
                state.status = RunStatus.RUNNING
                await phoenix.update_run_status(request.run_id, state.status.value)

            if tool_name.startswith(TOOL_PREFIX):
                call.output = await toolbox.call(tool_name, call.input)
            else:
                fn = get_tool(tool_name)
                if fn is None:
                    raise ValueError(f"unknown tool: {tool_name}")
                enriched_input = {**call.input, "_attached_files": [f.model_dump() for f in request.attached_files]}
                call.output = await fn(enriched_input, ctx)

            state.tool_calls.append(call)
            state.steps.append({"tool": tool_name, "ok": True})
            log.info("tool_executed", run_id=request.run_id, tool=tool_name)

        artifacts = await _save_artifacts(request, state, phoenix)

        state.status = RunStatus.COMPLETED
        state.output = {
            "steps": len(state.steps),
            "tool_calls": [c.model_dump(mode="json") for c in state.tool_calls],
            "artifacts": artifacts,
        }
        await phoenix.complete_run(
            request.run_id,
            state.output,
            token_usage=ctx.usage.as_dict(),
            cost_cents=ctx.usage.cost_cents,
        )
        log.info(
            "run_completed",
            run_id=request.run_id,
            tokens=ctx.usage.as_dict()["total_tokens"],
            cost_cents=ctx.usage.cost_cents,
        )

    except asyncio.CancelledError:
        state.status = RunStatus.CANCELED
        await phoenix.update_run_status(request.run_id, state.status.value)
        raise
    except Exception as exc:  # noqa: BLE001 — report any failure to the API
        state.status = RunStatus.FAILED
        state.error = str(exc)
        await phoenix.fail_run(request.run_id, state.error)
        log.error("run_failed", run_id=request.run_id, error=state.error)

    return state


def _safe_filename(name: str) -> str:
    slug = re.sub(r"[^\w\- ]+", "", name, flags=re.UNICODE).strip().replace(" ", "-")
    return (slug or "output")[:80]


async def _save_artifacts(request: RunRequest, state: RunState, phoenix: PhoenixClient) -> list[str]:
    """Uploads the documents produced during the run as Drive files linked to
    the task, so users can open the agent's output. Never fails the run."""
    saver = getattr(phoenix, "save_task_output", None)
    if saver is None:
        return []

    artifacts: list[str] = []
    for call in state.tool_calls:
        output = call.output if isinstance(call.output, dict) else None
        if output is None:
            continue

        try:
            if call.tool == "draft_document" and output.get("content"):
                filename = f"{_safe_filename(output.get('title') or request.task_title or 'document')}.md"
                saved = await saver(
                    request.workspace_id,
                    request.task_id,
                    filename,
                    output["content"],
                    mime_type="text/markdown",
                )
                if saved:
                    artifacts.append(filename)
            elif call.tool == "generate_report" and output.get("report"):
                filename = f"{_safe_filename(request.task_title or 'report')}-report.json"
                saved = await saver(
                    request.workspace_id,
                    request.task_id,
                    filename,
                    json.dumps(output["report"], indent=2, ensure_ascii=False),
                    mime_type="application/json",
                )
                if saved:
                    artifacts.append(filename)
            elif call.tool == "transform_image" and output.get("filename"):
                artifacts.append(output["filename"])
            elif call.tool == "transcribe_audio" and output.get("transcript"):
                clean = _safe_filename(request.task_title or "transcript")
                artifacts.append(f"{clean}-transcript.txt")
            elif call.tool == "analyze_file" and output.get("analysis"):
                filename = f"{_safe_filename(request.task_title or 'analysis')}.md"
                saved = await saver(
                    request.workspace_id,
                    request.task_id,
                    filename,
                    f"# Analysis\n\n{output['analysis']}",
                    mime_type="text/markdown",
                )
                if saved:
                    artifacts.append(filename)
        except Exception as exc:  # noqa: BLE001 — artifacts are best-effort
            log.warning("artifact_save_failed", run_id=request.run_id, tool=call.tool, error=str(exc))

    return artifacts


async def _wait_for_decision(run_id: str) -> ResumeRequest:
    event = asyncio.Event()
    _RESUME_EVENTS[run_id] = event
    await event.wait()
    _RESUME_EVENTS.pop(run_id, None)
    return _RESUME_DECISIONS.pop(run_id)


def resume_run(request: ResumeRequest) -> bool:
    event = _RESUME_EVENTS.get(request.run_id)
    if event is None:
        return False
    _RESUME_DECISIONS[request.run_id] = request
    event.set()
    return True
