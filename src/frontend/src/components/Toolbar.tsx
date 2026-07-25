import { Slider } from "@/components/ui/slider";
import { useCanvasStore } from "@/lib/canvas-store";
import type { CanvasTool } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Eraser,
  Hand,
  LayoutTemplate,
  MessageCircle,
  MousePointer2,
  Pencil,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ToolDef {
  id: CanvasTool;
  label: string;
  icon: LucideIcon;
  hint: string;
}

const TOOLS: ToolDef[] = [
  { id: "pen", label: "Pen", icon: Pencil, hint: "Freehand draw wireframes" },
  { id: "eraser", label: "Eraser", icon: Eraser, hint: "Erase canvas strokes" },
  { id: "comment", label: "Comment", icon: MessageCircle, hint: "Pin a comment" },
  { id: "circle", label: "Lasso AI", icon: Hand, hint: "Lasso region to generate app" },
  { id: "select", label: "Select", icon: MousePointer2, hint: "Move and scale regions" },
];

const SWATCHES = [
  "#1b1b2f", // obsidian
  "#6d28d9", // electric violet
  "#2563eb", // neon blue
  "#dc2626", // crimson
  "#f59e0b", // amber
  "#16a34a", // emerald
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
    <div className="relative group">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        aria-label={tool.label}
        className={cn(
          "relative flex size-11 items-center justify-center rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95",
          active
            ? "border-primary bg-gradient-primary text-white shadow-glow scale-105"
            : "border-border/60 bg-card/80 text-muted-foreground hover:border-primary/50 hover:bg-card hover:text-foreground shadow-sm",
        )}
      >
        <Icon className="size-5" />
      </button>

      {/* Floating Tooltip */}
      <div className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 hidden rounded-lg bg-popover px-2.5 py-1 text-[11px] font-semibold text-popover-foreground shadow-md group-hover:block whitespace-nowrap border border-border">
        {tool.label} — <span className="text-muted-foreground font-normal">{tool.hint}</span>
      </div>
    </div>
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
    <aside className="absolute left-4 top-20 z-40 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-card/80 p-3 shadow-glow backdrop-blur-md">
      {/* Tools Group */}
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

      <div className="my-1 h-px w-8 bg-border/80" aria-hidden />

      {/* Color Palette Swatches */}
      <div className="flex flex-col items-center gap-2">
        <label
          className="relative flex size-9 cursor-pointer items-center justify-center rounded-full border border-dashed border-primary/50 shadow-glow transition-transform hover:scale-110"
          title="Custom Color Picker"
          style={{ backgroundColor: activeColor }}
        >
          <input
            type="color"
            value={activeColor}
            onChange={(e) => setColor(e.target.value)}
            className="size-full cursor-pointer opacity-0"
          />
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "size-4 rounded-full border transition-all hover:scale-125",
                activeColor.toLowerCase() === c.toLowerCase()
                  ? "border-white ring-2 ring-primary shadow-glow scale-110"
                  : "border-transparent opacity-80 hover:opacity-100",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="my-1 h-px w-8 bg-border/80" aria-hidden />

      {/* Dynamic Brush Size Slider */}
      <div className="flex w-10 flex-col items-center gap-2">
        <div
          className="rounded-full bg-primary transition-all duration-150 shadow-glow"
          style={{
            width: `${Math.min(brushSize * 2, 16)}px`,
            height: `${Math.min(brushSize * 2, 16)}px`,
          }}
        />
        <Slider
          orientation="vertical"
          value={[brushSize]}
          min={1}
          max={20}
          step={1}
          onValueChange={(v) => setBrushSize(v[0] ?? brushSize)}
          className="h-20"
        />
        <span className="text-[10px] font-bold tabular-nums text-foreground font-mono">
          {brushSize}px
        </span>
      </div>

      <div className="my-1 h-px w-8 bg-border/80" aria-hidden />

      {/* Template Library Button */}
      <div className="relative group">
        <button
          type="button"
          onClick={toggleTemplateLibrary}
          className={cn(
            "flex size-11 items-center justify-center rounded-xl border transition-all hover:scale-105 active:scale-95",
            templateLibraryOpen
              ? "border-primary bg-primary text-primary-foreground shadow-glow"
              : "border-border/60 bg-card/80 text-muted-foreground hover:border-primary/50 hover:bg-card hover:text-foreground",
          )}
        >
          <LayoutTemplate className="size-5" />
        </button>
        <div className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 hidden rounded-lg bg-popover px-2.5 py-1 text-[11px] font-semibold text-popover-foreground shadow-md group-hover:block whitespace-nowrap border border-border">
          Templates Library
        </div>
      </div>
    </aside>
  );
}

export default Toolbar;
