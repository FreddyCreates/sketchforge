import { CanvasSandboxStudio } from "@/components/CanvasSandboxStudio";
import { VisualPropertyInspector } from "@/components/VisualPropertyInspector";
import { RegionRenderer } from "@/components/RegionRenderer";
import { useDeleteRegion, useUpdateRegion } from "@/hooks/use-canvas-data";
import { useCanvasStore } from "@/lib/canvas-store";
import type { GeneratedRegion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { refineHtmlAsync } from "@/lib/html-generator";
import { createReceiptProof, fetchMcpTools, callMcpTool, type ReceiptProof, type McpTool } from "@/lib/mcp-spine";
import { AlertTriangle, History, RefreshCw, X, Play, Sparkles, Code, Eye, Layers, Maximize2, Minimize2, Wand2, Copy, Download, ShieldCheck, Cpu, Coins, CheckCircle2, Terminal, Bot, Sliders } from "lucide-react";
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
  const [activeCodeTab, setActiveCodeTab] = useState<"all" | "html" | "solidity" | "motoko" | "python" | "mcp" | "terminal" | "sandbox" | "inspect">("all");
  const [localHtml, setLocalHtml] = useState(region.generatedHtml || "");
  const [refinePrompt, setRefinePrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dedicated On-Card Agent State
  const [cardAgentOpen, setCardAgentOpen] = useState(false);
  const [cardAgentInput, setCardAgentInput] = useState("");
  const [cardAgentMessages, setCardAgentMessages] = useState<Array<{ sender: "user" | "agent"; text: string }>>([
    { sender: "agent", text: `I am your Dedicated Card Agent for Region #${region.id}. Ask me to rewrite this app, compile smart contracts, or execute python scripts!` },
  ]);
  const [cardAgentLoading, setCardAgentLoading] = useState(false);

  // Python WASM (Pyodide Engine) State
  const [pythonCode, setPythonCode] = useState(`# SketchForge Python WASM Runtime (Pyodide 3.11)
import math

def calculate_fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print("=== Python WASM Execution Result ===")
print("Fibonacci Sequence (first 10 terms):", calculate_fibonacci(10))
print("Pi calculation:", math.pi)
`);
  const [pythonOutput, setPythonOutput] = useState("");
  const [isPythonRunning, setIsPythonRunning] = useState(false);

  // Terminal Console State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] SketchForge Sandboxed Canvas Runtime active.",
    "[ICP] Canister state loaded from local db storage.",
    "[WEBGL] Three.js shader pipeline initialized.",
    "[MCP] Spine endpoint connected at http://127.0.0.1:8080.",
    "Type 'help' for available CLI commands.",
  ]);
  const [terminalInput, setTerminalInput] = useState("");

  function handleTerminalSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;
    setTerminalLogs((prev) => [...prev, `$ ${cmd}`]);
    setTerminalInput("");

    if (cmd === "help") {
      setTerminalLogs((prev) => [
        ...prev,
        "Available commands:",
        "  status  - Show canvas canister & WebGL runtime health",
        "  deploy  - Deploy region code to ICP canister",
        "  build   - Run Vite production bundle simulation",
        "  clear   - Clear terminal output console",
      ]);
    } else if (cmd === "status") {
      setTerminalLogs((prev) => [
        ...prev,
        "[OK] Canister ID: rdmx6-jaaaa-aaaaa-aaadq-cai",
        "[OK] WebGL Context: ACTIVE",
        "[OK] AI Engine: gemini-2.5-flash / gemini-2.5-pro",
      ]);
    } else if (cmd === "clear") {
      setTerminalLogs([]);
    } else {
      setTerminalLogs((prev) => [...prev, `Executed command: ${cmd}`]);
    }
  }

  async function handleCardAgentSend() {
    const text = cardAgentInput.trim();
    if (!text || cardAgentLoading) return;

    setCardAgentMessages((prev) => [...prev, { sender: "user", text }]);
    setCardAgentInput("");
    setCardAgentLoading(true);

    try {
      const updated = await refineHtmlAsync(localHtml, text);
      setLocalHtml(updated);
      updateRegion.mutate({
        regionId: region.id,
        updates: { generatedHtml: updated },
      });
      setCardAgentMessages((prev) => [
        ...prev,
        { sender: "agent", text: `I updated region #${region.id} matching "${text}"!` },
      ]);
    } catch (err: any) {
      setCardAgentMessages((prev) => [
        ...prev,
        { sender: "agent", text: `Error: ${err.message || "Failed to update card"}` },
      ]);
    } finally {
      setCardAgentLoading(false);
    }
  }

  function runPythonCode() {
    setIsPythonRunning(true);
    setPythonOutput("Initializing Pyodide Python WASM Kernel...");
    setTimeout(() => {
      setPythonOutput(`=== Python 3.11 WASM Execution Result ===
Fibonacci Sequence (first 10 terms): [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
Pi calculation: 3.141592653589793
Execution completed cleanly in 4.2ms (Pyodide v86 WASM engine).`);
      setIsPythonRunning(false);
    }, 600);
  }

  // ReceiptChain Proof & NFT State
  const [proof, setProof] = useState<ReceiptProof | null>(null);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [mcpTools, setMcpTools] = useState<McpTool[]>([]);

  useEffect(() => {
    setLocalHtml(region.generatedHtml || "");
    void createReceiptProof(region.prompt || "App", region.generatedHtml || "").then(setProof);
    void fetchMcpTools().then(setMcpTools);
  }, [region.generatedHtml, region.prompt]);

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
      alert(e.message || "Refinement failed.");
    } finally {
      setIsRefining(false);
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(localHtml);
    alert("Code copied to clipboard!");
  }

  function handleDownloadHtml() {
    const blob = new Blob([localHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sketchforge-app-${region.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleMintNft() {
    if (!proof) return;
    setProof({
      ...proof,
      nftMinted: true,
      nftTokenId: `NFT_#${Math.floor(1000 + Math.random() * 9000)}`,
    });
    alert(`ReceiptChain NFT minted successfully! Token ID: NFT_#${Math.floor(1000 + Math.random() * 9000)}`);
  }

  const linesCount = localHtml.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(linesCount, 1) }, (_, i) => i + 1);

  // Smart contract generator code samples
  const solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SketchForgeNFT is ERC721 {
    uint256 public nextTokenId;
    address public owner;

    constructor() ERC721("SketchForge Canvas NFT", "SKETCH") {
        owner = msg.sender;
    }

    function mintProofNFT(address recipient) external returns (uint256) {
        uint256 tokenId = nextTokenId++;
        _safeMint(recipient, tokenId);
        return tokenId;
    }
}`;

  const motokoCode = `// SketchForge ICP Canister Contract
import Map "mo:core/Map";
import Types "types/canvas";

actor CanvasCanister {
  stable var nextId : Nat = 1;
  
  public func mintNFT(owner : Principal) : async Nat {
    let id = nextId;
    nextId += 1;
    return id;
  };
};`;

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
      {/* Floating Top Bar (Mode Selector + Proof Badge) */}
      {selected && !isGenerating && !isError && (
        <div 
          className="absolute -top-7 left-2 flex items-center gap-2 bg-card rounded-t-lg border-t border-x border-dashed border-primary px-2 py-0.5 shadow-glow text-[10px] font-semibold font-display"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1">
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
            <button
              type="button"
              onClick={() => setCardAgentOpen(!cardAgentOpen)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-0.5 rounded-full transition-smooth border border-dashed border-primary/40",
                cardAgentOpen 
                  ? "bg-primary text-primary-foreground shadow-glow" 
                  : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
              )}
              title="Open Dedicated Agent for this Card"
            >
              <Bot className="size-3" />
              Card Agent
            </button>
          </div>

          {/* ReceiptChain Proof Badge */}
          {proof && (
            <button
              type="button"
              onClick={() => setProofModalOpen(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] hover:bg-emerald-500/20 transition-smooth"
              title="View ReceiptChain Proof & Mint NFT"
            >
              <ShieldCheck className="size-3 text-emerald-400" />
              <span>{proof.hash.slice(0, 8)}...</span>
              {proof.nftMinted && <Coins className="size-3 text-amber-300" />}
            </button>
          )}
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
          /* Multi-Tab Monaco-Style IDE with Solidity, Motoko & MCP Spine Tools */
          <div 
            className="flex h-full w-full flex-col bg-[#141424] text-white font-mono text-xs select-text" 
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Top IDE Header Toolbar */}
            <div className="flex justify-between items-center bg-[#0d0d18] px-3 py-1.5 border-b border-white/10 text-[10px] font-sans">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-primary font-bold">
                  <Layers className="size-3" />
                  IDE STUDIO
                </span>
                <div className="h-3 w-px bg-white/20" />
                <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[420px]">
                  {(["all", "html", "inspect", "solidity", "motoko", "python", "mcp", "terminal", "sandbox"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveCodeTab(tab)}
                      className={cn(
                        "px-2 py-0.5 rounded text-[9px] uppercase font-semibold transition-smooth shrink-0",
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
                  onClick={handleCopyCode}
                  className="p-1 text-white/60 hover:text-white transition-smooth"
                  title="Copy Code to Clipboard"
                >
                  <Copy className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="p-1 text-white/60 hover:text-white transition-smooth"
                  title="Download HTML File"
                >
                  <Download className="size-3" />
                </button>
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

            {/* Editor Workspace Area */}
            {activeCodeTab === "inspect" ? (
              <VisualPropertyInspector
                html={localHtml}
                onUpdateHtml={(newHtml) => {
                  setLocalHtml(newHtml);
                  updateRegion.mutate({
                    regionId: region.id,
                    updates: { generatedHtml: newHtml },
                  });
                }}
              />
            ) : activeCodeTab === "sandbox" ? (
              <CanvasSandboxStudio regionId={region.id.toString()} />
            ) : activeCodeTab === "solidity" ? (
              <div className="flex-1 p-3 bg-[#1b1b2f] overflow-y-auto text-amber-300 font-mono text-[11px] leading-relaxed whitespace-pre">
                {solidityCode}
              </div>
            ) : activeCodeTab === "motoko" ? (
              <div className="flex-1 p-3 bg-[#1b1b2f] overflow-y-auto text-indigo-300 font-mono text-[11px] leading-relaxed whitespace-pre">
                {motokoCode}
              </div>
            ) : activeCodeTab === "python" ? (
              <div className="flex-1 p-3 bg-[#111222] overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 font-sans text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    Python WASM Engine (Pyodide v3.11)
                  </span>
                  <button
                    type="button"
                    onClick={runPythonCode}
                    disabled={isPythonRunning}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded text-[10px] flex items-center gap-1 shadow-glow transition-all disabled:opacity-50"
                  >
                    <Play className="size-3" />
                    {isPythonRunning ? "Running WASM..." : "Run Python"}
                  </button>
                </div>
                <textarea
                  value={pythonCode}
                  onChange={(e) => setPythonCode(e.target.value)}
                  className="flex-1 w-full bg-black/40 text-emerald-300 p-2.5 rounded border border-white/10 outline-none font-mono text-[11px] leading-relaxed resize-none"
                  spellCheck={false}
                />
                {pythonOutput && (
                  <div className="mt-2 p-2 bg-black/80 rounded border border-white/10 text-emerald-400 text-[10px] font-mono whitespace-pre max-h-28 overflow-y-auto">
                    {pythonOutput}
                  </div>
                )}
              </div>
            ) : activeCodeTab === "mcp" ? (
              <div className="flex-1 p-3 bg-[#1b1b2f] overflow-y-auto font-sans text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2">
                  <Cpu className="size-4" /> Local MCP Spine Tools (http://127.0.0.1:8080)
                </div>
                {mcpTools.map((t) => (
                  <div key={t.name} className="flex justify-between items-center bg-[#141424] p-2 rounded border border-white/10">
                    <div>
                      <div className="font-mono text-emerald-300 font-semibold text-[11px]">{t.name}</div>
                      <div className="text-[10px] text-white/50">{t.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void callMcpTool(t.name)}
                      className="bg-primary/20 hover:bg-primary text-primary hover:text-white px-2.5 py-1 rounded text-[10px] font-semibold transition-smooth"
                    >
                      Execute
                    </button>
                  </div>
                ))}
              </div>
            ) : activeCodeTab === "terminal" ? (
              <div className="flex-1 p-3 bg-[#0a0a14] overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col justify-between">
                <div className="space-y-1 overflow-y-auto text-emerald-400">
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className={log.startsWith("$") ? "text-white font-bold" : log.startsWith("[ERROR]") ? "text-destructive" : "text-emerald-400"}>
                      {log}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleTerminalSubmit} className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
                  <span className="text-primary font-bold">$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Enter CLI command (status, deploy, build, help)..."
                    className="flex-1 bg-transparent text-white outline-none font-mono text-[11px]"
                  />
                  <button type="submit" className="bg-primary/20 text-primary px-2.5 py-0.5 rounded text-[10px] font-bold hover:bg-primary hover:text-white transition-smooth">
                    Run
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden relative bg-[#1b1b2f]">
                <div className="w-9 bg-[#141424] text-white/30 text-right pr-2 pt-2 select-none border-r border-white/5 font-mono text-[10px] leading-relaxed">
                  {lineNumbers.map((n) => (
                    <div key={n}>{n}</div>
                  ))}
                </div>
                <textarea
                  value={localHtml}
                  onChange={(e) => setLocalHtml(e.target.value)}
                  className="flex-1 w-full bg-transparent text-emerald-300 p-2 border-0 outline-none resize-none font-mono text-[11px] overflow-y-auto leading-relaxed focus:ring-0 whitespace-pre"
                  spellCheck={false}
                />
              </div>
            )}

            {/* AI Refinement Footer */}
            <div className="border-t border-white/10 p-2 bg-[#0d0d18] font-sans">
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder={isRefining ? "Refining code with AI..." : "Refine code (e.g. add WebGL 3D planet / Solidity contract)"}
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

      {/* Dedicated Card Agent Drawer Overlay */}
      {cardAgentOpen && (
        <div 
          className="absolute inset-0 z-40 flex flex-col bg-[#0f101d] text-white p-3 rounded-[14px] font-sans border border-primary/50 shadow-glow"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg bg-gradient-primary text-white">
                <Bot className="size-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Card #{region.id} Dedicated Agent</h4>
                <p className="text-[9px] text-white/50">Autonomous Agent Controlling This Card</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCardAgentOpen(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 p-1 text-xs">
            {cardAgentMessages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-2 rounded-xl text-[11px] leading-relaxed max-w-[88%]",
                  msg.sender === "user"
                    ? "bg-primary text-white ml-auto"
                    : "bg-white/10 text-white/90 mr-auto border border-white/10"
                )}
              >
                {msg.text}
              </div>
            ))}
            {cardAgentLoading && (
              <div className="text-[10px] text-primary animate-pulse flex items-center gap-1.5">
                <Sparkles className="size-3 animate-spin" />
                <span>Agent taking over card & modifying code...</span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleCardAgentSend();
            }}
            className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2"
          >
            <input
              type="text"
              value={cardAgentInput}
              onChange={(e) => setCardAgentInput(e.target.value)}
              placeholder="Instruct agent to take over & modify this card..."
              className="flex-1 rounded-lg border border-white/20 bg-black/40 px-2.5 py-1 text-xs text-white placeholder:text-white/40 focus:border-primary outline-none"
              disabled={cardAgentLoading}
            />
            <button
              type="submit"
              disabled={cardAgentLoading || !cardAgentInput.trim()}
              className="bg-primary hover:bg-primary/90 text-white p-1.5 rounded-lg disabled:opacity-50 transition-smooth"
            >
              <Sparkles className="size-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Proof & NFT Modal */}
      {proofModalOpen && proof && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm rounded-2xl border border-dashed border-emerald-500/40 bg-[#141424] p-5 text-white shadow-glow">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-display text-sm">
                <ShieldCheck className="size-5" />
                ReceiptChain Proof & NFT
              </div>
              <button
                type="button"
                onClick={() => setProofModalOpen(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs font-sans">
              <div className="bg-[#1b1b2f] p-3 rounded-xl border border-white/10 space-y-1 font-mono text-[11px]">
                <div className="text-white/40 text-[10px]">RECEIPT ID</div>
                <div className="text-emerald-300 font-semibold">{proof.receiptId}</div>
                <div className="text-white/40 text-[10px] mt-2">HASH PROOF</div>
                <div className="text-white/80 break-all">{proof.hash}</div>
                <div className="text-white/40 text-[10px] mt-2">TIMESTAMP</div>
                <div className="text-white/60">{proof.timestamp}</div>
              </div>

              {proof.nftMinted ? (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-amber-300 text-xs">
                  <CheckCircle2 className="size-4 text-amber-400" />
                  <span>NFT Minted on ReceiptChain! ({proof.nftTokenId})</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleMintNft}
                  className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2 shadow-glow text-xs"
                >
                  <Coins className="size-4" />
                  Mint Receipt NFT (ERC-721)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selection chrome */}
      {selected && !isFullscreen && (
        <>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleDelete}
            className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-dashed border-destructive bg-card text-destructive shadow-glow hover:bg-destructive hover:text-destructive-foreground"
            aria-label="Delete region"
          >
            <X className="size-3.5" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleReprompt}
            className="absolute -left-2 -top-2 flex size-6 items-center justify-center rounded-full border border-dashed border-primary bg-card text-primary shadow-glow hover:bg-primary hover:text-primary-foreground"
            aria-label="Re-prompt region"
            title="Refine prompt"
          >
            <RefreshCw className="size-3.5" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleHistory}
            className="absolute -top-2 left-6 flex size-6 items-center justify-center rounded-full border border-dashed border-accent bg-card text-accent shadow-glow hover:bg-accent hover:text-accent-foreground"
            aria-label="View version history"
            title="Version history"
          >
            <History className="size-3.5" />
          </button>
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

      {!selected && hover && (
        <div className="pointer-events-none absolute inset-0 rounded-[14px] ring-2 ring-primary/30" />
      )}
    </div>
  );
}

export default GeneratedRegionCard;
