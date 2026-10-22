export async function runMediaProbe(page) {
    return await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const slots = [];
        const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
        const formatRatio = (w, h) => {
            if (!w || !h)
                return '16:9';
            const ratio = w / h;
            if (Math.abs(ratio - 16 / 9) < 0.15)
                return '16:9';
            if (Math.abs(ratio - 4 / 3) < 0.12)
                return '4:3';
            if (Math.abs(ratio - 1) < 0.1)
                return '1:1';
            if (Math.abs(ratio - 21 / 9) < 0.25)
                return '21:9';
            if (Math.abs(ratio - 3 / 4) < 0.12)
                return '3:4';
            if (Math.abs(ratio - 9 / 16) < 0.12)
                return '9:16';
            const rw = Math.max(1, Math.round(w / 20));
            const rh = Math.max(1, Math.round(h / 20));
            const g = gcd(rw, rh) || 1;
            return `${Math.round(rw / g)}:${Math.round(rh / g)}`;
        };
        // 1. Inspect <video> elements (Google Flow targets)
        const videos = Array.from(document.querySelectorAll('video'));
        videos.forEach((v, idx) => {
            const r = v.getBoundingClientRect();
            const w = Math.round(r.width) || v.videoWidth || 1280;
            const h = Math.round(r.height) || v.videoHeight || 720;
            if (w < 80 || h < 60)
                return;
            const cs = window.getComputedStyle(v);
            const container = v.closest('section, article, [class*="card"], [class*="brick"], [class*="hero"]') || v.parentElement;
            const heading = container?.querySelector('h1, h2, h3, h4')?.textContent?.replace(/\s+/g, ' ').trim() || 'Featured Motion Stage';
            const src = v.currentSrc || v.src || v.querySelector('source')?.src || '';
            slots.push({
                slotId: `FLOW-VIDEO-${String(idx + 1).padStart(2, '0')}`,
                mediaType: 'video-loop',
                generatorTarget: 'google-flow',
                renderedWidth: w,
                renderedHeight: h,
                aspectRatio: formatRatio(w, h),
                objectFit: cs.objectFit || 'cover',
                borderRadius: cs.borderRadius || '0px',
                sectionContext: container?.tagName.toLowerCase() || 'section',
                nearbyHeading: heading.slice(0, 70),
                hasTextOverlay: true,
                textSafeZoneHint: w > 900 ? 'Left 45% or Top-Center negative space for headline + CTA overlay' : 'Bottom 35% gradient-protected safe zone for card copy',
                sourceUrlHint: src.slice(0, 140),
                posterUrlHint: (v.poster || '').slice(0, 140),
                videoAttributes: {
                    autoplay: v.autoplay || v.hasAttribute('autoplay'),
                    loop: v.loop || v.hasAttribute('loop'),
                    muted: v.muted || v.hasAttribute('muted'),
                    playsInline: v.playsInline || v.hasAttribute('playsinline'),
                },
            });
        });
        // 2. Inspect significant <img> / <picture> elements (Nano Banana targets)
        const images = Array.from(document.querySelectorAll('img'));
        let imgCount = 0;
        for (const img of images) {
            const r = img.getBoundingClientRect();
            const w = Math.round(r.width);
            const h = Math.round(r.height);
            // Skip tiny icons/logos/tracking pixels
            if (w < 140 || h < 110)
                continue;
            if (imgCount >= 18)
                break;
            imgCount++;
            const cs = window.getComputedStyle(img);
            const container = img.closest('section, article, [class*="card"], [class*="brick"], [class*="hero"]') || img.parentElement;
            const heading = container?.querySelector('h1, h2, h3, h4')?.textContent?.replace(/\s+/g, ' ').trim() ||
                img.alt ||
                `Visual Slot ${imgCount}`;
            const isHero = (r.top + window.scrollY < 750 && w >= 600) || container?.querySelector('h1') !== null;
            const pos = cs.position;
            const parentPos = container ? window.getComputedStyle(container).position : 'static';
            const hasTextOverlay = pos === 'absolute' || parentPos === 'relative';
            slots.push({
                slotId: `NANO-IMG-${String(imgCount).padStart(2, '0')}`,
                mediaType: isHero ? 'hero-composite-image' : w >= 320 ? 'bento-card-visual' : 'feature-illustration',
                generatorTarget: 'nano-banana',
                renderedWidth: w,
                renderedHeight: h,
                aspectRatio: formatRatio(w, h),
                objectFit: cs.objectFit || 'cover',
                borderRadius: cs.borderRadius || '0px',
                sectionContext: isHero ? 'hero-stage' : 'bento-or-feature-card',
                nearbyHeading: heading.slice(0, 70),
                hasTextOverlay,
                textSafeZoneHint: isHero
                    ? 'Keep upper-left or center-top 40% clean with controlled luminance for high-contrast display typography'
                    : 'Subject anchored in lower-right or center-bottom; top 35% clean background for card title & eyebrow',
                sourceUrlHint: (img.currentSrc || img.src || '').slice(0, 140),
            });
        }
        return slots;
    });
}
