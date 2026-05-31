import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@kinvolk/headlamp-plugin/lib/k8s/cluster': path.resolve(
        __dirname,
        'src/__mocks__/headlamp-k8s-cluster.ts'
      ),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: 'src/setupTests.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/__mocks__/**'],
      thresholds: {
        statements: 39,
        branches: 35,
        functions: 33,
        lines: 37,
      },
    },
  },
});
