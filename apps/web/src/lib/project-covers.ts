import {
  Briefcase,
  Code2,
  Palette,
  Presentation,
  PenLine,
  type LucideIcon,
} from "lucide-react";

export interface ProjectCoverTheme {
  kind: string;
  label: string;
  Icon: LucideIcon;
  /** Soft tinted icon well */
  iconBg: string;
  iconColor: string;
  /** Muted swatch for the cover picker */
  swatch: string;
}

export const PROJECT_COVERS: ProjectCoverTheme[] = [
  {
    kind: "meeting",
    label: "Violet",
    Icon: Presentation,
    iconBg: "bg-primary-muted",
    iconColor: "text-primary-light",
    swatch: "bg-primary-muted ring-primary/30",
  },
  {
    kind: "coding",
    label: "Blue",
    Icon: Code2,
    iconBg: "bg-info-muted",
    iconColor: "text-info",
    swatch: "bg-info-muted ring-info/30",
  },
  {
    kind: "design",
    label: "Pink",
    Icon: Palette,
    iconBg: "bg-[rgba(244,114,182,0.12)]",
    iconColor: "text-[#f472b6]",
    swatch: "bg-[rgba(244,114,182,0.12)] ring-[#f472b6]/30",
  },
  {
    kind: "whiteboard",
    label: "Green",
    Icon: PenLine,
    iconBg: "bg-success-muted",
    iconColor: "text-success",
    swatch: "bg-success-muted ring-success/30",
  },
  {
    kind: "office",
    label: "Amber",
    Icon: Briefcase,
    iconBg: "bg-warning-muted",
    iconColor: "text-warning",
    swatch: "bg-warning-muted ring-warning/30",
  },
];

const coverByKind = Object.fromEntries(PROJECT_COVERS.map((c) => [c.kind, c]));

export function getProjectCover(kind?: string | null): ProjectCoverTheme {
  return coverByKind[kind ?? "meeting"] ?? coverByKind.meeting;
}
