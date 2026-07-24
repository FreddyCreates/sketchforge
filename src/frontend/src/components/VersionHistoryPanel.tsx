import { RegionRenderer } from "@/components/RegionRenderer";
import { Button } from "@/components/ui/button";
import {
  useRegionVersions,
  useRestoreRegionVersion,
} from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import type { RegionVersion } from "@/lib/types";
import { History, RotateCcw, X } from "lucide-react";
/**
 * SketchForge — version history drawer.
 *
 * Slides in from the right when `versionHistoryOpen` is true in the canvas
 * store. Lists every prior snapshot of the selected region's generated
 * content (newest-first), each as a `.version-row` with a timestamp, a
 * truncated prompt excerpt, a preview toggle (renders that version's
 * `generatedHtml` inline via `RegionRenderer` inside a `.version-preview`
 * frame), and a restore button that calls
 * `useRestoreRegionVersion(regionId, versionId)` and invalidates the region
 * query (handled in the hook).
 */
import { useEffect, useState } from "react";

function formatTime(ts: bigint): string {
  const ms = Number(ts);
  const d = new Date(ms);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}

export function VersionHistoryPanel() {
  const open = useCanvasStore((s) => s.versionHistoryOpen);
  const regionId = useCanvasStore((s) => s.versionHistoryRegionId);
  const close = useCanvasStore((s) => s.closeVersionHistory);

  const {
    data: versions,
    isLoading,
    isError,
  } = useRegionVersions(open ? regionId : null);
  const restore = useRestoreRegionVersion();

  // Which version is currently expanded for inline preview.
  const [previewId, setPreviewId] = useState<bigint | null>(null);

  // Reset preview + close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Clear the expanded preview whenever the panel closes or the region
  // changes so a stale previewId doesn't bleed into the next open.
  useEffect(() => {
    if (!open) setPreviewId(null);
  }, [open]);

  if (!open || regionId === null) return null;

  const list = (versions ?? []) as RegionVersion[];

  function handleRestore(versionId: bigint) {
    restore.mutate(
      { regionId: regionId!, versionId },
      {
        onSuccess: () => {
          // Closing keeps the canvas as the focus after a restore; the
          // region query is invalidated by the hook so the card re-renders.
          close();
        },
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-40"
      data-ocid="version_history.panel"
      // biome-ignore lint/a11y/useSemanticElements: drawer pattern requires div with transform animation
      role="dialog"
      aria-label="Version history"
      aria-modal="true"
    >
      {/* Scrim overlay */}
      <button
        type="button"
        aria-label="Close version history"
        className="panel-overlay absolute inset-0 cursor-default"
        onClick={close}
        data-ocid="version_history.overlay"
      />

      {/* Drawer */}
      <aside
        className="animate-panel-slide-right absolute right-0 top-0 flex h-full w-[26rem] max-w-[90vw] flex-col border-l border-dashed border-border bg-card shadow-glow"
        data-ocid="version_history.drawer"
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-2 border-b border-dashed border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <History className="size-4 shrink-0 text-primary" />
            <h2 className="truncate font-display text-sm font-semibold text-foreground">
              Version history
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 rounded-full"
            onClick={close}
            aria-label="Close version history"
            data-ocid="version_history.close_button"
          >
            <X className="size-4" />
          </Button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isLoading ? (
            <div
              className="flex h-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground"
              data-ocid="version_history.loading_state"
            >
              <div className="flex gap-1">
                <span className="size-2 rounded-full bg-primary animate-thinking-dot [animation-delay:0ms]" />
                <span className="size-2 rounded-full bg-primary animate-thinking-dot [animation-delay:160ms]" />
                <span className="size-2 rounded-full bg-primary animate-thinking-dot [animation-delay:320ms]" />
              </div>
              <p>Loading versions…</p>
            </div>
          ) : isError ? (
            <div
              className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-destructive"
              data-ocid="version_history.error_state"
            >
              <p>Couldn’t load version history.</p>
              <button
                type="button"
                onClick={close}
                className="font-semibold text-primary hover:underline"
              >
                Dismiss
              </button>
            </div>
          ) : list.length === 0 ? (
            <div
              className="flex h-full flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground"
              data-ocid="version_history.empty_state"
            >
              <History className="size-6 text-muted-foreground/50" />
              <p>No prior versions yet.</p>
              <p className="text-[11px] text-muted-foreground/70">
                Regenerate this region to start a history.
              </p>
            </div>
          ) : (
            <ol
              className="flex flex-col gap-3"
              data-ocid="version_history.list"
            >
              {list.map((v, i) => {
                const expanded = previewId === v.versionId;
                return (
                  <li
                    key={v.versionId.toString()}
                    className="version-row p-3"
                    data-ocid={`version_history.row.${i + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {formatTime(v.createdAt)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-foreground">
                          {truncate(v.prompt, 140) || "Untitled prompt"}
                        </p>
                      </div>
                    </div>

                    {/* Inline preview */}
                    {expanded && (
                      <div
                        className="version-preview mt-3 h-40 w-full"
                        data-ocid={`version_history.preview.${i + 1}`}
                      >
                        <RegionRenderer html={v.generatedHtml} />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full px-3 text-[11px]"
                        onClick={() =>
                          setPreviewId(expanded ? null : v.versionId)
                        }
                        aria-expanded={expanded}
                        aria-controls={
                          expanded
                            ? `version-preview-${v.versionId}`
                            : undefined
                        }
                        data-ocid={`version_history.preview_button.${i + 1}`}
                      >
                        {expanded ? "Hide preview" : "Preview"}
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        className="rounded-full px-3 text-[11px]"
                        onClick={() => handleRestore(v.versionId)}
                        disabled={restore.isPending}
                        data-ocid={`version_history.restore_button.${i + 1}`}
                      >
                        <RotateCcw className="size-3" />
                        {restore.isPending ? "Restoring…" : "Restore"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}

export default VersionHistoryPanel;
