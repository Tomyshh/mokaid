import { useState } from "react";
import { useCreateProject } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROJECT_COVERS } from "@/lib/project-covers";
import { cn } from "@/lib/cn";

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (projectId: string) => void;
}

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function NewProjectModal({ open, onOpenChange, onCreated }: NewProjectModalProps) {
  const createProject = useCreateProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueAt, setDueAt] = useState("");
  const [cover, setCover] = useState("meeting");

  const reset = () => {
    setName("");
    setDescription("");
    setPriority("medium");
    setDueAt("");
    setCover("meeting");
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const created = await createProject.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      priority: priority as never,
      status: "active" as never,
      cover_kind: cover,
      due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
    });
    reset();
    onOpenChange(false);
    onCreated?.(created.data.id);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New Project"
      description="A project groups tasks, agents and files around one goal."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={createProject.isPending}
            disabled={!name.trim()}
            onClick={handleSubmit}
          >
            Create Project
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required>
          <input
            className="mk-input"
            placeholder="e.g. Website Redesign"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Description">
          <Textarea
            placeholder="What is this project about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <Select value={priority} onValueChange={setPriority} options={priorityOptions} />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className="mk-input"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Icon">
          <div className="flex gap-1">
            {PROJECT_COVERS.map((c) => {
              const { Icon } = c;
              const isSelected = cover === c.kind;
              return (
                <button
                  key={c.kind}
                  type="button"
                  onClick={() => setCover(c.kind)}
                  aria-label={c.label}
                  title={c.label}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    isSelected
                      ? "bg-surface-overlay text-primary-light"
                      : "text-text-muted hover:bg-surface-overlay hover:text-text-secondary",
                  )}
                >
                  <Icon size={15} strokeWidth={1.5} />
                </button>
              );
            })}
          </div>
        </Field>
      </div>
    </Dialog>
  );
}
