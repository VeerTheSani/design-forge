import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { resolveExecutablePath } from './browser.js';

interface SectionCaptureSpec {
  id: string;
  selector: string;
  originalRefFile: string;
  expectedFontWeight: string;
  expectedTrackingRatio: number;
}

const SECTION_SPECS: SectionCaptureSpec[] = [
  {
    id: '01-global-navigation',
    selector: '[data-df-gnav]',
    originalRefFile: '01-global-navigation.png',
    expectedFontWeight: '700',
    expectedTrackingRatio: -0.01,
  },
  {
    id: '02-hero-stage',
    selector: '[data-df-hero-stage]',
    originalRefFile: '02-hero-stage.png',
    expectedFontWeight: '900',
    expectedTrackingRatio: -0.04,
  },
  {
    id: '03-elastic-carousel',
    selector: '#carousel',
    originalRefFile: '03-bento-grid.png',
    expectedFontWeight: '900',
    expectedTrackingRatio: -0.03,
  },
  {
    id: '04-bento-grid',
    selector: '#bento',
    originalRefFile: '04-bento-grid.png',
    expectedFontWeight: '900',
    expectedTrackingRatio: -0.04,
  },
];

async function runVisualDiffAudit() {
  const args = process.argv.slice(2);
  const showcaseUrl = args.find((a) => a.startsWith('http')) || 'http://localhost:4321/';
  const siteName = 'adobe';

  const designSystemDir = path.resolve(process.cwd(), 'design-systems', siteName);
  const auditDir = path.join(designSystemDir, 'visual-audit');
  const publicAuditDir = path.resolve(process.cwd(), 'sites/adobe-showcase/public/visual-audit');

  fs.mkdirSync(auditDir, { recursive: true });
  fs.mkdirSync(publicAuditDir, { recursive: true });

  console.log(`\n==================================================================`);
  console.log(`  DESIGN FORGE — AI Visual Diff & Motion Parity Auditor`);
  console.log(`  Live Showcase : ${showcaseUrl}`);
  console.log(`  Audit Output  : ${auditDir}`);
  console.log(`==================================================================\n`);

  const executablePath = resolveExecutablePath();
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    console.log(`[1/4] Loading live showcase (${showcaseUrl})...`);
    await page.goto(showcaseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);

    // Capture full-page top state
    const fullPath = path.join(auditDir, 'showcase-full-desktop.png');
    await page.screenshot({ path: fullPath, fullPage: true });
    fs.copyFileSync(fullPath, path.join(publicAuditDir, 'showcase-full-desktop.png'));

    // Capture each section at rest
    console.log(`[2/4] Capturing per-section renders & computed typography/motion telemetry...`);
    const sectionTelemetry: any[] = [];

    for (const spec of SECTION_SPECS) {
      const loc = page.locator(spec.selector).first();
      if ((await loc.count()) > 0) {
        await loc.scrollIntoViewIfNeeded();
        await page.waitForTimeout(450);

        const shotName = `showcase-${spec.id}.png`;
        const shotPath = path.join(auditDir, shotName);
        await loc.screenshot({ path: shotPath });
        fs.copyFileSync(shotPath, path.join(publicAuditDir, shotName));

        const metrics = await loc.evaluate((el) => {
          const heading = el.querySelector('h1, h2, h3');
          const hStyle = heading ? window.getComputedStyle(heading) : null;
          const elStyle = window.getComputedStyle(el);

          const fontSizePx = hStyle ? parseFloat(hStyle.fontSize) : 0;
          const lineHeightPx = hStyle ? parseFloat(hStyle.lineHeight) : 0;
          const letterSpacingPx = hStyle ? parseFloat(hStyle.letterSpacing) || 0 : 0;

          return {
            tag: el.tagName.toLowerCase(),
            rect: el.getBoundingClientRect(),
            backgroundColor: elStyle.backgroundColor,
            borderRadius: elStyle.borderRadius,
            backdropFilter: elStyle.backdropFilter,
            headingText: heading?.textContent?.trim().slice(0, 80) || null,
            headingFontFamily: hStyle?.fontFamily || null,
            headingFontWeight: hStyle?.fontWeight || null,
            headingFontSize: hStyle?.fontSize || null,
            headingLineHeight: hStyle?.lineHeight || null,
            headingLineHeightRatio: fontSizePx ? +(lineHeightPx / fontSizePx).toFixed(3) : null,
            headingLetterSpacing: hStyle?.letterSpacing || null,
            headingTrackingRatio: fontSizePx ? +(letterSpacingPx / fontSizePx).toFixed(4) : null,
          };
        });

        sectionTelemetry.push({
          ...spec,
          screenshot: shotName,
          metrics,
        });
      }
    }

    // Scroll back to top and probe continuous scroll-driven motion physics
    console.log(`[3/4] Probing continuous scroll-scrubbing & Lenis/GSAP motion physics...`);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }));
    await page.waitForTimeout(500);

    const motionProbe = await page.evaluate(async () => {
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const hero = document.querySelector<HTMLElement>('[data-df-hero-stage]');
      const navInner = document.querySelector<HTMLElement>('[data-df-gnav-inner]');
      const carousel = document.querySelector<HTMLElement>('[data-df-elastic-carousel]');
      const firstCarouselCard = document.querySelector<HTMLElement>('[data-df-elastic-item]');
      const bentoGrid = document.querySelector<HTMLElement>('[data-df-bento-grid]');
      const leadBentoMedia = document.querySelector<HTMLElement>('[data-df-bento-lead-media]');

      const captureState = () => ({
        scrollY: window.scrollY,
        heroTransform: hero ? window.getComputedStyle(hero).transform : 'none',
        navBg: navInner ? window.getComputedStyle(navInner).backgroundColor : 'none',
        navBackdrop: navInner ? window.getComputedStyle(navInner).backdropFilter : 'none',
        carouselTransform: carousel ? window.getComputedStyle(carousel).transform : 'none',
        cardMarginRight: firstCarouselCard ? window.getComputedStyle(firstCarouselCard).marginRight : '0px',
        bentoScale: bentoGrid ? window.getComputedStyle(bentoGrid).transform : 'none',
        leadMediaClip: leadBentoMedia ? window.getComputedStyle(leadBentoMedia).clipPath : 'none',
      });

      const atTop = captureState();
      window.scrollTo({ top: 420, behavior: 'instant' as ScrollBehavior });
      await wait(350);
      const atHeroMid = captureState();

      window.scrollTo({ top: 920, behavior: 'instant' as ScrollBehavior });
      await wait(350);
      const atCarousel = captureState();

      window.scrollTo({ top: 1650, behavior: 'instant' as ScrollBehavior });
      await wait(350);
      const atBento = captureState();

      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      await wait(300);

      return { atTop, atHeroMid, atCarousel, atBento };
    });

    // Save structured JSON report
    const report = {
      auditedAt: new Date().toISOString(),
      showcaseUrl,
      sectionTelemetry,
      motionProbe,
    };

    const reportPath = path.join(auditDir, 'visual-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    fs.copyFileSync(reportPath, path.join(publicAuditDir, 'visual-audit-report.json'));

    console.log(`[4/4] Visual Audit Complete! Saved screenshots & telemetry to ${auditDir}`);
    for (const sec of sectionTelemetry) {
      console.log(
        `  - ${sec.id}: font=${sec.metrics.headingFontFamily?.slice(0, 32)} | size=${sec.metrics.headingFontSize} | lhRatio=${sec.metrics.headingLineHeightRatio} | trackingRatio=${sec.metrics.headingTrackingRatio}`
      );
    }
  } finally {
    await browser.close();
  }
}

runVisualDiffAudit().catch((err) => {
  console.error('Visual Diff Audit Error:', err);
  process.exit(1);
});
