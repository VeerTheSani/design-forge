# Design Forge — AI Context & Master Operations Guide

Whenever a Claude Code session starts in or interacts with `C:\Users\sanis\design-forge`, you have the complete reverse-engineering & Astro + GSAP + Lenis website factory ready to go.

## Quick Commands (Run from `C:\Users\sanis\design-forge`)

| Action | Command | What It Does |
| :--- | :--- | :--- |
| **Start Live Website** | `npm run dev` | Starts the Astro + GSAP + Lenis dev server at **`http://localhost:4321/`** and the Design System Explorer at **`http://localhost:4321/design-system`** |
| **Clean Watermarks** | `npm run clean:media` | Uses FFmpeg (`extractor/clean-media.ts`) to crop & Lanczos-upscale out the bottom-right Gemini sparkle and Google Flow / Veo watermarks from all images & videos in `sites/adobe-showcase/public/media/` |
| **Extract Any Website** | `npx tsx extractor/index.ts https://example.com --name slug` | Launches local Chrome via Playwright + CDP, extracts tokens, motion physics, layout blueprints, cropped section PNGs, and media prompts into `design-systems/<slug>/` |
| **Re-Extract Adobe** | `npm run extract:adobe` | Runs the full live extraction pipeline against `https://www.adobe.com` |
| **Production Build** | `npm run build` | Builds the static production site into `sites/adobe-showcase/dist/` |

## Directory Structure

- `extractor/` — Playwright + CDP reverse-engineering probes (`tokens-probe.ts`, `motion-probe.ts`, `layout-probe.ts`, `media-probe.ts`), compilers (`compile-tokens.ts`, `compile-motion.ts`, `compile-prompts.ts`, `compile-context.ts`), and `clean-media.ts` (FFmpeg watermark remover).
- `design-systems/adobe/` — Complete extracted Adobe S2A Design System:
  - `AI-CONTEXT.md` — Full architectural specification of typography, colors, surfaces, motion physics, and grid math.
  - `tokens/` — `tokens.json`, `tokens.css`, `tailwind.preset.mjs`.
  - `motion/` — `motion-dna.json` & `gsap-choreography.ts` (Lenis smooth scroll + GSAP ScrollTrigger parallax & elastic reveals).
  - `blueprints/components/` — `MegaNav.astro`, `HeroStage.astro`, `ElasticCarousel.astro`, `BentoShowcase.astro`, `MarqueeFooter.astro`.
  - `media-prompts/` — `media-manifest.json`, `google-flow-prompts.md`, `nano-banana-prompts.md`.
- `sites/adobe-showcase/` — Live **KINETIX AI** flagship site built on the extracted Adobe Design System.
  - `public/logo-kinetix.svg` — Custom vector mark.
  - `public/media/images/` & `public/media/videos/` — All 10 downloaded and sanitized Google Flow & Nano Banana renders.

## Important Rules for AI Agents
1. **No Text Inside Image/Video Prompts:** Never put `[Nano Banana Image — NANO-IMG-01]` or slot labels inside prompt strings, or Gemini will literally render those words onto 3D glass objects. Always keep `CRITICAL: Pure visual render only — DO NOT render any text, words, letters, labels, or logos` in every prompt.
2. **Dual Watermark Defense:** Always run `npm run clean:media` after new assets are placed in `public/media/`, and keep `scale-[1.10] origin-[25%_25%]` inside `overflow-hidden` media containers.
