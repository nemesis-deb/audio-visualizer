// Album Art Module - Extract and display album art with blur effect
const { ipcRenderer } = require('electron');

export class AlbumArtManager {
    constructor() {
        this.currentArtUrl = null;
        this.cache = new Map(); // In-memory cache album art by file path
        this.cacheKey = 'spectra_album_art_cache'; // localStorage key
        this.maxCacheSize = 500; // Maximum number of cached items
        this.loadCache(); // Load persistent cache on initialization
    }

    /**
     * Load cache from localStorage
     */
    loadCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const cacheData = JSON.parse(cached);
                // Restore cache entries
                Object.entries(cacheData).forEach(([path, dataUrl]) => {
                    // Only restore non-null entries (null means no art found)
                    if (dataUrl !== null) {
                        this.cache.set(path, dataUrl);
                    }
                });
                console.log('[AlbumArt] Loaded', this.cache.size, 'cached album arts from localStorage');
            }
        } catch (error) {
            console.warn('[AlbumArt] Error loading cache from localStorage:', error);
            // Clear corrupted cache
            localStorage.removeItem(this.cacheKey);
        }
    }

    /**
     * Save cache to localStorage
     */
    saveCache() {
        try {
            // Convert Map to object for JSON serialization
            const cacheObject = {};
            this.cache.forEach((value, key) => {
                cacheObject[key] = value;
            });
            
            // Check size and trim if needed
            const cacheString = JSON.stringify(cacheObject);
            const sizeInMB = new Blob([cacheString]).size / (1024 * 1024);
            
            // If cache is too large (>4MB), remove oldest entries
            if (sizeInMB > 4 || this.cache.size > this.maxCacheSize) {
                console.log('[AlbumArt] Cache too large, trimming...');
                const entries = Array.from(this.cache.entries());
                // Keep only the most recent entries
                const toKeep = Math.floor(this.maxCacheSize * 0.8);
                this.cache.clear();
                entries.slice(-toKeep).forEach(([path, value]) => {
                    this.cache.set(path, value);
                });
                // Rebuild cache object
                const trimmedObject = {};
                this.cache.forEach((value, key) => {
                    trimmedObject[key] = value;
                });
                localStorage.setItem(this.cacheKey, JSON.stringify(trimmedObject));
            } else {
                localStorage.setItem(this.cacheKey, cacheString);
            }
        } catch (error) {
            console.warn('[AlbumArt] Error saving cache to localStorage:', error);
            // If quota exceeded, clear some entries
            if (error.name === 'QuotaExceededError') {
                console.log('[AlbumArt] localStorage quota exceeded, clearing old entries...');
                const entries = Array.from(this.cache.entries());
                this.cache.clear();
                // Keep only half of the entries
                entries.slice(-Math.floor(entries.length / 2)).forEach(([path, value]) => {
                    this.cache.set(path, value);
                });
                try {
                    const trimmedObject = {};
                    this.cache.forEach((value, key) => {
                        trimmedObject[key] = value;
                    });
                    localStorage.setItem(this.cacheKey, JSON.stringify(trimmedObject));
                } catch (e) {
                    console.error('[AlbumArt] Failed to save trimmed cache:', e);
                }
            }
        }
    }

    async extractAlbumArt(filePath) {
        // Check in-memory cache first
        if (this.cache.has(filePath)) {
            const cached = this.cache.get(filePath);
            if (cached) {
                console.log('[AlbumArt] Found in memory cache:', filePath);
                return cached;
            }
            // Cached as null means we tried and found nothing
            return null;
        }

        // Check persistent cache (localStorage)
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const cacheData = JSON.parse(cached);
                if (cacheData[filePath] !== undefined) {
                    const cachedValue = cacheData[filePath];
                    if (cachedValue) {
                        // Restore to in-memory cache
                        this.cache.set(filePath, cachedValue);
                        console.log('[AlbumArt] Found in persistent cache:', filePath);
                        return cachedValue;
                    } else {
                        // Cached as null - no art found
                        this.cache.set(filePath, null);
                        return null;
                    }
                }
            }
        } catch (error) {
            console.warn('[AlbumArt] Error checking persistent cache:', error);
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
                        this.saveCache(); // Save null to cache
                        return null;
                    }
                    
                    // Determine MIME type
                    const mimeType = pictureData.mimeType || 
                                    (pictureData.format ? `image/${pictureData.format}` : 'image/jpeg');
                    
                    // Create data URL directly (Amethyst approach - more efficient)
                    const dataUrl = `data:${mimeType};base64,${base64Data}`;
                    
                    console.log('[AlbumArt] Created data URL, size:', uint8Array.length, 'format:', pictureData.format);
                    
                    // Cache the URL (both in-memory and persistent)
                    this.cache.set(filePath, dataUrl);
                    this.saveCache(); // Save to localStorage
                    
                    return dataUrl;
                } catch (conversionError) {
                    console.error('[AlbumArt] Error processing base64 data:', conversionError);
                    this.cache.set(filePath, null);
                    this.saveCache(); // Save null to cache
                    return null;
                }
            } else {
                console.log('[AlbumArt] No album art data returned for:', filePath);
                // Cache null to prevent repeated attempts
                this.cache.set(filePath, null);
                this.saveCache(); // Save null to cache
                return null;
            }
        } catch (error) {
            console.error('[AlbumArt] Error extracting:', filePath, error.message);
            // Cache null to prevent infinite retries
            this.cache.set(filePath, null);
            this.saveCache(); // Save null to cache
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
        // Also clear persistent cache
        localStorage.removeItem(this.cacheKey);
        console.log('[AlbumArt] Cache cleared (both memory and persistent)');
    }

    // Remove specific item from cache
    removeFromCache(filePath) {
        const url = this.cache.get(filePath);
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
        this.cache.delete(filePath);
        // Also remove from persistent cache
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const cacheData = JSON.parse(cached);
                delete cacheData[filePath];
                localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
            }
        } catch (error) {
            console.warn('[AlbumArt] Error removing from persistent cache:', error);
        }
    }
}
