import fs from 'node:fs';
import path from 'node:path';
import { launchExtractorSession, dismissOverlaysAndHydrate } from './browser.js';
import { runTokensProbe } from './probes/tokens-probe.js';
import { runMotionProbe } from './probes/motion-probe.js';
import { runLayoutProbe } from './probes/layout-probe.js';
import { runMediaProbe } from './probes/media-probe.js';
import { compileTokens } from './compiler/compile-tokens.js';
import { compileMotion } from './compiler/compile-motion.js';
import { compileMediaPrompts } from './compiler/compile-prompts.js';
import { compileBlueprintsAndContext } from './compiler/compile-context.js';

async function main() {
  const args = process.argv.slice(2);
  const targetUrl = args.find((a) => a.startsWith('http')) || 'https://www.adobe.com';
  const nameIdx = args.indexOf('--name');
  const siteName =
    nameIdx !== -1 && args[nameIdx + 1]
      ? args[nameIdx + 1]
      : new URL(targetUrl).hostname.replace(/^www\./, '').split('.')[0];

  const outDir = path.resolve(process.cwd(), 'design-systems', siteName);
  const capturesDir = path.join(outDir, 'reference-captures');
  const sectionsCapturesDir = path.join(capturesDir, 'sections');

  fs.mkdirSync(sectionsCapturesDir, { recursive: true });

  console.log(`\n==================================================================`);
  console.log(`  DESIGN FORGE — Live Reverse-Engineering Pipeline`);
  console.log(`  Target URL : ${targetUrl}`);
  console.log(`  Output Dir : ${outDir}`);
  console.log(`==================================================================\n`);

  const session = await launchExtractorSession({ width: 1440, height: 900 });
  const { browser, page } = session;

  try {
    console.log(`[1/6] Navigating to ${targetUrl} (Desktop 1440x900)...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3500);

    console.log(`[2/6] Dismissing modals & scrolling page to hydrate lazy assets + ScrollTriggers...`);
    await dismissOverlaysAndHydrate(page);

    console.log(`[3/6] Capturing full-page desktop reference screenshot...`);
    await page.screenshot({
      path: path.join(capturesDir, 'full-desktop.png'),
      fullPage: true,
    });

    console.log(`[4/6] Running Tokens Probe (Computed Styles, Surfaces, Typography, Spatial Grid)...`);
    const tokensRaw = await runTokensProbe(page);

    console.log(`[5/6] Running Motion Probe (Web Animations API, CSS Transitions, Keyframes, Scroll Deltas)...`);
    const motionRaw = await runMotionProbe(page);

    console.log(`[6/6] Running Layout & Media Probes (Bento Sections, Section Captures, Nano Banana & Google Flow Slots)...`);
    const sectionsRaw = await runLayoutProbe(page, sectionsCapturesDir);
    const mediaRaw = await runMediaProbe(page);

    // Also capture mobile viewport snapshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(capturesDir, 'full-mobile.png'),
      fullPage: false,
    });

    // Compile everything into the standalone design-systems/<siteName> folder
    console.log(`\n[Compiler] Compiling Design System artifacts into ${outDir}...`);
    compileTokens(tokensRaw, outDir, siteName);
    compileMotion(motionRaw, outDir, siteName);
    compileMediaPrompts(mediaRaw, sectionsRaw, outDir, siteName);
    compileBlueprintsAndContext(targetUrl, siteName, tokensRaw, motionRaw, sectionsRaw, mediaRaw, outDir);

    console.log(`\nExtraction Complete!`);
    console.log(`  - Fonts detected       : ${tokensRaw.fontFamilies.slice(0, 4).join(', ')}`);
    console.log(`  - Typography tokens    : ${tokensRaw.typography.length}`);
    console.log(`  - Surface colors       : ${tokensRaw.colorsAndSurfaces.backgrounds.length}`);
    console.log(`  - Easing curves        : ${motionRaw.uniqueEasingCurves.length}`);
    console.log(`  - CSS Transitions      : ${motionRaw.cssTransitions.length}`);
    console.log(`  - Structural sections  : ${sectionsRaw.length}`);
    console.log(`  - Visual media slots   : ${mediaRaw.length}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Extractor Error:', err);
  process.exit(1);
});
