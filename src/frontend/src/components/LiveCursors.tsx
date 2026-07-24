import { usePresence } from "@/hooks/use-canvas-data";
import type { Presence } from "@/lib/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
/**
 * SketchForge — live collaborator cursors.
 *
 * Renders a cursor (arrow + label) for every OTHER online collaborator
 * (never the local user). Each cursor is positioned at the collaborator's
 * `cursorX` / `cursorY` in canvas space and lives inside the transformed
 * canvas layer in `CanvasWorkspace`, so it tracks pan/zoom automatically.
 *
 * The label shows the display name and the active tool; the arrow and label
 * are tinted with the collaborator's presence color via the `.cursor-arrow`
 * and `.cursor-label` classes. The `.animate-cursor-pulse` animation gives
 * the label a subtle breathing motion.
 */
function CursorMarker({ presence }: { presence: Presence }) {
  return (
    <div
      className="pointer-events-none absolute left-0 top-0"
      style={{
        transform: `translate(${presence.cursorX}px, ${presence.cursorY}px)`,
      }}
      data-ocid={`presence.cursor.${presence.principal}`}
      aria-hidden
    >
      {/* Arrowhead pointing down-left toward the cursor hotspot */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        className="cursor-arrow animate-cursor-pulse"
        style={{ display: "block" }}
        role="img"
        aria-label={`${presence.displayName} cursor`}
      >
        <title>{`${presence.displayName} cursor`}</title>
        <path
          d="M2 2 L2 14 L6 10 L9 16 L11 15 L8 9 L13 9 Z"
          className="cursor-arrow"
        />
      </svg>
      {/* Label sits just below the arrowhead */}
      <div className="cursor-label mt-0.5 animate-cursor-pulse">
        <span className="truncate">{presence.displayName}</span>
        <span className="opacity-60">·</span>
        <span className="capitalize">{presence.activeTool}</span>
      </div>
    </div>
  );
}

export function LiveCursors() {
  const { data: presence } = usePresence();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toText();

  const others = (presence ?? []).filter((p) => p.principal !== myPrincipal);

  if (others.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-0 top-0">
      {others.map((p) => (
        <CursorMarker key={p.principal} presence={p} />
      ))}
    </div>
  );
}

export default LiveCursors;
