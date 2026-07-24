import { RegionRenderer } from "@/components/RegionRenderer";
import { useDeleteRegion, useUpdateRegion } from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import type { GeneratedRegion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { refineHtmlAsync } from "@/lib/html-generator";
import { AlertTriangle, History, RefreshCw, X, Play, Sparkles, Code, Eye, Layers, Maximize2, Minimize2, Wand2 } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";

interface GeneratedRegionCardProps {
  region: GeneratedRegion;
}

type DragMode =
  | "move"
  | "resize-se"
  | "resize-sw"
  | "resize-ne"
  | "resize-nw"
  | null;

export function GeneratedRegionCard({ region }: GeneratedRegionCardProps) {
  const selectedRegionId = useCanvasStore((s) => s.selectedRegionId);
  const setSelectedRegion = useCanvasStore((s) => s.setSelectedRegion);
  const openPromptBox = useCanvasStore((s) => s.openPromptBox);
  const openVersionHistory = useCanvasStore((s) => s.openVersionHistory);
  const view = useCanvasStore((s) => s.view);

  const updateRegion = useUpdateRegion();
  const deleteRegion = useDeleteRegion();

  const selected = selectedRegionId === region.id;
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [hover, setHover] = useState(false);

  // Embedded Editor state
  const [editMode, setEditMode] = useState<"preview" | "code">("preview");
  const [activeCodeTab, setActiveCodeTab] = useState<"all" | "html" | "css" | "js">("all");
  const [localHtml, setLocalHtml] = useState(region.generatedHtml || "");
  const [refinePrompt, setRefinePrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setLocalHtml(region.generatedHtml || "");
  }, [region.generatedHtml]);

  useEffect(() => {
    if (!selected) {
      setEditMode("preview");
      setIsFullscreen(false);
    }
  }, [selected]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent, mode: DragMode) => {
      if (mode === null) return;
      e.stopPropagation();
      setSelectedRegion(region.id);
      dragRef.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        x: region.x,
        y: region.y,
        w: region.width,
        h: region.height,
      };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [
      region.id,
      region.x,
      region.y,
      region.width,
      region.height,
      setSelectedRegion,
    ],
  );

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    e.stopPropagation();
    const dx = (e.clientX - drag.startX) / view.scale;
    const dy = (e.clientY - drag.startY) / view.scale;
    let { x, y, w, h } = drag;
    if (drag.mode === "move") {
      x = drag.x + dx;
      y = drag.y + dy;
    } else {
      const mode = drag.mode;
      if (mode === null) return;
      if (mode.includes("e")) w = Math.max(80, drag.w + dx);
      if (mode.includes("s")) h = Math.max(60, drag.h + dy);
      if (mode.includes("w")) {
        const nw = Math.max(80, drag.w - dx);
        x = drag.x + (drag.w - nw);
        w = nw;
      }
      if (mode.includes("n")) {
        const nh = Math.max(60, drag.h - dy);
        y = drag.y + (drag.h - nh);
        h = nh;
      }
    }
    setLiveRect({ x, y, w, h });
  }

  const [liveRect, setLiveRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  function onPointerUp(e: React.PointerEvent) {
    const drag = dragRef.current;
    dragRef.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    if (drag && liveRect) {
      updateRegion.mutate({
        regionId: region.id,
        updates: {
          x: liveRect.x,
          y: liveRect.y,
          width: liveRect.w,
          height: liveRect.h,
        },
      });
    }
    setLiveRect(null);
  }

  const rx = liveRect?.x ?? region.x;
  const ry = liveRect?.y ?? region.y;
  const rw = liveRect?.w ?? region.width;
  const rh = liveRect?.h ?? region.height;

  const isGenerating = region.status === "generating";
  const isError = region.status === "error";

  function handleDelete() {
    deleteRegion.mutate(region.id);
    setSelectedRegion(null);
  }

  function handleReprompt() {
    openPromptBox({
      open: true,
      x: rx + rw / 2,
      y: ry + rh / 2,
      width: rw,
      height: rh,
      regionId: region.id,
      prompt: region.prompt,
    });
  }

  function handleHistory() {
    openVersionHistory(region.id);
  }

  function handleApplyCode() {
    updateRegion.mutate({
      regionId: region.id,
      updates: {
        generatedHtml: localHtml,
      },
    });
  }

  async function handleRefine() {
    if (!refinePrompt.trim()) return;
    setIsRefining(true);
    try {
      const updated = await refineHtmlAsync(localHtml, refinePrompt.trim());
      setLocalHtml(updated);
      setRefinePrompt("");
      updateRegion.mutate({
        regionId: region.id,
        updates: {
          generatedHtml: updated,
        },
      });
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Refinement failed. Check your Gemini API Key.");
    } finally {
      setIsRefining(false);
    }
  }

  // Calculate line numbers for the Monaco-style gutter
  const linesCount = localHtml.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(linesCount, 1) }, (_, i) => i + 1);

  return (
    <div
      data-ocid={`canvas.region.${region.id}`}
      className={cn(
        "absolute sketch-border bg-card overflow-visible select-none transition-all duration-200",
        selected ? "shadow-glow border-primary/70 z-30" : "shadow-sketch z-10",
        isFullscreen && "!fixed !inset-4 !w-auto !h-auto !z-50 sketch-border shadow-glow-lg"
      )}
      style={
        isFullscreen
          ? {}
          : {
              left: `${rx}px`,
              top: `${ry}px`,
              width: `${rw}px`,
              height: `${rh}px`,
            }
      }
      onPointerDown={(e) => onPointerDown(e, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Floating Top Mode Selector */}
      {selected && !isGenerating && !isError && (
        <div 
          className="absolute -top-7 left-12 flex gap-1 bg-card rounded-t-lg border-t border-x border-dashed border-primary px-2 py-0.5 shadow-glow text-[10px] font-semibold font-display"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setEditMode("preview")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-smooth",
              editMode === "preview" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Eye className="size-3" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setEditMode("code")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-smooth",
              editMode === "code" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Code className="size-3" />
            Monaco IDE
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="relative h-full w-full overflow-hidden rounded-[14px]">
        {isGenerating ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-card/60">
            <div className="flex gap-1">
              <span className="size-2 rounded-full bg-primary animate-thinking-dot [animation-delay:0ms]" />
              <span className="size-2 rounded-full bg-primary animate-thinking-dot [animation-delay:160ms]" />
              <span className="size-2 rounded-full bg-primary animate-thinking-dot [animation-delay:320ms]" />
            </div>
            <p className="text-xs font-medium text-muted-foreground font-display">
              Thinking…
            </p>
          </div>
        ) : isError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-destructive/5 p-3 text-center">
            <AlertTriangle className="size-5 text-destructive" />
            <p className="text-xs text-destructive">Generation failed</p>
            <button
              type="button"
              onClick={handleReprompt}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : editMode === "code" ? (
          /* High-End Monaco-Style Multi-Tab Code IDE */
          <div 
            className="flex h-full w-full flex-col bg-[#141424] text-white font-mono text-xs select-text" 
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Top IDE Header Toolbar */}
            <div className="flex justify-between items-center bg-[#0d0d18] px-3 py-1.5 border-b border-white/10 text-[10px] font-sans">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-primary font-bold">
                  <Layers className="size-3" />
                  MONACO ENGINE
                </span>
                <div className="h-3 w-px bg-white/20" />
                <div className="flex gap-1">
                  {(["all", "html", "css", "js"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveCodeTab(tab)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[9px] uppercase font-semibold transition-smooth",
                        activeCodeTab === tab ? "bg-white/20 text-white" : "text-white/40 hover:text-white"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/40 tabular-nums">
                  {linesCount} L | {localHtml.length} C
                </span>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1 text-white/60 hover:text-white transition-smooth"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Editor"}
                >
                  {isFullscreen ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
                </button>
                <button
                  type="button"
                  onClick={handleApplyCode}
                  className="flex items-center gap-1 bg-gradient-primary px-3 py-1 rounded-full text-white font-semibold hover:opacity-90 text-[10px] shadow-glow"
                >
                  <Play className="size-3" />
                  Run Engine
                </button>
              </div>
            </div>

            {/* Editor Workspace with Line Numbers Gutter */}
            <div className="flex flex-1 overflow-hidden relative bg-[#1b1b2f]">
              {/* Line Numbers Gutter */}
              <div className="w-9 bg-[#141424] text-white/30 text-right pr-2 pt-2 select-none border-r border-white/5 font-mono text-[10px] leading-relaxed">
                {lineNumbers.map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>

              {/* Code Input */}
              <textarea
                value={localHtml}
                onChange={(e) => setLocalHtml(e.target.value)}
                className="flex-1 w-full bg-transparent text-emerald-300 p-2 border-0 outline-none resize-none font-mono text-[11px] overflow-y-auto leading-relaxed focus:ring-0 whitespace-pre"
                spellCheck={false}
              />
            </div>

            {/* AI Code Refinement Footer */}
            <div className="border-t border-white/10 p-2 bg-[#0d0d18] font-sans">
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder={isRefining ? "Refining code with AI..." : "Refine code (e.g. add WebGL 3D planet / change layout)"}
                  className="flex-1 bg-[#1b1b2f] border border-white/20 rounded-lg px-2.5 py-1 text-white text-[11px] placeholder:text-white/40 focus:border-primary outline-none"
                  disabled={isRefining}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleRefine();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleRefine}
                  disabled={isRefining || !refinePrompt.trim()}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-3.5 py-1 rounded-full text-[10px] flex items-center gap-1.5 disabled:opacity-50 shadow-glow"
                >
                  {isRefining ? "Refining..." : "Refine"}
                  <Wand2 className="size-3" />
                </button>
              </div>
            </div>
          </div>
        ) : region.generatedHtml ? (
          <RegionRenderer html={region.generatedHtml} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground font-display">
            Empty region
          </div>
        )}
      </div>

      {/* Selection chrome */}
      {selected && !isFullscreen && (
        <>
          {/* Delete button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleDelete}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-dashed border-destructive bg-card text-destructive shadow-glow hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Delete region"
            data-ocid={`canvas.region.${region.id}.delete`}
          >
            <X className="size-3.5" />
          </button>
          {/* Re-prompt button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleReprompt}
            className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full border border-dashed border-primary bg-card text-primary shadow-glow hover:bg-primary hover:text-primary-foreground"
            aria-label="Re-prompt region"
            title="Refine prompt"
            data-ocid={`canvas.region.${region.id}.reprompt`}
          >
            <RefreshCw className="size-3.5" />
          </button>
          {/* Version history button */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleHistory}
            className="absolute -top-2 left-6 flex size-6 items-center justify-center rounded-full border border-dashed border-accent bg-card text-accent shadow-glow hover:bg-accent hover:text-accent-foreground"
            aria-label="View version history"
            title="Version history"
            data-ocid={`canvas.region.${region.id}.history`}
          >
            <History className="size-3.5" />
          </button>
          {/* Resize handles */}
          {(["nw", "ne", "sw", "se"] as const).map((corner) => (
            <span
              key={corner}
              onPointerDown={(e) =>
                onPointerDown(e, `resize-${corner}` as DragMode)
              }
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={cn(
                "absolute size-3 rounded-full border border-dashed border-primary bg-card shadow-glow",
                corner === "nw" && "-left-1.5 -top-1.5 cursor-nwse-resize",
                corner === "ne" && "-right-1.5 -top-1.5 cursor-nesw-resize",
                corner === "sw" && "-left-1.5 -bottom-1.5 cursor-nesw-resize",
                corner === "se" && "-right-1.5 -bottom-1.5 cursor-nwse-resize",
              )}
              aria-hidden
            />
          ))}
        </>
      )}

      {/* Hover affordance when not selected */}
      {!selected && hover && (
        <div className="pointer-events-none absolute inset-0 rounded-[14px] ring-2 ring-primary/30" />
      )}
    </div>
  );
}

export default GeneratedRegionCard;
