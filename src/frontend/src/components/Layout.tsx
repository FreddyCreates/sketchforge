import { SaasWorkspaceView } from "@/components/SaaSWorkspaceView";
import { CanvasWorkspace } from "@/components/CanvasWorkspace";
/**
 * SketchForge — app layout shell.
 *
 * Composes the Header (top), TabBar (below header), Toolbar (left), and a
 * canvas container that fills the remaining space. The canvas container is
 * the mounting point for the actual drawing surface, which a later page
 * task will render into. For now it shows a sketchy empty-state so the
 * shell is visually complete and the layout is verifiable.
 *
 * Undo/redo wiring: the backend has `undoLastStroke` but no redo, so redo
 * is handled by re-`addStroke`-ing the popped stroke from the local redo
 * stack in the canvas store.
 *
 * Export: the header's Export HTML pill is wired directly to the
 * `ExportButton` component, which gathers the active tab's data and
 * triggers a standalone HTML download. Presence is wired here via
 * `usePresence` so the header roster reflects live collaboration data.
 */
import { ExportButton } from "@/components/ExportButton";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { Toolbar } from "@/components/Toolbar";
import { VersionHistoryPanel } from "@/components/VersionHistoryPanel";
import {
  useAddStroke,
  usePresence,
  useStrokes,
  useUndoStroke,
} from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import type { ReactNode } from "react";

interface LayoutProps {
  /**
   * Optional override for the header's export control. Defaults to the
   * real `ExportButton`, which assembles and downloads a standalone HTML
   * document for the active tab.
   */
  exportButton?: ReactNode;
}

export function Layout({ exportButton }: LayoutProps = {}) {
  const activeTabId = useCanvasStore((s) => s.activeTabId);
  const redoStack = useCanvasStore((s) => s.redoStack);
  const pushRedo = useCanvasStore((s) => s.pushRedo);
  const popRedo = useCanvasStore((s) => s.popRedo);

  const { data: strokes } = useStrokes(activeTabId);
  // Wire presence here so the header roster stays fresh; the hook polls
  // every 3s. The data flows down into the Header's PresenceRoster via the
  // shared React Query cache.
  usePresence();
  const undoMutation = useUndoStroke();
  const addStroke = useAddStroke();

  const canUndo = (strokes?.length ?? 0) > 0 && activeTabId !== null;
  const canRedo = redoStack.length > 0 && activeTabId !== null;

  function handleUndo() {
    if (activeTabId === null) return;
    undoMutation.mutate(activeTabId, {
      onSuccess: (popped) => {
        if (popped) pushRedo(popped);
      },
    });
  }

  function handleRedo() {
    if (activeTabId === null) return;
    const popped = popRedo();
    if (!popped) return;
    addStroke.mutate(
      {
        tabId: activeTabId,
        tool: popped.tool,
        color: popped.color,
        size: popped.size,
        points: popped.points,
      },
      {
        onError: () => {
          // Restore the stroke to the redo stack if re-apply failed.
          pushRedo(popped);
        },
      },
    );
  }

  const saasViewOpen = useCanvasStore((s) => s.saasViewOpen);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <Header
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        exportButton={exportButton ?? <ExportButton />}
      />
      <TabBar />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <main className="relative flex-1 overflow-hidden bg-paper">
          {/* Canvas mount point — renders CanvasWorkspace or SaaS Workspace Hub View */}
          <div
            id="canvas-mount"
            className="absolute inset-0 flex flex-col"
            data-active-tab={activeTabId?.toString() ?? "none"}
          >
            {saasViewOpen ? <SaasWorkspaceView /> : <CanvasWorkspace />}
          </div>
        </main>
      </div>

      {/* Version history drawer — slides in from the right when a region's
          history is opened from its selection toolbar. */}
      <VersionHistoryPanel />
    </div>
  );
}

export default Layout;
