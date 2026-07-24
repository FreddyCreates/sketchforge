/**
 * SketchForge — comment pin marker.
 *
 * A numbered circular pin rendered at a canvas-space (x, y). Clicking
 * opens the CommentPanel for that comment (handled by the parent via
 * `onOpen`). The active pin gets the glowing accent treatment.
 *
 * The pin is positioned with its tip at (x, y); the circle sits above
 * and to the right like a map marker.
 */
import { useCanvasStore } from "@/lib/canvas-store";
import { cn } from "@/lib/utils";

interface CommentPinProps {
  index: number;
  x: number;
  y: number;
  active: boolean;
  onOpen: () => void;
}

export function CommentPin({ index, x, y, active, onOpen }: CommentPinProps) {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const scale = useCanvasStore((s) => s.view.scale);
  // Pins are always visible but only clickable when not actively drawing.
  const interactive = activeTool !== "pen" && activeTool !== "eraser";

  return (
    <button
      type="button"
      data-ocid={`canvas.comment_pin.${index}`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      disabled={!interactive}
      aria-label={`Open comment ${index}`}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-full rounded-full border-2 px-2 py-0.5 text-xs font-bold transition-smooth",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-glow scale-110"
          : "border-dashed bg-card text-foreground hover:border-primary hover:shadow-glow",
      )}
      style={{
        left: `${x}px`,
        top: `${y - 14}px`,
        // Counter-scale so the pin stays a constant screen size regardless
        // of canvas zoom. The parent layer scales us; we undo it.
        transform: `translate(-50%, -100%) scale(${1 / scale})`,
        transformOrigin: "bottom center",
        borderColor: active ? undefined : "oklch(var(--sketch-ink) / 0.7)",
      }}
    >
      {index}
      {/* Pin tip */}
      <span
        className={cn(
          "absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1 rotate-45 border-b-2 border-r-2",
          active ? "border-primary bg-primary" : "bg-card",
        )}
        style={
          active ? undefined : { borderColor: "oklch(var(--sketch-ink) / 0.7)" }
        }
        aria-hidden
      />
    </button>
  );
}

export default CommentPin;
