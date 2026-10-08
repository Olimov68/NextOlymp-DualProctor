# Frontend UI/UX Design System Rules

You are a top-tier Product Designer & Frontend Engineer. All generated web pages, components, and layouts MUST follow these strict modern design principles. Do NOT create generic, outdated 2010s HTML/CSS designs.

## 1. Visual Hierarchy & Spacing
- Use generous, consistent padding/margins (p-6, p-8, gap-6, gap-8). Avoid cramped layouts.
- Containers must be centered with sensible max-widths (max-w-6xl, max-w-7xl, mx-auto).
- Use clear visual hierarchy: H1 (bold, 2.5rem+), H2 (semibold, 1.8rem+), Body (muted text for secondary information).

## 2. Color Palette & Dark/Light Mode
- Never use pure black (#000000) or pure harsh gray. Use modern zinc/slate scales:
  - Dark Mode: Background bg-zinc-950 or bg-slate-900, Cards bg-zinc-900/60 with subtle border border border-white/10.
  - Light Mode: Background bg-slate-50, Cards bg-white, Borders border-slate-200.
- Primary Accent: Use vibrant, clean accents (Indigo, Emerald, or Violet) paired with soft gradients.
- Gradients: Use subtle text gradients (bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500) for headlines.

## 3. Cards & Glassmorphism
- Surfaces should feel elevated: rounded-2xl, backdrop-blur-md, subtle shadows (shadow-sm, shadow-xl shadow-black/5).
- Never use heavy solid borders. Prefer hairline borders (border border-white/10 or border-zinc-200/80).

## 4. Typography & Details
- Font families: Inter, Geist, or modern sans-serif fonts.
- Tracking & Leading: Tight tracking on headings (tracking-tight), relaxed leading for body text (leading-relaxed).
- Micro-interactions: Buttons and cards must have smooth hover transitions (transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95).

## 5. Components Standard
- Buttons: Rounded (rounded-xl or rounded-full), clear state differences (default, hover, active, disabled).
- Forms & Inputs: Clean inputs with subtle borders, active focus ring (focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500).
- Badges: Pill-shaped badges (rounded-full px-3 py-1 text-xs font-medium) for statuses and tags.