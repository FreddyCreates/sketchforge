/**
 * SketchForge — Design Tokens, Project Maintenance, and Code Linting Engine.
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
}

export interface LintReport {
  score: number; // 0 - 100
  issues: string[];
  passedChecks: string[];
}

export const DEFAULT_DESIGN_TOKENS: DesignTokens = {
  primaryColor: "#6d28d9",
  backgroundColor: "#0f101d",
  fontFamily: "Inter, sans-serif",
  borderRadius: "12px",
  themeMode: "dark",
};

/**
 * Extract a single self-contained HTML page into a modular multi-file project package.
 */
export function extractModularProjectBundle(rawHtml: string, appName = "sketchforge-app"): ProjectBundle {
  const cssMatch = rawHtml.match(/<style[\s\S]*?>([\s\S]*?)<\/style>/i);
  const jsMatch = rawHtml.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi);

  let cssContent = cssMatch ? cssMatch[1].trim() : "/* Custom Styles */\nbody { margin: 0; font-family: sans-serif; }";
  let jsContent = "";
  if (jsMatch) {
    jsContent = jsMatch
      .map((s) => s.replace(/<\/?script[\s\S]*?>/gi, "").trim())
      .filter((s) => s.length > 0)
      .join("\n\n");
  }
  if (!jsContent) {
    jsContent = "// App Interactive Logic\nconsole.log('App loaded cleanly.');";
  }

  const cleanIndexHtml = rawHtml
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '<link rel="stylesheet" href="styles.css">')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace("</body>", '  <script src="app.js"></script>\n</body>');

  const readmeMd = `# ${appName}

Generated with **SketchForge Visual App Engine**.

## File Structure
- \`index.html\` - Main HTML DOM layout
- \`styles.css\` - Extracted CSS stylesheet
- \`app.js\` - Interactive JavaScript app logic
- \`package.json\` - Project metadata and dependencies

## Development
Open \`index.html\` in any web browser or serve via Vite / Live Server.
`;

  const packageJson = JSON.stringify(
    {
      name: appName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      version: "1.0.0",
      description: "Modular web application exported from SketchForge Canvas Studio",
      main: "index.html",
      scripts: {
        start: "npx serve .",
        build: "echo 'Static production build ready.'",
      },
      dependencies: {
        tailwindcss: "^3.4.0",
        three: "^0.160.0",
        "chart.js": "^4.4.0",
      },
    },
    null,
    2
  );

  return {
    "index.html": cleanIndexHtml,
    "styles.css": cssContent,
    "app.js": jsContent,
    "README.md": readmeMd,
    "package.json": packageJson,
  };
}

/**
 * Perform static linting & maintainability analysis on HTML code.
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
    issues.push("Missing <title> tag for accessibility and SEO");
    score -= 10;
  } else {
    passedChecks.push("Title tag present for SEO");
  }

  if (!html.includes("aria-") && !html.includes('role="')) {
    issues.push("Consider adding ARIA accessibility attributes to interactive elements");
    score -= 10;
  } else {
    passedChecks.push("ARIA accessibility attributes present");
  }

  if (html.length > 500) {
    passedChecks.push("Rich interface component density");
  }

  return {
    score: Math.max(0, score),
    issues,
    passedChecks,
  };
}
