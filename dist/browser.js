import { chromium } from 'playwright-core';
import fs from 'node:fs';
const CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];
export function resolveExecutablePath() {
    for (const p of CHROME_PATHS) {
        if (fs.existsSync(p))
            return p;
    }
    throw new Error('Could not find local Chrome or Edge installation.');
}
export async function launchExtractorSession(viewport = { width: 1440, height: 900 }) {
    const executablePath = resolveExecutablePath();
    // Use offscreen non-headless Chrome to bypass Akamai/Cloudflare TLS + headless GPU fingerprinting
    const browser = await chromium.launch({
        executablePath,
        headless: false,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--window-position=-2400,-2400',
            '--window-size=1440,900',
            '--enable-webgl',
            '--ignore-gpu-blocklist',
            '--no-sandbox',
        ],
    });
    const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        locale: 'en-US',
    });
    // Inject stealth & runtime hooks BEFORE any page scripts run to capture WebGL shaders & Web Animations
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        window.__DESIGN_FORGE_SHADERS__ = [];
        window.__DESIGN_FORGE_ANIMATIONS__ = [];
        const hookShader = (proto) => {
            if (!proto || !proto.shaderSource)
                return;
            const orig = proto.shaderSource;
            proto.shaderSource = function (shader, source) {
                try {
                    if (source && source.length > 40) {
                        window.__DESIGN_FORGE_SHADERS__.push({
                            length: source.length,
                            snippet: source.slice(0, 1500),
                        });
                    }
                }
                catch { }
                return orig.apply(this, arguments);
            };
        };
        if (typeof WebGLRenderingContext !== 'undefined')
            hookShader(WebGLRenderingContext.prototype);
        if (typeof WebGL2RenderingContext !== 'undefined')
            hookShader(WebGL2RenderingContext.prototype);
        if (typeof Element !== 'undefined' && Element.prototype.animate) {
            const origAnimate = Element.prototype.animate;
            Element.prototype.animate = function (keyframes, options) {
                try {
                    window.__DESIGN_FORGE_ANIMATIONS__.push({
                        tag: this.tagName?.toLowerCase(),
                        className: typeof this.className === 'string' ? this.className.slice(0, 120) : '',
                        keyframes,
                        options,
                    });
                }
                catch { }
                return origAnimate.apply(this, arguments);
            };
        }
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    return { browser, context, page, cdp };
}
export async function dismissOverlaysAndHydrate(page) {
    const dismissSelectors = [
        '#onetrust-accept-btn-handler',
        'button[id*="onetrust-accept"]',
        'button[aria-label*="Close"]',
        'button[aria-label*="close"]',
        '.dialog-close',
        '.locale-modal-v2 .dexter-CloseButton',
        'a.locale-modal-v2-continue',
        '[data-testid="modal-close"]',
    ];
    for (const sel of dismissSelectors) {
        try {
            const loc = page.locator(sel).first();
            if (await loc.isVisible({ timeout: 500 })) {
                await loc.click({ timeout: 1000 }).catch(() => { });
            }
        }
        catch { }
    }
    // Smoothly scroll through the page to trigger lazy media, IntersectionObservers & ScrollTriggers
    await page.evaluate(async () => {
        const delay = (ms) => new Promise((res) => setTimeout(res, ms));
        const totalHeight = Math.min(document.body.scrollHeight || 6000, 12000);
        const step = 450;
        for (let y = 0; y <= totalHeight; y += step) {
            window.scrollTo({ top: y, behavior: 'instant' });
            await delay(140);
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
        await delay(500);
    });
}
