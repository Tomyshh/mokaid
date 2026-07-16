import { Network, RefreshCw, Sparkles } from "lucide-react";
import {
  useCompanyBrain,
  useKnowledgeGraph,
  useRebuildKnowledgeGraph,
  useReindexKnowledgeGraph,
} from "@/api/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { zoneForCommunity } from "@/three/knowledge-zones";
import { useState } from "react";

export function KnowledgeGraphPanel() {
  const { data: graph, isLoading } = useKnowledgeGraph();
  const rebuild = useRebuildKnowledgeGraph();
  const reindex = useReindexKnowledgeGraph();
  const companyBrain = useCompanyBrain();
  const [brainOpen, setBrainOpen] = useState(false);
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return (
      <div className="mk-card p-4 text-xs text-text-muted">Loading knowledge graph…</div>
    );
  }

  if (!graph) return null;

  return (
    <div className="mk-card space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <Network size={16} className="text-primary-light" />
            Knowledge Graph
            {graph.enabled ? (
              <Badge tone="success">{graph.scope_level}</Badge>
            ) : (
              <Badge tone="warning">Starter+</Badge>
            )}
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            {graph.node_count} concepts · {graph.edge_count} links · {graph.community_count}{" "}
            clusters
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={!graph.enabled || rebuild.isPending}
            onClick={() => rebuild.mutate({})}
          >
            <RefreshCw size={12} /> Clusters
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!graph.enabled || reindex.isPending}
            onClick={() => reindex.mutate({})}
          >
            Re-index (25 cr)
          </Button>
          <Button size="sm" onClick={() => setBrainOpen((v) => !v)}>
            <Sparkles size={12} /> Company brain
          </Button>
        </div>
      </div>

      {!graph.enabled && (
        <p className="rounded-md border border-border bg-surface-hover px-3 py-2 text-[11px] text-text-secondary">
          Upgrade to Starter or Professional to unlock graph traversal, path/explain tools, and
          office knowledge zones.
        </p>
      )}

      {brainOpen && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-[11px] font-medium text-text">Seed company notes (one per line)</p>
          <textarea
            className="min-h-[88px] w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-text"
            placeholder="Our refund policy is 30 days…&#10;Acme Corp is our top client…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            size="sm"
            disabled={companyBrain.isPending}
            onClick={() =>
              companyBrain.mutate({
                notes: notes
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((body, i) => ({ title: `Company note ${i + 1}`, body })),
              })
            }
          >
            Build company brain
          </Button>
          {companyBrain.data && (
            <div className="space-y-1 text-[11px] text-text-secondary">
              <p>
                {companyBrain.data.node_count} nodes · suggested:{" "}
                {(companyBrain.data.suggested_questions || []).slice(0, 2).join(" · ")}
              </p>
              {companyBrain.data.upgrade_hint && (
                <p className="text-danger">{companyBrain.data.upgrade_hint}</p>
              )}
            </div>
          )}
        </div>
      )}

      {graph.god_nodes.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            God concepts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {graph.god_nodes.map((node) => (
              <span
                key={node.id}
                className="rounded-full border border-border bg-surface-hover px-2.5 py-1 text-[11px] text-text"
              >
                {node.label}
                <span className="ml-1 text-text-muted">·{node.degree}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {graph.communities.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Office zones
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {graph.communities.slice(0, 8).map((community) => {
              const zone = zoneForCommunity(community);
              return (
                <div
                  key={community.id}
                  className="flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-[11px]"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{community.label}</p>
                    <p className="text-text-muted">
                      {zone.label} · {community.node_count} concepts
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {graph.suggested_questions.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Ask the graph
          </p>
          <ul className="space-y-1 text-[11px] text-text-secondary">
            {graph.suggested_questions.map((q) => (
              <li key={q}>· {q}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
