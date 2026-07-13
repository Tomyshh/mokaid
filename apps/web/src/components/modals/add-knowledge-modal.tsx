import { useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { useCreateKnowledge, useKnowledgeCategories, useUploadKnowledgeFiles } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { parserForFile } from "@/lib/file-parsers";

interface AddKnowledgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeOptions = [
  { value: "note", label: "Note (write content here)" },
  { value: "file", label: "File upload (PDF, Word, Excel…)" },
  { value: "link", label: "External link" },
];

const ACCEPTED = ".pdf,.docx,.doc,.xlsx,.xlsm,.xls,.pptx,.rtf,.txt,.md,.csv,.tsv,.json,.html,.htm,.xml,.yaml,.yml";

export function AddKnowledgeModal({ open, onOpenChange }: AddKnowledgeModalProps) {
  const createKnowledge = useCreateKnowledge();
  const uploadFiles = useUploadKnowledgeFiles();
  const { data: categoriesData } = useKnowledgeCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("note");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [body, setBody] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const categories = categoriesData?.data ?? [];
  const isFileMode = type === "file";
  const pending = createKnowledge.isPending || uploadFiles.isPending;
  const canSubmit = isFileMode ? files.length > 0 : title.trim().length > 0;

  const reset = () => {
    setTitle("");
    setType("note");
    setCategoryId(undefined);
    setBody("");
    setSourceUrl("");
    setTagsText("");
    setFiles([]);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (isFileMode) {
      await uploadFiles.mutateAsync({ files, categoryId });
    } else {
      await createKnowledge.mutateAsync({
        title: title.trim(),
        type,
        body: body.trim() || undefined,
        source_url: type === "link" ? sourceUrl.trim() || undefined : undefined,
        category_id: categoryId,
        status: "published",
        tags: tagsText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Knowledge"
      description="Content added here is indexed so your agents can use it."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" loading={pending} disabled={!canSubmit} onClick={handleSubmit}>
            {isFileMode && files.length > 1 ? `Add ${files.length} files` : "Add Knowledge"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!isFileMode && (
          <Field label="Title" required>
            <input
              className="mk-input"
              placeholder="e.g. Brand voice guidelines"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={type} onValueChange={setType} options={typeOptions} />
          </Field>
          <Field label="Category">
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              placeholder="Uncategorized"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
        </div>
        {isFileMode && (
          <Field
            label="Files"
            required
            hint="PDF, Word, Excel, PowerPoint, CSV… — content is extracted and indexed for your agents."
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                if (picked.length) setFiles((prev) => [...prev, ...picked]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface-raised px-3 py-4 text-xs text-text-muted transition-colors hover:border-primary hover:text-text"
            >
              <FileUp size={14} />
              Choose files…
            </button>
            {files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {files.map((file, index) => {
                  const parser = parserForFile(file.name, file.type);
                  return (
                    <span
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-surface-raised px-2 py-1"
                    >
                      <span className="max-w-[140px] truncate text-[11px] text-text">{file.name}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                          parser.method === "native"
                            ? "bg-success/15 text-success"
                            : parser.method === "ai"
                              ? "bg-info/15 text-info"
                              : "bg-warning/15 text-warning",
                        )}
                      >
                        {parser.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                        className="text-text-muted hover:text-text"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </Field>
        )}
        {type === "link" && (
          <Field label="URL" required>
            <input
              className="mk-input"
              placeholder="https://…"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </Field>
        )}
        {type === "note" && (
          <Field label="Content" hint="Markdown supported. This is what agents will read.">
            <Textarea
              className="min-h-[140px]"
              placeholder="Paste or write the content…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
        )}
        {!isFileMode && (
          <Field label="Tags" hint="Comma-separated">
            <input
              className="mk-input"
              placeholder="brand, marketing…"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </Field>
        )}
      </div>
    </Dialog>
  );
}
