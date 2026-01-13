// Image Compressor Utility
// Uses browser-native Canvas API for compression - no external dependencies

/**
 * Compress an image file
 * @param {File} file - The image file to compress
 * @param {object} options - Compression options
 * @returns {Promise<{file: File, originalSize: number, compressedSize: number, savings: string}>}
 */
export async function compressImage(file, options = {}) {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8, // 0.1 to 1.0
        format = 'image/jpeg' // 'image/jpeg', 'image/webp', 'image/png'
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let { width, height } = img;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');

                // Use high-quality image rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Create new file from blob
                        const extension = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
                        const fileName = file.name.replace(/\.[^/.]+$/, '') + '_compressed.' + extension;
                        const compressedFile = new File([blob], fileName, { type: format });

                        const originalSize = file.size;
                        const compressedSize = compressedFile.size;
                        const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);

                        resolve({
                            file: compressedFile,
                            blob,
                            originalSize,
                            compressedSize,
                            savings: `${savings}%`,
                            width,
                            height,
                            preview: URL.createObjectURL(blob)
                        });
                    },
                    format,
                    quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size string
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get image dimensions from file
 * @param {File} file - The image file
 * @returns {Promise<{width: number, height: number}>}
 */
export function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = event.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Create a thumbnail from an image file
 * @param {File} file - The image file
 * @param {number} size - Thumbnail size (default 150px)
 * @returns {Promise<string>} - Data URL of thumbnail
 */
export async function createThumbnail(file, size = 150) {
    const result = await compressImage(file, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.7,
        format: 'image/jpeg'
    });

    return result.preview;
}

export default { compressImage, formatFileSize, getImageDimensions, createThumbnail };
