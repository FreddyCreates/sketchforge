# Design Brief

## Direction

SketchForge — a hand-drawn, sketchy web canvas where freehand strokes and circled regions become live AI-generated UI, now with real-time multi-user presence, a template library, version history, and one-click HTML export.

## Tone

Drafting-table informality: rough hand-drawn borders on canvas content, crisp pill-shaped chrome, glowing blue-purple accent for AI actions — collaboration surfaces inherit the sketchy language so live cursors and panels feel hand-drawn, not corporate.

## Differentiation

Live collaborator cursors float over the sketch with hand-drawn dashed labels pulsing in each user's presence hue, while slide-in panels for templates and version history keep the same dashed-border, offset-shadow sketch aesthetic as the canvas itself.

## Color Palette

| Token        | OKLCH         | Role                                    |
| ------------ | ------------- | --------------------------------------- |
| background   | 0.99 0.003 95 | warm off-white canvas paper             |
| foreground   | 0.18 0.01 280 | ink-black strokes and text              |
| card         | 1.0 0 0       | pure white elevated surfaces            |
| primary      | 0.62 0.22 285 | glowing blue-purple, AI + active states |
| accent       | 0.7 0.17 45   | warm orange for drawn containers        |
| muted        | 0.95 0.004 280| soft gray secondary surfaces            |
| border       | 0.86 0.008 280| ink-tinted hairline borders             |
| sketch-ink   | 0.2 0.01 280  | hand-drawn stroke color                 |
| sketch-paper | 0.97 0.006 90 | canvas drawing surface                  |
| presence-1   | 0.62 0.22 285 | collaborator hue — blue-purple          |
| presence-2   | 0.7 0.17 45   | collaborator hue — warm orange          |
| presence-3   | 0.6 0.16 150  | collaborator hue — green                |
| presence-4   | 0.55 0.2 350  | collaborator hue — magenta              |
| presence-5   | 0.7 0.15 195  | collaborator hue — cyan                 |
| panel-overlay| 0.18 0.01 280 | slide-in drawer scrim                   |

## Typography

- Display: Space Grotesk — project name, tab labels, panel headings, template names
- Body: DM Sans — UI labels, buttons, version excerpts, cursor labels
- Mono: JetBrains Mono — prompt input, code snippets, version timestamps
- Scale: hero `text-3xl font-bold tracking-tight`, h2 `text-xl font-semibold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm`

## Elevation & Depth

Flat ink-on-paper base; cards float with a hard offset "sketch shadow" (`shadow-sketch`); the AI Generate button alone carries a colored glow (`shadow-glow`) that breathes during generation; slide-in panels overlay a blurred `panel-overlay` scrim above the canvas.

## Structural Zones

| Zone              | Background                  | Border                  | Notes                                          |
| ----------------- | --------------------------- | ----------------------- | ---------------------------------------------- |
| Header            | `bg-card`                   | `border-b` ink hairline | project name + avatar roster + export pill     |
| Tab bar           | `bg-card`                   | `border-b`              | pill tabs, active = primary tint               |
| Toolbar           | `bg-card` / left rail       | `border-r`              | pen/eraser/circle/comment + templates trigger  |
| Canvas            | `bg-paper` (sketch-paper)   | none (infinite)         | strokes + generated regions + live cursors     |
| Template panel    | `bg-card` slide-in left     | `sketch-border`         | search + grid of `template-card`s with tags    |
| Version panel     | `bg-card` drawer on region  | `sketch-border`         | newest-first `version-row`s + restore          |
| Footer            | `bg-muted/40`               | `border-t`              | status hints, zoom controls                    |

## Spacing & Rhythm

Spacious drafting layout: 16px base gaps, 24px section padding, 8px micro-spacing in toolbars; panels are 360px wide with 16px internal padding; canvas fills remaining space edge-to-edge.

## Component Patterns

- Buttons: pill-shaped (`rounded-full`), primary = blue-purple gradient + glow, secondary = ink outline on white, accent = warm orange for sketch actions
- Cards / regions: `sketch-border` (dashed ink) + `shadow-sketch` offset; generated regions get a subtle primary-tinted ring when selected
- Tabs: pill-shaped, active tab gets `bg-secondary` + primary text; add-tab button is a dashed ink circle
- Comments: numbered pin (primary fill, white number) + `sketch-border` popover card
- Lasso: dashed ink stroke with `animate-lasso-march` marching ants while drawing
- Avatar chips: `.avatar-chip` color-coded circle per collaborator (presence hue), `.avatar-online` green ring for active users; clustered in header roster
- Live cursors: `.cursor-arrow` tinted arrowhead + `.cursor-label` dashed pill showing name + active tool, pulsing via `animate-cursor-pulse`
- Template cards: `.template-card` dashed border + offset shadow, hover lifts and tints primary; `.template-tag` uppercase pill for category
- Version rows: `.version-row` dashed border, `.version-preview` thumbnail of prior HTML, restore action on hover
- Export pill: `.export-pill` secondary outline button with download icon, hover tints primary; no glow (clean chrome)

## Motion

- Entrance: strokes and regions fade-draw in (`animate-sketch-draw`, 0.6s); panels slide in (`animate-panel-slide-left` / `animate-panel-slide-right`, 0.28s)
- Thinking: pill pulses (`animate-thinking-pulse`) with three bouncing dots (`animate-thinking-dot` staggered)
- Hover: tool buttons lift via `shadow-sketch-lg`; Generate button breathes (`animate-glow-breathe`) only while AI active; template cards lift + primary tint
- Decorative: lasso marching ants, sketch draw-in on new regions, live cursor labels pulse subtly to signal presence

## Constraints

- Sketch aesthetic lives in borders, shadows, and canvas strokes — never in primary buttons, inputs, or tabs (those stay clean)
- Only the primary AI action glows; export pill and secondary UI stay flat
- Collaboration surfaces (cursors, avatars, panels) inherit dashed-border sketch language, not corporate chat-app chrome
- AA+ contrast maintained in both light and dark; dark mode is a tuned inversion, not a flat flip
- Canvas drawing API may use literal color values (CSS vars don't resolve in Canvas/WebGL)
- No per-user region edit locking and no React/JSX export — out of scope by design

## Signature Detail

A user draws a rough lasso around a sketch, and as collaborators join, their color-coded cursors float over the canvas with hand-drawn dashed name labels — while one clicks the Export HTML pill to download the whole page, and another browses the slide-in template library to drop in a starting point the AI can reason from.
