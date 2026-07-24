/**
 * SketchForge — domain types.
 *
 * These mirror the backend Candid shapes from `src/backend.d.ts` (re-exported
 * via `@/backend`) but are re-declared here as plain TS types so the UI store
 * and components can import a single, stable surface without pulling the
 * generated bindings (which carry `bigint` IDs and Candid variant quirks)
 * into every file.
 *
 * Backend IDs are `bigint`; we keep them as `bigint` here for fidelity, and
 * `main.tsx` already patches `BigInt.prototype.toJSON` so they serialize.
 */

// --- Backend view re-exports (kept as-is for query/mutation typing) ---
export type {
  ProjectView,
  TabView,
  StrokeView,
  CommentView,
  ReplyView,
  GeneratedRegionView,
  Point,
  StrokeInput,
  CommentInput,
  ReplyInput,
  RegionInput,
  RegionUpdate,
  Tool,
  PresenceView,
  PresenceInput,
  RegionVersionView,
  TemplateView,
} from "@/backend";

import type {
  CommentView,
  GeneratedRegionView,
  Point,
  PresenceView,
  ProjectView,
  RegionVersionView,
  StrokeView,
  TabView,
  TemplateView,
  Tool,
} from "@/backend";

// Re-aliased for ergonomic local use.
export type Project = ProjectView;
export type Tab = TabView;
export type Stroke = StrokeView;
export type Comment = CommentView;
export type Reply = CommentView["replies"][number];
export type GeneratedRegion = GeneratedRegionView;
export type Presence = PresenceView;
export type RegionVersion = RegionVersionView;
export type Template = TemplateView;

// --- Frontend-only UI tool enum ---
// The backend `Tool` enum only has `pen` and `eraser` (drawing tools that
// persist strokes). `comment`, `circle`, and `select` are pure UI tools that
// do not produce strokes — they are frontend-only and never sent to the
// backend `addStroke` call.
export type CanvasTool = "pen" | "eraser" | "comment" | "circle" | "select";

// --- View / camera transform ---
export interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

// --- Prompt box (circle-to-prompt) ---
// `regionId` is null when creating a brand-new region; set when refining an
// existing generated region.
export interface PromptBox {
  open: boolean;
  /** Canvas-space coordinates (pre-transform) of the lasso centroid. */
  x: number;
  y: number;
  /** Width/height of the circled region in canvas space. */
  width: number;
  height: number;
  regionId: bigint | null;
  prompt: string;
}

// --- Local undo/redo stacks ---
// The backend exposes `undoLastStroke` but no `redoStroke`. We keep a local
// redo stack of the strokes returned by `undoLastStroke` so the user can
// re-apply them. The undo stack is implicit (driven by backend state) but we
// track its length to enable/disable the undo button.
export interface UndoRedoState {
  /** Strokes popped by undo, available for redo. */
  redoStack: Stroke[];
  /** Whether an undo is currently possible (driven by query data length). */
  canUndo: boolean;
}

// --- Convenience: a stroke being drawn (pre-persist) ---
export interface LiveStroke {
  tool: Tool;
  color: string;
  size: number;
  points: Point[];
}

// --- Region status (re-exported enum for component use) ---
export { RegionStatus } from "@/backend";
