import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  // Transformation JSX automatique (React 19) sans plugin-react ESM-only.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    // environnement par défaut Node (tests purs lib/utils/…)
    environment: 'node',
    // Switcher en happy-dom uniquement sur les tests qui touchent à React / DOM,
    // via le suffixe `.dom.test.{ts,tsx}`. Évite de payer le coût happy-dom
    // sur les centaines de tests purs.
    environmentMatchGlobs: [
      ['src/**/*.dom.test.{ts,tsx}', 'happy-dom'],
    ],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
