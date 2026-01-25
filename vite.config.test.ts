import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('vite.config.ts', () => {
  it('should include reactRouter plugin', () => {
    const configContent = readFileSync(join(__dirname, 'vite.config.ts'), 'utf-8');
    expect(configContent).toContain('reactRouter()');
    expect(configContent).toContain('import { reactRouter } from "@react-router/dev/vite"');
  });

  it('should include Tailwind CSS v4 plugin', () => {
    const configContent = readFileSync(join(__dirname, 'vite.config.ts'), 'utf-8');
    // Should have the tailwindcss import and plugin call
    expect(configContent).toMatch(/tailwindcss\(\)/);
  });

  it('should include tsconfigPaths plugin', () => {
    const configContent = readFileSync(join(__dirname, 'vite.config.ts'), 'utf-8');
    expect(configContent).toContain('tsconfigPaths()');
    expect(configContent).toContain('import tsconfigPaths from "vite-tsconfig-paths"');
  });

  it('should have plugins in correct order for React Router v7', () => {
    const configContent = readFileSync(join(__dirname, 'vite.config.ts'), 'utf-8');
    // reactRouter should come first in the plugins array
    const pluginsMatch = configContent.match(/plugins:\s*\[(.*?)\]/s);
    expect(pluginsMatch).toBeTruthy();
    if (pluginsMatch) {
      const pluginsArray = pluginsMatch[1];
      const reactRouterIndex = pluginsArray.indexOf('reactRouter()');
      const tailwindIndex = pluginsArray.indexOf('tailwindcss()');
      const tsconfigIndex = pluginsArray.indexOf('tsconfigPaths()');

      expect(reactRouterIndex).toBeGreaterThan(-1);
      expect(tailwindIndex).toBeGreaterThan(-1);
      expect(tsconfigIndex).toBeGreaterThan(-1);
      expect(reactRouterIndex).toBeLessThan(tailwindIndex); // React Router should come before Tailwind
    }
  });
});
