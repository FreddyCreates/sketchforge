import {
  useComments,
  useProject,
  useRegions,
  useStrokes,
  useTabs,
} from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
/**
 * SketchForge — Export HTML button.
 *
 * Wires the header's "Export HTML" pill to the real export logic. On
 * click, gathers the active tab's data (project name, active tab, and
 * its strokes / regions / comments) via the shared React Query hooks,
 * assembles a standalone HTML document through `downloadTabAsHtml`, and
 * triggers a browser download as `{projectName}-{tabName}.html`.
 *
 * The button uses the `.export-pill` class from the design system. It
 * is disabled when there is no active tab or while the data is still
 * loading.
 */
import { downloadTabAsHtml } from "@/lib/html-export";
import { Download } from "lucide-react";

export function ExportButton() {
  const activeTabId = useCanvasStore((s) => s.activeTabId);

  const { data: project } = useProject();
  const { data: tabs } = useTabs();
  const { data: strokes } = useStrokes(activeTabId);
  const { data: regions } = useRegions(activeTabId);
  const { data: comments } = useComments(activeTabId);

  const projectName = project?.name ?? "Untitled project";
  const activeTab =
    activeTabId !== null
      ? ((tabs ?? []).find((t) => t.id === activeTabId) ?? null)
      : null;

  const ready = activeTab !== null;

  function handleExport() {
    if (!activeTab) return;
    downloadTabAsHtml(
      projectName,
      activeTab,
      strokes ?? [],
      regions ?? [],
      comments ?? [],
    );
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!ready}
      className="export-pill disabled:cursor-not-allowed disabled:opacity-40"
      aria-label="Export HTML"
      title={
        ready
          ? "Export the current canvas as a standalone HTML file"
          : "Select a tab to export"
      }
      data-ocid="header.export_html_button"
    >
      <Download className="size-4" />
      <span className="hidden sm:inline">Export HTML</span>
    </button>
  );
}

export default ExportButton;
