import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  // Priorizar process.env (CI) sobre loadEnv (.env files)
  const basePath = process.env.VITE_BASE_URL || env.VITE_BASE_URL || '/';
  
  // Recopilar todas las variables VITE_ de process.env para asegurar que se incluyan en el build
  const processViteEnv: Record<string, string> = {};
  for (const key in process.env) {
    if (key.startsWith('VITE_')) {
      processViteEnv[`import.meta.env.${key}`] = JSON.stringify(process.env[key]);
    }
  }

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
    define: {
      ...processViteEnv,
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    test: {
      globals: true,
      environment: 'jsdom',
    },
  };
});
