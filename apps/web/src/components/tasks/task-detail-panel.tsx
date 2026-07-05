import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  ThumbsUp,
  Undo2,
} from "lucide-react";
import { apiFetch } from "@/api/client";
import type { Envelope, TaskAttachment, TaskRunToolCall } from "@/api/types";
import {
  useAgents,
  useCreateTaskComment,
  useProjects,
  useTask,
  useToggleSubtask,
  useUpdateTask,
} from "@/api/hooks";
import { DetailPanel } from "@/components/ui/detail-panel";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PriorityBadge, TaskStatusBadge } from "@/components/ui/status";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatBytes, formatDateTime } from "@/lib/format";

const NO_PROJECT = "__none__";
const NO_AGENT = "__none__";

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface ProducedDoc {
  title: string;
  content: string;
}

function producedDocs(toolCalls: TaskRunToolCall[]): ProducedDoc[] {
  return toolCalls.flatMap((call) => {
    const out = call.output;
    if (!out || typeof out !== "object") return [];
    if (call.tool === "draft_document" && typeof out.content === "string") {
      return [{ title: typeof out.title === "string" ? out.title : "Document", content: out.content }];
    }
    if (call.tool === "summarize" && typeof out.summary === "string" && out.summary) {
      return [{ title: "Summary", content: out.summary }];
    }
    if (call.tool === "generate_report" && out.report) {
      return [{ title: "Report", content: JSON.stringify(out.report, null, 2) }];
    }
    return [];
  });
}

function AttachmentRow({ file }: { file: TaskAttachment }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const res = await apiFetch<Envelope<{ url: string; name: string }>>(
        `/api/drive/${file.id}/download`,
      );
      window.open(res.data.url, "_blank", "noopener");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface-raised px-2.5 py-2">
      <FileText size={14} className="shrink-0 text-primary-light" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium text-text">{file.name}</p>
        <p className="text-[10px] text-text-muted">
          {formatBytes(file.size_bytes)} · {formatDateTime(file.inserted_at)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={download}
        loading={busy}
        aria-label={`Download ${file.name}`}
      >
        <Download size={13} />
      </Button>
    </div>
  );
}

