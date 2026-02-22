import test, { describe, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { fetchHandwritingFonts, loadFont, isFontLoaded, _resetCache } from './googleFontsService.ts';

describe('googleFontsService', () => {
    const originalApiKey = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
    const originalFetch = globalThis.fetch;
    const originalDocument = globalThis.document;

    beforeEach(() => {
        _resetCache();
        process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY = 'test-api-key';

        // Mock document
        (globalThis as any).document = {
            head: {
                appendChild: mock.fn()
            },
            createElement: mock.fn(() => ({ rel: '', href: '' }))
        };

        // Mock console.error to avoid cluttering test output
        mock.method(console, 'error', () => {});
    });

    afterEach(() => {
        process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY = originalApiKey;
        globalThis.fetch = originalFetch;
        (globalThis as any).document = originalDocument;
        (console.error as any).mock?.restore();
    });

    describe('fetchHandwritingFonts', () => {
        test('should fetch and filter handwriting fonts', async () => {
            const mockFonts = [
                { family: 'Roboto', category: 'sans-serif' },
                { family: 'Dancing Script', category: 'handwriting' },
                { family: 'Open Sans', category: 'sans-serif' },
                { family: 'Pacifico', category: 'handwriting' }
            ];

            mock.method(globalThis, 'fetch', async (url: string) => {
                assert.ok(url.includes('test-api-key'));
                return {
                    ok: true,
                    json: async () => ({ items: mockFonts })
                };
            });

            const fonts = await fetchHandwritingFonts();

            assert.strictEqual(fonts.length, 2);
            assert.deepStrictEqual(fonts, [
                { family: 'Dancing Script', category: 'handwriting' },
                { family: 'Pacifico', category: 'handwriting' }
            ]);
        });

        test('should return empty array if API key is missing', async () => {
            delete process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;

            const fonts = await fetchHandwritingFonts();
            assert.deepStrictEqual(fonts, []);
            assert.strictEqual((console.error as any).mock.calls.length, 1);
        });

        test('should return empty array if fetch fails', async () => {
            mock.method(globalThis, 'fetch', async () => ({
                ok: false,
                statusText: 'Not Found'
            }));

            const fonts = await fetchHandwritingFonts();
            assert.deepStrictEqual(fonts, []);
            assert.strictEqual((console.error as any).mock.calls.length, 1);
        });

        test('should use cached results on subsequent calls', async () => {
            const mockFonts = [{ family: 'Dancing Script', category: 'handwriting' }];
            const fetchMock = mock.method(globalThis, 'fetch', async () => ({
                ok: true,
                json: async () => ({ items: mockFonts })
            }));

            await fetchHandwritingFonts();
            const fonts = await fetchHandwritingFonts();

            assert.strictEqual(fonts.length, 1);
            assert.strictEqual(fetchMock.mock.calls.length, 1);
        });

        test('should handle empty API response items', async () => {
            mock.method(globalThis, 'fetch', async () => ({
                ok: true,
                json: async () => ({ items: [] })
            }));

            const fonts = await fetchHandwritingFonts();
            assert.deepStrictEqual(fonts, []);
        });

        test('should handle missing API response items property', async () => {
            mock.method(globalThis, 'fetch', async () => ({
                ok: true,
                json: async () => ({})
            }));

            const fonts = await fetchHandwritingFonts();
            assert.deepStrictEqual(fonts, []);
        });
    });

    describe('loadFont', () => {
        test('should inject a link tag for a new font', () => {
            loadFont('Dancing Script');

            const doc = globalThis.document as any;
            assert.strictEqual(doc.createElement.mock.calls.length, 1);
            assert.strictEqual(doc.head.appendChild.mock.calls.length, 1);

            const element = doc.createElement.mock.calls[0].result;
            assert.strictEqual(element.rel, 'stylesheet');
            assert.ok(element.href.includes('Dancing+Script'));
        });

        test('should not inject twice for the same font', () => {
            loadFont('Dancing Script');
            loadFont('Dancing Script');

            const doc = globalThis.document as any;
            assert.strictEqual(doc.createElement.mock.calls.length, 1);
        });

        test('should do nothing for empty family', () => {
            loadFont('');

            const doc = globalThis.document as any;
            assert.strictEqual(doc.createElement.mock.calls.length, 0);
        });
    });

    describe('isFontLoaded', () => {
        test('should return correct loaded status', () => {
            assert.strictEqual(isFontLoaded('Pacifico'), false);
            loadFont('Pacifico');
            assert.strictEqual(isFontLoaded('Pacifico'), true);
        });
    });
});
