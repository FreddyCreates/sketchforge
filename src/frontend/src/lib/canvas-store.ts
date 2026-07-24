/**
 * SketchForge — global canvas UI store (Zustand).
 *
 * Owns all ephemeral, client-only canvas interaction state that the backend
 * does not persist directly: active tool, color, brush size, the active tab,
 * the pan/zoom camera transform, local undo/redo stacks, the currently
 * selected generated region, the circle-to-prompt box, and the "Thinking"
 * generation flag.
 *
 * Persisted entities (strokes, comments, regions, tabs, project) live in the
 * TanStack Query cache via `hooks/use-canvas-data.ts` and are mutated
 * through the backend actor. This store only holds the *view* of those.
 */
import { create } from "zustand";
import type { CanvasTool, PromptBox, Stroke, ViewTransform } from "./types";

export interface CanvasState {
  // --- Tool & style ---
  activeTool: CanvasTool;
  activeColor: string;
  brushSize: number;

  // --- Active tab ---
  activeTabId: bigint | null;

  // --- Camera ---
  view: ViewTransform;

  // --- Local undo/redo ---
  // `redoStack` holds strokes popped by undo, available to re-apply.
  // Undo itself is backend-driven (`undoLastStroke`); we mirror the popped
  // stroke here so redo can re-`addStroke` it.
  redoStack: Stroke[];

  // --- Selection (generated regions) ---
  selectedRegionId: bigint | null;

  // --- Circle-to-prompt box ---
  promptBox: PromptBox;

  // --- AI generation "Thinking" indicator ---
  isGenerating: boolean;

  // --- Template library panel ---
  templateLibraryOpen: boolean;

  // --- Version history panel ---
  versionHistoryOpen: boolean;
  // The region whose version history is currently shown; null when closed.
  versionHistoryRegionId: bigint | null;

  // --- My presence color (assigned once per session) ---
  // Picked from the presence palette (--presence-1..5) at store init so
  // every collaborator in a session has a stable color-coded hue.
  myPresenceColor: string;

  // --- Actions ---
  setTool: (tool: CanvasTool) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setActiveTab: (id: bigint) => void;
  setView: (view: Partial<ViewTransform>) => void;
  resetView: () => void;
  pushRedo: (stroke: Stroke) => void;
  popRedo: () => Stroke | undefined;
  clearRedo: () => void;
  setSelectedRegion: (id: bigint | null) => void;
  openPromptBox: (box: Partial<PromptBox>) => void;
  closePromptBox: () => void;
  setPromptText: (text: string) => void;
  setGenerating: (v: boolean) => void;
  openTemplateLibrary: () => void;
  closeTemplateLibrary: () => void;
  toggleTemplateLibrary: () => void;
  openVersionHistory: (regionId: bigint) => void;
  closeVersionHistory: () => void;
}

const DEFAULT_VIEW: ViewTransform = { scale: 1, offsetX: 0, offsetY: 0 };

const DEFAULT_PROMPT_BOX: PromptBox = {
  open: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  regionId: null,
  prompt: "",
};

// Presence palette — mirrors --presence-1..5 in index.css. Assigned once
// per session so the local user has a stable color-coded hue for cursors
// and avatar chips.
const PRESENCE_PALETTE = [
  "oklch(0.62 0.22 285)",
  "oklch(0.7 0.17 45)",
  "oklch(0.6 0.16 150)",
  "oklch(0.55 0.2 350)",
  "oklch(0.7 0.15 195)",
];
const MY_PRESENCE_COLOR =
  PRESENCE_PALETTE[Math.floor(Math.random() * PRESENCE_PALETTE.length)];

export const useCanvasStore = create<CanvasState>((set, get) => ({
  activeTool: "pen",
  activeColor: "#1b1b2f",
  brushSize: 3,
  activeTabId: null,
  view: { ...DEFAULT_VIEW },
  redoStack: [],
  selectedRegionId: null,
  promptBox: { ...DEFAULT_PROMPT_BOX },
  isGenerating: false,
  templateLibraryOpen: false,
  versionHistoryOpen: false,
  versionHistoryRegionId: null,
  myPresenceColor: MY_PRESENCE_COLOR,

  setTool: (tool) => set({ activeTool: tool }),
  setColor: (color) => set({ activeColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),
  setActiveTab: (id) =>
    set({ activeTabId: id, selectedRegionId: null, redoStack: [] }),
  setView: (view) => set((s) => ({ view: { ...s.view, ...view } })),
  resetView: () => set({ view: { ...DEFAULT_VIEW } }),

  pushRedo: (stroke) => set((s) => ({ redoStack: [...s.redoStack, stroke] })),
  popRedo: () => {
    const stack = get().redoStack;
    if (stack.length === 0) return undefined;
    const last = stack[stack.length - 1];
    set({ redoStack: stack.slice(0, -1) });
    return last;
  },
  clearRedo: () => set({ redoStack: [] }),

  setSelectedRegion: (id) => set({ selectedRegionId: id }),

  openPromptBox: (box) =>
    set((s) => ({
      promptBox: { ...s.promptBox, ...box, open: true },
    })),
  closePromptBox: () =>
    set((s) => ({ promptBox: { ...s.promptBox, open: false } })),
  setPromptText: (text) =>
    set((s) => ({ promptBox: { ...s.promptBox, prompt: text } })),

  setGenerating: (v) => set({ isGenerating: v }),

  openTemplateLibrary: () => set({ templateLibraryOpen: true }),
  closeTemplateLibrary: () => set({ templateLibraryOpen: false }),
  toggleTemplateLibrary: () =>
    set((s) => ({ templateLibraryOpen: !s.templateLibraryOpen })),

  openVersionHistory: (regionId) =>
    set({ versionHistoryOpen: true, versionHistoryRegionId: regionId }),
  closeVersionHistory: () =>
    set({ versionHistoryOpen: false, versionHistoryRegionId: null }),
}));
