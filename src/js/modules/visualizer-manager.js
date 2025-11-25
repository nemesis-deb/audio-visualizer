// Visualizer Manager
export class VisualizerManager {
    constructor() {
        this.visualizers = new Map();
        this.currentVisualizer = null;
    }

    register(visualizer) {
        this.visualizers.set(visualizer.name, visualizer);
        console.log(`Registered visualizer: ${visualizer.name}`);
    }

    init(canvas, ctx) {
        this.visualizers.forEach(viz => {
            if (viz.init) {
                viz.init(canvas, ctx);
            }
        });
    }

    initializeAll(ctx, width, height) {
        // Legacy method for compatibility
        const canvas = { width, height };
        this.visualizers.forEach(viz => {
            if (viz.init) {
                viz.init(canvas, ctx);
            }
        });
    }

    setActive(name) {
        const visualizer = this.visualizers.get(name);
        if (visualizer) {
            this.currentVisualizer = visualizer;
            console.log(`Active visualizer: ${name}`);
            return true;
        }
        return false;
    }

    update(timeDomainData, frequencyData) {
        if (this.currentVisualizer) {
            this.currentVisualizer.update(timeDomainData, frequencyData);
        }
    }

    draw() {
        if (this.currentVisualizer) {
            // Ensure visualizer is initialized before drawing
            if (!this.currentVisualizer.canvas || !this.currentVisualizer.ctx) {
                // Try to initialize if canvas is available
                const canvas = document.getElementById('visualizerCanvas');
                if (canvas && canvas.getContext) {
                    const ctx = canvas.getContext('2d');
                    if (ctx && this.currentVisualizer.init) {
                        this.currentVisualizer.init(canvas, ctx);
                    }
                }
            }
            
            // Only draw if canvas is available
            if (this.currentVisualizer.canvas && this.currentVisualizer.ctx) {
                this.currentVisualizer.draw();
            }
        }
    }

    getAll() {
        return Array.from(this.visualizers.values());
    }

    getCurrent() {
        return this.currentVisualizer;
    }

    getCurrentName() {
        return this.currentVisualizer ? this.currentVisualizer.name : null;
    }

    get(name) {
        return this.visualizers.get(name);
    }

    getVisualizerNames() {
        return Array.from(this.visualizers.keys());
    }
}
