import { useState } from "react";
import { ChevronRight, Folder, Home } from "lucide-react";
import { useDriveItems, useMoveDriveItems } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

interface MoveCrumb {
  id: string | null;
  name: string;
}

interface MoveItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemIds: string[];
  /** The folder the items currently live in — offered as a destination is fine, but moving there is a no-op. */
  currentParentId: string | null;
}

export function MoveItemsModal({ open, onOpenChange, itemIds, currentParentId }: MoveItemsModalProps) {
  const [crumbs, setCrumbs] = useState<MoveCrumb[]>([{ id: null, name: "Drive" }]);
  const destination = crumbs[crumbs.length - 1];
  const { data, isLoading } = useDriveItems(destination.id);
  const moveItems = useMoveDriveItems();

  const folders = (data?.data ?? []).filter(
    (item) => item.kind === "folder" && !itemIds.includes(item.id),
  );

  const handleMove = async () => {
    await moveItems.mutateAsync({ ids: itemIds, parentId: destination.id });
    onOpenChange(false);
    setCrumbs([{ id: null, name: "Drive" }]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={itemIds.length > 1 ? `Move ${itemIds.length} items` : "Move item"}
      description="Choose a destination folder."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={moveItems.isPending}
            disabled={destination.id === currentParentId}
            onClick={handleMove}
          >
            Move here
          </Button>
        </>
      }
    >
      <nav className="mb-3 flex min-w-0 flex-wrap items-center gap-1 text-xs" aria-label="Breadcrumb">
        {crumbs.map((crumb, index) => (
          <span key={crumb.id ?? "root"} className="flex items-center gap-1">
            {index > 0 && <ChevronRight size={12} className="text-text-muted" />}
            <button
              onClick={() => setCrumbs(crumbs.slice(0, index + 1))}
              className={cn(
                "flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-surface-hover",
                index === crumbs.length - 1
                  ? "font-semibold text-text"
                  : "text-text-muted hover:text-text",
              )}
            >
              {index === 0 && <Home size={12} />}
              {crumb.name}
            </button>
          </span>
        ))}
      </nav>

      <div className="max-h-64 overflow-y-auto rounded-md border border-border">
        {isLoading ? (
          <p className="px-3 py-4 text-center text-xs text-text-muted">Loading…</p>
        ) : folders.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-text-muted">No subfolders here.</p>
        ) : (
          folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setCrumbs((prev) => [...prev, { id: folder.id, name: folder.name }])}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text transition-colors last:rounded-b-md first:rounded-t-md hover:bg-surface-hover"
            >
              <Folder size={14} className="text-primary-light" fill="currentColor" fillOpacity={0.2} />
              {folder.name}
            </button>
          ))
        )}
      </div>
    </Dialog>
  );
}
