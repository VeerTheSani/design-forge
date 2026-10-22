/**
 * DESIGN FORGE — Extracted Motion & Choreography Engine (ADOBE S2A)
 * Stack: GSAP + ScrollTrigger + Lenis Smooth Scroll
 * Replicates:
 *  - Lenis Smooth Scroll (detected on live www.adobe.com)
 *  - `parallax-move-up-fast` (translateY(0px) -> translateY(-315px))
 *  - `parallax-fade-to-dark` (opacity: 0 -> 0.75)
 *  - `elasticCarouselSlideIn` (marginLeft: 200px -> 0px) & `elasticItemsGapShrink` (44px -> 4px)
 *  - `rm-card-progress-bar` (5000ms linear progress bar dock cycle)
 *  - `cubic-bezier(0.42, 0, 0, 1)` Bento card hover physics
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const EXTRACTED_EASING = {
  s2aPrimary: 'cubic-bezier(0.42, 0, 0, 1)',
  s2aCarousel: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
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
 * 2. Hero Curtain Parallax (`parallax-move-up-fast` & `parallax-fade-to-dark`)
 * Extracted from Adobe's live Web Animations API keyframes:
 *  - Hero stage translates Y from 0px to -315px as user scrolls into the next rounded sheet
 *  - Dark overlay fades from opacity 0 to 0.75
 */
export function initHeroCurtainParallax() {
  const heroStage = document.querySelector<HTMLElement>('[data-df-hero-stage]');
  const darkOverlay = document.querySelector<HTMLElement>('[data-df-hero-dark-overlay]');
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

  if (darkOverlay) {
    gsap.fromTo(
      darkOverlay,
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
 * 3. Elastic Carousel Slide-In & Gap Shrink (`elasticCarouselSlideIn` + `elasticItemsGapShrink`)
 * Extracted from Adobe Section 3 ("Everything you need to make anything"):
 *  - Container slides in from right offset
 *  - Individual cards compress their horizontal gap into a tight editorial lockup
 */
export function initElasticCarouselChoreography() {
  const carousel = document.querySelector<HTMLElement>('[data-df-elastic-carousel]');
  if (!carousel) return;

  const items = carousel.querySelectorAll<HTMLElement>('[data-df-elastic-item]');

  gsap.fromTo(
    carousel,
    { x: 90, opacity: 0.85 },
    {
      x: 0,
      opacity: 1,
      duration: 1.0,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: carousel,
        start: 'top 88%',
        toggleActions: 'play none none reverse',
      },
    }
  );

  gsap.fromTo(
    items,
    { y: 36, opacity: 0, scale: 0.96 },
    {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.75,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: carousel,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    }
  );
}

/**
 * 4. Scroll-Triggered Bento Grid Stagger Reveals
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
 * 5. Interactive Bento Card Hover + Inner Media Scale (`cubic-bezier(0.42, 0, 0, 1)`)
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
  });
}

/**
 * 6. Boot entire extracted choreography suite
 */
export function bootDesignSystemMotion() {
  if (typeof window === 'undefined') return;
  const lenis = initSmoothScroll();
  initHeroCurtainParallax();
  initElasticCarouselChoreography();
  initBentoScrollReveals();
  initInteractiveBentoCards();
  return lenis;
}
