import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'skip-youtube-processing',
      enforce: 'pre', // Run before other plugins
      resolveId(id) {
        // Mark these files so we can handle them in load()
        if (id.includes('youtube-search.js') || 
            id.includes('youtube-audio.js') || 
            id.includes('youtube-integration.js')) {
          return id;
        }
        return null;
      },
      load(id) {
        // Serve YouTube scripts directly without processing
        if (id.includes('youtube-search.js')) {
          const filePath = resolve(__dirname, 'src/js/youtube-search.js');
          if (existsSync(filePath)) {
            return readFileSync(filePath, 'utf-8');
          }
        }
        if (id.includes('youtube-audio.js')) {
          const filePath = resolve(__dirname, 'src/js/youtube-audio.js');
          if (existsSync(filePath)) {
            return readFileSync(filePath, 'utf-8');
          }
        }
        if (id.includes('youtube-integration.js')) {
          const filePath = resolve(__dirname, 'src/js/youtube-integration.js');
          if (existsSync(filePath)) {
            return readFileSync(filePath, 'utf-8');
          }
        }
        return null;
      }
    }
  ],
  root: './',
  base: './',
  build: {
    outDir: 'dist-vite',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      strict: false
    },
    hmr: {
      overlay: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    exclude: ['electron']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
