// Base Visualizer Class
export class Visualizer {
    constructor(name) {
        this.name = name;
        this.settings = {};
    }

    init(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    update(timeDomainData, frequencyData) {
        // Override in subclasses
    }

    draw() {
        // Override in subclasses
    }

    // Return custom settings for this visualizer
    getCustomSettings() {
        return []; // Override in subclasses to return array of setting definitions
    }

    // Update visualizer-specific setting
    updateSetting(key, value) {
        this.settings[key] = value;
    }
}

// Export settings reference (will be set by renderer.js)
export let settings = null;
export function setSettings(s) {
    settings = s;
}
