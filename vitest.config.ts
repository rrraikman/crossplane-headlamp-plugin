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
    // Each jsdom worker (more with coverage) can take several GB; the default
    // pool of one per core exhausted a 16 GB dev machine.
    maxWorkers: 2,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/__mocks__/**', 'src/testing.ts'],
      thresholds: {
        statements: 75,
        branches: 67,
        functions: 72,
        lines: 74,
      },
    },
  },
});
