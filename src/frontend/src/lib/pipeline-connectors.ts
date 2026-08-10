/**
 * SketchForge — Pipeline Architecture Connectors & Data Flow Engine.
 */

export interface CardConnection {
  id: string;
  fromRegionId: string;
  toRegionId: string;
  label?: string;
  color?: string;
  active?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate a smooth, sketchy quadratic Bézier curve path between two region card centers.
 */
export function calculateBezierConnectorPath(from: RegionBounds, to: RegionBounds): {
  path: string;
  labelX: number;
  labelY: number;
} {
  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  const endX = to.x + to.width / 2;
  const endY = to.y + to.height / 2;

  // Control points for organic Bézier curve
  const dx = endX - startX;
  const dy = endY - startY;

  const controlX = startX + dx * 0.5 - dy * 0.15;
  const controlY = startY + dy * 0.5 + dx * 0.15;

  const path = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

  // Midpoint for label positioning
  const labelX = 0.25 * startX + 0.5 * controlX + 0.25 * endX;
  const labelY = 0.25 * startY + 0.5 * controlY + 0.25 * endY;

  return { path, labelX, labelY };
}

/**
 * Trigger data payload flow across a pipeline connection.
 */
export function triggerPipelineDataFlow(
  fromId: string,
  toId: string,
  payload: Record<string, any>
): { success: boolean; log: string } {
  const timestamp = new Date().toLocaleTimeString();
  return {
    success: true,
    log: `[PIPELINE FLOW ${timestamp}] Data payload from Region #${fromId} transmitted to Region #${toId}: ${JSON.stringify(payload)}`,
  };
}
