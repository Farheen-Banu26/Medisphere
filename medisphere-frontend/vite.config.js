import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,  // Fail fast if 5173 is taken instead of silently using 5174/5175.
                       // This forces the developer to stop the old process (npm run stop)
                       // rather than running on a port Keycloak doesn't allow.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
