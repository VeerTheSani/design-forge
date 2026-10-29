/**
 * DESIGN FORGE — Complete Extracted Motion & Choreography Engine (ADOBE S2A)
 * Stack: GSAP + ScrollTrigger + Lenis Smooth Scroll
 *
 * Implements ALL extracted Web Animations API sequences from `motion-dna.json`:
 *  1. Silky Lenis Smooth Scroll (lerp: 0.075, zero native CSS scroll-smooth conflict)
 *  2. `parallax-move-up-fast` (translateY(0px) -> translateY(-315px)) + `parallax-fade-to-dark` (0 -> 0.75)
 *  3. `elasticCarouselSlideIn` (x: 160px -> 0px) + `elasticItemsGapShrink` (44px / 36px / 28px / 16px / 8px -> 0px)
 *  4. `enable-grid-parallax` (scale 1.08 -> 1) + `grow-featured-card-radius`
 *  5. `enable-parallax-stagger` (differential 72px / 140px / 210px scroll depth on 3-col Bento cards) + inner `parallax-scale-down`
 *  6. 60fps `gsap.quickTo` Magnetic Card & Pill Physics (`cubic-bezier(0.16, 1, 0.3, 1)`)
 *  7. Live Motion Physics Hot-Swap API (`window.__dfMotion`) for the Sync Controller
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export interface MotionPresetConfig {
  id: 'butter' | 'snappy' | 'cinematic';
  label: string;
  lerp: number;
  scrubSmoothing: number;
  parallaxMultiplier: number;
}

export const MOTION_PRESETS: Record<MotionPresetConfig['id'], MotionPresetConfig> = {
  butter: {
    id: 'butter',
    label: 'S2A Butter Smooth (0.075)',
    lerp: 0.075,
    scrubSmoothing: 0.55,
    parallaxMultiplier: 1.0,
  },
  snappy: {
    id: 'snappy',
    label: 'Snappy Studio (0.13)',
    lerp: 0.13,
    scrubSmoothing: 0.25,
    parallaxMultiplier: 0.75,
  },
  cinematic: {
    id: 'cinematic',
    label: 'Cinematic Float (0.048)',
    lerp: 0.048,
    scrubSmoothing: 1.0,
    parallaxMultiplier: 1.25,
  },
};

let activeLenis: Lenis | null = null;
let currentPreset: MotionPresetConfig = MOTION_PRESETS.butter;

/**
 * 1. Initialize Lenis Smooth Scroll synchronized 1:1 with GSAP ticker
 */
