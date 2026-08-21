/**
 * SketchForge — Executable Production Workflows Library.
 */

export interface ExecutableWorkflow {
  id: string;
  title: string;
  category: "Option 1: In-Browser WASM" | "Option 2: Process Bridge" | "Option 3: Visual AI & Export";
  description: string;
  iconName: string;
  codeTab: "python" | "solidity" | "terminal" | "inspect" | "all";
  initialCode: string;
  initialPrompt: string;
}

export const PRODUCTION_WORKFLOWS: ExecutableWorkflow[] = [
  // OPTION 1 WORKFLOWS
  {
    id: "wf_py_data_science",
    title: "🐍 Python WASM Data Analytics & Matrix Math",
    category: "Option 1: In-Browser WASM",
    description: "Executes Python 3.11 WASM in Pyodide calculating matrix operations, statistical summaries, and array transformations.",
    iconName: "FileCode",
    codeTab: "python",
    initialCode: `# Python 3.11 WASM Data Analytics Pipeline
import math

data = [12, 45, 67, 89, 34, 23, 90, 54, 78, 99]
mean = sum(data) / len(data)
variance = sum((x - mean) ** 2 for x in data) / len(data)
std_dev = math.sqrt(variance)

print("=== SKETCHFORGE PYTHON WASM DATA PIPELINE ===")
print(f"Dataset Count: {len(data)}")
print(f"Calculated Mean: {mean:.2f}")
print(f"Variance: {variance:.2f}")
print(f"Standard Deviation: {std_dev:.2f}")
print("Status: 100% Pyodide WebAssembly Execution Clean")
`,
    initialPrompt: "Python WASM Matrix Data Analytics Pipeline",
  },
  {
    id: "wf_solidity_nft",
    title: "📜 OpenZeppelin ERC-721 NFT Smart Contract",
    category: "Option 1: In-Browser WASM",
    description: "Compiles Solidity smart contract code in browser, outputting real EVM Bytecode and ABI contract function signatures.",
    iconName: "Coins",
    codeTab: "solidity",
    initialCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SketchForgeNFT {
    string public name = "SketchForge Canvas Artifact";
    string public symbol = "FORGE";
    address public owner;
    uint256 public totalSupply;

    mapping(uint256 => address) public tokenOwner;

    event Mint(address indexed to, uint256 indexed tokenId);

    constructor() {
        owner = msg.sender;
    }

    function mint(address to) external returns (uint256) {
        totalSupply += 1;
        uint256 newTokenId = totalSupply;
        tokenOwner[newTokenId] = to;
        emit Mint(to, newTokenId);
        return newTokenId;
    }
}
`,
    initialPrompt: "ERC-721 NFT Smart Contract with ABI Compilation",
  },

  // OPTION 2 WORKFLOWS
  {
    id: "wf_wsl_container",
    title: "🐧 WSL Linux Shell & System Audit",
    category: "Option 2: Process Bridge",
    description: "Executes real Linux commands inside Windows Subsystem for Linux (wsl.exe) via local bridge server on port 8080.",
    iconName: "Terminal",
    codeTab: "terminal",
    initialCode: "wsl --exec uname -a",
    initialPrompt: "WSL Linux Kernel & Environment Relay",
  },
  {
    id: "wf_icp_dfx",
    title: "⚡ Internet Computer Canister Deployment",
    category: "Option 2: Process Bridge",
    description: "Executes real DFX CLI commands (dfx ping, dfx canister status) via host process bridge server.",
    iconName: "Cpu",
    codeTab: "terminal",
    initialCode: "dfx --version",
    initialPrompt: "ICP Canister DFX Build Pipeline",
  },
  {
    id: "wf_git_repo_audit",
    title: "🐙 Git Version Control & Workspace Audit",
    category: "Option 2: Process Bridge",
    description: "Executes real Git status and log history queries on local workspace repository.",
    iconName: "GitBranch",
    codeTab: "terminal",
    initialCode: "git status",
    initialPrompt: "Git Workspace Audit Trail Workflow",
  },

  // OPTION 3 WORKFLOWS
  {
    id: "wf_wireframe_to_saas",
    title: "🎨 Hand-Drawn Wireframe to Tailwind SaaS Hero",
    category: "Option 3: Visual AI & Export",
    description: "Converts visual canvas vector strokes into a responsive Tailwind CSS glassmorphic SaaS landing page.",
    iconName: "Sparkles",
    codeTab: "all",
    initialCode: "",
    initialPrompt: "Build a responsive glassmorphic dark theme SaaS Hero section with CTA buttons and features grid.",
  },
  {
    id: "wf_bem_theme_editor",
    title: "🎛️ BEM CSS Custom Property Theme Inspector",
    category: "Option 3: Visual AI & Export",
    description: "Inspects and updates CSS custom properties (--sf-primary, --sf-radius) with real-time DOM styling overrides.",
    iconName: "Sliders",
    codeTab: "inspect",
    initialCode: "",
    initialPrompt: "BEM CSS Custom Properties Theme System",
  },
  {
    id: "wf_multifile_zip_export",
    title: "📦 Multi-File Project Package Exporter",
    category: "Option 3: Visual AI & Export",
    description: "Extracts single-file HTML apps into structured index.html, styles.css, app.js, README.md, and package.json.",
    iconName: "Download",
    codeTab: "inspect",
    initialCode: "",
    initialPrompt: "Modular Multi-File Codebase Exporter",
  },
];
