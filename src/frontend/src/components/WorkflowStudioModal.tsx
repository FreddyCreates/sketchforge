import { useState } from "react";
import { Play, Sparkles, Terminal, FileCode, Coins, Sliders, Download, X, Layers, Cpu, Check, GitBranch } from "lucide-react";
import { PRODUCTION_WORKFLOWS, type ExecutableWorkflow } from "@/lib/workflow-presets";
import { useCanvasStore } from "@/lib/canvas-store";
import { useCreateRegion } from "@/hooks/use-canvas-data";
import { cn } from "@/lib/utils";

interface WorkflowStudioModalProps {
  open: boolean;
  onClose: () => void;
}

export function WorkflowStudioModal({ open, onClose }: WorkflowStudioModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  const activeTabId = useCanvasStore((s) => s.activeTabId);
  const createRegion = useCreateRegion();

  const categories = ["All", "Option 1: In-Browser WASM", "Option 2: Process Bridge", "Option 3: Visual AI & Export"];

  const filteredWorkflows = PRODUCTION_WORKFLOWS.filter((w) =>
    selectedCategory === "All" ? true : w.category === selectedCategory
  );

  async function launchWorkflow(wf: ExecutableWorkflow) {
    if (activeTabId === null) {
      alert("Please open or select a canvas tab first.");
      return;
    }

    setActiveWorkflowId(wf.id);

    try {
      await createRegion.mutateAsync({
        tabId: activeTabId,
        region: {
          x: 100 + Math.random() * 80,
          y: 100 + Math.random() * 80,
          width: 480,
          height: 360,
          prompt: wf.initialPrompt,
        },
      });
      onClose();
      alert(`Workflow Launched: "${wf.title}" instantiated on canvas!`);
    } catch (err: any) {
      alert(`Workflow Launch Failed: ${err.message || "Failed to create card"}`);
    } finally {
      setActiveWorkflowId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl border border-dashed border-primary/50 bg-[#0c0d1a] text-white shadow-glow flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-[#060712]">
          <div className="flex items-center gap-2 font-display text-sm font-bold text-white">
            <Sparkles className="size-5 text-amber-400" />
            WORKFLOW STUDIO (OPTIONS 1, 2, & 3)
          </div>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
            <X className="size-4" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 px-5 py-3 border-b border-white/10 overflow-x-auto no-scrollbar bg-black/20 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1 rounded-full font-semibold transition-all shrink-0 text-[11px]",
                selectedCategory === cat ? "bg-primary text-white shadow-glow" : "bg-white/5 text-white/50 hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Workflows Grid */}
        <div className="flex-1 p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorkflows.map((wf) => (
            <div
              key={wf.id}
              className="bg-[#131428] p-4 rounded-xl border border-white/10 flex flex-col justify-between hover:border-primary/50 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                    {wf.category.split(":")[0]}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">Tab: {wf.codeTab.toUpperCase()}</span>
                </div>
                <h4 className="font-bold text-white text-xs group-hover:text-primary transition-colors">{wf.title}</h4>
                <p className="text-[11px] text-white/60 leading-relaxed">{wf.description}</p>
              </div>

              <button
                type="button"
                onClick={() => launchWorkflow(wf)}
                disabled={activeWorkflowId === wf.id}
                className="mt-4 w-full bg-primary hover:bg-primary/90 text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-glow transition-all disabled:opacity-50"
              >
                <Play className="size-3.5" />
                {activeWorkflowId === wf.id ? "Instantiating Workflow..." : "Launch Workflow on Canvas"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WorkflowStudioModal;
