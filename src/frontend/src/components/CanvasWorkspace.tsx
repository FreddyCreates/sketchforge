import { AIChatBotPanel } from "@/components/AIChatBotPanel";
import { CommentPanel } from "@/components/CommentPanel";
import { CommentPin } from "@/components/CommentPin";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { GeneratedRegionCard } from "@/components/GeneratedRegionCard";
import { LassoOverlay } from "@/components/LassoOverlay";
import { LiveCursors } from "@/components/LiveCursors";
import { PromptBox } from "@/components/PromptBox";
import { TemplateLibraryPanel } from "@/components/TemplateLibraryPanel";
import {
  useAddComment,
  useComments,
  useRegions,
  useStrokes,
} from "@/hooks/use-canvas-data";
import { usePresenceSync } from "@/hooks/use-presence-sync";
import { useCanvasStore } from "@/lib/canvas-store";
import type { Point } from "@/lib/types";
/**
 * SketchForge — main interactive canvas surface.
 *
 * Mounts inside Layout's `#canvas-mount` container. Owns the infinite
 * pan/zoom camera (mouse-drag to pan, wheel to zoom), renders all
 * canvas entities (strokes, comments, generated regions) in canvas
 * space, and dispatches tool-based pointer events:
 *
 *   pen/eraser → forward to DrawingCanvas (freehand capture)
 *   comment    → click to pin a comment at that canvas point
 *   circle     → drag to lasso; on release open the PromptBox
 *   select     → click to select a generated region (handled by the
 *                region card itself); empty-space click clears selection
 *
 * All entities are positioned in canvas coordinates and rendered inside
 * a single transformed <div> so pan/zoom is one CSS transform.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface LassoDraft {
  points: Point[];
}

export function CanvasWorkspace() {
  const activeTabId = useCanvasStore((s) => s.activeTabId);
  const activeTool = useCanvasStore((s) => s.activeTool);
  const view = useCanvasStore((s) => s.view);
  const setView = useCanvasStore((s) => s.setView);
  const resetView = useCanvasStore((s) => s.resetView);
  const setSelectedRegion = useCanvasStore((s) => s.setSelectedRegion);
  const openPromptBox = useCanvasStore((s) => s.openPromptBox);

  const containerRef = useRef<HTMLDivElement>(null);

  // Per-tab data
  const { data: strokes } = useStrokes(activeTabId);
  const { data: comments } = useComments(activeTabId);
  const { data: regions } = useRegions(activeTabId);
  const addComment = useAddComment();

  // Local UI state
  const [openCommentId, setOpenCommentId] = useState<bigint | null>(null);
  const [lasso, setLasso] = useState<LassoDraft | null>(null);
  // Pan state
  const panRef = useRef<{
    startX: number;
    startY: number;
    ox: number;
    oy: number;
  } | null>(null);
  // Track whether a pointer move has exceeded the drag threshold so we
  // can distinguish a click (comment pin) from a drag (pan/lasso).
  const movedRef = useRef(false);

  // --- Coordinate conversion ---
  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      return {
        x: (sx - view.offsetX) / view.scale,
        y: (sy - view.offsetY) / view.scale,
      };
    },
    [view.offsetX, view.offsetY, view.scale],
  );

  // --- Presence sync (cursor broadcast) ---
  // Must be called AFTER screenToCanvas is defined; tracks the local
  // user's cursor and broadcasts presence to the backend on a throttled
  // interval. The returned onPointerMove is composed into the workspace's
  // own onPointerMove below.
  const { onPointerMove: onPresenceMove } = usePresenceSync(screenToCanvas);

  // --- Wheel zoom (cursor-anchored) ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const nextScale = Math.min(Math.max(view.scale * factor, 0.2), 4);
      const realFactor = nextScale / view.scale;
      setView({
        scale: nextScale,
        offsetX: px - (px - view.offsetX) * realFactor,
        offsetY: py - (py - view.offsetY) * realFactor,
      });
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setView, view.scale, view.offsetX, view.offsetY]);

  // --- Pointer handlers (delegated by tool) ---
  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    movedRef.current = false;
    const rect = containerRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Select tool: empty-space click clears selection; region cards
    // handle their own selection via stopPropagation.
    if (activeTool === "select") {
      setSelectedRegion(null);
      // Allow panning with select tool too.
      panRef.current = {
        startX: sx,
        startY: sy,
        ox: view.offsetX,
        oy: view.offsetY,
      };
      (e.target as Element).setPointerCapture?.(e.pointerId);
      return;
    }

    if (activeTool === "circle") {
      const p = screenToCanvas(e.clientX, e.clientY);
      setLasso({ points: [p] });
      (e.target as Element).setPointerCapture?.(e.pointerId);
      return;
    }

    if (activeTool === "comment") {
      // Defer to onPointerUp so a drag doesn't pin.
      panRef.current = {
        startX: sx,
        startY: sy,
        ox: view.offsetX,
        oy: view.offsetY,
      };
      (e.target as Element).setPointerCapture?.(e.pointerId);
      return;
    }

    // pen / eraser: DrawingCanvas handles its own pointer capture, but
    // we also allow panning when the user middle-clicks or holds space.
    // For MVP, pen/eraser do NOT pan — DrawingCanvas owns the gesture.
  }

  function onPointerMove(e: React.PointerEvent) {
    // Broadcast local cursor presence BEFORE the early-return guard so
    // cursor tracking works even when the user is not dragging.
    onPresenceMove(e);
    if (e.buttons === 0) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const dx = sx - (panRef.current?.startX ?? sx);
    const dy = sy - (panRef.current?.startY ?? sy);
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;

    if (lasso) {
      const p = screenToCanvas(e.clientX, e.clientY);
      setLasso((l) => (l ? { points: [...l.points, p] } : l));
      return;
    }

    if (
      panRef.current &&
      (activeTool === "select" || activeTool === "comment")
    ) {
      setView({
        offsetX: panRef.current.ox + dx,
        offsetY: panRef.current.oy + dy,
      });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const wasPanning = panRef.current !== null;
    panRef.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);

    if (lasso) {
      const points = lasso.points;
      setLasso(null);
      if (points.length < 3) return;
      // Compute bounding box in canvas space.
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const width = Math.max(maxX - minX, 80);
      const height = Math.max(maxY - minY, 80);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      openPromptBox({
        open: true,
        x: cx,
        y: cy,
        width,
        height,
        regionId: null,
        prompt: "",
      });
      return;
    }

    // Comment tool: a click (no significant move) pins a comment.
    if (activeTool === "comment" && !movedRef.current && wasPanning) {
      if (activeTabId === null) return;
      const p = screenToCanvas(e.clientX, e.clientY);
      const text = window.prompt("Comment text") ?? "";
      const author = "You";
      if (text.trim()) {
        addComment.mutate(
          {
            tabId: activeTabId,
            comment: { x: p.x, y: p.y, text: text.trim(), author },
          },
          {
            onSuccess: (c) => {
              if (c) setOpenCommentId(c.id);
            },
          },
        );
      }
    }
  }

  const cursor =
    activeTool === "pen" || activeTool === "eraser"
      ? "crosshair"
      : activeTool === "circle"
        ? "crosshair"
        : activeTool === "comment"
          ? "pointer"
          : "default";

  return (
    <div
      ref={containerRef}
      data-ocid="canvas.workspace"
      className="absolute inset-0 overflow-hidden bg-paper touch-none select-none"
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Transformed canvas layer — all entities live in canvas space. */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${view.offsetX}px, ${view.offsetY}px) scale(${view.scale})`,
        }}
      >
        {/* Strokes */}
        <DrawingCanvas strokes={strokes ?? []} />

        {/* Project connectors linking consecutive regions into a software pipeline */}
        {(regions ?? []).length > 1 && (
          <svg className="absolute left-0 top-0 overflow-visible pointer-events-none z-0" width="10000" height="10000">
            <g className="sketch-rough" fill="none" stroke="oklch(0.62 0.22 285 / 0.4)" strokeWidth="2" strokeDasharray="6,6">
              {(regions ?? []).map((r, idx, arr) => {
                if (idx === 0) return null;
                const prev = arr[idx - 1];
                const x1 = prev.x + prev.width / 2;
                const y1 = prev.y + prev.height / 2;
                const x2 = r.x + r.width / 2;
                const y2 = r.y + r.height / 2;
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2;
                return (
                  <path
                    key={`conn-${prev.id}-${r.id}`}
                    d={`M ${x1} ${y1} Q ${mx} ${y1 - 30} ${x2} ${y2}`}
                  />
                );
              })}
            </g>
          </svg>
        )}

        {/* Generated regions */}
        {(regions ?? []).map((r) => (
          <GeneratedRegionCard key={r.id.toString()} region={r} />
        ))}

        {/* Comment pins */}
        {(comments ?? []).map((c, i) => (
          <CommentPin
            key={c.id.toString()}
            index={i + 1}
            x={c.x}
            y={c.y}
            active={openCommentId === c.id}
            onOpen={() => setOpenCommentId(c.id)}
          />
        ))}

        {/* Lasso draft */}
        {lasso && <LassoOverlay points={lasso.points} />}

        {/* Live collaborator cursors — inside the transformed layer so
            they track canvas coordinates through pan/zoom. */}
        <LiveCursors />
      </div>

      {/* Comment panel — rendered in screen space, anchored to the pin. */}
      {openCommentId !== null &&
        (comments ?? []).find((c) => c.id === openCommentId) && (
          <CommentPanel
            comment={(comments ?? []).find((c) => c.id === openCommentId)!}
            view={view}
            onClose={() => setOpenCommentId(null)}
          />
        )}

      {/* Prompt box — rendered in screen space, anchored to the region. */}
      <PromptBox />

      {/* Template library panel — slide-in drawer controlled by the store. */}
      <TemplateLibraryPanel />

      {/* AI Chatbot Assistant panel — slide-in side drawer. */}
      <AIChatBotPanel />

      {/* Floating Camera Zoom & View Controls */}
      <div className="fixed bottom-4 left-20 z-40 flex items-center gap-1.5 rounded-full border border-dashed border-primary/30 bg-card/80 p-1.5 shadow-glow backdrop-blur-md text-xs font-mono select-none">
        <button
          type="button"
          onClick={() => setView({ scale: Math.max(0.2, view.scale - 0.1) })}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/20 hover:text-primary transition-smooth"
          title="Zoom Out"
        >
          <ZoomOut className="size-3.5" />
        </button>
        <span className="min-w-[42px] text-center text-[11px] font-bold text-foreground tabular-nums">
          {Math.round(view.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setView({ scale: Math.min(3, view.scale + 0.1) })}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/20 hover:text-primary transition-smooth"
          title="Zoom In"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <div className="h-3 w-px bg-border/80" />
        <button
          type="button"
          onClick={resetView}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-smooth"
          title="Reset View"
        >
          <Maximize className="size-3" />
          Reset View
        </button>
      </div>
    </div>
  );
}

export default CanvasWorkspace;