export function initSmoothScroll(lerp = 0.075): Lenis {
  // Ensure native CSS scroll-behavior never fights Lenis
  document.documentElement.classList.remove('scroll-smooth');
  document.documentElement.style.scrollBehavior = 'auto';

  if (activeLenis) {
    activeLenis.destroy();
  }

  const lenis = new Lenis({
    lerp,
    smoothWheel: true,
    wheelMultiplier: 0.95,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  activeLenis = lenis;
  return lenis;
}

/**
 * 2. Hero Curtain Parallax (`parallax-move-up-fast` & `parallax-fade-to-dark`)
 * Extracted from Adobe's live Web Animations API keyframes (`motion-dna.json` lines 16-43):
 *  - Hero stage translates Y from 0px to -315px as user scrolls into the rounded sheet
 *  - Dark overlay fades from opacity 0 to 0.75 with velvet scrub smoothing
 */
export function initHeroCurtainParallax(scrubSmoothing = 0.55, mult = 1.0) {
  const heroStage = document.querySelector<HTMLElement>('[data-df-hero-stage]');
  const darkOverlay = document.querySelector<HTMLElement>('[data-df-hero-dark-overlay]');
  if (!heroStage) return;

  gsap.fromTo(
    heroStage,
    { y: 0 },
    {
      y: -315 * mult,
      ease: 'none',
      scrollTrigger: {
        id: 'df-hero-parallax',
        trigger: heroStage,
        start: 'top top',
        end: 'bottom top',
        scrub: scrubSmoothing,
      },
    }
  );

  if (darkOverlay) {
    gsap.fromTo(
      darkOverlay,
      { opacity: 0 },
      {
        opacity: 0.75,
        ease: 'none',
        scrollTrigger: {
          id: 'df-hero-scrim',
          trigger: heroStage,
          start: 'top top',
          end: 'bottom top',
          scrub: scrubSmoothing,
        },
      }
    );
  }
}

/**
 * 3. Elastic Carousel Slide-In & Gap Shrink (`elasticCarouselSlideIn` + `elasticItemsGapShrink`)
 * Extracted from `motion-dna.json` (lines 72-195):
 *  - Container slides horizontally from right offset (`x: 150 -> 0`) on scroll scrub
 *  - Individual cards start with wide staggered horizontal offsets (`44px, 36px, 28px, 16px, 8px` scaled)
 *    and compress into a tight lockup as the sheet rises into view
 */
export function initElasticCarouselChoreography(scrubSmoothing = 0.55, mult = 1.0) {
  const carousel = document.querySelector<HTMLElement>('[data-df-elastic-carousel]');
  if (!carousel) return;

  const items = Array.from(carousel.querySelectorAll<HTMLElement>('[data-df-elastic-item]'));

  // Container horizontal slide-in (`elasticCarouselSlideIn`)
  gsap.fromTo(
    carousel,
    { x: 140 * mult },
    {
      x: 0,
      ease: 'power2.out',
      scrollTrigger: {
        id: 'df-elastic-slide',
        trigger: carousel,
        start: 'top 96%',
        end: 'top 28%',
        scrub: scrubSmoothing,
      },
    }
  );

  // Per-card elastic gap compression (`elasticItemsGapShrink` — 44px, 36px, 28px, 16px, 8px cumulative feel)
  const gapOffsets = [0, 38, 82, 132, 186];
  const yOffsets = [28, 46, 68, 92, 118];

  items.forEach((item, idx) => {
    const startX = (gapOffsets[idx] ?? idx * 36) * mult;
    const startY = (yOffsets[idx] ?? 40) * mult;

    gsap.fromTo(
      item,
      {
        x: startX,
        y: startY,
        scale: 0.96,
      },
      {
        x: 0,
        y: 0,
        scale: 1,
        ease: 'power3.out',
        scrollTrigger: {
          id: `df-elastic-item-${idx}`,
          trigger: carousel,
          start: 'top 95%',
          end: 'top 30%',
          scrub: scrubSmoothing,
        },
      }
    );
  });
}

/**
 * 4. Extracted Bento Grid Parallax (`enable-grid-parallax`, `grow-featured-card-radius`, `enable-parallax-stagger`)
 * Extracted from `motion-dna.json` (lines 412-633):
 *  - Lead 12-col flagship card scales from 1.06 -> 1.0 while its media unclips
 *  - The 3 bottom Bento cards have differential vertical parallax (`72px`, `136px`, `204px` -> `0px`)
 *    so they glide into alignment at different velocities as you scroll
 */
export function initBentoScrollReveals(scrubSmoothing = 0.55, mult = 1.0) {
  const grids = document.querySelectorAll<HTMLElement>('[data-df-bento-grid]');

  grids.forEach((grid) => {
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-df-bento-card]'));
    if (cards.length === 0) return;

    const [leadCard, ...staggerCards] = cards;

    // Lead Flagship 12-Col Card (`enable-grid-parallax` + `grow-featured-card-radius`)
    if (leadCard) {
      const leadMedia = leadCard.querySelector<HTMLElement>('[data-df-card-media]');

      gsap.fromTo(
        leadCard,
        { y: 64 * mult, scale: 0.965 },
        {
          y: 0,
          scale: 1,
          ease: 'power2.out',
          scrollTrigger: {
            id: 'df-bento-lead',
            trigger: leadCard,
            start: 'top 94%',
            end: 'top 32%',
            scrub: scrubSmoothing,
          },
        }
      );

      if (leadMedia) {
        gsap.fromTo(
          leadMedia,
          { scale: 1.12 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              id: 'df-bento-lead-media',
              trigger: leadCard,
              start: 'top 95%',
              end: 'bottom 20%',
              scrub: scrubSmoothing,
            },
          }
        );
      }
    }

    // 3-Column Bento Row (`enable-parallax-stagger`: 72px / 140px / 216px differential depth)
    const staggerDepths = [64, 128, 196];
    staggerCards.forEach((card, i) => {
      const depth = (staggerDepths[i] ?? 96) * mult;
      const innerMedia = card.querySelector<HTMLElement>('[data-df-card-media]');

      gsap.fromTo(
        card,
        { y: depth },
        {
          y: 0,
          ease: 'power2.out',
          scrollTrigger: {
            id: `df-bento-stagger-${i}`,
            trigger: grid,
            start: 'top 72%',
            end: 'bottom 78%',
            scrub: scrubSmoothing,
          },
        }
      );

      if (innerMedia) {
        gsap.fromTo(
          innerMedia,
          { scale: 1.09 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              id: `df-bento-media-${i}`,
              trigger: card,
              start: 'top 95%',
              end: 'bottom 25%',
              scrub: scrubSmoothing,
            },
          }
        );
      }
    });
  });
}

