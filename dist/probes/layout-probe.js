import path from 'node:path';
export async function runLayoutProbe(page, screenshotsDir) {
    const sections = await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        // Identify top-level semantic blocks
        const rawCandidates = [];
        const header = document.querySelector('header, nav, .globalnav, [class*="gnav"]');
        if (header)
            rawCandidates.push(header);
        const mainSections = Array.from(document.querySelectorAll('main > section, main > div > section, main > div > div.section, body > main > div, body > section, [class*="section"]'));
        for (const el of mainSections) {
            const r = el.getBoundingClientRect();
            if (r.height >= 120 && r.width >= window.innerWidth * 0.65) {
                // Avoid adding parent container if its children are already in mainSections
                const hasLargeChildSection = rawCandidates.some((existing) => existing !== header && (existing.contains(el) || el.contains(existing)));
                if (!hasLargeChildSection) {
                    rawCandidates.push(el);
                }
            }
        }
        // Fallback if DOM uses deep nested divs inside main
        if (rawCandidates.length <= 2) {
            const mainEl = document.querySelector('main') || document.body;
            const children = Array.from(mainEl.children);
            for (const child of children) {
                const r = child.getBoundingClientRect();
                if (r.height >= 120 && r.width >= window.innerWidth * 0.6) {
                    rawCandidates.push(child);
                }
                else if (child.children.length > 1) {
                    for (const grand of Array.from(child.children)) {
                        const gr = grand.getBoundingClientRect();
                        if (gr.height >= 140 && gr.width >= window.innerWidth * 0.6) {
                            rawCandidates.push(grand);
                        }
                    }
                }
            }
        }
        const footer = document.querySelector('footer, .globalfooter, [class*="feds-footer"]');
        if (footer && !rawCandidates.includes(footer))
            rawCandidates.push(footer);
        // Sort top-to-bottom and deduplicate overlapping vertical ranges
        const sorted = rawCandidates
            .map((el) => ({ el, rect: el.getBoundingClientRect() }))
            .filter((item) => item.rect.height >= 50 && item.rect.width >= 300)
            .sort((a, b) => a.rect.top - b.rect.top);
        const deduped = [];
        for (const item of sorted) {
            const overlaps = deduped.some((d) => Math.abs(d.rect.top - item.rect.top) < 40 &&
                Math.abs(d.rect.height - item.rect.height) < 80);
            if (!overlaps && deduped.length < 14) {
                deduped.push(item);
            }
        }
        const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
        const calcAspect = (w, h) => {
            if (!w || !h)
                return 'auto';
            const rw = Math.round(w / 10);
            const rh = Math.round(h / 10);
            const g = gcd(rw, rh) || 1;
            return `${Math.round(rw / g)}:${Math.round(rh / g)}`;
        };
        return deduped.map((item, idx) => {
            const { el, rect } = item;
            const cs = window.getComputedStyle(el);
            const tag = el.tagName.toLowerCase();
            const cls = typeof el.className === 'string'
                ? el.className.split(/\s+/).filter(Boolean).slice(0, 3).join('.')
                : '';
            const selectorHint = `${tag}${cls ? '.' + cls : ''}`;
            const headings = Array.from(el.querySelectorAll('h1, h2, h3, [role="heading"]'))
                .map((h) => (h.textContent || '').replace(/\s+/g, ' ').trim())
                .filter((t) => t.length > 1)
                .slice(0, 8);
            // Extract CTAs
            const ctas = Array.from(el.querySelectorAll('a, button'))
                .filter((btn) => {
                const bcs = window.getComputedStyle(btn);
                const br = btn.getBoundingClientRect();
                return (br.width > 60 &&
                    br.height >= 28 &&
                    br.height <= 72 &&
                    (parseFloat(bcs.borderRadius) >= 4 || bcs.backgroundColor !== 'rgba(0, 0, 0, 0)' || parseFloat(bcs.borderTopWidth) > 0));
            })
                .slice(0, 6)
                .map((btn) => {
                const bcs = window.getComputedStyle(btn);
                return {
                    text: (btn.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
                    bg: bcs.backgroundColor,
                    color: bcs.color,
                    radius: bcs.borderRadius,
                    padding: `${bcs.paddingTop} ${bcs.paddingRight}`,
                };
            });
            // Extract internal cards / Bento tiles
            const cardCandidates = Array.from(el.querySelectorAll('div, article, li, a')).filter((c) => {
                const cr = c.getBoundingClientRect();
                if (cr.width < 220 || cr.width > window.innerWidth * 0.92 || cr.height < 180 || cr.height > 900)
                    return false;
                const ccs = window.getComputedStyle(c);
                const hasSurface = ccs.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
                    ccs.backgroundImage !== 'none' ||
                    parseFloat(ccs.borderRadius) >= 8 ||
                    c.querySelector('img, video, picture') !== null;
                return hasSurface;
            });
            // Keep distinct non-nested cards
            const distinctCards = [];
            for (const c of cardCandidates) {
                if (!distinctCards.some((existing) => existing.contains(c) || c.contains(existing))) {
                    distinctCards.push(c);
                }
                if (distinctCards.length >= 10)
                    break;
            }
            const cards = distinctCards.map((card, cIdx) => {
                const cr = card.getBoundingClientRect();
                const ccs = window.getComputedStyle(card);
                const ratioWidth = cr.width / window.innerWidth;
                let colSpanHint = 'col-span-4 (1/3 width)';
                if (ratioWidth > 0.6)
                    colSpanHint = 'col-span-8 (2/3 asymmetric wide)';
                else if (ratioWidth > 0.42)
                    colSpanHint = 'col-span-6 (1/2 split)';
                else if (ratioWidth < 0.28)
                    colSpanHint = 'col-span-3 (1/4 compact)';
                const headingEl = card.querySelector('h2, h3, h4, strong');
                const ctaEl = card.querySelector('a, button');
                return {
                    index: cIdx,
                    widthPx: Math.round(cr.width),
                    heightPx: Math.round(cr.height),
                    aspectRatio: calcAspect(cr.width, cr.height),
                    colSpanHint,
                    backgroundColor: ccs.backgroundColor,
                    backgroundImage: ccs.backgroundImage !== 'none' ? ccs.backgroundImage.slice(0, 180) : 'none',
                    borderRadius: ccs.borderRadius,
                    padding: `${ccs.paddingTop} ${ccs.paddingRight} ${ccs.paddingBottom} ${ccs.paddingLeft}`,
                    hasVideo: card.querySelector('video') !== null,
                    hasImage: card.querySelector('img, picture') !== null,
                    headingSample: (headingEl?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
                    ctaSample: (ctaEl?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 35),
                };
            });
            // Classify section archetype
            let archetype = 'content-section';
            if (idx === 0 || tag === 'header' || tag === 'nav' || selectorHint.includes('nav')) {
                archetype = 'global-navigation';
            }
            else if (tag === 'footer' || selectorHint.includes('footer')) {
                archetype = 'enterprise-footer';
            }
            else if (idx === 1 || el.querySelector('h1') !== null || (rect.top < 350 && rect.height >= 420)) {
                archetype = 'hero-stage';
            }
            else if (cards.length >= 3) {
                archetype = 'bento-grid';
            }
            else if (el.querySelector('[role="tablist"], [role="tab"]') !== null) {
                archetype = 'interactive-tabs';
            }
            else if (rect.height < 220) {
                archetype = 'promo-ribbon';
            }
            else {
                archetype = 'feature-showcase';
            }
            // Check inner grid container if the outer wrapper is block
            let layoutType = cs.display;
            let gridTemplateColumns = cs.gridTemplateColumns;
            let gap = cs.gap;
            const innerGrid = el.querySelector('[style*="grid"], [class*="grid"], [class*="brick"], [class*="bento"]');
            if (innerGrid) {
                const igs = window.getComputedStyle(innerGrid);
                if (igs.display.includes('grid') || igs.display.includes('flex')) {
                    layoutType = igs.display;
                    gridTemplateColumns = igs.gridTemplateColumns;
                    gap = igs.gap;
                }
            }
            return {
                id: `section-${idx + 1}-${archetype}`,
                index: idx + 1,
                archetype,
                tag,
                selectorHint,
                boundingBox: {
                    y: Math.max(0, Math.round(rect.top + window.scrollY)),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                },
                layoutType,
                gridTemplateColumns: gridTemplateColumns || 'none',
                gap: gap || '0px',
                padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
                backgroundColor: cs.backgroundColor,
                backgroundImage: cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 180) : 'none',
                headings,
                ctas,
                cards,
            };
        });
    });
    // Capture cropped screenshots of top sections for visual reference
    const viewport = page.viewportSize() || { width: 1440, height: 900 };
    for (const sec of sections.slice(0, 8)) {
        try {
            const fileName = `${String(sec.index).padStart(2, '0')}-${sec.archetype}.png`;
            const fullPath = path.join(screenshotsDir, fileName);
            const scrollY = Math.max(0, sec.boundingBox.y - 20);
            await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), scrollY);
            await page.waitForTimeout(200);
            const clipHeight = Math.min(Math.max(sec.boundingBox.height, 80), viewport.height - 20);
            await page.screenshot({
                path: fullPath,
                clip: {
                    x: 0,
                    y: 0,
                    width: viewport.width,
                    height: clipHeight,
                },
            });
            sec.screenshotFile = `reference-captures/sections/${fileName}`;
        }
        catch { }
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    return sections;
}
