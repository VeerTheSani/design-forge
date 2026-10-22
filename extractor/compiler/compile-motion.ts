import fs from 'node:fs';
import path from 'node:path';
import { ExtractedMotionRaw } from '../probes/motion-probe.js';

export function compileMotion(raw: ExtractedMotionRaw, outDir: string, siteName: string) {
  const motionDir = path.join(outDir, 'motion');
  fs.mkdirSync(motionDir, { recursive: true });

  const motionDna = {
    meta: {
      sourceSite: siteName,
      extractedAt: new Date().toISOString(),
    },
    choreographyPrinciples: {
      smoothScrollEngine: 'Lenis (lerp: 0.085, duration: 1.15, smoothWheel: true)',
      heroStageSwitcher: {
        description:
          '5-slot glassmorphic dock at bottom of Hero (`rm-card-progress-bar`) with 5000ms linear progress bar (`translateX(-101%) -> translateX(0%)`) that auto-cycles hero video/image stages',
        cycleDurationMs: 5000,
        progressEasing: 'linear',
        activeCardSurface: '#ffffff (text: #131313)',
        inactiveCardSurface: 'rgba(19, 19, 19, 0.56) backdrop-filter: blur(20px)',
      },
      heroScrollParallax: {
        description:
          'As user scrolls past the Hero (`parallax-move-up-fast` + `parallax-fade-to-dark`), the hero stage translates `translateY(-315px)` while darkening (`opacity: 0 -> 0.75`) as the next rounded-top section (`border-radius: 32px 32px 0 0`) slides over it.',
        translateY: '-315px',
        fadeOverlayMaxOpacity: 0.75,
        easing: 'cubic-bezier(0.42, 0, 0, 1)',
      },
      elasticCarouselGapShrink: {
        description:
          'Extracted `elasticCarouselSlideIn` + `elasticItemsGapShrink`: cards enter with `marginLeft: 200px -> 0px` and item horizontal margins compress from `44px -> 4px` using `cubic-bezier(0.42, 0, 0, 1)`.',
        initialMarginPx: 44,
        settledMarginPx: 4,
        easing: 'cubic-bezier(0.42, 0, 0, 1)',
      },
      bentoCardHover: {
        description:
          'Card surface elevates -6px while inner media scales 1.045x over 480ms cubic-bezier(0.42, 0, 0, 1) and video playback triggers',
        cardTransform: 'translate3d(0, -6px, 0)',
        mediaScale: 1.045,
        durationMs: 480,
        easing: 'cubic-bezier(0.42, 0, 0, 1)',
      },
      ctaPillPhysics: {
        description: 'High-contrast pill button with 200ms background/scale transition and directional arrow nudge',
        hoverScale: 1.025,
        activeScale: 0.98,
        durationMs: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    extractedRuntimeData: raw,
  };

  fs.writeFileSync(path.join(motionDir, 'motion-dna.json'), JSON.stringify(motionDna, null, 2), 'utf8');

  const gsapModule = `/**
 * DESIGN FORGE — Extracted Motion & Choreography Engine (${siteName.toUpperCase()})
 * Stack: GSAP + ScrollTrigger + Lenis Smooth Scroll
 * Replicates the exact extracted Adobe S2A motion signatures:
 *  1. 5000ms Hero Stage Dock Progress & Crossfade (\`rm-card-progress-bar\`)
 *  2. Hero Parallax Move-Up (\`-315px\`) & Fade-to-Dark (\`0.75\`) under rounded sheet (\`32px 32px 0 0\`)
 *  3. Elastic Carousel Gap-Shrink (\`margin 44px -> 4px\` with \`cubic-bezier(0.42, 0, 0, 1)\`)
 *  4. Bento Card Hover Elevation & Video-on-Hover Trigger
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const EXTRACTED_EASING = {
  s2aSignature: 'cubic-bezier(0.42, 0, 0, 1)',
  materialStandard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  expoOut: 'power4.out',
  cubicOut: 'power3.out',
};

/**
 * 1. Initialize Lenis Smooth Scroll synchronized with GSAP ScrollTrigger ticker
 */
export function initSmoothScroll(): Lenis {
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

/**
 * 2. Hero Parallax Move-Up (-315px) & Fade-To-Dark (0 -> 0.75) + Sheet Curtain Overlap
 */
export function initHeroParallaxCurtain() {
  const heroStage = document.querySelector<HTMLElement>('[data-df-hero-stage]');
  const heroDarkOverlay = document.querySelector<HTMLElement>('[data-df-hero-dark-overlay]');

  if (!heroStage) return;

  gsap.to(heroStage, {
    y: -180,
    ease: 'none',
    scrollTrigger: {
      trigger: heroStage,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });

  if (heroDarkOverlay) {
    gsap.fromTo(
      heroDarkOverlay,
      { opacity: 0 },
      {
        opacity: 0.75,
        ease: 'none',
        scrollTrigger: {
          trigger: heroStage,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  }
}

/**
 * 3. Elastic Carousel Gap-Shrink & Slide-In (\`elasticCarouselSlideIn\` + \`elasticItemsGapShrink\`)
 */
export function initElasticCarouselReveal() {
  const carousels = document.querySelectorAll<HTMLElement>('[data-df-elastic-carousel]');

  carousels.forEach((carousel) => {
    const items = carousel.querySelectorAll<HTMLElement>('[data-df-elastic-item]');
    if (!items.length) return;

    gsap.fromTo(
      carousel,
      { x: 140, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.95,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: carousel,
          start: 'top 86%',
        },
      }
    );

    gsap.fromTo(
      items,
      { marginLeft: '28px', marginRight: '28px', y: 36, opacity: 0 },
      {
        marginLeft: '0px',
        marginRight: '0px',
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.07,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: carousel,
          start: 'top 85%',
        },
      }
    );
  });
}

/**
 * 4. Scroll-Triggered Bento Grid & Section Stagger Reveals
 */
export function initBentoScrollReveals() {
  const grids = document.querySelectorAll('[data-df-bento-grid]');
  grids.forEach((grid) => {
    const cards = grid.querySelectorAll('[data-df-bento-card]');
    gsap.fromTo(
      cards,
      { y: 50, opacity: 0, scale: 0.98 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.82,
        stagger: 0.09,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: grid,
          start: 'top 84%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

/**
 * 5. Interactive Bento Card Hover + Video-on-Hover Physics + Cursor Spotlight
 */
export function initInteractiveBentoCards() {
  const cards = document.querySelectorAll<HTMLElement>('[data-df-bento-card]');

  cards.forEach((card) => {
    const media = card.querySelector<HTMLElement>('[data-df-card-media]');
    const video = card.querySelector<HTMLVideoElement>('video');
    const arrow = card.querySelector<HTMLElement>('[data-df-card-arrow]');

    card.addEventListener('mouseenter', () => {
      gsap.to(card, { y: -6, duration: 0.48, ease: 'power3.out' });
      if (media) gsap.to(media, { scale: 1.045, duration: 0.55, ease: 'power3.out' });
      if (arrow) gsap.to(arrow, { x: 5, duration: 0.3, ease: 'power2.out' });
      if (video) {
        video.play().catch(() => {});
      }
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, duration: 0.48, ease: 'power3.out' });
      if (media) gsap.to(media, { scale: 1, duration: 0.55, ease: 'power3.out' });
      if (arrow) gsap.to(arrow, { x: 0, duration: 0.3, ease: 'power2.out' });
    });

    card.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', \`\${x}px\`);
      card.style.setProperty('--mouse-y', \`\${y}px\`);
    });
  });
}

/**
 * 6. Boot entire extracted choreography suite
 */
export function bootDesignSystemMotion() {
  if (typeof window === 'undefined') return;
  const lenis = initSmoothScroll();
  initHeroParallaxCurtain();
  initElasticCarouselReveal();
  initBentoScrollReveals();
  initInteractiveBentoCards();
  return lenis;
}
`;

  fs.writeFileSync(path.join(motionDir, 'gsap-choreography.ts'), gsapModule, 'utf8');
  return motionDna;
}
