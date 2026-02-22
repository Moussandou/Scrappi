"use client";

const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY || "dummy_key";
const BASE_URL = "https://pixabay.com/api/";

export interface PixabayImage {
    id: number;
    pageURL: string;
    type: string;
    tags: string;
    previewURL: string;
    previewWidth: number;
    previewHeight: number;
    webformatURL: string;
    webformatWidth: number;
    webformatHeight: number;
    largeImageURL: string;
    imageWidth: number;
    imageHeight: number;
    imageSize: number;
    views: number;
    downloads: number;
    collections: number;
    likes: number;
    comments: number;
    user_id: number;
    user: string;
    userImageURL: string;
}

export const pixabayService = {
    async searchImages(query: string, page = 1, perPage = 20): Promise<PixabayImage[]> {
        try {
            const params = new URLSearchParams({
                key: PIXABAY_API_KEY,
                q: query || "illustrations", // Default to general illustrations if no query
                image_type: "illustration",
                orientation: "horizontal",
                safesearch: "true",
                page: page.toString(),
                per_page: perPage.toString(),
            });

            const response = await fetch(`${BASE_URL}?${params.toString()}`);
            if (!response.ok) throw new Error("Pixabay search failed");

            const data = await response.json();
            return data.hits || [];
        } catch (error) {
            console.error("Pixabay search error:", error);
            return [];
        }
    }
};