export function TaskDetailPanel({
  taskId,
  onClose,
}: {
  taskId: string | null;
  onClose: () => void;
}) {
  const [comment, setComment] = useState("");
  const [expandedDoc, setExpandedDoc] = useState<number | null>(0);

  const { data: taskData, isLoading } = useTask(taskId);
  const { data: agentsData } = useAgents();
  const { data: projectsData } = useProjects();
  const createComment = useCreateTaskComment();
  const toggleSubtask = useToggleSubtask();
  const updateTask = useUpdateTask();

  const task = taskData?.data ?? null;
  const agents = agentsData?.data ?? [];
  const projects = projectsData?.data ?? [];

  // Agent, project and due date stay editable until the task is closed or past due.
  const editable = useMemo(() => {
    if (!task) return false;
    if (["completed", "canceled"].includes(task.status)) return false;
    if (task.due_at && new Date(task.due_at).getTime() < Date.now()) return false;
    return true;
  }, [task]);

  const outputs = task?.attachments.filter((f) => f.source === "output") ?? [];
  const inputs = task?.attachments.filter((f) => f.source === "input") ?? [];
  const run = task?.latest_run ?? null;
  const docs = useMemo(() => producedDocs(run?.output?.tool_calls ?? []), [run]);
  const agentWorking = run != null && ["queued", "running", "waiting_for_approval"].includes(run.status);

  const submitComment = () => {
    if (!task || !comment.trim()) return;
    createComment.mutate(
      { taskId: task.id, body: comment.trim() },
      { onSuccess: () => setComment("") },
    );
  };

  const patch = (body: Record<string, unknown>) => {
    if (!task) return;
    updateTask.mutate({ id: task.id, ...body });
  };

  return (
    <DetailPanel open={taskId != null} onClose={onClose} title="Task Details">
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Loader2 size={18} className="animate-spin" />
        </div>
      )}

      {task && (
        <div className="space-y-5 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold leading-snug text-text">{task.title}</h3>
            {task.description && (
              <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.tags.map((tag) => (
              <Badge key={tag} tone="muted">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Agent working right now */}
          {agentWorking && (
            <div className="flex items-center gap-2.5 rounded-lg border border-info/30 bg-info/10 px-3 py-2.5">
              <Loader2 size={14} className="shrink-0 animate-spin text-info" />
              <p className="text-[11px] leading-snug text-text-secondary">
                <span className="font-semibold text-text">
                  {task.assigned_agent_name ?? "The agent"}
                </span>{" "}
                is working on this task — the output will appear here.
              </p>
            </div>
          )}

          {/* Review gate: the agent finished, a human decides */}
          {task.status === "in_review" && (
            <div className="rounded-lg border border-primary/40 bg-primary-muted/30 px-3 py-2.5">
              <p className="flex items-start gap-2 text-[11px] leading-snug text-text-secondary">
                <Sparkles size={13} className="mt-0.5 shrink-0 text-primary-light" />
                <span>
                  <span className="font-semibold text-text">Waiting for your review.</span>{" "}
                  {task.assigned_agent_name ?? "The agent"} finished its work. Check the output
                  below, then approve or send it back.
                </span>
              </p>
              <div className="mt-2.5 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  loading={updateTask.isPending}
                  onClick={() => patch({ status: "completed" })}
                >
                  <ThumbsUp size={12} /> Approve & complete
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => patch({ status: "in_progress" })}
                >
                  <Undo2 size={12} /> Request changes
                </Button>
              </div>
            </div>
          )}

          {/* Failed run */}
          {run?.status === "failed" && task.status !== "completed" && (
            <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-danger" />
              <p className="text-[11px] leading-snug text-text-secondary">
                <span className="font-semibold text-danger">The last run failed.</span>{" "}
                {run.error ?? "Unknown error."}
              </p>
            </div>
          )}

          {/* Editable meta */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-text-muted">Assigned to</span>
              {editable ? (
                <Select
                  className="h-8 w-44 text-[11px]"
                  value={task.assigned_agent_id ?? NO_AGENT}
                  onValueChange={(value) =>
                    patch({ assigned_agent_id: value === NO_AGENT ? null : value })
                  }
                  options={[
                    { value: NO_AGENT, label: "Unassigned" },
                    ...agents.map((a) => ({ value: a.id, label: a.display_name })),
                  ]}
                />
              ) : (
                <span className="flex items-center gap-1.5 text-text">
                  <Avatar
                    name={task.assigned_agent_name}
                    size="xs"
                    isAi={task.assigned_agent_kind === "ai"}
                  />
                  {task.assigned_agent_name ?? "Unassigned"}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-text-muted">Project</span>
              {editable ? (
                <Select
                  className="h-8 w-44 text-[11px]"
                  value={task.project_id ?? NO_PROJECT}
                  onValueChange={(value) =>
                    patch({ project_id: value === NO_PROJECT ? null : value })
                  }
                  options={[
                    { value: NO_PROJECT, label: "No project" },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
              ) : (
                <span className="text-text">{task.project_name ?? "·"}</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-text-muted">Due</span>
              {editable ? (
                <input
                  type="datetime-local"
                  className="mk-input h-8 w-44 text-[11px]"
                  value={toDatetimeLocal(task.due_at)}
                  onChange={(e) =>
                    patch({ due_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                  }
                />
              ) : (
                <span className="text-text">{formatDateTime(task.due_at)}</span>
              )}
            </div>
          </div>

          {task.progress_percent > 0 && (
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-text-muted">
                <span>Progress</span>
                <span className="font-semibold text-text">{task.progress_percent}%</span>
              </div>
              <ProgressBar value={task.progress_percent} />
            </div>
          )}

          {/* Agent output: files + generated content */}
          {(outputs.length > 0 || docs.length > 0) && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Output · {outputs.length + docs.length}
              </p>
              <div className="space-y-1.5">
                {outputs.map((file) => (
                  <AttachmentRow key={file.id} file={file} />
                ))}
                {docs.map((doc, index) => (
                  <div key={index} className="rounded-md border border-border bg-surface-raised">
                    <button
                      type="button"
                      onClick={() => setExpandedDoc(expandedDoc === index ? null : index)}
                      className="flex w-full items-center gap-2 px-2.5 py-2 text-left mk-focus-ring"
                    >
                      <Sparkles size={13} className="shrink-0 text-primary-light" />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-text">
                        {doc.title}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {expandedDoc === index ? "Hide" : "View"}
                      </span>
                    </button>
                    {expandedDoc === index && (
                      <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap border-t border-border px-2.5 py-2 font-sans text-[11px] leading-relaxed text-text-secondary">
                        {doc.content}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User-provided files */}
          {inputs.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                <Paperclip size={11} /> Attachments · {inputs.length}
              </p>
              <div className="space-y-1.5">
                {inputs.map((file) => (
                  <AttachmentRow key={file.id} file={file} />
                ))}
              </div>
            </div>
          )}

          {task.subtasks.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Subtasks · {task.subtask_done_count}/{task.subtask_count}
              </p>
              <div className="space-y-1.5">
                {task.subtasks
                  .slice()
                  .sort((a, b) => a.position - b.position)
                  .map((subtask) => (
                    <button
                      key={subtask.id}
                      type="button"
                      onClick={() =>
                        toggleSubtask.mutate({
                          taskId: task.id,
                          subtaskId: subtask.id,
                          done: !subtask.done,
                        })
                      }
                      className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-xs transition-colors hover:bg-surface-hover mk-focus-ring"
                    >
                      {subtask.done ? (
                        <CheckCircle2 size={14} className="shrink-0 text-success" />
                      ) : (
                        <Circle size={14} className="shrink-0 text-text-muted" />
                      )}
                      <span className={subtask.done ? "text-text-muted line-through" : "text-text"}>
                        {subtask.title}
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Comments · {task.comments.length}
            </p>
            <div className="space-y-3">
              {task.comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar name={c.author_name} size="xs" isAi={c.author_kind === "agent"} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px]">
                      <span className="font-semibold text-text">{c.author_name}</span>{" "}
                      <span className="text-text-muted">{formatDateTime(c.inserted_at)}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
                placeholder="Add a comment…"
                className="mk-input flex-1"
              />
              <Button
                size="icon"
                variant="secondary"
                onClick={submitComment}
                loading={createComment.isPending}
                aria-label="Send comment"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </DetailPanel>
  );
}
