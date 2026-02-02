import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
// Use './' for universal deployment (works on any platform)
// Override with VITE_BASE_URL env variable if needed for specific platforms
export default defineConfig({
  base: process.env.VITE_BASE_URL || './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Required headers for WebContainer API (SharedArrayBuffer support)
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})

