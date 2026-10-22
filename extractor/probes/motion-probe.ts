import { Page } from 'playwright-core';

export interface ActiveAnimationRecord {
  name: string;
  targetTag: string;
  targetClass: string;
  duration: number | string;
  delay: number;
  easing: string;
  iterations: number | string;
  keyframes: Record<string, any>[];
}

export interface TransitionRecipe {
  selectorHint: string;
  tag: string;
  transitionProperty: string;
  transitionDuration: string;
  transitionTimingFunction: string;
  transitionDelay: string;
  transform: string;
  willChange: string;
}

export interface KeyframeRuleRecord {
  name: string;
  cssText: string;
}

export interface ScrollDeltaSample {
  selectorHint: string;
  topStyleAt0: { transform: string; opacity: string; backgroundColor: string; backdropFilter: string };
  topStyleAtScrolled: { transform: string; opacity: string; backgroundColor: string; backdropFilter: string };
}

export interface ExtractedMotionRaw {
  detectedLibraries: string[];
  uniqueEasingCurves: string[];
  uniqueDurations: string[];
  activeWebAnimations: ActiveAnimationRecord[];
  cssTransitions: TransitionRecipe[];
  cssKeyframes: KeyframeRuleRecord[];
  scrollDeltas: ScrollDeltaSample[];
  webglShadersCaptured: number;
}

