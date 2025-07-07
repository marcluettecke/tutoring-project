/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/testing/setup.ts'],
    server: {
      deps: {
        inline: ['@angular/core', '@angular/platform-browser']
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/testing/',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/main.ts',
        'src/environments/',
        '**/*.config.ts',
        '**/*.config.js'
      ],
      thresholds: {
        global: {
          statements: 40,
          branches: 35,
          functions: 45,
          lines: 40
        }
      }
    },
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules/', 'dist/', 'cypress/', 'src/testing/'],
    reporters: ['verbose']
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src'),
      '@testing': resolve(process.cwd(), 'src/testing')
    }
  },
  define: {
    'import.meta.vitest': undefined,
  },
  optimizeDeps: {
    include: ['@angular/fire/auth', 'rxfire/auth']
  },
  plugins: [
    {
      name: 'angular-component-loader',
      transform(code, id) {
        if (id.endsWith('.component.ts')) {
          // Replace templateUrl and styleUrls with inline templates/styles for testing
          return code
            .replace(/templateUrl\s*:\s*['"`]([^'"`]+)['"`]/g, 'template: ""')
            .replace(/styleUrls\s*:\s*\[[^\]]*\]/g, 'styles: []');
        }
        return null;
      }
    }
  ],
  deps: {
    external: ['rxfire/auth']
  }
});