/**
 * SketchForge — Local Node.js Terminal & Process Execution Bridge.
 * Runs on http://127.0.0.1:8080 (or PORT env).
 * Spawns real local system processes (wsl, dfx, node, python, git)
 * and streams stdout/stderr to SketchForge frontend canvas cards.
 */

const http = require("http");
const { exec } = require("child_process");

const PORT = process.env.PORT || 8080;

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || "/";

  // Health Check
  if (req.method === "GET" && url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        server: "SketchForge Terminal Bridge",
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
      })
    );
    return;
  }

  // List Local Tools
  if (req.method === "GET" && url === "/v1/tools") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        tools: [
          { name: "wsl_exec", description: "Execute native command inside Windows Subsystem for Linux (wsl.exe)" },
          { name: "dfx_exec", description: "Execute Internet Computer DFX CLI command (dfx)" },
          { name: "node_exec", description: "Execute Node.js script or command" },
          { name: "python_exec", description: "Execute local Python 3 interpreter script" },
          { name: "git_status", description: "Query workspace Git repository status" },
        ],
      })
    );
    return;
  }

  // Execute Real CLI Command
  if (req.method === "POST" && (url === "/v1/exec" || url === "/v1/call")) {
    try {
      const body = await parseJsonBody(req);
      const command = body.command || body.arguments?.command || "node -v";
      const toolName = body.tool;

      let fullCommand = command;
      if (toolName === "wsl_exec") {
        fullCommand = `wsl -- ${command}`;
      } else if (toolName === "dfx_exec") {
        fullCommand = `dfx ${command}`;
      }

      console.log(`[Bridge Server] Executing real command: "${fullCommand}"`);

      exec(fullCommand, { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: !error,
            command: fullCommand,
            stdout: stdout || "",
            stderr: stderr || (error ? error.message : ""),
            exitCode: error ? error.code || 1 : 0,
          })
        );
      });
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Endpoint not found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`=======================================================`);
  console.log(`🚀 SketchForge Real Process Bridge Server active!`);
  console.log(`URL: http://127.0.0.1:${PORT}`);
  console.log(`Health: http://127.0.0.1:${PORT}/health`);
  console.log(`=======================================================`);
});
