import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pixabayService, PixabayImage } from './pixabayService';

// Mock data
const mockImages: PixabayImage[] = [
  {
    id: 1,
    pageURL: 'http://page.url',
    type: 'illustration',
    tags: 'tag1, tag2',
    previewURL: 'http://preview.url',
    previewWidth: 100,
    previewHeight: 100,
    webformatURL: 'http://webformat.url',
    webformatWidth: 200,
    webformatHeight: 200,
    largeImageURL: 'http://large.url',
    imageWidth: 300,
    imageHeight: 300,
    imageSize: 1000,
    views: 100,
    downloads: 50,
    collections: 10,
    likes: 5,
    comments: 2,
    user_id: 123,
    user: 'testuser',
    userImageURL: 'http://user.url',
  },
];

describe('pixabayService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return images when API call is successful with default parameters', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ hits: mockImages }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const result = await pixabayService.searchImages('');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('q=illustrations')); // Default query
    expect(result).toEqual(mockImages);
  });

  it('should return images when API call is successful with custom parameters', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ hits: mockImages }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const query = 'cats';
    const page = 2;
    const perPage = 10;
    const result = await pixabayService.searchImages(query, page, perPage);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const url = (global.fetch as any).mock.calls[0][0] as string;
    expect(url).toContain(`q=${query}`);
    expect(url).toContain(`page=${page}`);
    expect(url).toContain(`per_page=${perPage}`);
    expect(result).toEqual(mockImages);
  });

  it('should handle API errors gracefully and return empty array', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await pixabayService.searchImages('error');

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Pixabay search error:', expect.any(Error));
    expect(consoleSpy.mock.calls[0][1].message).toBe('Pixabay search failed');
  });

  it('should handle network errors (fetch throws) and return empty array', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await pixabayService.searchImages('network error');

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Pixabay search error:', expect.any(Error));
  });

  it('should return empty array if response has no hits', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ }), // Missing hits
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const result = await pixabayService.searchImages('empty');

    expect(result).toEqual([]);
  });
});
