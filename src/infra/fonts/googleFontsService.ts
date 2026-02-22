/**
 * Google Fonts API service.
 * Fetches handwriting fonts and manages dynamic font loading.
 */

import handwritingFonts from "./handwritingFonts.json";

const FONTS_CSS_BASE = "https://fonts.googleapis.com/css2";

export interface GoogleFont {
    family: string;
    category: string;
}

const loadedFonts = new Set<string>();

/**
 * Fetch all handwriting fonts.
 * Now returns the pre-generated list from build time.
 */
export async function fetchHandwritingFonts(): Promise<GoogleFont[]> {
    return handwritingFonts as GoogleFont[];
}

/**
 * Reset the font cache for testing purposes.
 */
export function _resetCache(): void {
    cachedFonts = null;
    loadedFonts.clear();
}

/**
 * Dynamically load a Google Font by injecting a <link> into <head>.
 * Each font is only loaded once per session.
 */
export function loadFont(family: string): void {
    loadFonts([family]);
}

/**
 * Batch load multiple Google Fonts in a single request.
 * Reduces the number of HTTP requests and DOM manipulations.
 */
export function loadFonts(families: string[]): void {
    const uniqueFamilies = Array.from(new Set(families));
    const familiesToLoad = uniqueFamilies.filter(f => f && !loadedFonts.has(f));

    if (familiesToLoad.length === 0) return;

    // Mark all as loaded immediately to prevent duplicate requests
    familiesToLoad.forEach(f => loadedFonts.add(f));

    // Batch in chunks to keep URL length reasonable (approx 20 fonts per request)
    const chunkSize = 20;
    for (let i = 0; i < familiesToLoad.length; i += chunkSize) {
        const chunk = familiesToLoad.slice(i, i + chunkSize);
        const params = chunk.map(f => `family=${f.replace(/ /g, "+")}`).join("&");

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `${FONTS_CSS_BASE}?${params}&display=swap`;
        document.head.appendChild(link);
    }
}

/**
 * Check if a font has already been loaded.
 */
export function isFontLoaded(family: string): boolean {
    return loadedFonts.has(family);
}
