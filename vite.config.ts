import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3010,
    proxy: {
      '/api': {
        target: 'http://localhost:3010', // agora backend também está na 3010
        changeOrigin: true,
      },
    },
    // Force cache invalidation
    hmr: {
      overlay: true,
      port: 24678 // Different port for HMR
    },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  // Force complete rebuild every time
  optimizeDeps: {
    force: true,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  build: {
    // Force rebuild and cache busting
    rollupOptions: {
      cache: false,
      output: {
        // Add timestamp to filenames to bust cache
        entryFileNames: `[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `[name]-[hash]-${Date.now()}.[ext]`
      }
    }
  },  // Disable all caching
  // cacheDir: 'node_modules/.vite-disabled',
  esbuild: {
    target: 'es2020'
  }
});