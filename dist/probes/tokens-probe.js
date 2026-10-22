export async function runTokensProbe(page) {
    return await page.evaluate(() => {
        // 1. Collect CSS custom properties declared on :root / html / body
        const rootCustomProperties = {};
        try {
            for (const sheet of Array.from(document.styleSheets)) {
                try {
                    for (const rule of Array.from(sheet.cssRules || [])) {
                        if (rule instanceof CSSStyleRule && (rule.selectorText === ':root' || rule.selectorText === 'html' || rule.selectorText === 'body')) {
                            for (let i = 0; i < rule.style.length; i++) {
                                const prop = rule.style[i];
                                if (prop.startsWith('--')) {
                                    rootCustomProperties[prop] = rule.style.getPropertyValue(prop).trim();
                                }
                            }
                        }
                    }
                }
                catch { }
            }
        }
        catch { }
        // 2. Walk visible elements
        const allElements = Array.from(document.querySelectorAll('body *'));
        const bgMap = new Map();
        const textMap = new Map();
        const borderMap = new Map();
        const gradients = [];
        const backdropBlurs = [];
        const shadowMap = new Map();
        const radiusMap = new Map();
        const gapMap = new Map();
        const maxWidthSet = new Set();
        const gridTemplateSet = new Set();
        const fontFamilySet = new Set();
        const sectionPaddings = [];
        const typographyCandidates = new Map();
        for (const el of allElements.slice(0, 1800)) {
            const rect = el.getBoundingClientRect();
            if (rect.width < 4 || rect.height < 4)
                continue;
            const cs = window.getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0)
                continue;
            const tag = el.tagName.toLowerCase();
            const classHint = (typeof el.className === 'string' ? el.className : '')
                .split(/\s+/)
                .slice(0, 2)
                .join('.');
            const roleLabel = `${tag}${classHint ? '.' + classHint : ''}`;
            // Font family
            if (cs.fontFamily) {
                fontFamilySet.add(cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim());
            }
            // Backgrounds
            const bg = cs.backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                const prev = bgMap.get(bg);
                if (prev)
                    prev.count++;
                else
                    bgMap.set(bg, { count: 1, sampleRole: roleLabel });
            }
            // Gradients
            const bgImage = cs.backgroundImage;
            if (bgImage && bgImage !== 'none' && bgImage.includes('gradient')) {
                if (gradients.length < 25 && !gradients.some((g) => g.value === bgImage)) {
                    gradients.push({ value: bgImage, sampleElement: roleLabel });
                }
            }
            // Text color
            const color = cs.color;
            if (color && el.children.length === 0 && (el.textContent || '').trim().length > 0) {
                const prev = textMap.get(color);
                if (prev)
                    prev.count++;
                else
                    textMap.set(color, { count: 1, sampleRole: roleLabel });
            }
            // Borders
            const bw = parseFloat(cs.borderTopWidth);
            if (bw > 0 && cs.borderTopColor && cs.borderTopColor !== 'rgba(0, 0, 0, 0)') {
                borderMap.set(cs.borderTopColor, (borderMap.get(cs.borderTopColor) || 0) + 1);
            }
            // Backdrop filter (Glassmorphism)
            const bf = cs.backdropFilter || cs.webkitBackdropFilter;
            if (bf && bf !== 'none') {
                if (backdropBlurs.length < 15 && !backdropBlurs.some((b) => b.backdropFilter === bf && b.backgroundColor === bg)) {
                    backdropBlurs.push({
                        backdropFilter: bf,
                        backgroundColor: bg,
                        border: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
                        role: roleLabel,
                    });
                }
            }
            // Box Shadows
            if (cs.boxShadow && cs.boxShadow !== 'none') {
                const prev = shadowMap.get(cs.boxShadow);
                if (prev)
                    prev.count++;
                else
                    shadowMap.set(cs.boxShadow, { count: 1, role: roleLabel });
            }
            // Border Radius
            if (cs.borderRadius && cs.borderRadius !== '0px') {
                radiusMap.set(cs.borderRadius, (radiusMap.get(cs.borderRadius) || 0) + 1);
            }
            // Grid & Gaps
            if (cs.display.includes('grid') && cs.gridTemplateColumns && cs.gridTemplateColumns !== 'none') {
                if (gridTemplateSet.size < 20)
                    gridTemplateSet.add(cs.gridTemplateColumns);
            }
            if (cs.gap && cs.gap !== 'normal' && cs.gap !== '0px') {
                gapMap.set(cs.gap, (gapMap.get(cs.gap) || 0) + 1);
            }
            // Max widths
            if (cs.maxWidth && cs.maxWidth !== 'none' && !cs.maxWidth.includes('%') && parseFloat(cs.maxWidth) >= 600) {
                maxWidthSet.add(cs.maxWidth);
            }
            // Section Paddings
            if ((tag === 'section' || tag === 'header' || tag === 'footer' || rect.width >= window.innerWidth * 0.85) && rect.height > 180) {
                const vPad = `${cs.paddingTop} / ${cs.paddingBottom}`;
                const hPad = `${cs.paddingLeft} / ${cs.paddingRight}`;
                if ((parseFloat(cs.paddingTop) > 16 || parseFloat(cs.paddingBottom) > 16) &&
                    sectionPaddings.length < 15 &&
                    !sectionPaddings.some((p) => p.vertical === vPad && p.horizontal === hPad)) {
                    sectionPaddings.push({ vertical: vPad, horizontal: hPad });
                }
            }
            // Typography scale extraction
            const directText = Array.from(el.childNodes)
                .filter((n) => n.nodeType === Node.TEXT_NODE)
                .map((n) => n.textContent?.trim())
                .join(' ')
                .trim();
            if (directText.length > 2) {
                const px = Math.round(parseFloat(cs.fontSize));
                const lhPx = parseFloat(cs.lineHeight) || px * 1.25;
                const ratio = Math.round((lhPx / px) * 100) / 100;
                const key = `${px}-${cs.fontWeight}`;
                if (!typographyCandidates.has(key) && px >= 11) {
                    let role = 'body';
                    if (px >= 44)
                        role = 'display-hero';
                    else if (px >= 32)
                        role = 'heading-xl';
                    else if (px >= 24)
                        role = 'heading-lg';
                    else if (px >= 18)
                        role = 'heading-md / lead';
                    else if (px <= 13)
                        role = 'caption / eyebrow-label';
                    typographyCandidates.set(key, {
                        role,
                        tag,
                        fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
                        fontSize: cs.fontSize,
                        fontSizePx: px,
                        lineHeight: cs.lineHeight,
                        lineHeightRatio: ratio,
                        fontWeight: cs.fontWeight,
                        letterSpacing: cs.letterSpacing,
                        sampleText: directText.slice(0, 70),
                    });
                }
            }
        }
        const typography = Array.from(typographyCandidates.values()).sort((a, b) => b.fontSizePx - a.fontSizePx);
        return {
            rootCustomProperties,
            fontFamilies: Array.from(fontFamilySet).filter(Boolean),
            typography,
            colorsAndSurfaces: {
                backgrounds: Array.from(bgMap.entries())
                    .map(([value, d]) => ({ value, count: d.count, sampleRole: d.sampleRole }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 25),
                textColors: Array.from(textMap.entries())
                    .map(([value, d]) => ({ value, count: d.count, sampleRole: d.sampleRole }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 20),
                borderColors: Array.from(borderMap.entries())
                    .map(([value, count]) => ({ value, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 15),
                gradients,
                backdropBlurs,
                boxShadows: Array.from(shadowMap.entries())
                    .map(([value, d]) => ({ value, count: d.count, role: d.role }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 15),
            },
            spatial: {
                maxWidths: Array.from(maxWidthSet),
                borderRadii: Array.from(radiusMap.entries())
                    .map(([value, count]) => ({ value, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 15),
                gridTemplates: Array.from(gridTemplateSet),
                gaps: Array.from(gapMap.entries())
                    .map(([value, count]) => ({ value, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 15),
                sectionPaddings,
            },
        };
    });
}
