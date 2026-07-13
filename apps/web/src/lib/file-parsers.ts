/**
 * Which parser the AI worker will use for a given file — mirrors the
 * worker's app/memory/extractors.py capabilities so the UI can tell the
 * user upfront whether a dropped file will be read natively, via AI
 * vision/audio, or not at all.
 */

export interface ParserInfo {
  /** Short parser name shown in the badge (e.g. "Excel", "PDF"). */
  label: string;
  /** How the content becomes readable to agents. */
  method: "native" | "ai" | "unsupported";
}

const NATIVE_BY_EXT: Record<string, string> = {
  pdf: "PDF",
  docx: "Word",
  xlsx: "Excel",
  xlsm: "Excel",
  xls: "Excel",
  pptx: "PowerPoint",
  rtf: "RTF",
  txt: "Text",
  md: "Markdown",
  markdown: "Markdown",
  csv: "CSV",
  tsv: "CSV",
  json: "JSON",
  html: "HTML",
  htm: "HTML",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
};

const AUDIO_EXTS = new Set(["mp3", "wav", "m4a", "ogg", "flac", "aac", "webm", "mp4", "mov"]);

export function parserForFile(name: string, mime?: string | null): ParserInfo {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const type = mime ?? "";

  const native = NATIVE_BY_EXT[ext];
  if (native) return { label: native, method: "native" };
  if (type.startsWith("text/")) return { label: "Text", method: "native" };

  if (type.startsWith("image/")) return { label: "Vision AI", method: "ai" };
  if (type.startsWith("audio/") || type.startsWith("video/") || AUDIO_EXTS.has(ext))
    return { label: "Whisper", method: "ai" };

  return { label: ext ? `.${ext}` : "Unknown", method: "unsupported" };
}

/** Text-like files whose content can be previewed inline in the UI. */
export function isTextPreviewable(name: string, mime?: string | null): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if ((mime ?? "").startsWith("text/")) return true;
  return ["txt", "md", "markdown", "csv", "tsv", "json", "xml", "yaml", "yml"].includes(ext);
}
