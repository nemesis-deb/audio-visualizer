// Cover Art Fetcher - Fetches album cover art from Cover Art Archive via MusicBrainz API

export class CoverArtFetcher {
    constructor() {
        this.cache = new Map(); // Cache cover art URLs by album key
    }

    /**
     * Generate a cache key from artist and album
     */
    getCacheKey(artist, album) {
        return `${artist || ''}::${album || ''}`.toLowerCase();
    }

    /**
     * Search MusicBrainz for a release and get the MusicBrainz ID
     */
    async searchMusicBrainzRelease(artist, album) {
        try {
            // Build query string
            let queryString = `release:${album}`;
            if (artist) {
                queryString = `artist:${artist} AND ${queryString}`;
            }

            // Search MusicBrainz API
            const response = await fetch(
                `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(queryString)}&fmt=json&limit=1`,
                {
                    headers: {
                        'User-Agent': 'Spectra/1.1.0 (https://github.com/yourusername/spectra)'
                    }
                }
            );

            if (!response.ok) {
                console.warn('MusicBrainz API request failed:', response.status);
                return null;
            }

            const data = await response.json();
            
            if (!data.releases || data.releases.length === 0) {
                return null;
            }

            // Return the MusicBrainz Release ID
            return data.releases[0].id;
        } catch (error) {
            console.error('Error searching MusicBrainz:', error);
            return null;
        }
    }

    /**
     * Fetch cover art URL from Cover Art Archive
     * Returns a direct HTTPS image link that's publicly accessible and not redirected
     */
    async fetchCoverArtUrl(mbid) {
        if (!mbid) return null;

        try {
            // First, get the release info to find the front cover image URL
            const releaseResponse = await fetch(`https://coverartarchive.org/release/${mbid}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!releaseResponse.ok) {
                return null;
            }

            const releaseData = await releaseResponse.json();
            
            // Find the front cover image
            if (releaseData.images && releaseData.images.length > 0) {
                const frontCover = releaseData.images.find(img => img.front === true) || releaseData.images[0];
                
                if (frontCover && frontCover.image) {
                    // Return the direct HTTPS image URL
                    return frontCover.image;
                }
            }

            // Fallback: try the /front endpoint which should redirect to the image
            const frontResponse = await fetch(`https://coverartarchive.org/release/${mbid}/front`, {
                method: 'GET',
                redirect: 'follow'
            });

            if (frontResponse.ok && frontResponse.url) {
                const finalUrl = frontResponse.url;
                // Verify it's a direct image URL
                if (finalUrl.includes('coverartarchive.org') && 
                    (finalUrl.includes('/release/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(finalUrl))) {
                    return finalUrl;
                }
            }

            return null;
        } catch (error) {
            console.error('Error fetching cover art:', error);
            return null;
        }
    }

    /**
     * Get cover art URL for a track
     * @param {Object} metadata - Track metadata with artist, album, title
     * @returns {Promise<string|null>} Cover art URL or null
     */
    async getCoverArtUrl(metadata) {
        if (!metadata) return null;

        const artist = metadata.artist || '';
        const album = metadata.album || metadata.title || '';
        
        if (!album) return null;

        // Check cache first
        const cacheKey = this.getCacheKey(artist, album);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Search MusicBrainz for the release
        const mbid = await this.searchMusicBrainzRelease(artist, album);
        if (!mbid) {
            // Cache null result to avoid repeated failed searches
            this.cache.set(cacheKey, null);
            return null;
        }

        // Fetch cover art URL
        const coverUrl = await this.fetchCoverArtUrl(mbid);
        
        // Cache the result (even if null)
        this.cache.set(cacheKey, coverUrl);
        
        return coverUrl;
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
}

