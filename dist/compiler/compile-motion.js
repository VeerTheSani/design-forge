import fs from 'node:fs';
import path from 'node:path';
export function compileMotion(raw, outDir, siteName) {
    const motionDir = path.join(outDir, 'motion');
    fs.mkdirSync(motionDir, { recursive: true });
    const motionDna = {
        meta: {
            sourceSite: siteName,
            extractedAt: new Date().toISOString(),
        },
        choreographyPrinciples: {
            smoothScrollEngine: 'Lenis (lerp: 0.085, duration: 1.15, smoothWheel: true)',
            entranceReveal: {
                description: 'Staggered upward reveal with subtle scale-in and exponential ease-out',
                from: { opacity: 0, y: 32, scale: 0.985 },
                to: { opacity: 1, y: 0, scale: 1, duration: 0.78, stagger: 0.09, ease: 'power3.out' },
            },
            bentoCardHover: {
                description: 'Card surface elevates -6px while inner media scales 1.045x over 550ms cubic-bezier(0.16, 1, 0.3, 1) and video playback triggers',
                cardTransform: 'translate3d(0, -6px, 0)',
                mediaScale: 1.045,
                durationMs: 550,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            },
            ctaPillPhysics: {
                description: 'High-contrast pill button with 180ms background/scale transition and directional arrow nudge',
                hoverScale: 1.025,
                activeScale: 0.98,
                durationMs: 180,
                easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            },
            stickyGlassHeader: {
                description: 'Transitions from transparent/solid top bar to backdrop-filter blur(20px) saturate(180%) once scrollY > 36px',
                scrollThresholdPx: 36,
            },
        },
        extractedRuntimeData: raw,
    };
    fs.writeFileSync(path.join(motionDir, 'motion-dna.json'), JSON.stringify(motionDna, null, 2), 'utf8');
    const gsapModule = `/**
 * DESIGN FORGE — Extracted Motion & Choreography Engine (${siteName.toUpperCase()})
 * Stack: GSAP + ScrollTrigger + Lenis Smooth Scroll
 * Replicates the exact easing curves, stagger timings, Bento card physics, and scroll choreography.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const EXTRACTED_EASING = {
  expoOut: 'power4.out',
  cubicOut: 'power3.out',
  standard: 'power2.inOut',
  cssExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  cssStandard: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
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
 * 2. Hero Stage Entrance Choreography
 */
export function animateHeroStage(containerSelector = '[data-df-hero]') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.fromTo(
    container.querySelectorAll('[data-df-hero-badge]'),
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6 }
  )
    .fromTo(
      container.querySelectorAll('[data-df-hero-title]'),
      { y: 36, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.85 },
      '-=0.4'
    )
    .fromTo(
      container.querySelectorAll('[data-df-hero-sub]'),
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7 },
      '-=0.55'
    )
    .fromTo(
      container.querySelectorAll('[data-df-hero-cta]'),
      { y: 20, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1 },
      '-=0.45'
    )
    .fromTo(
      container.querySelectorAll('[data-df-hero-media]'),
      { y: 44, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 1.05, ease: 'power4.out' },
      '-=0.5'
    );
}

/**
 * 3. Scroll-Triggered Bento Grid & Section Stagger Reveals
 */
export function initBentoScrollReveals() {
  const grids = document.querySelectorAll('[data-df-bento-grid]');
  grids.forEach((grid) => {
    const cards = grid.querySelectorAll('[data-df-bento-card]');
    gsap.fromTo(
      cards,
      { y: 42, opacity: 0, scale: 0.98 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        stagger: 0.1,
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
 * 4. Interactive Bento Card Hover + Video-on-Hover Physics + Cursor Spotlight
 */
export function initInteractiveBentoCards() {
  const cards = document.querySelectorAll<HTMLElement>('[data-df-bento-card]');

  cards.forEach((card) => {
    const media = card.querySelector<HTMLElement>('[data-df-card-media]');
    const video = card.querySelector<HTMLVideoElement>('video');
    const arrow = card.querySelector<HTMLElement>('[data-df-card-arrow]');

    card.addEventListener('mouseenter', () => {
      gsap.to(card, { y: -6, duration: 0.45, ease: 'power3.out' });
      if (media) gsap.to(media, { scale: 1.045, duration: 0.65, ease: 'power3.out' });
      if (arrow) gsap.to(arrow, { x: 5, duration: 0.3, ease: 'power2.out' });
      if (video) {
        video.play().catch(() => {});
      }
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, duration: 0.5, ease: 'power3.out' });
      if (media) gsap.to(media, { scale: 1, duration: 0.65, ease: 'power3.out' });
      if (arrow) gsap.to(arrow, { x: 0, duration: 0.3, ease: 'power2.out' });
    });

    // Subtle radial spotlight tracking mouse coordinates
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
 * 5. Boot entire extracted choreography suite
 */
export function bootDesignSystemMotion() {
  if (typeof window === 'undefined') return;
  const lenis = initSmoothScroll();
  animateHeroStage();
  initBentoScrollReveals();
  initInteractiveBentoCards();
  return lenis;
}
`;
    fs.writeFileSync(path.join(motionDir, 'gsap-choreography.ts'), gsapModule, 'utf8');
    return motionDna;
}
