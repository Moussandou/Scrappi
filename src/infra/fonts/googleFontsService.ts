/**
 * Google Fonts API service.
 * Fetches handwriting fonts and manages dynamic font loading.
 */

const API_BASE = "https://www.googleapis.com/webfonts/v1/webfonts";
const FONTS_CSS_BASE = "https://fonts.googleapis.com/css2";

export interface GoogleFont {
    family: string;
    category: string;
}

let cachedFonts: GoogleFont[] | null = null;
const loadedFonts = new Set<string>();

/**
 * Fetch all handwriting fonts from Google Fonts API.
 * Results are cached in memory after the first call.
 */
export async function fetchHandwritingFonts(): Promise<GoogleFont[]> {
    if (cachedFonts) return cachedFonts;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
    if (!apiKey) {
        console.error("Google Fonts API key is missing");
        return [];
    }

    const url = `${API_BASE}?key=${apiKey}&sort=popularity&capability=WOFF2`;

    const response = await fetch(url);
    if (!response.ok) {
        console.error("Failed to fetch Google Fonts:", response.statusText);
        return [];
    }

    const data = await response.json();
    const allFonts: GoogleFont[] = data.items || [];

    cachedFonts = allFonts
        .filter((f: GoogleFont) => f.category === "handwriting")
        .map((f: GoogleFont) => ({ family: f.family, category: f.category }));

    return cachedFonts;
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
