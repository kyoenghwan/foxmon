import sharp from 'sharp';

export interface OptimizedImage {
    buffer: Buffer;
    contentType: string;
    ext: string;
}

/**
 * Optimizes an image buffer (JPEG, PNG, GIF, WebP, etc.) to WebP format.
 * Automatically detects if the image is animated (like a GIF or animated WebP) and preserves the animation.
 */
export async function optimizeToWebp(buffer: Buffer): Promise<OptimizedImage> {
    try {
        const image = sharp(buffer);
        const metadata = await image.metadata();
        
        const isAnimated = (metadata.pages && metadata.pages > 1) || false;
        
        // If animated, we pass { animated: true } to sharp
        let processed = sharp(buffer, isAnimated ? { animated: true } : undefined);
        
        // Convert to WebP with optimized web defaults (Quality: 80)
        const webpBuffer = await processed
            .toFormat('webp', {
                quality: 80,
                effort: 4,
            })
            .toBuffer();
            
        return {
            buffer: webpBuffer,
            contentType: 'image/webp',
            ext: 'webp'
        };
    } catch (error) {
        console.error('Image optimization failed, falling back to original image:', error);
        return {
            buffer,
            contentType: 'image/octet-stream',
            ext: 'bin'
        };
    }
}
