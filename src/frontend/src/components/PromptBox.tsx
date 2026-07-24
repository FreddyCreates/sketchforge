import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateRegion,
  useRegenerateRegion,
  useTemplates,
  useUpdateRegion,
  useStrokes,
  useAddStroke,
} from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import { generateHtmlAsync, generateDrawingStrokes } from "@/lib/html-generator";
import { RegionStatus } from "@/lib/types";
import { Sparkles, X, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function PromptBox() {
  const promptBox = useCanvasStore((s) => s.promptBox);
  const closePromptBox = useCanvasStore((s) => s.closePromptBox);
  const setPromptText = useCanvasStore((s) => s.setPromptText);
  const setGenerating = useCanvasStore((s) => s.setGenerating);
  const view = useCanvasStore((s) => s.view);
  const activeTabId = useCanvasStore((s) => s.activeTabId);

  const createRegion = useCreateRegion();
  const updateRegion = useUpdateRegion();
  const regenerateRegion = useRegenerateRegion();
  const addStroke = useAddStroke();

  // Fetch the available templates and strokes
  const { data: templates } = useTemplates();
  const { data: strokes } = useStrokes(activeTabId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [busy, setBusy] = useState(false);
  const [sketchBusy, setSketchBusy] = useState(false);

  useEffect(() => {
    if (promptBox.open) textareaRef.current?.focus();
  }, [promptBox.open]);

  if (!promptBox.open) return null;

  // Anchor in screen space.
  const screenX = promptBox.x * view.scale + view.offsetX;
  const screenY = promptBox.y * view.scale + view.offsetY;

  async function handleGenerate() {
    const prompt = promptBox.prompt.trim();
    if (!prompt || activeTabId === null) return;
    setBusy(true);
    setGenerating(true);
    let regionId = promptBox.regionId;
    try {
      const box = {
        x: promptBox.x - promptBox.width / 2,
        y: promptBox.y - promptBox.height / 2,
        width: promptBox.width,
        height: promptBox.height,
      };

      if (regionId === null) {
        // New region: create it in pending state first.
        const created = await createRegion.mutateAsync({
          tabId: activeTabId,
          region: {
            ...box,
            prompt,
          },
        });
        if (!created) throw new Error("Failed to create region");
        regionId = created.id;
      } else {
        // Refining an existing region: regenerate clears HTML server-side.
        await regenerateRegion.mutateAsync({
          regionId: regionId!,
          newPrompt: prompt,
        });
      }

      // Set status to generating before the async HTML generation so the
      // in-card Thinking dots animation is reachable.
      await updateRegion.mutateAsync({
        regionId: regionId!,
        updates: { status: RegionStatus.generating },
      });

      // Concurrently generate multi-colored pen/marker strokes on the canvas paper
      try {
        const drawnStrokes = await generateDrawingStrokes(prompt, box);
        for (const stroke of drawnStrokes) {
          if (stroke.points.length > 0) {
            await addStroke.mutateAsync({
              tabId: activeTabId,
              tool: (stroke.tool === 1 ? "eraser" : "pen") as any,
              color: stroke.color,
              size: stroke.size,
              points: stroke.points,
            });
          }
        }
      } catch (err) {
        console.error("Canvas stroke drawing failed, continuing app generation", err);
      }

      // Generate HTML client-side, passing current template list, drawn strokes and region box
      const html = await generateHtmlAsync(prompt, templates ?? [], strokes ?? [], box);

      // Persist the generated HTML and mark done.
      await updateRegion.mutateAsync({
        regionId: regionId!,
        updates: {
          generatedHtml: html,
          status: RegionStatus.done,
          prompt,
        },
      });
      closePromptBox();
    } catch {
      if (regionId !== null) {
        updateRegion.mutate({
          regionId,
          updates: { status: RegionStatus.error },
        });
      }
    } finally {
      setBusy(false);
      setGenerating(false);
    }
  }

  async function handleAISecondSketch() {
    const prompt = promptBox.prompt.trim();
    if (!prompt || activeTabId === null) return;
    const apiKey = localStorage.getItem("sketchforge_gemini_api_key") || "";
    if (!apiKey) {
      alert("Please configure a Gemini API key in the engine settings first!");
      return;
    }

    setSketchBusy(true);
    try {
      const box = {
        x: promptBox.x - promptBox.width / 2,
        y: promptBox.y - promptBox.height / 2,
        width: promptBox.width,
        height: promptBox.height,
      };

      const generatedStrokes = await generateDrawingStrokes(prompt, box);
      for (const stroke of generatedStrokes) {
        if (stroke.points.length > 0) {
          await addStroke.mutateAsync({
            tabId: activeTabId,
            tool: (stroke.tool === 1 ? "eraser" : "pen") as any,
            color: stroke.color,
            size: stroke.size,
            points: stroke.points,
          });
        }
      }
      closePromptBox();
    } catch (e) {
      console.error(e);
      alert("Failed to sketch with AI. Make sure your API key is correct.");
    } finally {
      setSketchBusy(false);
    }
  }

  const isWorking = busy || sketchBusy;

  return (
    <div
      className="absolute z-40 w-72 sketch-border bg-card p-3 shadow-glow-lg animate-panel-slide-left"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: "translate(-50%, -50%)",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      data-ocid="canvas.prompt_box"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary font-display">
          <Sparkles className="size-3.5" />
          <span>Describe what to build / sketch</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 rounded-full"
          onClick={closePromptBox}
          aria-label="Close prompt box"
          disabled={isWorking}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        value={promptBox.prompt}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="e.g. login form, or: a wireframe layout / a funny face"
        className="min-h-16 resize-none rounded-lg border-dashed text-sm focus-visible:ring-primary/20"
        aria-label="Generation prompt"
        disabled={isWorking}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void handleGenerate();
          }
        }}
      />

      <div className="mt-3 flex items-center justify-between gap-1.5">
        <span className="text-[10px] text-muted-foreground font-medium">
          {promptBox.regionId === null ? "New creation" : "Refinement"}
        </span>
        <div className="flex gap-1.5">
          {promptBox.regionId === null && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleAISecondSketch()}
              disabled={isWorking || !promptBox.prompt.trim()}
              className="rounded-full border-dashed text-xs font-semibold border-accent text-accent hover:bg-accent/5 hover:text-accent"
              title="Draw strokes on canvas with AI"
            >
              <Pencil className="size-3 mr-1" />
              {sketchBusy ? "Sketching…" : "AI Sketch"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => void handleGenerate()}
            disabled={isWorking || !promptBox.prompt.trim()}
            className="glow-primary rounded-full bg-gradient-primary px-4 text-xs font-semibold text-primary-foreground"
            data-ocid="canvas.prompt_box.generate"
          >
            {busy ? "Generating…" : "Generate App"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PromptBox;
