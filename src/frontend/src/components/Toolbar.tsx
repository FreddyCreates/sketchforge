import { Slider } from "@/components/ui/slider";
import { useCanvasStore } from "@/lib/canvas-store";
import type { CanvasTool } from "@/lib/types";
import { cn } from "@/lib/utils";
/**
 * SketchForge — left-side tool toolbar.
 *
 * Vertical pill toolbar with the five canvas tools (Pen, Eraser, Comment,
 * Circle/Lasso, Select/Move), a color picker, a brush-size slider, and a
 * template library toggle button at the bottom that opens the template
 * library panel via the canvas store.
 *
 * Tool list:
 *  - pen       : freehand drawing (backend `Tool.pen`)
 *  - eraser    : erase strokes (backend `Tool.eraser`)
 *  - comment   : pin a comment by clicking (frontend-only UI tool)
 *  - circle    : lasso a region to open the prompt box (frontend-only)
 *  - select    : select/move/resize generated regions (frontend-only)
 */
import {
  Eraser,
  Hand,
  LayoutTemplate,
  MessageCircle,
  MousePointer2,
  Pencil,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ToolDef {
  id: CanvasTool;
  label: string;
  icon: LucideIcon;
  hint: string;
}

const TOOLS: ToolDef[] = [
  { id: "pen", label: "Pen", icon: Pencil, hint: "Freehand draw" },
  { id: "eraser", label: "Eraser", icon: Eraser, hint: "Erase strokes" },
  {
    id: "comment",
    label: "Comment",
    icon: MessageCircle,
    hint: "Pin a comment",
  },
  {
    id: "circle",
    label: "Lasso",
    icon: Hand,
    hint: "Circle a region to prompt",
  },
  { id: "select", label: "Select", icon: MousePointer2, hint: "Move regions" },
];

const SWATCHES = [
  "#1b1b2f", // ink
  "#6d28d9", // violet
  "#2563eb", // blue
  "#dc2626", // red
  "#f59e0b", // amber
  "#16a34a", // green
];

function ToolButton({
  tool,
  active,
  onSelect,
}: {
  tool: ToolDef;
  active: boolean;
  onSelect: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      title={tool.hint}
      aria-label={tool.label}
      className={cn(
        "group flex size-11 items-center justify-center rounded-full border transition-smooth",
        active
          ? "border-primary/50 bg-primary text-primary-foreground shadow-glow"
          : "border-dashed border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

export function Toolbar() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setTool = useCanvasStore((s) => s.setTool);
  const activeColor = useCanvasStore((s) => s.activeColor);
  const setColor = useCanvasStore((s) => s.setColor);
  const brushSize = useCanvasStore((s) => s.brushSize);
  const setBrushSize = useCanvasStore((s) => s.setBrushSize);
  const toggleTemplateLibrary = useCanvasStore((s) => s.toggleTemplateLibrary);
  const templateLibraryOpen = useCanvasStore((s) => s.templateLibraryOpen);

  return (
    <aside className="flex w-16 flex-col items-center gap-3 border-r border-dashed border-border/70 bg-card/40 py-4">
      {/* Tools */}
      <div className="flex flex-col items-center gap-2">
        {TOOLS.map((t) => (
          <ToolButton
            key={t.id}
            tool={t}
            active={activeTool === t.id}
            onSelect={() => setTool(t.id)}
          />
        ))}
      </div>

      <div className="my-1 h-px w-8 bg-border/60" aria-hidden />

      {/* Color picker */}
      <div className="flex flex-col items-center gap-2">
        <label
          className="size-9 cursor-pointer rounded-full border border-dashed border-border/60 shadow-sketch"
          title="Pick a color"
          aria-label="Pick a color"
          style={{ backgroundColor: activeColor }}
        >
          <input
            type="color"
            value={activeColor}
            onChange={(e) => setColor(e.target.value)}
            className="size-full cursor-pointer opacity-0"
            aria-label="Color picker"
          />
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Use color ${c}`}
              className={cn(
                "size-4 rounded-full border transition-smooth",
                activeColor.toLowerCase() === c.toLowerCase()
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-border/60 hover:scale-110",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="my-1 h-px w-8 bg-border/60" aria-hidden />

      {/* Brush size */}
      <div className="flex w-12 flex-col items-center gap-2">
        <div
          className="rounded-full bg-foreground"
          style={{
            width: `${Math.min(brushSize * 2, 18)}px`,
            height: `${Math.min(brushSize * 2, 18)}px`,
          }}
          aria-hidden
        />
        <Slider
          orientation="vertical"
          value={[brushSize]}
          min={1}
          max={20}
          step={1}
          onValueChange={(v) => setBrushSize(v[0] ?? brushSize)}
          className="h-24"
          aria-label="Brush size"
        />
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {brushSize}
        </span>
      </div>

      {/* Spacer to push template toggle to the bottom */}
      <div className="flex-1" aria-hidden />

      {/* Template library toggle */}
      <button
        type="button"
        onClick={toggleTemplateLibrary}
        aria-pressed={templateLibraryOpen}
        aria-label="Template library"
        title="Toggle template library"
        className={cn(
          "group flex size-11 items-center justify-center rounded-full border transition-smooth",
          templateLibraryOpen
            ? "border-primary/50 bg-primary text-primary-foreground shadow-glow"
            : "border-dashed border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
        )}
      >
        <LayoutTemplate className="size-5" />
      </button>
    </aside>
  );
}

export default Toolbar;
