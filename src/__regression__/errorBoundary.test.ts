import { describe, expect, it } from 'vitest';

const fs = await import('node:fs');
const path = await import('node:path');

function readRepoFile(rel: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8');
}

describe('app/error.tsx — ErrorBoundary contract (W10.1)', () => {
  it('exports a named ErrorBoundary that takes ErrorBoundaryProps', () => {
    const src = readRepoFile('app/error.tsx');
    expect(src).toMatch(/export function ErrorBoundary\s*\(/);
    expect(src).toContain('ErrorBoundaryProps');
  });

  it('renders a retry button that calls retry()', () => {
    const src = readRepoFile('app/error.tsx');
    expect(src).toContain('retry');
    expect(src).toMatch(/onPress=\{onRetry\}/);
    expect(src).toContain('accessibilityLabel="Try again"');
  });

  it('is re-exported from app/_layout.tsx so expo-router picks it up', () => {
    const layoutSrc = readRepoFile('app/_layout.tsx');
    expect(layoutSrc).toMatch(/export\s*\{\s*ErrorBoundary\s*\}\s*from\s*['"]\.\/error['"]/);
  });

  it('shows the underlying error message to the user', () => {
    const src = readRepoFile('app/error.tsx');
    expect(src).toContain('error.message');
  });
});
