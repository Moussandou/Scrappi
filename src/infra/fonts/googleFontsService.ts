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
 * Dynamically load a Google Font by injecting a <link> into <head>.
 * Each font is only loaded once per session.
 */
export function loadFont(family: string): void {
    if (!family || loadedFonts.has(family)) return;

    loadedFonts.add(family);

    const encoded = family.replace(/ /g, "+");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${FONTS_CSS_BASE}?family=${encoded}&display=swap`;
    document.head.appendChild(link);
}

/**
 * Check if a font has already been loaded.
 */
export function isFontLoaded(family: string): boolean {
    return loadedFonts.has(family);
}
