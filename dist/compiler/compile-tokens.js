import fs from 'node:fs';
import path from 'node:path';
export function compileTokens(raw, outDir, siteName) {
    const tokensDir = path.join(outDir, 'tokens');
    fs.mkdirSync(tokensDir, { recursive: true });
    // Derive primary font and semantic palette from live extraction
    const primaryFont = raw.fontFamilies[0] || 'Adobe Clean, Inter, system-ui, -apple-system, sans-serif';
    const topBgs = raw.colorsAndSurfaces.backgrounds.map((b) => b.value);
    const topTexts = raw.colorsAndSurfaces.textColors.map((t) => t.value);
    const topBorders = raw.colorsAndSurfaces.borderColors.map((b) => b.value);
    const topRadii = raw.spatial.borderRadii.map((r) => r.value);
    const structuredTokens = {
        $schema: 'https://design-forge.local/schemas/tokens-v1.json',
        meta: {
            sourceSite: siteName,
            extractedAt: new Date().toISOString(),
            detectedFontFamilies: raw.fontFamilies,
        },
        color: {
            canvas: {
                primary: topBgs[0] || 'rgb(255, 255, 255)',
                secondary: topBgs[1] || 'rgb(245, 245, 247)',
                darkStage: 'rgb(14, 14, 18)',
                darkCard: 'rgb(24, 24, 30)',
            },
            text: {
                primary: topTexts[0] || 'rgb(19, 19, 19)',
                secondary: topTexts[1] || 'rgb(80, 80, 88)',
                onDarkPrimary: 'rgb(255, 255, 255)',
                onDarkSecondary: 'rgba(255, 255, 255, 0.76)',
            },
            accent: {
                brandPrimary: '#FA0F00', // Adobe signature crimson/red or overrideable brand slot
                brandInteractive: '#1473E6', // Spectrum interactive blue
                brandGradient: raw.colorsAndSurfaces.gradients[0]?.value ||
                    'linear-gradient(135deg, #FA0F00 0%, #FF5C00 48%, #7A28FF 100%)',
            },
            border: {
                subtleLight: topBorders[0] || 'rgba(0, 0, 0, 0.08)',
                subtleDark: 'rgba(255, 255, 255, 0.12)',
                interactiveHover: 'rgba(255, 255, 255, 0.28)',
            },
            glass: {
                navSurfaceLight: 'rgba(255, 255, 255, 0.82)',
                navSurfaceDark: 'rgba(18, 18, 23, 0.78)',
                pillSurface: 'rgba(255, 255, 255, 0.14)',
                backdropBlur: raw.colorsAndSurfaces.backdropBlurs[0]?.backdropFilter || 'blur(20px) saturate(180%)',
            },
        },
        typography: {
            fontFamily: {
                display: `"${primaryFont}", "Plus Jakarta Sans", "Inter", system-ui, sans-serif`,
                sans: `"${primaryFont}", "Inter", system-ui, -apple-system, sans-serif`,
                mono: `"JetBrains Mono", monospace`,
            },
            scale: {
                displayHero: {
                    fontSize: 'clamp(2.75rem, 5.2vw, 4.75rem)',
                    lineHeight: '1.04',
                    letterSpacing: '-0.03em',
                    fontWeight: '800',
                },
                headingXl: {
                    fontSize: 'clamp(2rem, 3.6vw, 3.25rem)',
                    lineHeight: '1.08',
                    letterSpacing: '-0.025em',
                    fontWeight: '700',
                },
                headingLg: {
                    fontSize: 'clamp(1.5rem, 2.4vw, 2.15rem)',
                    lineHeight: '1.15',
                    letterSpacing: '-0.02em',
                    fontWeight: '700',
                },
                headingMd: {
                    fontSize: 'clamp(1.2rem, 1.5vw, 1.45rem)',
                    lineHeight: '1.25',
                    letterSpacing: '-0.015em',
                    fontWeight: '600',
                },
                bodyLead: {
                    fontSize: 'clamp(1.05rem, 1.2vw, 1.25rem)',
                    lineHeight: '1.5',
                    letterSpacing: '-0.005em',
                    fontWeight: '400',
                },
                bodyBase: {
                    fontSize: '1rem',
                    lineHeight: '1.55',
                    letterSpacing: '0em',
                    fontWeight: '400',
                },
                eyebrow: {
                    fontSize: '0.78rem',
                    lineHeight: '1.2',
                    letterSpacing: '0.08em',
                    fontWeight: '700',
                },
            },
            extractedSamples: raw.typography.slice(0, 18),
        },
        spatial: {
            containerMaxWidth: raw.spatial.maxWidths[0] || '1440px',
            bentoGridGap: '24px',
            sectionVerticalPadding: 'clamp(4rem, 7vw, 6.5rem)',
            radii: {
                pill: '9999px',
                cardLg: '24px',
                cardMd: '16px',
                button: '9999px',
                extractedTop: topRadii.slice(0, 8),
            },
            shadows: {
                cardAmbient: raw.colorsAndSurfaces.boxShadows[0]?.value ||
                    '0 12px 32px -8px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.06)',
                cardHover: '0 24px 48px -12px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.16)',
                floatingGlass: '0 16px 40px rgba(0, 0, 0, 0.22)',
            },
        },
        rawInspection: raw,
    };
    // 1. Write tokens.json
    fs.writeFileSync(path.join(tokensDir, 'tokens.json'), JSON.stringify(structuredTokens, null, 2), 'utf8');
    // 2. Write tokens.css
    const cssContent = `/* ==========================================================================
   DESIGN FORGE — Extracted Design Tokens (${siteName.toUpperCase()})
   Generated from live DOM & ComputedStyle inspection
   ========================================================================== */

:root {
  /* Font Families */
  --df-font-display: ${structuredTokens.typography.fontFamily.display};
  --df-font-sans: ${structuredTokens.typography.fontFamily.sans};
  --df-font-mono: ${structuredTokens.typography.fontFamily.mono};

  /* Surface & Canvas Colors */
  --df-bg-canvas: ${structuredTokens.color.canvas.primary};
  --df-bg-subtle: ${structuredTokens.color.canvas.secondary};
  --df-bg-dark-stage: ${structuredTokens.color.canvas.darkStage};
  --df-bg-dark-card: ${structuredTokens.color.canvas.darkCard};

  /* Typography Colors */
  --df-text-primary: ${structuredTokens.color.text.primary};
  --df-text-secondary: ${structuredTokens.color.text.secondary};
  --df-text-on-dark: ${structuredTokens.color.text.onDarkPrimary};
  --df-text-on-dark-muted: ${structuredTokens.color.text.onDarkSecondary};

  /* Brand & Interactive Accents (Swap these variables to re-skin for any new brand) */
  --df-accent-primary: ${structuredTokens.color.accent.brandPrimary};
  --df-accent-interactive: ${structuredTokens.color.accent.brandInteractive};
  --df-accent-gradient: ${structuredTokens.color.accent.brandGradient};

  /* Borders & Glassmorphism Physics */
  --df-border-light: ${structuredTokens.color.border.subtleLight};
  --df-border-dark: ${structuredTokens.color.border.subtleDark};
  --df-border-hover: ${structuredTokens.color.border.interactiveHover};
  --df-glass-light: ${structuredTokens.color.glass.navSurfaceLight};
  --df-glass-dark: ${structuredTokens.color.glass.navSurfaceDark};
  --df-glass-pill: ${structuredTokens.color.glass.pillSurface};
  --df-backdrop-blur: ${structuredTokens.color.glass.backdropBlur};

  /* Fluid Typography Scale */
  --df-text-hero: ${structuredTokens.typography.scale.displayHero.fontSize};
  --df-lh-hero: ${structuredTokens.typography.scale.displayHero.lineHeight};
  --df-ls-hero: ${structuredTokens.typography.scale.displayHero.letterSpacing};

  --df-text-h1: ${structuredTokens.typography.scale.headingXl.fontSize};
  --df-lh-h1: ${structuredTokens.typography.scale.headingXl.lineHeight};
  --df-ls-h1: ${structuredTokens.typography.scale.headingXl.letterSpacing};

  --df-text-h2: ${structuredTokens.typography.scale.headingLg.fontSize};
  --df-lh-h2: ${structuredTokens.typography.scale.headingLg.lineHeight};

  --df-text-h3: ${structuredTokens.typography.scale.headingMd.fontSize};
  --df-text-lead: ${structuredTokens.typography.scale.bodyLead.fontSize};
  --df-text-body: ${structuredTokens.typography.scale.bodyBase.fontSize};
  --df-text-eyebrow: ${structuredTokens.typography.scale.eyebrow.fontSize};

  /* Spatial & Layout Rhythm */
  --df-container-max: ${structuredTokens.spatial.containerMaxWidth};
  --df-bento-gap: ${structuredTokens.spatial.bentoGridGap};
  --df-section-py: ${structuredTokens.spatial.sectionVerticalPadding};

  /* Border Radii */
  --df-radius-pill: ${structuredTokens.spatial.radii.pill};
  --df-radius-card-lg: ${structuredTokens.spatial.radii.cardLg};
  --df-radius-card-md: ${structuredTokens.spatial.radii.cardMd};

  /* Elevation & Shadows */
  --df-shadow-ambient: ${structuredTokens.spatial.shadows.cardAmbient};
  --df-shadow-hover: ${structuredTokens.spatial.shadows.cardHover};
  --df-shadow-glass: ${structuredTokens.spatial.shadows.floatingGlass};

  /* Motion Easing Tokens */
  --df-ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --df-ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1);
  --df-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --df-duration-fast: 180ms;
  --df-duration-normal: 350ms;
  --df-duration-slow: 650ms;
}
`;
    fs.writeFileSync(path.join(tokensDir, 'tokens.css'), cssContent, 'utf8');
    // 3. Write tailwind.preset.mjs
    const tailwindPreset = `// Auto-generated Tailwind Preset for ${siteName} Design System
export default {
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--df-font-display)'],
        sans: ['var(--df-font-sans)'],
        mono: ['var(--df-font-mono)'],
      },
      colors: {
        df: {
          canvas: 'var(--df-bg-canvas)',
          subtle: 'var(--df-bg-subtle)',
          stage: 'var(--df-bg-dark-stage)',
          cardDark: 'var(--df-bg-dark-card)',
          ink: 'var(--df-text-primary)',
          muted: 'var(--df-text-secondary)',
          accent: 'var(--df-accent-primary)',
          interactive: 'var(--df-accent-interactive)',
        },
      },
      borderRadius: {
        'df-pill': 'var(--df-radius-pill)',
        'df-card-lg': 'var(--df-radius-card-lg)',
        'df-card-md': 'var(--df-radius-card-md)',
      },
      boxShadow: {
        'df-ambient': 'var(--df-shadow-ambient)',
        'df-hover': 'var(--df-shadow-hover)',
        'df-glass': 'var(--df-shadow-glass)',
      },
      transitionTimingFunction: {
        'df-expo': 'var(--df-ease-out-expo)',
        'df-standard': 'var(--df-ease-standard)',
        'df-spring': 'var(--df-ease-spring)',
      },
    },
  },
};
`;
    fs.writeFileSync(path.join(tokensDir, 'tailwind.preset.mjs'), tailwindPreset, 'utf8');
    return structuredTokens;
}
