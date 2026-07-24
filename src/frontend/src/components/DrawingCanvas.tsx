import { useAddStroke } from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import type { LiveStroke, Point, Stroke } from "@/lib/types";
/**
 * SketchForge — stroke renderer.
 *
 * Renders all persisted strokes for the active tab as SVG paths inside a
 * single absolutely-positioned <svg> that fills the canvas layer. While
 * the pen/eraser tool is active and the pointer is down, captures the
 * live stroke and renders a preview path; on pointer up the stroke is
 * committed via `useAddStroke`.
 *
 * Sketchy aesthetic: pen strokes use a slightly rough stroke with round
 * caps/joins and a subtle wobble filter (the `#rough-paper` SVG filter
 * declared in index.css via `.sketch-rough`). Eraser strokes render in
 * the paper color to "erase" visually.
 */
import { useEffect, useRef, useState } from "react";

interface DrawingCanvasProps {
  strokes: Stroke[];
}

// Build an SVG path `d` string from a list of points using smooth
// quadratic curves through midpoints for a hand-drawn feel.
function pathFromPoints(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x} ${p.y} L ${p.x + 0.1} ${p.y + 0.1}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const mx = (prev.x + cur.x) / 2;
    const my = (prev.y + cur.y) / 2;
    d += ` Q ${prev.x} ${prev.y} ${mx} ${my}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

export function DrawingCanvas({ strokes }: DrawingCanvasProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const activeColor = useCanvasStore((s) => s.activeColor);
  const brushSize = useCanvasStore((s) => s.brushSize);
  const activeTabId = useCanvasStore((s) => s.activeTabId);
  const addStroke = useAddStroke();

  const svgRef = useRef<SVGSVGElement>(null);
  const [live, setLive] = useState<LiveStroke | null>(null);
  const drawingRef = useRef(false);

  // Only pen/eraser capture strokes here.
  const isDrawingTool = activeTool === "pen" || activeTool === "eraser";

  function canvasPointFromEvent(e: React.PointerEvent): Point {
    // The SVG lives inside the transformed canvas layer, so its own
    // coordinate system IS canvas space. We use the SVG's CTM inverse.
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const inv = ctm.inverse();
    const transformed = pt.matrixTransform(inv);
    return { x: transformed.x, y: transformed.y };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!isDrawingTool || activeTabId === null) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    drawingRef.current = true;
    const p = canvasPointFromEvent(e);
    const tool: any = activeTool === "eraser" ? "eraser" : "pen";
    setLive({
      tool,
      color: tool === "eraser" ? "#f7f3e8" : activeColor,
      size: tool === "eraser" ? Math.max(brushSize * 3, 12) : brushSize,
      points: [p],
    });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawingRef.current || !live) return;
    e.stopPropagation();
    const p = canvasPointFromEvent(e);
    setLive((l) => (l ? { ...l, points: [...l.points, p] } : l));
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    e.stopPropagation();
    if (live && live.points.length > 0 && activeTabId !== null) {
      addStroke.mutate({
        tabId: activeTabId,
        tool: live.tool,
        color: live.color,
        size: live.size,
        points: live.points,
      });
    }
    setLive(null);
  }

  // Cancel any in-flight stroke if the tool changes mid-draw.
  useEffect(() => {
    if (!isDrawingTool) {
      drawingRef.current = false;
      setLive(null);
    }
  }, [isDrawingTool]);

  // Compute a generous SVG viewBox that covers all strokes + live.
  const allPoints: Point[] = [
    ...strokes.flatMap((s) => s.points),
    ...(live?.points ?? []),
  ];
  let vbX = 0;
  let vbY = 0;
  let vbW = 1;
  let vbH = 1;
  if (allPoints.length > 0) {
    const xs = allPoints.map((p) => p.x);
    const ys = allPoints.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const pad = 40;
    vbX = minX - pad;
    vbY = minY - pad;
    vbW = Math.max(maxX - minX + pad * 2, 1);
    vbH = Math.max(maxY - minY + pad * 2, 1);
  }

  return (
    <svg
      ref={svgRef}
      data-ocid="canvas.strokes"
      role="img"
      aria-label="Drawing canvas"
      className="absolute left-0 top-0 overflow-visible"
      // Use a huge fixed pixel size; the parent transform handles scale.
      // overflow-visible means strokes outside the viewBox still render.
      width="10000"
      height="10000"
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      style={{ pointerEvents: isDrawingTool ? "auto" : "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Rough-paper turbulence filter for the sketchy hand-drawn look. */}
      <defs>
        <filter id="rough-paper" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="2"
            seed="3"
          />
          <feDisplacementMap in="SourceGraphic" scale="1.4" />
        </filter>
      </defs>

      <g
        className="sketch-rough"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {strokes.map((s) => (
          <path
            key={s.id.toString()}
            d={pathFromPoints(s.points)}
            stroke={s.tool === "eraser" ? "#f7f3e8" : s.color}
            strokeWidth={s.tool === "eraser" ? Math.max(s.size, 12) : s.size}
          />
        ))}
        {live && (
          <path
            d={pathFromPoints(live.points)}
            stroke={live.color}
            strokeWidth={live.size}
            opacity={0.95}
          />
        )}
      </g>
    </svg>
  );
}

export default DrawingCanvas;