export async function runMotionProbe(page: Page): Promise<ExtractedMotionRaw> {
  // Capture baseline state at scrollTop = 0, then scroll down 600px and compare sticky/animated elements
  const baseMotion = await page.evaluate(async () => {
    const detectedLibraries: string[] = [];
    const win = window as any;
    if (win.gsap || win.GreenSockGlobals) detectedLibraries.push('GSAP');
    if (win.ScrollTrigger) detectedLibraries.push('GSAP ScrollTrigger');
    if (win.Lenis) detectedLibraries.push('Lenis Smooth Scroll');
    if (win.lottie || win.bodymovin) detectedLibraries.push('Lottie');
    if (win.THREE) detectedLibraries.push('Three.js / WebGL');
    if (document.querySelector('[data-framer-appear-id], [data-projection-id]')) detectedLibraries.push('Framer Motion');

    // 1. Web Animations API (`document.getAnimations()`)
    const activeWebAnimations: ActiveAnimationRecord[] = [];
    const easingSet = new Set<string>();
    const durationSet = new Set<string>();

    try {
      const anims = (document as any).getAnimations ? (document as any).getAnimations({ subtree: true }) : [];
      for (const anim of anims.slice(0, 60)) {
        const effect = anim.effect as KeyframeEffect | null;
        if (!effect) continue;
        const timing = effect.getTiming();
        const target = effect.target as HTMLElement | null;
        const kfs = effect.getKeyframes().map((k) => {
          const clean: Record<string, any> = {};
          for (const [key, val] of Object.entries(k)) {
            if (val !== undefined && val !== null && key !== 'composite') clean[key] = val;
          }
          return clean;
        });

        const easingStr = String(timing.easing || 'linear');
        easingSet.add(easingStr);
        if (typeof timing.duration === 'number' && timing.duration > 0) {
          durationSet.add(`${timing.duration}ms`);
        }

        activeWebAnimations.push({
          name: (anim as any).animationName || anim.id || 'web-animation',
          targetTag: target?.tagName?.toLowerCase() || 'unknown',
          targetClass: typeof target?.className === 'string' ? target.className.split(/\s+/).slice(0, 3).join('.') : '',
          duration: typeof timing.duration === 'number' ? timing.duration : String(timing.duration ?? 'auto'),
          delay: timing.delay ?? 0,
          easing: easingStr,
          iterations: timing.iterations ?? 1,
          keyframes: kfs.slice(0, 6),
        });
      }
    } catch {}

    // 2. CSS Transitions & Transforms across interactive elements (buttons, links, cards, nav items)
    const cssTransitions: TransitionRecipe[] = [];
    const seenTransitions = new Set<string>();
    const allElements = Array.from(document.querySelectorAll('a, button, [role="button"], section *, header *, nav *'));

    for (const el of allElements.slice(0, 1500)) {
      const cs = window.getComputedStyle(el);
      const dur = cs.transitionDuration;
      if (!dur || dur === '0s' || dur === '0ms') continue;
      // Skip if all comma-separated durations are 0s
      if (
        dur
          .split(',')
          .every((d) => d.trim() === '0s' || d.trim() === '0ms')
      ) {
        continue;
      }

      const prop = cs.transitionProperty;
      const timing = cs.transitionTimingFunction;
      const delay = cs.transitionDelay;

      timing.split(/\),\s*/).forEach((t) => {
        const cleaned = t.includes('(') && !t.endsWith(')') ? t + ')' : t;
        if (cleaned) easingSet.add(cleaned.trim());
      });
      dur.split(',').forEach((d) => {
        const trimmed = d.trim();
        if (trimmed && trimmed !== '0s') durationSet.add(trimmed);
      });

      const tag = el.tagName.toLowerCase();
      const cls = typeof (el as HTMLElement).className === 'string'
        ? (el as HTMLElement).className.split(/\s+/).filter(Boolean).slice(0, 2).join('.')
        : '';
      const selectorHint = `${tag}${cls ? '.' + cls : ''}`;
      const sig = `${selectorHint}|${prop}|${dur}|${timing}`;

      if (!seenTransitions.has(sig) && cssTransitions.length < 45) {
        seenTransitions.add(sig);
        cssTransitions.push({
          selectorHint,
          tag,
          transitionProperty: prop,
          transitionDuration: dur,
          transitionTimingFunction: timing,
          transitionDelay: delay,
          transform: cs.transform !== 'none' ? cs.transform : 'none',
          willChange: cs.willChange,
        });
      }
    }

    // 3. Extract @keyframes rules from accessible stylesheets
    const cssKeyframes: KeyframeRuleRecord[] = [];
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule.type === CSSRule.KEYFRAMES_RULE) {
              const kfRule = rule as CSSKeyframesRule;
              if (cssKeyframes.length < 30 && !cssKeyframes.some((k) => k.name === kfRule.name)) {
                cssKeyframes.push({
                  name: kfRule.name,
                  cssText: kfRule.cssText.replace(/\s+/g, ' ').slice(0, 600),
                });
              }
            }
          }
        } catch {}
      }
    } catch {}

    // 4. Sample scroll delta between scrollY=0 and scrollY=650
    const watchTargets = Array.from(
      document.querySelectorAll('header, nav, [class*="nav"], [class*="hero"], [class*="sticky"], [class*="card"], section > div')
    ).slice(0, 35);

    const readSnap = (el: Element) => {
      const cs = window.getComputedStyle(el);
      return {
        transform: cs.transform,
        opacity: cs.opacity,
        backgroundColor: cs.backgroundColor,
        backdropFilter: (cs as any).backdropFilter || (cs as any).webkitBackdropFilter || 'none',
      };
    };

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    await new Promise((r) => setTimeout(r, 150));
    const snap0 = watchTargets.map(readSnap);

    window.scrollTo({ top: 650, behavior: 'instant' as ScrollBehavior });
    await new Promise((r) => setTimeout(r, 250));
    const snapScrolled = watchTargets.map(readSnap);

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    const scrollDeltas: ScrollDeltaSample[] = [];
    for (let i = 0; i < watchTargets.length; i++) {
      const a = snap0[i];
      const b = snapScrolled[i];
      if (
        a.transform !== b.transform ||
        a.opacity !== b.opacity ||
        a.backgroundColor !== b.backgroundColor ||
        a.backdropFilter !== b.backdropFilter
      ) {
        const el = watchTargets[i] as HTMLElement;
        const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
        scrollDeltas.push({
          selectorHint: `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}`,
          topStyleAt0: a,
          topStyleAtScrolled: b,
        });
      }
    }

    return {
      detectedLibraries,
      uniqueEasingCurves: Array.from(easingSet),
      uniqueDurations: Array.from(durationSet),
      activeWebAnimations,
      cssTransitions,
      cssKeyframes,
      scrollDeltas,
      webglShadersCaptured: Array.isArray(win.__DESIGN_FORGE_SHADERS__) ? win.__DESIGN_FORGE_SHADERS__.length : 0,
    };
  });

  return baseMotion;
}
