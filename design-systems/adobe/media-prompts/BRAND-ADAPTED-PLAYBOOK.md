# Brand-Adapted Prompt Playbook: AI / SaaS / Developer Platform
**Design System Base:** Extracted Adobe S2A Architecture (`C:\Users\sanis\design-forge\design-systems\adobe\`)
**Brand Direction:** Next-Gen AI / SaaS / Developer Platform (`AETHER STUDIO`)
**Color DNA:** Obsidian Stage (`#0B0B10`) + Electric Crimson (`#FA0F00`) + Deep Violet (`#7A28FF`) + Crisp Alabaster Bento Surface (`#F3F3F3`)
**Visual Art Style:** 3D Tactile Refractive Glass, Floating Telemetry UI Layers, & Volumetric Studio Rim Lighting

---

## PART 1: GOOGLE FLOW (Video & Motion Agent Prompts)

Use these prompts directly inside **Google Flow** (or pass them to the Google Flow video agent) to generate seamless, 60fps looping `.mp4` / `.webm` videos that fit the exact aspect ratios and typography safe zones of the Adobe layout.

### 1. `FLOW-VIDEO-01` — Flagship Hero Stage Loop (Right 55% Visual Stage, Left 45% Text Safe Zone)
- **Target Component:** `HeroStage.astro` (Main 16:9 Full-Bleed Hero Stage, `1440×900`)
- **Typography Safe Zone:** **Left 45% MUST remain dark/low-contrast obsidian** (`#0B0B10`) so the `80px` Display Black white headline (`line-height: 76px`, `letter-spacing: -3.2px`) is 100% legible without clutter.
- **Copy-Paste Google Flow Prompt:**
```text
[Google Flow Video Agent Prompt — Slot: FLOW-VIDEO-01]
Create a seamless 6-second 60fps 16:9 cinema-grade motion loop for a flagship AI developer platform hero stage.
COMPOSITION & SAFE ZONE: Keep the left 45% of the frame in deep, clean obsidian shadow (#0B0B10) with subtle atmospheric falloff to serve as a negative-space safe zone for 80px white display typography. Anchor all primary 3D subject matter on the right 55% of the frame.
SUBJECT: A floating, precision-engineered 3D refractive dark-glass AI compute core and layered translucent holographic code/telemetry planes suspended in space, surrounded by orbiting optical glass prisms that refract electric crimson (#FA0F00) and ultraviolet (#7A28FF) laser light paths.
CAMERA & MOTION PHYSICS: Ultra-smooth slow orbital push-in (35mm cinema prime lens, f/2.0 shallow depth of field). The glass UI layers gently separate along the Z-axis and pulse with real-time neural data streams, paced to cubic-bezier(0.42, 0, 0, 1), returning seamlessly to frame 0 for an infinite loop.
LIGHTING: High-contrast commercial studio rim lighting, obsidian studio floor reflection, zero text watermarks, 8K Octane/Redshift render fidelity.
```

---

### 2. `FLOW-VIDEO-02` — Lead 12-Column Bento Split Stage (Right 7 Columns of Flagship Bento Card)
- **Target Component:** `BentoShowcase.astro` (Top 12-Column Split Card — `"Turn AI signals into business impact"`, `840×420` stage)
- **Copy-Paste Google Flow Prompt:**
```text
[Google Flow Video Agent Prompt — Slot: FLOW-VIDEO-02]
Create a seamless 5-second 60fps 16:9 motion loop for an interactive SaaS Bento showcase card.
SUBJECT: An isometric 3D stack of frosted acrylic glass dashboard cards and glowing fiber-optic signal nodes hovering over a matte obsidian grid (#131313). Streams of electric crimson (#FA0F00) and cobalt-violet (#7A28FF) light flow into a central glass lens, transforming raw particle noise into structured geometric crystal bars.
CAMERA & MOTION PHYSICS: Locked isometric 50mm telephoto perspective. Smooth, damped spring elevation of the top glass card with a subtle specular light sweep across the beveled acrylic edges (cubic-bezier(0.42, 0, 0, 1)). Seamless start-to-end loop.
```

---

### 3. `FLOW-VIDEO-03` — 4-Column Bento Card Video-on-Hover Loop (Middle Bento Card)
- **Target Component:** `BentoShowcase.astro` (4-Column Card #2 — `"Introducing Color Mode / Spectral Engine"`, `460×260` stage)
- **Copy-Paste Google Flow Prompt:**
```text
[Google Flow Video Agent Prompt — Slot: FLOW-VIDEO-03]
Create a seamless 4-second 60fps 16:10 macro motion loop triggered on card hover.
SUBJECT: Macro close-up of a precision dark-glass dial and floating 3D spectral waveform ribbons shifting smoothly from deep ultraviolet (#7A28FF) through electric crimson (#FA0F00) to warm solar orange (#FF5C00).
CAMERA & MOTION PHYSICS: 85mm macro lens, shallow depth of field, velvety bokeh, continuous harmonic wave oscillation across the glass surface, clean top-left corner for pill badge overlay.
```

---

## PART 2: NANO BANANA (High-Craft Image Generation Prompts)

Use these prompts in **Nano Banana** to generate the exact `4:5` vertical cards for the **5-Column Elastic Carousel** (`ElasticCarousel.astro`) and the `16:10` feature cards for the **Bento Grid** (`BentoShowcase.astro`).

### 4. `NANO-IMG-01` — Elastic Carousel Card 01 (4:5 Vertical — AI Model Routing)
- **Target Component:** `ElasticCarousel.astro` — Card 1 (`400×500`, `4:5` aspect ratio)
- **Copy-Paste Nano Banana Prompt:**
```text
[Nano Banana Prompt — Slot: NANO-IMG-01 | Aspect Ratio: 4:5]
Editorial 3D studio key visual of a sculptural refractive glass router prism splitting a single white laser beam into five distinct electric crimson (#FA0F00) and amber (#FF7A00) data streams inside a dark obsidian studio (#131313). Floating micro-glass UI tags with subtle frosted blur around the core. Top 20% and bottom 20% kept clean with smooth dark gradient falloff for badge overlays. 85mm studio macro lens, Octane Render, ultra-crisp caustics, zero text or watermarks.
```

### 5. `NANO-IMG-02` — Elastic Carousel Card 02 (4:5 Vertical — Autonomous Code & Agent Sandbox)
- **Target Component:** `ElasticCarousel.astro` — Card 2 (`400×500`, `4:5` aspect ratio)
- **Copy-Paste Nano Banana Prompt:**
```text
[Nano Banana Prompt — Slot: NANO-IMG-02 | Aspect Ratio: 4:5]
High-craft 3D tactile glass composition showing three interlocking translucent obsidian and violet (#7A28FF) acrylic cubes containing glowing volumetric neural nodes and precision geometric wireframes. Rim-lit with electric crimson (#FA0F00) and cool studio key light against a deep violet-black gradient background (#11052C). Clean top-left safe zone, photorealistic glass refraction, 8k studio product photography aesthetic.
```

### 6. `NANO-IMG-03` — Elastic Carousel Card 03 (4:5 Vertical — Document & Knowledge Synthesis)
- **Target Component:** `ElasticCarousel.astro` — Card 3 (`400×500`, `4:5` aspect ratio)
- **Copy-Paste Nano Banana Prompt:**
```text
[Nano Banana Prompt — Slot: NANO-IMG-03 | Aspect Ratio: 4:5]
Precision 3D architectural render of stacked ultra-thin frosted glass sheets rising vertically out of a glowing crimson (#E31B0C) optical scanner beam, with crystalline data nodes hovering above the top sheet. Deep obsidian-crimson studio backdrop (#2E0600), sharp specular highlights on chamfered glass edges, minimalist luxury SaaS art direction, no text.
```

### 7. `NANO-IMG-04` — Elastic Carousel Card 04 (4:5 Vertical — Enterprise Cloud Telemetry)
- **Target Component:** `ElasticCarousel.astro` — Card 4 (`400×500`, `4:5` aspect ratio)
- **Copy-Paste Nano Banana Prompt:**
```text
[Nano Banana Prompt — Slot: NANO-IMG-04 | Aspect Ratio: 4:5]
Isometric 3D studio render of a precision anodized-metal and dark-glass server matrix with glowing cobalt-violet (#4B75FF) and crimson (#FA0F00) optical interconnects. Volumetric studio lighting, shallow depth of field, clean negative space in the upper third for UI pill overlays, ultra-sharp material textures.
```

### 8. `NANO-IMG-05` — Bento Grid 4-Col Card #1 (16:10 Horizontal — Precision Layer Isolation)
- **Target Component:** `BentoShowcase.astro` — Card 1 (`460×260`, `16:10` aspect ratio)
- **Copy-Paste Nano Banana Prompt:**
```text
[Nano Banana Prompt — Slot: NANO-IMG-05 | Aspect Ratio: 16:10]
Exploded-view 3D studio render of a sleek glass interface card separating into three distinct floating refractive layers—base obsidian carbon layer, middle glowing violet wireframe layer, and top crystal lens layer highlighted by a precision crimson (#FA0F00) laser ring. Deep midnight-blue and violet studio backdrop, commercial tech flagship aesthetic, 8k resolution.
```

### 9. `NANO-IMG-06` — Bento Grid 4-Col Card #3 (16:10 Horizontal — Instant Pipeline Deployment)
- **Target Component:** `BentoShowcase.astro` — Card 3 (`460×260`, `16:10` aspect ratio)
- **Copy-Paste Nano Banana Prompt:**
```text
[Nano Banana Prompt — Slot: NANO-IMG-06 | Aspect Ratio: 16:10]
Macro 3D studio render of a tactile frosted glass launch switch and glowing optical conduit radiating warm crimson (#F03823) and soft rose-gold light trails across a dark brushed-titanium surface. High-contrast studio lighting, razor-sharp glass bevels, clean composition designed for a modern AI SaaS Bento card.
```