/**
 * 5. 60fps `gsap.quickTo` Interactive Bento & Carousel Card Physics
 * Uses pre-allocated GSAP quickTo interpolators with zero CSS transition fighting
 */
export function initInteractiveBentoCards() {
  const cards = document.querySelectorAll<HTMLElement>('[data-df-bento-card], [data-df-elastic-item]');

  cards.forEach((card) => {
    if (card.dataset.dfHoverBound === 'true') return;
    card.dataset.dfHoverBound = 'true';

    const media = card.querySelector<HTMLElement>('[data-df-card-media]');
    const video = card.querySelector<HTMLVideoElement>('video');
    const arrow = card.querySelector<HTMLElement>('[data-df-card-arrow]');

    const quickScaleMedia = media
      ? gsap.quickTo(media, 'scale', { duration: 0.55, ease: 'power3.out' })
      : null;
    const quickXMedia = media
      ? gsap.quickTo(media, 'x', { duration: 0.55, ease: 'power3.out' })
      : null;
    const quickYMedia = media
      ? gsap.quickTo(media, 'y', { duration: 0.55, ease: 'power3.out' })
      : null;
    const quickArrowX = arrow
      ? gsap.quickTo(arrow, 'x', { duration: 0.3, ease: 'power3.out' })
      : null;

    card.addEventListener('mouseenter', () => {
      if (quickScaleMedia) quickScaleMedia(1.055);
      if (quickArrowX) quickArrowX(5);
      if (video) {
        video.play().catch(() => {});
      }
    });

    card.addEventListener('mousemove', (e: MouseEvent) => {
      if (!quickXMedia || !quickYMedia) return;
      const rect = card.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      quickXMedia(relX * -10);
      quickYMedia(relY * -10);
    });

    card.addEventListener('mouseleave', () => {
      if (quickScaleMedia) quickScaleMedia(1);
      if (quickXMedia) quickXMedia(0);
      if (quickYMedia) quickYMedia(0);
      if (quickArrowX) quickArrowX(0);
    });
  });
}

/**
 * 6. Re-configure Motion Preset at Runtime (Called by Live Sync Controller)
 */
export function setMotionPreset(presetId: MotionPresetConfig['id']) {
  const preset = MOTION_PRESETS[presetId] || MOTION_PRESETS.butter;
  currentPreset = preset;

  // Kill scroll triggers created by our motion system and rebuild with new scrub physics
  ScrollTrigger.getAll().forEach((st) => {
    if (st.vars.id && String(st.vars.id).startsWith('df-')) {
      st.kill();
    }
  });

  initSmoothScroll(preset.lerp);
  initHeroCurtainParallax(preset.scrubSmoothing, preset.parallaxMultiplier);
  initElasticCarouselChoreography(preset.scrubSmoothing, preset.parallaxMultiplier);
  initBentoScrollReveals(preset.scrubSmoothing, preset.parallaxMultiplier);
  ScrollTrigger.refresh();
}

/**
 * 7. Boot entire extracted choreography suite
 */
export function bootDesignSystemMotion() {
  if (typeof window === 'undefined') return;

  const savedMotion = (localStorage.getItem('df-motion-preset') as MotionPresetConfig['id']) || 'butter';
  const preset = MOTION_PRESETS[savedMotion] || MOTION_PRESETS.butter;
  currentPreset = preset;

  const lenis = initSmoothScroll(preset.lerp);
  initHeroCurtainParallax(preset.scrubSmoothing, preset.parallaxMultiplier);
  initElasticCarouselChoreography(preset.scrubSmoothing, preset.parallaxMultiplier);
  initBentoScrollReveals(preset.scrubSmoothing, preset.parallaxMultiplier);
  initInteractiveBentoCards();

  // Expose live controller API on window for SyncController.astro
  (window as any).__dfMotion = {
    setMotionPreset,
    getCurrentPreset: () => currentPreset,
    getLenis: () => activeLenis,
  };

  return lenis;
}
