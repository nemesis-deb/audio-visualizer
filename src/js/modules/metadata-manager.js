/**
 * Metadata Manager - Implements Amethyst-style file-based caching for metadata
 * Caches metadata and album art to disk to avoid re-reading files
 */

import { md5 } from 'js-md5';

export class MetadataManager {
  constructor(appDataPath) {
    this.appDataPath = appDataPath;
    this.cachePath = null;
    this.metadataCache = new Map(); // In-memory cache
    this.coverCache = new Map(); // In-memory cache for covers
    this.initialized = false;
  }

  /**
   * Initialize the metadata cache directory
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      const path = require('path');
      const fs = require('fs');
      
      // Use appDataPath if provided, otherwise use Electron's app.getPath
      if (this.appDataPath) {
        this.cachePath = path.join(this.appDataPath, 'spectra', 'Metadata Cache');
      } else if (window.require) {
        const { app } = window.require('electron').remote || window.require('@electron/remote');
        this.cachePath = path.join(app.getPath('userData'), 'Metadata Cache');
      } else {
        console.warn('[MetadataManager] Cannot determine cache path');
        return;
      }

      // Create cache directory if it doesn't exist
      if (!fs.existsSync(this.cachePath)) {
        fs.mkdirSync(this.cachePath, { recursive: true });
        console.log(`[MetadataManager] Created metadata cache folder at ${this.cachePath}`);
      }

      this.initialized = true;
    } catch (error) {
      console.error('[MetadataManager] Failed to initialize:', error);
    }
  }

  /**
   * Get cache file path for a given file path
   */
  getCacheFilePath(filePath) {
    if (!this.cachePath) return null;
    
    const path = require('path');
    const fs = require('fs');
    
    // Generate a safe filename from the file path
    // Use MD5 hash to avoid filesystem issues with special characters
    const hash = md5(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    const safeName = baseName.replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
    
    return path.join(this.cachePath, `${safeName}_${hash.substring(0, 8)}.amf`);
  }

  /**
   * Check if metadata is cached for a file
   */
  async isCached(filePath) {
    if (!this.initialized) await this.initialize();
    if (!this.cachePath) return false;

    try {
      const fs = require('fs');
      const cacheFile = this.getCacheFilePath(filePath);
      if (!cacheFile) return false;
      
      await fs.promises.stat(cacheFile);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fetch cached metadata from disk
   */
  async fetchCache(filePath) {
    if (!this.initialized) await this.initialize();
    if (!this.cachePath) return null;

    try {
      const fs = require('fs');
      const cacheFile = this.getCacheFilePath(filePath);
      if (!cacheFile) return null;

      const data = await fs.promises.readFile(cacheFile, 'utf8');
      const parsed = JSON.parse(data.trim());
      
      // Store in memory cache
      if (parsed.metadata) {
        this.metadataCache.set(filePath, parsed.metadata);
      }
      if (parsed.cover) {
        this.coverCache.set(filePath, parsed.cover);
      }
      
      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.log('[MetadataManager] Fixing malformed metadata cache file:', filePath);
        // Delete corrupted cache file
        try {
          const fs = require('fs');
          const cacheFile = this.getCacheFilePath(filePath);
          if (cacheFile) {
            await fs.promises.unlink(cacheFile);
          }
        } catch (unlinkError) {
          // Ignore unlink errors
        }
      }
      return null;
    }
  }

  /**
   * Save metadata and cover to cache
   */
  async saveCache(filePath, metadata, cover) {
    if (!this.initialized) await this.initialize();
    if (!this.cachePath) return;

    try {
      const fs = require('fs');
      const cacheFile = this.getCacheFilePath(filePath);
      if (!cacheFile) return;

      // Store in memory cache
      if (metadata) {
        this.metadataCache.set(filePath, metadata);
      }
      if (cover) {
        this.coverCache.set(filePath, cover);
      }

      // Remove picture data from metadata before caching (to save space)
      const metadataToCache = metadata ? { ...metadata } : null;
      if (metadataToCache && metadataToCache.common) {
        metadataToCache.common = { ...metadataToCache.common };
        metadataToCache.common.picture = []; // Don't cache picture data
      }

      const cacheData = {
        metadata: metadataToCache,
        cover: cover || null
      };

      await fs.promises.writeFile(
        cacheFile,
        JSON.stringify(cacheData, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('[MetadataManager] Failed to write metadata cache file:', error);
    }
  }

  /**
   * Get metadata from cache (memory or disk)
   */
  async getMetadata(filePath, force = false) {
    if (!this.initialized) await this.initialize();

    // Check memory cache first
    if (!force && this.metadataCache.has(filePath)) {
      return this.metadataCache.get(filePath);
    }

    // Check disk cache
    if (!force) {
      const cached = await this.fetchCache(filePath);
      if (cached && cached.metadata) {
        return cached.metadata;
      }
    }

    return null;
  }

  /**
   * Get cover from cache (memory or disk)
   */
  async getCover(filePath, force = false) {
    if (!this.initialized) await this.initialize();

    // Check memory cache first
    if (!force && this.coverCache.has(filePath)) {
      return this.coverCache.get(filePath);
    }

    // Check disk cache
    if (!force) {
      const cached = await this.fetchCache(filePath);
      if (cached && cached.cover) {
        return cached.cover;
      }
    }

    return null;
  }

  /**
   * Clear cache for a specific file
   */
  async clearCache(filePath) {
    this.metadataCache.delete(filePath);
    this.coverCache.delete(filePath);

    if (!this.cachePath) return;

    try {
      const fs = require('fs');
      const cacheFile = this.getCacheFilePath(filePath);
      if (cacheFile) {
        await fs.promises.unlink(cacheFile).catch(() => {
          // Ignore errors if file doesn't exist
        });
      }
    } catch (error) {
      // Ignore errors
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.metadataCache.clear();
    this.coverCache.clear();
  }
}

