/**
 * File Manager - Handles folder browsing and file loading
 * Refactored to use EventEmitter pattern like Amethyst
 */
import { EventEmitter } from './eventEmitter.js';

export class FileManager extends EventEmitter {
  constructor() {
    super();
    this.audioFiles = [];
    this.currentFolder = '';
    this.includeSubfolders = localStorage.getItem('includeSubfolders') === 'true' || false;
    this.audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'];
    
    // Try to get fs and path modules
    this.fs = null;
    this.path = null;
    if (typeof window !== 'undefined' && window.require) {
      try {
        this.fs = window.require('fs');
        this.path = window.require('path');
      } catch (e) {
        console.warn('[FileManager] Failed to load Node.js modules:', e);
      }
    }
  }

  setIncludeSubfolders(value) {
    this.includeSubfolders = value;
    localStorage.setItem('includeSubfolders', value.toString());
    this.emit('includeSubfoldersChanged', value);
  }

  // Recursively scan folder for audio files
  scanFolderRecursive(folderPath) {
    if (!this.fs || !this.path) {
      console.error('[FileManager] File system modules not available');
      return [];
    }

    let files = [];

    try {
      console.log('[FileManager] Scanning:', folderPath);
      const items = this.fs.readdirSync(folderPath);
      console.log('[FileManager] Items found:', items.length);

      items.forEach(item => {
        const fullPath = this.path.join(folderPath, item);

        try {
          const stats = this.fs.statSync(fullPath);

          if (stats.isDirectory()) {
            console.log('[FileManager] [DIR]', item);
            if (this.includeSubfolders) {
              const subFiles = this.scanFolderRecursive(fullPath);
              files = files.concat(subFiles);
            }
          } else if (stats.isFile()) {
            const ext = this.path.extname(item).toLowerCase();
            if (this.audioExtensions.includes(ext)) {
              console.log('[FileManager] [AUDIO]', item);
              files.push({
                name: item,
                path: fullPath,
                folder: this.path.basename(this.path.dirname(fullPath))
              });
            }
          }
        } catch (err) {
          console.warn('[FileManager] Error accessing:', fullPath, err.message);
        }
      });
    } catch (err) {
      console.error('[FileManager] Error scanning folder:', err);
      this.emit('error', err);
    }

    return files;
  }

  // Load folder and return result
  loadFolder(folderPath) {
    if (!this.fs || !this.path) {
      console.error('[FileManager] File system modules not available');
      return { success: false, error: 'File system not available' };
    }

    try {
      if (!this.fs.existsSync(folderPath)) {
        return { success: false, error: 'Folder does not exist' };
      }

      const stats = this.fs.statSync(folderPath);
      if (!stats.isDirectory()) {
        return { success: false, error: 'Path is not a directory' };
      }

      const files = this.scanFolderRecursive(folderPath);
      this.audioFiles = files;
      this.currentFolder = folderPath;

      console.log('[FileManager] Loaded', files.length, 'audio files from', folderPath);

      // Emit event for listeners
      this.emit('folderLoaded', {
        folderPath,
        files,
        count: files.length
      });

      return {
        success: true,
        files: files,
        count: files.length,
        folderPath: folderPath
      };
    } catch (error) {
      console.error('[FileManager] Error loading folder:', error);
      this.emit('error', error);
      return { success: false, error: error.message };
    }
  }

  getAudioFiles() {
    return this.audioFiles;
  }

  getCurrentFolder() {
    return this.currentFolder;
  }

  // Parse filename to extract artist and title
  parseFileName(filename) {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    // Remove leading track numbers (01, 01., 1., etc.)
    let cleaned = nameWithoutExt.replace(/^\d+[\s.-]*/, '');

    // Try to split by " - " or " – " (em dash)
    const separators = [' - ', ' – ', ' — '];
    for (const sep of separators) {
      if (cleaned.includes(sep)) {
        const parts = cleaned.split(sep);
        return {
          artist: parts[0].trim(),
          title: parts.slice(1).join(sep).trim(),
          hasArtist: true
        };
      }
    }

    // No separator found, treat entire name as title
    return {
      artist: '',
      title: cleaned.trim(),
      hasArtist: false
    };
  }

  // Get filtered files based on search query
  getFilteredFiles(searchQuery) {
    if (!searchQuery) return this.audioFiles;

    const searchLower = searchQuery.toLowerCase();
    return this.audioFiles.filter(file => {
      const parsed = this.parseFileName(file.name);
      return parsed.title.toLowerCase().includes(searchLower) ||
        parsed.artist.toLowerCase().includes(searchLower) ||
        file.name.toLowerCase().includes(searchLower);
    });
  }

  // Group files by folder
  getGroupedFiles() {
    if (!this.includeSubfolders || !this.path) {
      return null;
    }

    const grouped = new Map();
    
    this.audioFiles.forEach(file => {
      const folderPath = this.path.dirname(file.path);
      const folderName = this.path.basename(folderPath);
      
      if (!grouped.has(folderPath)) {
        grouped.set(folderPath, {
          name: folderName,
          path: folderPath,
          files: []
        });
      }
      
      grouped.get(folderPath).files.push(file);
    });

    // Convert to array and sort by folder name
    return Array.from(grouped.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }
}

