// Base Visualizer Class
class Visualizer {
    constructor(name) {
        this.name = name;
        this.canvas = null;
        this.ctx = null;
        this.timeDomainData = null;
        this.frequencyData = null;
        this.settings = {};
    }

    init(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    update(timeDomainData, frequencyData) {
        this.timeDomainData = timeDomainData;
        this.frequencyData = frequencyData;
    }

    draw() {
        // Override in subclass
    }

    getCustomSettings() {
        // Override in subclass to return array of custom settings
        return [];
    }

    updateSetting(key, value) {
        this.settings[key] = value;
    }
}

module.exports = Visualizer;
