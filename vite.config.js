import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const REQUIRED_BUILD_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
    const missing = REQUIRED_BUILD_ENV.filter(k => !env[k]);
    if (missing.length) {
      throw new Error(
        `[vite build] Missing required env vars: ${missing.join(', ')}\n` +
        `Set them in Vercel project settings (Production) or in .env.production for local builds.`
      );
    }
  }
  return {
    plugins: [react()],
    server: { port: 3000 },
    build: { outDir: 'dist' },
  };
});
