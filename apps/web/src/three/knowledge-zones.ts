/** Knowledge graph types + office-zone community mapping. */

export interface KnowledgeGraphNode {
  id: string;
  key: string;
  label: string;
  kind: string;
  degree: number;
  lesson_status?: string | null;
  community_id?: string | null;
  knowledge_item_id?: string;
  project_id?: string | null;
  agent_id?: string | null;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  confidence: string;
  weight: number;
}

export interface KnowledgeCommunity {
  id: string;
  label: string;
  slug: string;
  node_count: number;
  god_score: number;
  office_zone: string | null;
  project_id?: string | null;
  agent_id?: string | null;
}

export interface KnowledgeGraphSnapshot {
  enabled: boolean;
  scope_level: "none" | "project" | "workspace";
  node_count: number;
  edge_count: number;
  community_count: number;
  god_nodes: KnowledgeGraphNode[];
  communities: KnowledgeCommunity[];
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  suggested_questions: string[];
}

export interface CompanyBrainReport {
  title: string;
  god_concepts: KnowledgeGraphNode[];
  communities: KnowledgeCommunity[];
  suggested_questions: string[];
  node_count: number;
  edge_count: number;
  enabled: boolean;
  upgrade_hint?: string | null;
  seeded?: unknown[];
}

/** Maps graph office_zone labels to desk-slot indices / POI regions in the 3D office. */
export const OFFICE_ZONE_LAYOUT: Record<
  string,
  { label: string; deskIndexes: number[]; color: string }
> = {
  finance: { label: "Finance", deskIndexes: [0, 1], color: "#3d9a6a" },
  legal: { label: "Legal", deskIndexes: [2], color: "#c9a227" },
  product: { label: "Product", deskIndexes: [3, 4], color: "#7c5cff" },
  engineering: { label: "Engineering", deskIndexes: [5, 6], color: "#4a9eff" },
  design: { label: "Design", deskIndexes: [7], color: "#e879a8" },
  marketing: { label: "Marketing", deskIndexes: [8], color: "#f97316" },
  ops: { label: "Ops", deskIndexes: [1, 5], color: "#94a3b8" },
  lobby: { label: "Lobby", deskIndexes: [], color: "#a78bfa" },
};

export function zoneForCommunity(community: KnowledgeCommunity) {
  const key = (community.office_zone || "lobby").toLowerCase();
  return OFFICE_ZONE_LAYOUT[key] ?? OFFICE_ZONE_LAYOUT.lobby;
}
