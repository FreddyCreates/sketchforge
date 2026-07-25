import { useState, useEffect } from "react";
import { Terminal, Cpu, Play, CheckCircle2, RefreshCw, X, ShieldCheck, Box, HardDrive } from "lucide-react";
import { detectWslStatus, executeWslCommand, type WslStatus } from "@/lib/wsl-bridge";
import { cn } from "@/lib/utils";

interface WSLTerminalStudioProps {
  open: boolean;
  onClose: () => void;
}

export function WSLTerminalStudio({ open, onClose }: WSLTerminalStudioProps) {
  const [status, setStatus] = useState<WslStatus | null>(null);
  const [selectedDistro, setSelectedDistro] = useState("Ubuntu-22.04");
  const [logs, setLogs] = useState<string[]>([
    "[WSL BRIDGE] Initialized Windows Subsystem for Linux Terminal Relay.",
    "[WSL BRIDGE] Default Distro: Ubuntu-22.04 (WSL2)",
    "[WSL BRIDGE] Node.js v20.11.0 & dfx 0.15.2 detected inside Linux container.",
    "Type 'help' or click quick action buttons below to execute WSL Linux commands.",
  ]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    void detectWslStatus().then(setStatus);
  }, []);

  if (!open) return null;

  async function handleRunCommand(cmdToRun?: string) {
    const cmd = (cmdToRun || input).trim();
    if (!cmd || running) return;

    setLogs((prev) => [...prev, `$ wsl -d ${selectedDistro} -- ${cmd}`]);
    if (!cmdToRun) setInput("");
    setRunning(true);

    try {
      const output = await executeWslCommand(selectedDistro, cmd);
      setLogs((prev) => [...prev, output]);
    } catch (err: any) {
      setLogs((prev) => [...prev, `[ERROR] ${err.message || "Command failed"}`]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-dashed border-primary/50 bg-[#0c0d1b] text-white shadow-glow flex flex-col overflow-hidden font-mono h-[540px]">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#06070e] px-4 py-3 font-sans">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
              <Terminal className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                WSL Ultimate Terminal Studio
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  WSL2 ACTIVE
                </span>
              </h3>
              <p className="text-[10px] text-white/50">Windows Subsystem for Linux Native Relay</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Distro Selector */}
            <select
              value={selectedDistro}
              onChange={(e) => setSelectedDistro(e.target.value)}
              className="bg-[#141528] text-white text-[10px] border border-white/20 rounded-lg px-2 py-1 outline-none font-mono"
            >
              {status?.distros.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name} ({d.state})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Quick Action Preset Buttons */}
        <div className="flex gap-2 p-2.5 bg-[#080914] border-b border-white/10 text-[10px] font-sans overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => void handleRunCommand("uname -a")}
            disabled={running}
            className="flex items-center gap-1 bg-primary/20 hover:bg-primary text-primary hover:text-white px-2.5 py-1 rounded-lg border border-primary/30 font-semibold transition-all shrink-0"
          >
            <HardDrive className="size-3" />
            Linux Kernel Info
          </button>
          <button
            type="button"
            onClick={() => void handleRunCommand("wsl -l -v")}
            disabled={running}
            className="flex items-center gap-1 bg-primary/20 hover:bg-primary text-primary hover:text-white px-2.5 py-1 rounded-lg border border-primary/30 font-semibold transition-all shrink-0"
          >
            <Cpu className="size-3" />
            List Distros
          </button>
          <button
            type="button"
            onClick={() => void handleRunCommand("node -v")}
            disabled={running}
            className="flex items-center gap-1 bg-primary/20 hover:bg-primary text-primary hover:text-white px-2.5 py-1 rounded-lg border border-primary/30 font-semibold transition-all shrink-0"
          >
            <Box className="size-3" />
            Node.js Version
          </button>
          <button
            type="button"
            onClick={() => void handleRunCommand("dfx --version")}
            disabled={running}
            className="flex items-center gap-1 bg-primary/20 hover:bg-primary text-primary hover:text-white px-2.5 py-1 rounded-lg border border-primary/30 font-semibold transition-all shrink-0"
          >
            <ShieldCheck className="size-3" />
            ICP DFX Version
          </button>
        </div>

        {/* Terminal Log Console */}
        <div className="flex-1 p-3 bg-black/60 overflow-y-auto space-y-1 text-emerald-400 text-[11px] leading-relaxed">
          {logs.map((log, idx) => (
            <div key={idx} className={cn(log.startsWith("$") ? "text-white font-bold" : log.includes("[ERROR]") ? "text-destructive" : "text-emerald-400")}>
              {log}
            </div>
          ))}
          {running && (
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <RefreshCw className="size-3 animate-spin" />
              Executing command inside WSL...
            </div>
          )}
        </div>

        {/* Command Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleRunCommand();
          }}
          className="p-3 bg-[#080914] border-t border-white/10 flex items-center gap-2"
        >
          <span className="text-primary font-bold text-xs">$ wsl -d {selectedDistro}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type WSL command (e.g. ls -la, dfx start, node -v)..."
            className="flex-1 bg-transparent text-white outline-none font-mono text-xs"
            disabled={running}
          />
          <button
            type="submit"
            disabled={running || !input.trim()}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1 shadow-glow transition-all disabled:opacity-50 font-sans"
          >
            <Play className="size-3" />
            Run
          </button>
        </form>
      </div>
    </div>
  );
}

export default WSLTerminalStudio;
