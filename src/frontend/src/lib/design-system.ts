/**
 * SketchForge — Design System, BEM CSS, Package Export, & Visual Diff Engine.
 */

export interface DesignTokens {
  primaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  borderRadius: string;
  themeMode: "dark" | "light" | "glassmorphic";
}

export interface ProjectBundle {
  "index.html": string;
  "styles.css": string;
  "app.js": string;
  "README.md": string;
  "package.json": string;
  "assets/": Record<string, string>;
}

export interface LintReport {
  score: number;
  issues: string[];
  passedChecks: string[];
}

export interface CodeDiffLine {
  type: "added" | "removed" | "unchanged";
  text: string;
  lineNumberOld?: number;
  lineNumberNew?: number;
}

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  primaryColor: "#6d28d9",
  backgroundColor: "#0f101d",
  fontFamily: "Inter, sans-serif",
  borderRadius: "12px",
  themeMode: "dark",
};

/**
 * Convert raw vector strokes into structural wireframe layout hints for Gemini.
 */
export function convertStrokesToLayoutPrompt(strokesCount: number): string {
  if (strokesCount === 0) return "Clean digital app card";
  if (strokesCount < 5) return "Simple card layout with headline and CTA button";
  if (strokesCount < 15) return "Structured dashboard grid with navigation sidebar, hero card, and data chart";
  return "Complex multi-region WebGL 3D application canvas with sidebar dock and interactive panels";
}

/**
 * Generate a clean CSS custom properties + BEM-ish stylesheet.
 */
export function generateBemCss(tokens: DesignTokens = DEFAULT_DESIGN_TOKENS): string {
  return `@layer base, components, utilities;

@layer base {
  :root {
    --sf-primary: ${tokens.primaryColor};
    --sf-[#0f101d]: ${tokens.backgroundColor};
    --sf-font-base: ${tokens.fontFamily};
    --sf-radius-lg: ${tokens.borderRadius};
    --sf-shadow-glow: 0 0 20px rgba(109, 40, 217, 0.35);
  }

  body {
    margin: 0;
    padding: 0;
    font-family: var(--sf-font-base);
    background-color: var(--sf-[#0f101d]);
    color: #ffffff;
    -webkit-font-smoothing: antialiased;
  }
}

@layer components {
  .sf-card {
    background: rgba(20, 21, 40, 0.75);
    backdrop-filter: blur(12px);
    border: 1px border-dashed rgba(255, 255, 255, 0.15);
    border-radius: var(--sf-radius-lg);
    box-shadow: var(--sf-shadow-glow);
    padding: 1.5rem;
  }

  .sf-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .sf-card__title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--sf-primary);
  }

  .sf-card__button--primary {
    background-color: var(--sf-primary);
    color: #ffffff;
    padding: 0.5rem 1rem;
    border-radius: calc(var(--sf-radius-lg) - 4px);
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .sf-card__button--primary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
}
`;
}

/**
 * Extract a single self-contained HTML page into a modular BEM + custom properties multi-file project package.
 */
export function extractModularProjectBundle(rawHtml: string, appName = "sketchforge-app"): ProjectBundle {
  const cssMatch = rawHtml.match(/<style[\s\S]*?>([\s\S]*?)<\/style>/i);
  const jsMatch = rawHtml.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);

  let cssContent = cssMatch ? cssMatch[1].trim() : generateBemCss();
  if (!cssContent.includes("--sf-primary")) {
    cssContent = `${generateBemCss()}\n\n/* Embedded Styles */\n${cssContent}`;
  }

  let jsContent = "";
  if (jsMatch) {
    jsContent = jsMatch
      .map((s) => s.replace(/<\/?script[\s\S]*?>/gi, "").trim())
      .filter((s) => s.length > 0)
      .join("\n\n");
  }
  if (!jsContent) {
    jsContent = "// App Interactive Logic\nconsole.log('App loaded cleanly in SketchForge Engine.');";
  }

  const cleanIndexHtml = rawHtml
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '<link rel="stylesheet" href="styles.css">')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace("</body>", '  <script src="app.js"></script>\n</body>');

  return {
    "index.html": cleanIndexHtml,
    "styles.css": cssContent,
    "app.js": jsContent,
    "README.md": `# ${appName}\n\nExported from **SketchForge Canvas Studio**.\n\n## Structure\n- \`index.html\`\n- \`styles.css\` (BEM + CSS Custom Properties)\n- \`app.js\`\n- \`assets/\`\n`,
    "package.json": JSON.stringify(
      {
        name: appName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        version: "1.0.0",
        main: "index.html",
        scripts: { start: "npx serve ." },
      },
      null,
      2
    ),
    "assets/": {
      "favicon.ico": "base64-placeholder",
    },
  };
}

/**
 * Bidirectional import of edited package bundle (`POST /builder/maintain/import`).
 */
export function importProjectPackage(bundleJsonStr: string): string {
  try {
    const parsed = JSON.parse(bundleJsonStr);
    let html = parsed["index.html"] || parsed.html || "";
    const css = parsed["styles.css"] || parsed.css || "";
    const js = parsed["app.js"] || parsed.js || "";

    if (css && !html.includes("<style>")) {
      html = html.replace("</head>", `<style>\n${css}\n</style>\n</head>`);
    }
    if (js && !html.includes("<script>")) {
      html = html.replace("</body>", `<script>\n${js}\n</script>\n</body>`);
    }
    return html;
  } catch {
    throw new Error("Invalid project package bundle format.");
  }
}

/**
 * Compute line-by-line visual code diff.
 */
export function calculateCodeDiff(oldCode: string, newCode: string): CodeDiffLine[] {
  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const diffLines: CodeDiffLine[] = [];

  let i = 0;
  let j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      diffLines.push({ type: "unchanged", text: oldLines[i], lineNumberOld: i + 1, lineNumberNew: j + 1 });
      i++;
      j++;
    } else if (j < newLines.length && (!oldLines.includes(newLines[j]) || i >= oldLines.length)) {
      diffLines.push({ type: "added", text: newLines[j], lineNumberNew: j + 1 });
      j++;
    } else if (i < oldLines.length) {
      diffLines.push({ type: "removed", text: oldLines[i], lineNumberOld: i + 1 });
      i++;
    }
  }

  return diffLines;
}

/**
 * Static linting & maintainability analysis on HTML code.
 */
export function lintHtmlCode(html: string): LintReport {
  const issues: string[] = [];
  const passedChecks: string[] = [];
  let score = 100;

  if (!html.includes("<!DOCTYPE html>") && !html.includes("<!doctype html>")) {
    issues.push("Missing <!DOCTYPE html> declaration");
    score -= 10;
  } else {
    passedChecks.push("Valid DOCTYPE declaration");
  }

  if (!html.includes('viewport"')) {
    issues.push("Missing responsive viewport meta tag");
    score -= 15;
  } else {
    passedChecks.push("Responsive viewport meta tag present");
  }

  if (!html.includes("<title>")) {
    issues.push("Missing <title> tag for accessibility");
    score -= 10;
  } else {
    passedChecks.push("Title tag present for SEO");
  }

  return {
    score: Math.max(0, score),
    issues,
    passedChecks,
  };
}
