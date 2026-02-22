
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '../src/infra/fonts/handwritingFonts.json');
const API_BASE = "https://www.googleapis.com/webfonts/v1/webfonts";

// Fallback list of popular handwriting fonts
const FALLBACK_FONTS = [
    { family: "Caveat", category: "handwriting" },
    { family: "Dancing Script", category: "handwriting" },
    { family: "Satisfy", category: "handwriting" },
    { family: "Great Vibes", category: "handwriting" },
    { family: "Sacramento", category: "handwriting" },
    { family: "Indie Flower", category: "handwriting" },
    { family: "Shadows Into Light", category: "handwriting" },
    { family: "Gloria Hallelujah", category: "handwriting" },
    { family: "Pacifico", category: "handwriting" },
    { family: "Handlee", category: "handwriting" },
    { family: "Patrick Hand", category: "handwriting" },
    { family: "Cookie", category: "handwriting" },
    { family: "Permanent Marker", category: "handwriting" },
    { family: "Amatic SC", category: "handwriting" },
    { family: "Courgette", category: "handwriting" },
    { family: "Kaushan Script", category: "handwriting" },
    { family: "Yellowtail", category: "handwriting" },
    { family: "Tangerine", category: "handwriting" },
    { family: "Damion", category: "handwriting" },
    { family: "Nothing You Could Do", category: "handwriting" }
];

async function loadEnv() {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
        }
    } catch (error) {
        console.warn('Could not read .env.local:', error.message);
    }
}

async function fetchFonts() {
    await loadEnv();

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;

    if (!apiKey) {
        console.warn('⚠️  NEXT_PUBLIC_GOOGLE_FONTS_API_KEY not found. Using fallback font list.');
        return FALLBACK_FONTS;
    }

    try {
        const url = `${API_BASE}?key=${apiKey}&sort=popularity&capability=WOFF2`;
        console.log(`Fetching fonts from ${url}...`);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const handwritingFonts = (data.items || [])
            .filter(f => f.category === "handwriting")
            .map(f => ({
                family: f.family,
                category: f.category
            }));

        console.log(`✅ Fetched ${handwritingFonts.length} handwriting fonts.`);
        return handwritingFonts;

    } catch (error) {
        console.error('❌ Failed to fetch fonts:', error.message);
        console.warn('⚠️  Using fallback font list.');
        return FALLBACK_FONTS;
    }
}

async function main() {
    console.log('Generating handwriting fonts JSON...');
    const fonts = await fetchFonts();

    // Ensure directory exists
    const dir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fonts, null, 2));
    console.log(`✅ Saved ${fonts.length} fonts to ${OUTPUT_FILE}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
