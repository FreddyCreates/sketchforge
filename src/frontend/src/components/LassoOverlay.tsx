/**
 * SketchForge — lasso overlay.
 *
 * While the circle tool is active and the user drags, this renders the
 * freehand lasso path with the `lasso-march` marching-ants animation.
 * The path is in canvas space (rendered inside the transformed layer).
 */
import type { Point } from "@/lib/types";

interface LassoOverlayProps {
  points: Point[];
}

function pathFromPoints(points: Point[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

export function LassoOverlay({ points }: LassoOverlayProps) {
  if (points.length < 2) return null;
  const d = pathFromPoints(points);
  return (
    <svg
      className="absolute left-0 top-0 overflow-visible"
      role="img"
      aria-label="Lasso selection"
      width="10000"
      height="10000"
      style={{ pointerEvents: "none" }}
      data-ocid="canvas.lasso"
    >
      <path
        d={d}
        fill="oklch(0.62 0.22 285 / 0.06)"
        stroke="oklch(0.62 0.22 285)"
        strokeWidth={2}
        strokeDasharray="6 5"
        className="animate-lasso-march"
      />
    </svg>
  );
}

export default LassoOverlay;
