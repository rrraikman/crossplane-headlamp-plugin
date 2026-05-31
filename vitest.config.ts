import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: 'node_modules/@kinvolk/headlamp-plugin/config/setupTests.js',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
  },
});
