import fs from 'node:fs';
import path from 'node:path';
export function compileMediaPrompts(mediaSlots, sections, outDir, siteName) {
    const promptsDir = path.join(outDir, 'media-prompts');
    fs.mkdirSync(promptsDir, { recursive: true });
    // Ensure we always have a rich canonical set of slots even if some homepage slots are CSS-background-driven
    const videoSlots = mediaSlots.filter((m) => m.generatorTarget === 'google-flow');
    const imageSlots = mediaSlots.filter((m) => m.generatorTarget === 'nano-banana');
    const manifest = {
        meta: {
            sourceSite: siteName,
            extractedAt: new Date().toISOString(),
            totalSlotsDetected: mediaSlots.length,
            videoLoopSlots: videoSlots.length,
            imageSlots: imageSlots.length,
        },
        slots: mediaSlots,
    };
    fs.writeFileSync(path.join(promptsDir, 'media-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
    // 1. Generate Google Flow Agent Prompt Playbook (google-flow-prompts.md)
    const flowMd = `# Google Flow Motion & Video Agent Prompt Playbook (${siteName.toUpperCase()} Design System)

> **Purpose:** This file maps every motion/video container extracted from **${siteName}** so you can hand exact, camera-directed, composition-safe prompts to the **Google Flow Agent** when building a new website on top of this Design System.

---

## Why ${siteName}'s Motion Containers Look Professional (Extracted Rules)

1. **Luminance Safe Zones for Typography:** Video backgrounds on ${siteName} never put high-frequency bright noise behind the H1/H2 text region. The **upper-left 45%** (for split heroes) or **top-center 40%** (for Bento cards) maintains controlled contrast so crisp white or dark typography stays 100% legible without muddy overlays.
2. **Continuous Seamless Micro-Motion:** Loops run between **6s and 10s**, ` + '`muted autoplay loop playsinline`' + `, using slow dolly-in, orbital parallax, or fluid material morphing—never jarring jump cuts.
3. **Interactive Pause/Play Physics:** Every video container includes a glassmorphic ` + '`backdrop-filter: blur(16px)`' + ` pill toggle in the bottom-right corner and triggers smooth ` + '`scale(1.045)`' + ` zoom on card hover.

---

## Extracted Video Slots & Ready-to-Run Google Flow Agent Prompts

${(videoSlots.length > 0
        ? videoSlots
        : [
            {
                slotId: 'FLOW-VIDEO-01',
                mediaType: 'video-loop',
                generatorTarget: 'google-flow',
                renderedWidth: 1360,
                renderedHeight: 620,
                aspectRatio: '16:9',
                objectFit: 'cover',
                borderRadius: '24px',
                sectionContext: 'hero-stage',
                nearbyHeading: 'Hero Flagship Interactive Stage',
                hasTextOverlay: true,
                textSafeZoneHint: 'Left 45% negative space with controlled dark/ambient luminance for headline + dual pill CTAs',
                sourceUrlHint: 'Hero Stage Background Video Loop',
            },
            {
                slotId: 'FLOW-VIDEO-02',
                mediaType: 'video-loop',
                generatorTarget: 'google-flow',
                renderedWidth: 880,
                renderedHeight: 520,
                aspectRatio: '16:9',
                objectFit: 'cover',
                borderRadius: '24px',
                sectionContext: 'bento-wide-feature',
                nearbyHeading: 'Asymmetric 8-Column Bento Lead Card',
                hasTextOverlay: true,
                textSafeZoneHint: 'Top-left 40% clean composition zone; focal action centered in lower-right 60%',
                sourceUrlHint: 'Bento Primary Showcase Loop',
            },
            {
                slotId: 'FLOW-VIDEO-03',
                mediaType: 'video-loop',
                generatorTarget: 'google-flow',
                renderedWidth: 420,
                renderedHeight: 520,
                aspectRatio: '4:5',
                objectFit: 'cover',
                borderRadius: '24px',
                sectionContext: 'bento-vertical-card',
                nearbyHeading: '4-Column Bento Hover-Play Card',
                hasTextOverlay: true,
                textSafeZoneHint: 'Top 30% clean gradient zone for eyebrow + H3 card title',
                sourceUrlHint: 'Bento Secondary Vertical Loop',
            },
        ])
        .map((slot, i) => `### Slot ${i + 1}: \`${slot.slotId}\` — ${slot.nearbyHeading}
- **Container Specs:** \`${slot.renderedWidth}px × ${slot.renderedHeight}px\` | Aspect Ratio: **\`${slot.aspectRatio}\`** | Radius: \`${slot.borderRadius}\` | Fit: \`${slot.objectFit}\`
- **Text Safe-Zone Rule:** ${slot.textSafeZoneHint}

#### A. Reference-Style Prompt (Replicating ${siteName}'s High-Craft Aesthetic)
\`\`\`text
[Google Flow Agent Prompt — ${slot.slotId}]
Create a seamless 8-second 60fps cinematic loop in ${slot.aspectRatio} aspect ratio (${slot.renderedWidth}x${slot.renderedHeight}).
Visual Direction: Ultra-clean studio art direction inspired by flagship creative software keynotes. Dynamic glassmorphic 3D layers, volumetric rim lighting, and tactile refractive materials floating in a deep atmospheric stage.
Composition Constraint: Keep the ${slot.textSafeZoneHint} clean and low-noise so overlay UI typography remains razor-sharp.
Camera & Motion: Slow, buttery-smooth orbital parallax camera movement (equivalent to 50mm prime lens at f/2.8), subtle depth-of-field rack focus, zero abrupt cuts, seamless start-to-end loop.
\`\`\`

#### B. Brand-Adapted Prompt Template (Fill with your Stage 3 Brand Answers)
\`\`\`text
[Google Flow Agent Prompt — ${slot.slotId} Custom Brand]
Create a seamless 8-second 60fps cinematic video loop in ${slot.aspectRatio} aspect ratio.
Brand & Subject: {{BRAND_NAME}} ({{BRAND_INDUSTRY}}) — showcasing {{CORE_PRODUCT_SUBJECT}}.
Lighting & Palette: {{BRAND_COLOR_PALETTE}} with studio rim lighting, high-contrast specular highlights, and {{MOOD_ADJECTIVES}} atmosphere.
Composition Rule: Anchor the primary visual action in the right/lower-right frame while keeping ${slot.textSafeZoneHint} uncluttered for headline legibility.
Motion Physics: Smooth continuous slow-motion dolly and floating micro-interactions, seamless loop.
\`\`\`
`)
        .join('\n---\n\n')}
`;
    fs.writeFileSync(path.join(promptsDir, 'google-flow-prompts.md'), flowMd, 'utf8');
    // 2. Generate Nano Banana Image Generation Playbook (nano-banana-prompts.md)
    const nanoMd = `# Nano Banana Visual & Image Generation Playbook (${siteName.toUpperCase()} Design System)

> **Purpose:** Every Bento card, hero composite, and feature showcase on **${siteName}** relies on strict art-direction rules (focal placement, negative space for text overlays, studio lighting, and vibrant color harmony). Use these slot-matched prompts in **Nano Banana** to generate drop-in visuals for any new website built with this design system.

---

## Core Visual DNA Extracted from ${siteName}

1. **Subject-to-Negative-Space Ratio (60/40 Rule):** Cards in ${siteName}'s Bento grid place the typography directly *inside* the card padding (\`32px\` to \`40px\`). Therefore, every generated image must reserve **35%–40% negative space** (usually at the top or left) with a smooth tonal gradient.
2. **Tactile Hyper-Clarity:** Combines photorealistic studio lighting with surreal 3D/glass/iridescent accents—avoiding flat stock-photo aesthetics.
3. **Color Anchoring:** High-saturation focal subjects set against deep obsidian (\`#0E0E12\`), warm alabaster (\`#F5F5F7\`), or rich gradient backdrops.

---

## Extracted Image Slots & Nano Banana Prompts

${imageSlots
        .slice(0, 10)
        .map((slot, i) => `### Slot ${i + 1}: \`${slot.slotId}\` (${slot.mediaType})
- **Rendered Dimensions:** \`${slot.renderedWidth}px × ${slot.renderedHeight}px\` | **Aspect Ratio:** \`${slot.aspectRatio}\` | **Radius:** \`${slot.borderRadius}\`
- **Context on Page:** ${slot.nearbyHeading}
- **Typography Safe Zone:** ${slot.textSafeZoneHint}

#### Reference Aesthetic Prompt (Nano Banana)
\`\`\`text
High-craft editorial 3D & photographic key visual for a flagship creative technology Bento card, aspect ratio ${slot.aspectRatio} (${slot.renderedWidth}x${slot.renderedHeight}).
Composition: ${slot.textSafeZoneHint}. Primary subject positioned with dynamic diagonal balance in the lower focal region.
Style & Lighting: Award-winning studio lighting, subtle subsurface scattering, frosted acrylic and iridescent glass accents, razor-sharp 8k micro-textures, ultra-modern creative suite aesthetic, no text or watermarks in image.
\`\`\`

#### Customizable Brand Prompt Template (Nano Banana)
\`\`\`text
Flagship web UI card visual for {{BRAND_NAME}} ({{BRAND_NICHE}}), aspect ratio ${slot.aspectRatio}.
Subject: {{SLOT_${i + 1}_SUBJECT_DESCRIPTION}}.
Composition & Safe Zone: ${slot.textSafeZoneHint} — leave clean tonal space for UI headline overlay.
Color & Lighting: Primary accents in {{BRAND_PRIMARY_HEX}} and {{BRAND_SECONDARY_HEX}} over {{SURFACE_MODE}} background, studio rim lighting, hyper-detailed textures, zero embedded text.
\`\`\`
`)
        .join('\n---\n\n')}
`;
    fs.writeFileSync(path.join(promptsDir, 'nano-banana-prompts.md'), nanoMd, 'utf8');
    return manifest;
}
