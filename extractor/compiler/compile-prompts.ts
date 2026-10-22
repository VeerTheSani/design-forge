import fs from 'node:fs';
import path from 'node:path';
import { MediaSlot } from '../probes/media-probe.js';
import { SectionBlueprint } from '../probes/layout-probe.js';

export interface CompiledPromptEntry {
  slotId: string;
  role: string;
  sectionContext: string;
  dimensions: string;
  aspectRatio: string;
  borderRadius: string;
  safeZoneForText: string;
  extractedSourceUrl: string;
  extractedPosterUrl: string;
  referenceStylePrompt: string;
  brandAdaptedPromptTemplate: string;
}

export function compileMediaPrompts(mediaSlots: MediaSlot[], sections: SectionBlueprint[], outDir: string, siteName: string) {
  const promptsDir = path.join(outDir, 'media-prompts');
  fs.mkdirSync(promptsDir, { recursive: true });

  // Filter out any empty placeholder slots so only verified live media slots remain
  const validSlots = mediaSlots.filter((m) => Boolean(m.sourceUrlHint || m.posterUrlHint));
  const videoSlots = validSlots.filter((m) => m.generatorTarget === 'google-flow');
  const imageSlots = validSlots.filter((m) => m.generatorTarget === 'nano-banana');

  const googleFlowVideoPrompts: CompiledPromptEntry[] = videoSlots.map((slot) => ({
    slotId: slot.slotId,
    role: slot.nearbyHeading || 'Hero / Bento Motion Loop',
    sectionContext: slot.sectionContext,
    dimensions: `${slot.renderedWidth}×${slot.renderedHeight}`,
    aspectRatio: slot.aspectRatio,
    borderRadius: slot.borderRadius,
    safeZoneForText: slot.textSafeZoneHint,
    extractedSourceUrl: slot.sourceUrlHint || '',
    extractedPosterUrl: slot.posterUrlHint || '',
    referenceStylePrompt: `Create a seamless 6-second 60fps cinema-grade loop (${slot.aspectRatio}). Composition & Safe Zone: ${slot.textSafeZoneHint}. Visual Direction: High-contrast commercial studio lighting, 3D refractive dark glass and floating UI telemetry planes, smooth orbital camera motion paced to cubic-bezier(0.42, 0, 0, 1). CRITICAL: Pure visual render only — DO NOT render any text, words, letters, labels, slot IDs, or logos inside the video.`,
    brandAdaptedPromptTemplate: `Seamless 6-second 60fps loop (${slot.aspectRatio}). Subject: 3D tactile refractive dark glass and volumetric studio rim lighting (#FA0F00 electric crimson & #7A28FF deep violet). Safe Zone: ${slot.textSafeZoneHint}. CRITICAL: Pure visual render only — DO NOT render any text, words, labels, or logos inside the video frame.`,
  }));

  const nanoBananaImagePrompts: CompiledPromptEntry[] = imageSlots.map((slot) => ({
    slotId: slot.slotId,
    role: slot.nearbyHeading || 'Bento Feature Visual',
    sectionContext: slot.sectionContext,
    dimensions: `${slot.renderedWidth}×${slot.renderedHeight}`,
    aspectRatio: slot.aspectRatio,
    borderRadius: slot.borderRadius,
    safeZoneForText: slot.textSafeZoneHint,
    extractedSourceUrl: slot.sourceUrlHint || '',
    extractedPosterUrl: slot.posterUrlHint || '',
    referenceStylePrompt: `Editorial 3D studio key visual (${slot.aspectRatio}). Composition: ${slot.textSafeZoneHint}. Style: Tactile frosted acrylic glass, volumetric studio rim lighting, obsidian & vibrant S2A accent contrast, 8k Octane render clarity. CRITICAL: Pure 3D visual only — DO NOT render any text, words, letters, slot codes, or logos on the objects.`,
    brandAdaptedPromptTemplate: `Editorial 3D studio key visual (${slot.aspectRatio}). Subject: Precision refractive dark glass layers and #FA0F00 / #7A28FF rim lighting. Safe Zone: ${slot.textSafeZoneHint}. CRITICAL: Pure 3D visual only — DO NOT render any text, words, labels, or logos on the objects.`,
  }));

  const manifest = {
    meta: {
      sourceSite: siteName,
      extractedAt: new Date().toISOString(),
      totalSlotsDetected: validSlots.length,
      videoLoopSlots: googleFlowVideoPrompts.length,
      imageSlots: nanoBananaImagePrompts.length,
    },
    slots: validSlots,
    googleFlowVideoPrompts,
    nanoBananaImagePrompts,
  };

  fs.writeFileSync(path.join(promptsDir, 'media-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const flowMd = `# Google Flow Motion & Video Agent Prompt Playbook (${siteName.toUpperCase()} Design System)\n\n${googleFlowVideoPrompts
    .map(
      (p) => `## ${p.slotId} — ${p.role}\n- **Dimensions:** \`${p.dimensions}\` (\`${p.aspectRatio}\`)\n- **Safe Zone:** ${p.safeZoneForText}\n- **Extracted Reference Asset:** \`${p.extractedSourceUrl || p.extractedPosterUrl}\`\n\n### Reference-Style Prompt\n\`\`\`text\n${p.referenceStylePrompt}\n\`\`\`\n\n### Brand-Customizable Prompt\n\`\`\`text\n${p.brandAdaptedPromptTemplate}\n\`\`\`\n`
    )
    .join('\n---\n\n')}`;

  fs.writeFileSync(path.join(promptsDir, 'google-flow-prompts.md'), flowMd, 'utf8');

  const nanoMd = `# Nano Banana Visual & Image Generation Playbook (${siteName.toUpperCase()} Design System)\n\n${nanoBananaImagePrompts
    .map(
      (p) => `## ${p.slotId} — ${p.role}\n- **Dimensions:** \`${p.dimensions}\` (\`${p.aspectRatio}\`)\n- **Safe Zone:** ${p.safeZoneForText}\n- **Extracted Reference Asset:** \`${p.extractedSourceUrl}\`\n\n### Reference-Style Prompt\n\`\`\`text\n${p.referenceStylePrompt}\n\`\`\`\n\n### Brand-Customizable Prompt\n\`\`\`text\n${p.brandAdaptedPromptTemplate}\n\`\`\`\n`
    )
    .join('\n---\n\n')}`;

  fs.writeFileSync(path.join(promptsDir, 'nano-banana-prompts.md'), nanoMd, 'utf8');
  return manifest;
}
