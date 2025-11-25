// Album Art Module - Extract and display album art with blur effect
const { ipcRenderer } = require('electron');

export class AlbumArtManager {
    constructor() {
        this.currentArtUrl = null;
        this.cache = new Map(); // Cache album art by file path
    }

    async extractAlbumArt(filePath) {
        // Check cache first
        if (this.cache.has(filePath)) {
            const cached = this.cache.get(filePath);
            if (cached) {
                console.log('[AlbumArt] Found in cache:', filePath);
                return cached;
            }
            // Cached as null means we tried and found nothing
            return null;
        }

        try {
            console.log('[AlbumArt] Extracting from:', filePath);
            
            // Use IPC to extract album art in main process
            const pictureData = await ipcRenderer.invoke('extract-album-art', filePath);
            
            if (pictureData && pictureData.data) {
                try {
                    // Data should be base64 string (Amethyst approach)
                    let base64Data = pictureData.data;
                    
                    // If it's already a data URL, extract the base64 part
                    if (base64Data.startsWith('data:')) {
                        const commaIndex = base64Data.indexOf(',');
                        if (commaIndex !== -1) {
                            base64Data = base64Data.substring(commaIndex + 1);
                        }
                    }
                    
                    // Convert base64 to binary
                    const binaryString = atob(base64Data);
                    const uint8Array = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        uint8Array[i] = binaryString.charCodeAt(i);
                    }
                    
                    if (!uint8Array || uint8Array.length === 0) {
                        console.warn('[AlbumArt] Empty data after base64 conversion');
                        this.cache.set(filePath, null);
                        return null;
                    }
                    
                    // Determine MIME type
                    const mimeType = pictureData.mimeType || 
                                    (pictureData.format ? `image/${pictureData.format}` : 'image/jpeg');
                    
                    // Create data URL directly (Amethyst approach - more efficient)
                    const dataUrl = `data:${mimeType};base64,${base64Data}`;
                    
                    console.log('[AlbumArt] Created data URL, size:', uint8Array.length, 'format:', pictureData.format);
                    
                    // Cache the URL
                    this.cache.set(filePath, dataUrl);
                    
                    return dataUrl;
                } catch (conversionError) {
                    console.error('[AlbumArt] Error processing base64 data:', conversionError);
                    this.cache.set(filePath, null);
                    return null;
                }
            } else {
                console.log('[AlbumArt] No album art data returned for:', filePath);
                // Cache null to prevent repeated attempts
                this.cache.set(filePath, null);
                return null;
            }
        } catch (error) {
            console.error('[AlbumArt] Error extracting:', filePath, error.message);
            // Cache null to prevent infinite retries
            this.cache.set(filePath, null);
            return null;
        }
    }

    setBackground(imageUrl, blurAmount = 20, opacity = 0.3) {
        const backgroundElement = document.getElementById('albumArtBackground');
        
        if (!backgroundElement) {
            console.error('Background element not found');
            return;
        }

        if (imageUrl) {
            console.log('Setting album art background:', imageUrl);
            backgroundElement.style.backgroundImage = `url(${imageUrl})`;
            backgroundElement.style.filter = `blur(${blurAmount}px)`;
            backgroundElement.style.opacity = opacity;
            backgroundElement.style.display = 'block';
            this.currentArtUrl = imageUrl;
        } else {
            // No album art - hide background completely
            console.log('No album art found, hiding background');
            backgroundElement.style.display = 'none';
            this.currentArtUrl = null;
        }
    }

    clearBackground() {
        const backgroundElement = document.getElementById('albumArtBackground');
        if (backgroundElement) {
            backgroundElement.style.display = 'none';
        }
    }

    // Clean up old cached URLs to prevent memory leaks
    clearCache() {
        this.cache.forEach(url => {
            if (url && url.startsWith('blob:')) {
                URL.revokeObjectURL(url);
            }
        });
        this.cache.clear();
    }

    // Remove specific item from cache
    removeFromCache(filePath) {
        const url = this.cache.get(filePath);
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
        this.cache.delete(filePath);
    }
}
