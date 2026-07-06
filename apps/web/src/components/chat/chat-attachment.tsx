import { useEffect, useState } from "react";
import {
  Download,
  ExternalLink,
  File as FileIcon,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import type { ChatAttachment } from "@/api/types";
import { fetchDriveFileBlob } from "@/api/client";
import { cn } from "@/lib/cn";

function iconFor(name: string | null, mime: string | null) {
  const ext = name?.split(".").pop()?.toLowerCase() ?? "";
  if (mime?.startsWith("image/")) return ImageIcon;
  if (["html", "htm", "css", "js", "ts", "tsx", "json", "py"].includes(ext)) return FileCode;
  if (["csv", "xlsx", "xls"].includes(ext)) return FileSpreadsheet;
  if (mime === "application/pdf" || ["pdf", "doc", "docx", "md", "txt"].includes(ext))
    return FileText;
  return FileIcon;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * A single attachment inside a chat bubble. Images render as an inline
 * preview (click to open full size); everything else is a compact file card
 * that opens (HTML/PDF) or downloads on click. All bytes flow through the
 * authenticated Drive raw endpoint — never a direct object-store URL.
 */
export function ChatAttachmentView({
  attachment,
  tone,
}: {
  attachment: ChatAttachment;
  tone: "agent" | "member";
}) {
  const { drive_item_id: id, name, mime_type: mime } = attachment;
  const isImage = mime?.startsWith("image/") ?? false;
  const openable = isImage || mime === "application/pdf" || (name?.endsWith(".html") ?? false);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Eagerly fetch images for the inline preview; other types fetch on demand.
  useEffect(() => {
    if (!isImage) return;
    let alive = true;
    let url: string | null = null;
    fetchDriveFileBlob(id)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        if (alive) setBlobUrl(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, isImage]);

  const ensureUrl = async (): Promise<string> => {
    if (blobUrl) return blobUrl;
    const blob = await fetchDriveFileBlob(id);
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return url;
  };

  const handleClick = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const url = await ensureUrl();
      if (openable) {
        window.open(url, "_blank", "noopener");
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = name ?? "download";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (isImage) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="mt-1.5 block overflow-hidden rounded-lg border border-border-strong/50 transition-opacity hover:opacity-90"
        title={`Open ${name ?? "image"}`}
      >
        {blobUrl ? (
          <img
            src={blobUrl}
            alt={name ?? "attachment"}
            className="max-h-48 w-full max-w-[240px] object-cover"
          />
        ) : (
          <span className="flex h-24 w-[240px] items-center justify-center bg-surface-overlay">
            {failed ? (
              <span className="text-[11px] text-danger">Preview unavailable</span>
            ) : (
              <Loader2 size={16} className="animate-spin text-text-muted" />
            )}
          </span>
        )}
      </button>
    );
  }

  const Icon = iconFor(name, mime);

  return (
    <button
      type="button"
      onClick={handleClick}
      title={openable ? `Open ${name ?? "file"}` : `Download ${name ?? "file"}`}
      className={cn(
        "mt-1.5 flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
        tone === "member"
          ? "border-white/20 bg-white/10 hover:bg-white/15"
          : "border-border bg-surface hover:bg-surface-hover",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          tone === "member" ? "bg-white/15 text-white" : "bg-primary-muted text-primary-light",
        )}
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-[12px] font-medium",
            tone === "member" ? "text-white" : "text-text",
          )}
        >
          {name ?? "file"}
        </span>
        <span
          className={cn(
            "block text-[10px]",
            tone === "member" ? "text-white/70" : "text-text-muted",
          )}
        >
          {failed ? "Failed — retry" : formatSize(attachment.size_bytes) || "file"}
        </span>
      </span>
      {busy ? (
        <Loader2
          size={14}
          className={cn("animate-spin", tone === "member" ? "text-white/80" : "text-text-muted")}
        />
      ) : openable ? (
        <ExternalLink
          size={14}
          className={cn("shrink-0", tone === "member" ? "text-white/80" : "text-text-muted")}
        />
      ) : (
        <Download
          size={14}
          className={cn("shrink-0", tone === "member" ? "text-white/80" : "text-text-muted")}
        />
      )}
    </button>
  );
}
