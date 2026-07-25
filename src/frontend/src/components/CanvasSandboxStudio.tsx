import { useState } from "react";
import { Terminal, Shield, Box, Cpu, Play, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SandboxMode = "agent" | "bottle" | "minios";

interface CanvasSandboxStudioProps {
  regionId: string;
}

export function CanvasSandboxStudio({ regionId }: CanvasSandboxStudioProps) {
  const [mode, setMode] = useState<SandboxMode>("agent");

  // Agent Sandbox State (OpenShell / NemoClaw YAML Policy)
  const [yamlPolicy, setYamlPolicy] = useState(`version: "1.0"
name: sketchforge-agent-policy
egress:
  allowed_domains:
    - "*.googleapis.com"
    - "api.github.com"
    - "cdn.tailwindcss.com"
permissions:
  file_system: read_write
  wasm_execution: true
  max_memory_mb: 512`);
  const [agentStatus, setAgentStatus] = useState<"idle" | "running" | "denied">("idle");
  const [egressLogs, setEgressLogs] = useState<string[]>([
    "[ALLOW] GET https://generativelanguage.googleapis.com/v1beta (200 OK)",
    "[ALLOW] GET https://cdn.tailwindcss.com (200 OK)",
    "[DENY]  CONNECT raw.socket:443 (Blocked by OpenShell YAML policy)",
  ]);

  // App Bottle State (Single Container Program)
  const [bottleLogs, setBottleLogs] = useState<string[]>([
    "[BOTTLE init] Mounting rootfs container...",
    "[BOTTLE exec] /usr/local/bin/python3 app.py",
    "Starting FastAPI server on http://0.0.0.0:8000",
    "Uvicorn running on process ID 402 (press CTRL+C to quit)",
    "[200 OK] GET /health - 1.2ms",
  ]);
  const [bottleInput, setBottleInput] = useState("");

  // Mini OS State (Full WebAssembly x86 Linux)
  const [osLogs, setOsLogs] = useState<string[]>([
    "Linux sketchforge-os 6.1.0-v86 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux",
    "Booting minified Linux webassembly kernel...",
    "Systemd 252-2 initialized. Mount points ready.",
    "root@sketchforge-os:~# ",
  ]);
  const [osInput, setOsInput] = useState("");

  function runAgentPolicy() {
    setAgentStatus("running");
    setTimeout(() => {
      setAgentStatus("idle");
      setEgressLogs((prev) => [
        ...prev,
        `[NemoClaw] Policy re-evaluated at ${new Date().toLocaleTimeString()}: 3 allowed rules, 1 enforced block rule.`,
      ]);
    }, 800);
  }

  function handleBottleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bottleInput.trim()) return;
    const cmd = bottleInput.trim();
    setBottleLogs((prev) => [...prev, `$ ${cmd}`]);
    setBottleInput("");

    if (cmd === "status") {
      setBottleLogs((prev) => [...prev, "App Bottle PID 402: 12.4 MB RAM, 0.4% CPU"]);
    } else if (cmd === "restart") {
      setBottleLogs((prev) => [...prev, "[BOTTLE] Restarting app process inside container... OK"]);
    } else {
      setBottleLogs((prev) => [...prev, `Process output for '${cmd}'`]);
    }
  }

  function handleOsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!osInput.trim()) return;
    const cmd = osInput.trim();
    setOsLogs((prev) => [...prev, `root@sketchforge-os:~# ${cmd}`]);
    setOsInput("");

    if (cmd === "uname -a") {
      setOsLogs((prev) => [...prev, "Linux sketchforge-os 6.1.0-v86 x86_64 GNU/Linux"]);
    } else if (cmd === "ls" || cmd === "ls -la") {
      setOsLogs((prev) => [...prev, "drwxr-xr-x 2 root root 4096 Jan 1 00:00 app", "-rw-r--r-- 1 root root  240 Jan 1 00:00 config.json"]);
    } else if (cmd === "free -m") {
      setOsLogs((prev) => [...prev, "              total        used        free", "Mem:           1024         180         844"]);
    } else {
      setOsLogs((prev) => [...prev, `bash: ${cmd}: command executed`]);
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#0b0c16] text-white font-mono text-xs select-text">
      {/* Top Sandbox Mode Selector */}
      <div className="flex justify-between items-center bg-[#06070d] px-3 py-2 border-b border-white/10 text-[10px] font-sans">
        <div className="flex items-center gap-1.5 font-bold text-primary">
          <Cpu className="size-4" />
          SANDBOX ENGINE
        </div>

        <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setMode("agent")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[10px] transition-all",
              mode === "agent" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <Shield className="size-3" />
            Agent Sandbox
          </button>
          <button
            type="button"
            onClick={() => setMode("bottle")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[10px] transition-all",
              mode === "bottle" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <Box className="size-3" />
            App Bottle
          </button>
          <button
            type="button"
            onClick={() => setMode("minios")}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[10px] transition-all",
              mode === "minios" ? "bg-primary text-white shadow-glow" : "text-white/50 hover:text-white"
            )}
          >
            <Terminal className="size-3" />
            Mini OS (WASM)
          </button>
        </div>
      </div>

      {/* Mode 1: Agent Sandbox (OpenShell / NemoClaw + YAML Policy) */}
      {mode === "agent" && (
        <div className="flex flex-1 overflow-hidden p-3 gap-3">
          {/* YAML Policy Editor */}
          <div className="flex-1 flex flex-col bg-[#121324] rounded-xl border border-white/10 p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Shield className="size-3.5" /> OpenShell Policy Editor (YAML)
              </span>
              <button
                type="button"
                onClick={runAgentPolicy}
                disabled={agentStatus === "running"}
                className="bg-primary hover:bg-primary/90 text-white px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all shadow-glow disabled:opacity-50"
              >
                <Play className="size-3" />
                {agentStatus === "running" ? "Evaluating..." : "Apply Policy"}
              </button>
            </div>
            <textarea
              value={yamlPolicy}
              onChange={(e) => setYamlPolicy(e.target.value)}
              className="flex-1 w-full bg-black/40 text-emerald-300 p-2.5 rounded-lg border border-white/10 outline-none font-mono text-[11px] leading-relaxed resize-none"
              spellCheck={false}
            />
          </div>

          {/* Egress Console */}
          <div className="flex-1 flex flex-col bg-[#121324] rounded-xl border border-white/10 p-3">
            <div className="text-[11px] font-bold text-emerald-400 mb-2 flex items-center justify-between">
              <span>Network / Egress Security Console</span>
              <CheckCircle2 className="size-3.5 text-emerald-400" />
            </div>
            <div className="flex-1 bg-black/40 p-2.5 rounded-lg border border-white/10 overflow-y-auto space-y-1.5 text-[10px]">
              {egressLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-1.5 rounded font-mono",
                    log.includes("[ALLOW]")
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  )}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: App Bottle (Single Program Container) */}
      {mode === "bottle" && (
        <div className="flex-1 flex flex-col p-3 bg-[#0a0b14] overflow-hidden justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
              <Box className="size-3.5" /> Container App Bottle (Minified Linux Environment)
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              CONTAINER ACTIVE
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 text-emerald-400 text-[11px] p-2 bg-black/40 rounded-lg border border-white/10 font-mono">
            {bottleLogs.map((log, idx) => (
              <div key={idx} className={log.startsWith("$") ? "text-white font-bold" : "text-emerald-300"}>
                {log}
              </div>
            ))}
          </div>
          <form onSubmit={handleBottleSubmit} className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
            <span className="text-indigo-400 font-bold">$</span>
            <input
              type="text"
              value={bottleInput}
              onChange={(e) => setBottleInput(e.target.value)}
              placeholder="Send container command (status, restart, help)..."
              className="flex-1 bg-transparent text-white outline-none font-mono text-[11px]"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-0.5 rounded text-[10px] font-bold transition-all">
              Execute
            </button>
          </form>
        </div>
      )}

      {/* Mode 3: Mini OS (Full WebAssembly Linux) */}
      {mode === "minios" && (
        <div className="flex-1 flex flex-col p-3 bg-[#05050a] overflow-hidden justify-between">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <Terminal className="size-3.5" /> Mini OS — Full x86 Linux in WebAssembly (v86 Kernel)
            </span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              BOOTED (v86 WASM)
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 text-emerald-300 text-[11px] p-2.5 bg-black/60 rounded-lg border border-white/10 font-mono">
            {osLogs.map((log, idx) => (
              <div key={idx} className={log.startsWith("root@") ? "text-white font-bold" : "text-emerald-400"}>
                {log}
              </div>
            ))}
          </div>
          <form onSubmit={handleOsSubmit} className="mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
            <span className="text-amber-400 font-bold">root@sketchforge-os:~#</span>
            <input
              type="text"
              value={osInput}
              onChange={(e) => setOsInput(e.target.value)}
              placeholder="Type Linux shell command (uname -a, ls, free -m)..."
              className="flex-1 bg-transparent text-white outline-none font-mono text-[11px]"
            />
            <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-0.5 rounded text-[10px] font-bold transition-all">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default CanvasSandboxStudio;
