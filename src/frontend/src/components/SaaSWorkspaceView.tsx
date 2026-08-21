import { useState, useEffect } from "react";
import { Sparkles, Terminal, Code, Sliders, ShieldCheck, Download, Layers, Cpu, Key, Activity, CreditCard, Check, Zap, ArrowUpRight } from "lucide-react";
import { getAuditLogs, getSystemTelemetry, type AuditEvent } from "@/lib/telemetry";
import { PRODUCTION_WORKFLOWS } from "@/lib/workflow-presets";
import { cn } from "@/lib/utils";

export function SaasWorkspaceView() {
  const [activeTab, setActiveTab] = useState<"workflows" | "telemetry" | "apikeys" | "billing">("workflows");
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [telemetry, setTelemetry] = useState(getSystemTelemetry(4));
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [bridgeUrlInput, setBridgeUrlInput] = useState("http://127.0.0.1:8080");

  useEffect(() => {
    setAuditLogs(getAuditLogs());
    const interval = setInterval(() => {
      setAuditLogs(getAuditLogs());
      setTelemetry(getSystemTelemetry(4));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-[#070812] text-white font-sans text-xs select-text overflow-y-auto">
      {/* SaaS Sub-Header Navigation */}
      <div className="flex justify-between items-center bg-[#0d0e1b] px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-amber-400" />
          <span className="font-bold text-sm text-white font-display">SKETCHFORGE SAAS PLATFORM STUDIO</span>
        </div>

        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("workflows")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-all",
              activeTab === "workflows" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <Sparkles className="size-3.5" />
            Workflows Hub
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("telemetry")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-all",
              activeTab === "telemetry" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <Activity className="size-3.5" />
            Telemetry & Audit Logs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("apikeys")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-all",
              activeTab === "apikeys" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <Key className="size-3.5" />
            API & Bridge Config
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("billing")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-all",
              activeTab === "billing" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <CreditCard className="size-3.5" />
            Enterprise Billing
          </button>
        </div>
      </div>

      {/* Main SaaS Workspace Content */}
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Tab 1: Workflows Hub */}
        {activeTab === "workflows" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Production Executable Workflows</h2>
                <p className="text-xs text-white/50">Options 1, 2, and 3 integrated execution pipelines</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRODUCTION_WORKFLOWS.map((wf) => (
                <div key={wf.id} className="bg-[#121326] p-4 rounded-xl border border-white/10 space-y-3 hover:border-primary/50 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 font-semibold">
                      {wf.category.split(":")[0]}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">Tab: {wf.codeTab.toUpperCase()}</span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{wf.title}</h4>
                  <p className="text-[11px] text-white/60 leading-relaxed">{wf.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Telemetry & Audit Logs */}
        {activeTab === "telemetry" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#121326] p-4 rounded-xl border border-white/10">
                <div className="text-white/50 text-xs font-semibold">SYSTEM FPS</div>
                <div className="text-2xl font-black font-display text-emerald-400">{telemetry.fps} FPS</div>
              </div>
              <div className="bg-[#121326] p-4 rounded-xl border border-white/10">
                <div className="text-white/50 text-xs font-semibold">CANVAS MEMORY</div>
                <div className="text-2xl font-black font-display text-indigo-400">{telemetry.canvasMemoryMb.toFixed(1)} MB</div>
              </div>
              <div className="bg-[#121326] p-4 rounded-xl border border-white/10">
                <div className="text-white/50 text-xs font-semibold">ACTIVE CARDS</div>
                <div className="text-2xl font-black font-display text-amber-400">{telemetry.activeNodesCount} Nodes</div>
              </div>
              <div className="bg-[#121326] p-4 rounded-xl border border-white/10">
                <div className="text-white/50 text-xs font-semibold">AI LATENCY AVG</div>
                <div className="text-2xl font-black font-display text-violet-400">{telemetry.aiLatencyAvgMs} ms</div>
              </div>
            </div>

            <div className="bg-[#121326] p-4 rounded-xl border border-white/10 space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" /> Enterprise Audit Log Stream
              </h3>
              <div className="max-h-72 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <div className="text-white/40 p-2 text-center">No audit events logged yet. Operations will record here.</div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-2 rounded bg-black/40 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-white/40">{log.timestamp.split("T")[1].slice(0, 8)}</span>
                        <span className="px-2 py-0.5 rounded bg-white/10 text-emerald-300 font-bold text-[10px]">{log.eventType}</span>
                        <span className="text-white/80">{log.details}</span>
                      </div>
                      <span className="text-white/40 text-[10px]">{log.actor}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: API & Bridge Config */}
        {activeTab === "apikeys" && (
          <div className="bg-[#121326] p-5 rounded-xl border border-white/10 space-y-4 max-w-xl">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Key className="size-4 text-primary" /> API Keys & Process Bridge Settings
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-white/60 block mb-1 font-semibold">Gemini 2.5 API Key Override</label>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-black/40 border border-white/20 rounded p-2 text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-white/60 block mb-1 font-semibold">Local Node.js Process Bridge Endpoint</label>
                <input
                  type="text"
                  value={bridgeUrlInput}
                  onChange={(e) => setBridgeUrlInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 rounded p-2 text-emerald-300 font-mono outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => alert("API Keys & Bridge Settings saved cleanly!")}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-lg shadow-glow transition-all"
              >
                Save SaaS Configuration
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Enterprise Billing */}
        {activeTab === "billing" && (
          <div className="space-y-4">
            <div className="text-center space-y-1 mb-6">
              <h2 className="text-2xl font-black font-display text-white">SaaS Enterprise Pricing Plans</h2>
              <p className="text-xs text-white/50">Scale your AI visual app building with dedicated execution workers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Tier */}
              <div className="bg-[#121326] p-6 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-base">Developer Free</h3>
                  <div className="text-3xl font-black font-display text-white">$0 <span className="text-xs text-white/40 font-normal">/ month</span></div>
                  <ul className="space-y-2 text-xs text-white/70 pt-3">
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Unlimited Canvas Drawing</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Gemini 2.5 Flash Generation</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Local Host Bridge Integration</li>
                  </ul>
                </div>
                <button type="button" className="w-full bg-white/10 text-white font-semibold py-2 rounded-xl text-xs">Current Active Plan</button>
              </div>

              {/* Pro Studio Tier */}
              <div className="bg-gradient-to-b from-[#1b1c3a] to-[#121326] p-6 rounded-2xl border-2 border-primary shadow-glow space-y-4 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-3 right-3 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">POPULAR</div>
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-base">Pro Studio</h3>
                  <div className="text-3xl font-black font-display text-primary">$29 <span className="text-xs text-white/40 font-normal">/ month</span></div>
                  <ul className="space-y-2 text-xs text-white/70 pt-3">
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Everything in Developer Free</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Pyodide Python 3.11 WASM Engine</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> 1-Click Multi-File ZIP Exporter</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Multi-Node LLM Refactoring</li>
                  </ul>
                </div>
                <button type="button" onClick={() => alert("Upgraded to Pro Studio Plan!")} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2 rounded-xl text-xs shadow-glow">Upgrade to Pro Studio</button>
              </div>

              {/* Enterprise Swarm Tier */}
              <div className="bg-[#121326] p-6 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-base">Enterprise Swarm</h3>
                  <div className="text-3xl font-black font-display text-amber-400">$99 <span className="text-xs text-white/40 font-normal">/ month</span></div>
                  <ul className="space-y-2 text-xs text-white/70 pt-3">
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Everything in Pro Studio</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Autonomous Agent Canvas Swarms</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Dedicated Host Process Bridge Cluster</li>
                    <li className="flex items-center gap-2"><Check className="size-3.5 text-emerald-400" /> Custom BEM Design Tokens Sync</li>
                  </ul>
                </div>
                <button type="button" onClick={() => alert("Contacting Enterprise Sales...")} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs">Contact Sales</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SaasWorkspaceView;
