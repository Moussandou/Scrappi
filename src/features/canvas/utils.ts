
/**
 * Resizes the dimensions of an object while maintaining its aspect ratio to fit within
 * the specified maximum width and height.
 *
 * @param width The current width of the object.
 * @param height The current height of the object.
 * @param maxWidth The maximum allowed width.
 * @param maxHeight The maximum allowed height. Defaults to maxWidth if not provided.
 * @returns An object containing the new width and height.
 */
export const resizeDimensions = (
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number = maxWidth
): { width: number; height: number } => {
    let finalWidth = width;
    let finalHeight = height;

    if (finalWidth > maxWidth || finalHeight > maxHeight) {
        const ratio = Math.min(maxWidth / finalWidth, maxHeight / finalHeight);
        finalWidth *= ratio;
        finalHeight *= ratio;
    }

    return { width: finalWidth, height: finalHeight };
};
