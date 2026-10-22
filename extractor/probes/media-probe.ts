import { Page } from 'playwright-core';

export interface MediaSlot {
  slotId: string;
  mediaType: 'video-loop' | 'hero-composite-image' | 'bento-card-visual' | 'feature-illustration' | 'svg-vector';
  generatorTarget: 'google-flow' | 'nano-banana' | 'svg-code';
  renderedWidth: number;
  renderedHeight: number;
  aspectRatio: string;
  objectFit: string;
  borderRadius: string;
  sectionContext: string;
  nearbyHeading: string;
  nearbyCopy: string;
  hasTextOverlay: boolean;
  textSafeZoneHint: string;
  sourceUrlHint: string;
  posterUrlHint?: string;
  videoAttributes?: {
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    playsInline: boolean;
  };
}

export async function runMediaProbe(page: Page): Promise<MediaSlot[]> {
  return await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    const slots: MediaSlot[] = [];
    const seenKeys = new Set<string>();

    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const formatRatio = (w: number, h: number): string => {
      if (!w || !h) return '16:9';
      const ratio = w / h;
      if (Math.abs(ratio - 16 / 9) < 0.22) return '16:9';
      if (Math.abs(ratio - 16 / 10) < 0.16) return '16:10';
      if (Math.abs(ratio - 4 / 3) < 0.14) return '4:3';
      if (Math.abs(ratio - 4 / 5) < 0.14) return '4:5';
      if (Math.abs(ratio - 3 / 4) < 0.14) return '3:4';
      if (Math.abs(ratio - 1) < 0.12) return '1:1';
      if (Math.abs(ratio - 21 / 9) < 0.28) return '21:9';
      if (Math.abs(ratio - 9 / 16) < 0.14) return '9:16';
      const rw = Math.max(1, Math.round(w / 20));
      const rh = Math.max(1, Math.round(h / 20));
      const g = gcd(rw, rh) || 1;
      return `${Math.round(rw / g)}:${Math.round(rh / g)}`;
    };

    const findNearestCopy = (el: Element): { heading: string; copy: string; sectionName: string } => {
      let cur: Element | null = el;
      let heading = '';
      let copy = '';
      let sectionName = 'section';

      for (let depth = 0; depth < 6 && cur; depth++) {
        if (!heading) {
          const h = cur.querySelector('h1, h2, h3, h4, strong, [class*="heading"], [class*="title"]');
          const text = h?.textContent?.replace(/\s+/g, ' ').trim() || '';
          if (text.length > 3 && text.length < 120) heading = text;
        }
        if (!copy) {
          const p = cur.querySelector('p, [class*="body"], [class*="desc"]');
          const text = p?.textContent?.replace(/\s+/g, ' ').trim() || '';
          if (text.length > 10 && text !== heading) copy = text.slice(0, 140);
        }
        const cls = (cur.className && typeof cur.className === 'string' ? cur.className : '').toLowerCase();
        if (cls.includes('hero') || cls.includes('marquee')) sectionName = 'hero-stage';
        else if (cls.includes('carousel')) sectionName = 'elastic-carousel';
        else if (cls.includes('bento') || cls.includes('grid') || cls.includes('card')) sectionName = 'bento-showcase';
        cur = cur.parentElement;
      }

      return {
        heading: heading || 'Visual Showcase Stage',
        copy,
        sectionName,
      };
    };

    // 1. Inspect real visible <video> elements (skipping empty 1280x720 tracking/preload shells)
    const videos = Array.from(document.querySelectorAll('video'));
    let videoIdx = 0;
    for (const v of videos) {
      const r = v.getBoundingClientRect();
      const src = v.currentSrc || v.src || v.querySelector('source')?.src || '';
      const poster = v.poster || '';

      // Filter out unmounted/empty video shells with no source & no poster
      if (!src && !poster) continue;

      const w = Math.round(r.width) || v.videoWidth || 1280;
      const h = Math.round(r.height) || v.videoHeight || 720;
      if (w < 120 || h < 90) continue;

      const dedupeKey = src || poster || `${w}x${h}-${Math.round(r.top)}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      videoIdx++;
      const cs = window.getComputedStyle(v);
      const { heading, copy, sectionName } = findNearestCopy(v);

      slots.push({
        slotId: `FLOW-VIDEO-${String(videoIdx).padStart(2, '0')}`,
        mediaType: 'video-loop',
        generatorTarget: 'google-flow',
        renderedWidth: w,
        renderedHeight: h,
        aspectRatio: formatRatio(w, h),
        objectFit: cs.objectFit || 'cover',
        borderRadius: cs.borderRadius && cs.borderRadius !== '0px' ? cs.borderRadius : '16px',
        sectionContext: sectionName,
        nearbyHeading: heading.slice(0, 80),
        nearbyCopy: copy,
        hasTextOverlay: true,
        textSafeZoneHint:
          w > 900
            ? 'Left 45% negative-space safe zone (#0B0B10 obsidian falloff) for 80px Display Black headline + pill CTAs'
            : 'Top 25% & Bottom 25% clean tonal gradient for badge & card copy legibility',
        sourceUrlHint: src.slice(0, 160),
        posterUrlHint: poster.slice(0, 160),
        videoAttributes: {
          autoplay: v.autoplay || v.hasAttribute('autoplay'),
          loop: v.loop || v.hasAttribute('loop'),
          muted: v.muted || v.hasAttribute('muted'),
          playsInline: v.playsInline || v.hasAttribute('playsinline'),
        },
      });
    }

    // 2. Inspect significant <img> / <picture> elements (Nano Banana targets)
    const images = Array.from(document.querySelectorAll('img'));
    let imgCount = 0;
    for (const img of images) {
      const r = img.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      const src = img.currentSrc || img.src || '';
      if (w < 160 || h < 120 || !src) continue;
      if (seenKeys.has(src)) continue;
      seenKeys.add(src);
      if (imgCount >= 12) break;
      imgCount++;

      const cs = window.getComputedStyle(img);
      const { heading, copy, sectionName } = findNearestCopy(img);
      const isHero = r.top + window.scrollY < 850 && w >= 600;

      slots.push({
        slotId: `NANO-IMG-${String(imgCount).padStart(2, '0')}`,
        mediaType: isHero ? 'hero-composite-image' : w >= 320 ? 'bento-card-visual' : 'feature-illustration',
        generatorTarget: 'nano-banana',
        renderedWidth: w,
        renderedHeight: h,
        aspectRatio: formatRatio(w, h),
        objectFit: cs.objectFit || 'cover',
        borderRadius: cs.borderRadius && cs.borderRadius !== '0px' ? cs.borderRadius : '16px',
        sectionContext: isHero ? 'hero-stage' : sectionName,
        nearbyHeading: (heading !== 'Visual Showcase Stage' ? heading : img.alt || `Bento Feature Slot ${imgCount}`).slice(0, 80),
        nearbyCopy: copy,
        hasTextOverlay: true,
        textSafeZoneHint: isHero
          ? 'Left 45% negative space with controlled dark luminance for 80px Display Black typography'
          : 'Subject centered in middle/lower-right 65%; clean perimeter for 24px card title & eyebrow pill',
        sourceUrlHint: src.slice(0, 160),
      });
    }

    return slots;
  });
}
