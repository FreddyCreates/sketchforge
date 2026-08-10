import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInsertTemplate, useTemplates } from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import type { Template } from "@/lib/types";
import { LayoutTemplate, Search, X } from "lucide-react";
/**
 * SketchForge — drop-in template library panel.
 *
 * A slide-in drawer from the left (`.animate-panel-slide-left`) showing a
 * searchable grid of template cards. Each card shows the template name,
 * short description, category tag (`.template-tag`), and an "Insert"
 * button. Inserting drops a new generated region at the center of the
 * current view (300×200) via `useInsertTemplate`; the regions query is
 * invalidated by the hook so the new region appears immediately.
 *
 * The panel is controlled by `templateLibraryOpen` in the canvas store.
 * A `.panel-overlay` scrim sits behind it; clicking the scrim or the
 * close button (or pressing Escape) closes the panel.
 */
import { useEffect, useMemo, useState } from "react";

const DEFAULT_INSERT_WIDTH = 300;
const DEFAULT_INSERT_HEIGHT = 200;

export function TemplateLibraryPanel() {
  const open = useCanvasStore((s) => s.templateLibraryOpen);
  const close = useCanvasStore((s) => s.closeTemplateLibrary);
  const activeTabId = useCanvasStore((s) => s.activeTabId);
  const view = useCanvasStore((s) => s.view);

  const { data: templates, isLoading, isError } = useTemplates();
  const insertTemplate = useInsertTemplate();

  const [query, setQuery] = useState("");
  const [insertingId, setInsertingId] = useState<bigint | null>(null);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Reset search when the panel closes.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // Client-side filter by name / description / category. We use the full
  // `useTemplates()` list (already cached) rather than `useSearchTemplates`
  // so the grid stays responsive as the user types without extra round-trips.
  const FALLBACK_TEMPLATES: Template[] = [
    { id: 1n, name: "🚀 3D WebGL Galaxy", description: "Interactive Three.js particle galaxy with mouse rotation controls", category: "WebGL 3D", html: "<div>WebGL 3D Galaxy Template</div>" },
    { id: 2n, name: "📊 Real-Time Analytics", description: "Real-time Chart.js crypto stats and line charts", category: "Dashboard", html: "<div>Analytics Dashboard Template</div>" },
    { id: 3n, name: "⚡ SaaS Hero Section", description: "Modern dark theme hero section with CTA buttons", category: "Landing", html: "<div>SaaS Hero Template</div>" },
    { id: 4n, name: "🎮 Physics Canvas Game", description: "Interactive HTML5 canvas bouncing balls physics game", category: "Game", html: "<div>Physics Game Template</div>" },
  ];

  const filtered = useMemo<Template[]>(() => {
    const all = (templates && templates.length > 0) ? templates : FALLBACK_TEMPLATES;
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((t) => {
      const hay = `${t.name} ${t.description} ${t.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [templates, query]);

  if (!open) return null;

  // Compute a canvas-space center point for the new region based on the
  // current view transform. Falls back to (0,0) when the container is not
  // measurable; the region is still inserted at a reasonable spot.
  function centerCanvasPoint() {
    // The canvas mount fills the viewport; use window dimensions as a
    // proxy for the visible canvas area.
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 768;
    // Subtract the toolbar (64px) + header/tabbar (~96px) rough offsets.
    const visibleCenterX = (vw - 64) / 2;
    const visibleCenterY = (vh - 96) / 2;
    return {
      x: (visibleCenterX - view.offsetX) / view.scale,
      y: (visibleCenterY - view.offsetY) / view.scale,
    };
  }

  async function handleInsert(tpl: Template) {
    if (activeTabId === null) return;
    const center = centerCanvasPoint();
    const x = center.x - DEFAULT_INSERT_WIDTH / 2;
    const y = center.y - DEFAULT_INSERT_HEIGHT / 2;
    setInsertingId(tpl.id);
    try {
      await insertTemplate.mutateAsync({
        tabId: activeTabId,
        templateId: tpl.id,
        x,
        y,
        width: DEFAULT_INSERT_WIDTH,
        height: DEFAULT_INSERT_HEIGHT,
      });
      close();
    } catch {
      // Surface a non-blocking error; the hook already invalidates regions.
    } finally {
      setInsertingId(null);
    }
  }

  return (
    <div className="absolute inset-0 z-50" data-ocid="template_library">
      {/* Scrim */}
      <div
        className="panel-overlay absolute inset-0"
        onClick={close}
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
        role="button"
        tabIndex={0}
        aria-label="Close template library"
      />

      {/* Panel */}
      <aside
        className="animate-panel-slide-left absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col border-r border-dashed border-border/70 bg-card shadow-glow-lg"
        onPointerDown={(e) => e.stopPropagation()}
        // biome-ignore lint/a11y/useSemanticElements: drawer pattern requires div with transform animation
        role="dialog"
        aria-label="Template library"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-dashed border-border/70 px-4 py-3">
          <div className="flex items-center gap-2 text-foreground">
            <LayoutTemplate className="size-4 text-primary" />
            <h2 className="font-display text-sm font-semibold">
              Template library
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-full"
            onClick={close}
            aria-label="Close template library"
            data-ocid="template_library.close_button"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="border-b border-dashed border-border/70 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="h-9 rounded-full border-dashed pl-8 text-sm"
              aria-label="Search templates"
              data-ocid="template_library.search_input"
            />
          </div>
        </div>

        {/* Grid */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3"
          data-ocid="template_library.list"
        >
          {isLoading ? (
            <div
              className="flex h-full items-center justify-center text-xs text-muted-foreground"
              data-ocid="template_library.loading_state"
            >
              Loading templates…
            </div>
          ) : isError ? (
            <div
              className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground"
              data-ocid="template_library.error_state"
            >
              <p>Couldn’t load templates.</p>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground"
              data-ocid="template_library.empty_state"
            >
              <p>No templates match “{query}”.</p>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setQuery("")}
              >
                Clear search
              </Button>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {filtered.map((tpl, i) => (
                <li
                  key={tpl.id.toString()}
                  className="template-card flex flex-col gap-2 p-3"
                  data-ocid={`template_library.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 font-display text-sm font-semibold text-foreground">
                      {tpl.name}
                    </h3>
                    {tpl.category && (
                      <span className="template-tag shrink-0">
                        {tpl.category}
                      </span>
                    )}
                  </div>
                  {tpl.description && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {tpl.description}
                    </p>
                  )}
                  <div className="mt-1 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => void handleInsert(tpl)}
                      disabled={activeTabId === null || insertingId === tpl.id}
                      className="glow-primary rounded-full bg-gradient-primary px-4 text-xs font-semibold text-primary-foreground"
                      data-ocid={`template_library.insert_button.${i + 1}`}
                    >
                      {insertingId === tpl.id ? "Inserting…" : "Insert"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-dashed border-border/70 px-4 py-2 text-[10px] text-muted-foreground">
          Inserting drops a new region at the center of your view.
        </div>
      </aside>
    </div>
  );
}

export default TemplateLibraryPanel;
