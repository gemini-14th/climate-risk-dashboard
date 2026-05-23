import { defineConfig } from 'vite';

// https://vite.dev/config/
// No plugin-react needed — Vite handles JSX via esbuild by default.
// The API base URL is injected by Vercel at build time via VITE_API_BASE_URL.
export default defineConfig({
  // No hardcoded localhost — all API calls use import.meta.env.VITE_API_BASE_URL
});
