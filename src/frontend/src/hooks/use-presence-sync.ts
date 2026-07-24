import { useUpsertPresence } from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import type { Point } from "@/lib/types";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useEffect, useRef } from "react";

/**
 * SketchForge — local presence broadcast hook.
 *
 * Tracks the local user's cursor position over the canvas workspace and
 * their active tool, then broadcasts presence to the backend on a throttled
 * interval (~every 2.5s, or immediately on movement past a small threshold).
 *
 * The hook reads `activeTool`, `activeTabId`, and `myPresenceColor` from the
 * canvas store, derives the principal + display name from the Internet
 * Identity identity, converts pointer coordinates to canvas space using the
 * current view transform, and calls `upsertPresence`. It only syncs when the
 * actor is available (i.e. the user is authenticated) and a tab is active.
 *
 * Attach the returned `onPointerMove` handler to the canvas workspace
 * container so the hook receives raw pointer coordinates.
 */
const SYNC_INTERVAL_MS = 2500;
const MOVE_THRESHOLD = 6; // canvas-space px before an immediate sync

export interface PresenceSyncApi {
  /** Attach to the canvas workspace container's onPointerMove. */
  onPointerMove: (e: React.PointerEvent) => void;
}

export function usePresenceSync(
  screenToCanvas: (clientX: number, clientY: number) => Point,
): PresenceSyncApi {
  const upsertPresence = useUpsertPresence();
  const { identity } = useInternetIdentity();

  const activeTool = useCanvasStore((s) => s.activeTool);
  const activeTabId = useCanvasStore((s) => s.activeTabId);
  const myPresenceColor = useCanvasStore((s) => s.myPresenceColor);
  const view = useCanvasStore((s) => s.view);

  // Latest cursor in canvas space + last broadcasted point, kept in refs so
  // the interval closure always reads fresh values without re-subscribing.
  const cursorRef = useRef<Point>({ x: 0, y: 0 });
  const lastSentRef = useRef<Point>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Keep latest sync inputs in refs so the interval callback stays stable.
  const syncInputsRef = useRef({
    activeTool,
    activeTabId,
    myPresenceColor,
    identity,
    upsertPresence,
  });
  syncInputsRef.current = {
    activeTool,
    activeTabId,
    myPresenceColor,
    identity,
    upsertPresence,
  };

  function broadcast() {
    const {
      activeTool: tool,
      activeTabId: tabId,
      myPresenceColor: color,
      identity: ident,
      upsertPresence: upsert,
    } = syncInputsRef.current;
    if (!ident || tabId === null) return;
    const principal = ident.getPrincipal();
    if (principal.isAnonymous()) return;

    const displayName = principal.toText().slice(0, 8) ?? "Collaborator";

    upsert.mutate({
      displayName,
      color,
      activeTabId: tabId,
      cursorX: cursorRef.current.x,
      cursorY: cursorRef.current.y,
      activeTool: tool,
    });
    lastSentRef.current = { ...cursorRef.current };
    hasMovedRef.current = false;
  }

  // Interval-based heartbeat so presence stays fresh even when idle.
  // biome-ignore lint/correctness/useExhaustiveDependencies: broadcast reads from refs; interval only needs to be set up once.
  useEffect(() => {
    const id = window.setInterval(() => {
      broadcast();
    }, SYNC_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  function onPointerMove(e: React.PointerEvent) {
    const p = screenToCanvas(e.clientX, e.clientY);
    cursorRef.current = p;
    const dx = p.x - lastSentRef.current.x;
    const dy = p.y - lastSentRef.current.y;
    if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
      hasMovedRef.current = true;
      broadcast();
    }
  }

  // Re-broadcast immediately when the active tool or tab changes so the
  // roster tooltip reflects the new tool without waiting for the interval.
  // biome-ignore lint/correctness/useExhaustiveDependencies: broadcast reads from refs; only view/tool/tab changes should trigger re-broadcast.
  useEffect(() => {
    broadcast();
  }, [activeTool, activeTabId, view.scale, view.offsetX, view.offsetY]);

  return { onPointerMove };
}
