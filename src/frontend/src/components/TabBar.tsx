import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateTab,
  useDeleteTab,
  useProject,
  useRenameTab,
  useTabs,
} from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import { cn } from "@/lib/utils";
/**
 * SketchForge — canvas tab bar.
 *
 * Horizontal row of tabs (each an independent canvas page). Supports:
 *  - Add tab (+ pill button)
 *  - Rename on double-click (inline input)
 *  - Delete (x button revealed on hover)
 *  - Active tab highlighted with sketch-border + glow
 *
 * Tab reordering is wired through `useReorderTabs` but the MVP uses a simple
 * left-to-right order; drag-reorder is left to a future task. The active tab
 * is tracked in the canvas store.
 */
import { Check, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function TabChip({
  id,
  name,
  active,
  onSelect,
}: {
  id: bigint;
  name: string;
  active: boolean;
  onSelect: () => void;
}) {
  const rename = useRenameTab();
  const del = useDeleteTab();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== name) rename.mutate({ tabId: id, name: next });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-full border border-dashed border-primary/60 bg-card px-1.5 py-1 shadow-glow">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="h-6 w-28 rounded-full border-0 bg-transparent px-2 text-xs"
          aria-label="Rename tab"
        />
        <button
          type="button"
          onClick={commit}
          className="flex size-6 items-center justify-center rounded-full text-primary hover:bg-primary/10"
          aria-label="Save tab name"
        >
          <Check className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-smooth",
        active
          ? "border-dashed border-primary/60 bg-card text-foreground shadow-glow"
          : "border-dashed border-border/60 bg-card/40 text-muted-foreground hover:bg-card hover:text-foreground",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={() => {
          setDraft(name);
          setEditing(true);
        }}
        className="max-w-[140px] truncate"
        title={name}
      >
        {name}
      </button>
      <button
        type="button"
        onClick={() => del.mutate(id)}
        className="flex size-5 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        aria-label={`Delete tab ${name}`}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

export function TabBar() {
  const { data: tabs } = useTabs();
  const { data: project } = useProject();
  const createTab = useCreateTab();
  const activeTabId = useCanvasStore((s) => s.activeTabId);
  const setActiveTab = useCanvasStore((s) => s.setActiveTab);

  // Auto-select the first tab when tabs load and nothing is active.
  useEffect(() => {
    if (tabs && tabs.length > 0 && activeTabId === null) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTabId, setActiveTab]);

  function handleAdd() {
    if (!project) return;
    const n = (tabs?.length ?? 0) + 1;
    createTab.mutate(
      { projectId: project.id, name: `Page ${n}` },
      {
        onSuccess: (tab) => {
          if (tab) setActiveTab(tab.id);
        },
      },
    );
  }

  return (
    <div className="flex h-12 items-center gap-2 overflow-x-auto border-b border-dashed border-border/70 bg-card/40 px-4 py-2">
      <div className="flex items-center gap-2">
        {tabs?.map((tab) => (
          <TabChip
            key={tab.id.toString()}
            id={tab.id}
            name={tab.name}
            active={activeTabId === tab.id}
            onSelect={() => setActiveTab(tab.id)}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleAdd}
        disabled={!project}
        className="h-8 shrink-0 rounded-full border border-dashed border-border/60 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
        aria-label="Add new tab"
      >
        <Plus className="size-3.5" />
        <span>Page</span>
      </Button>
    </div>
  );
}

export default TabBar;
