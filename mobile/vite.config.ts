import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Repo root (one level up from /mobile)
const repoRoot = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  publicDir: path.resolve(__dirname, 'public'),
  resolve: {
    alias: {
      // Shared code reuse — identical to Next.js "@/..." aliases
      '@': repoRoot,
      '@/components': path.resolve(repoRoot, 'components'),
      '@/contexts': path.resolve(repoRoot, 'contexts'),
      '@/hooks': path.resolve(repoRoot, 'hooks'),
      '@/lib': path.resolve(repoRoot, 'lib'),
      '@/types': path.resolve(repoRoot, 'types'),
      // Next.js compatibility shims so shared components work unchanged
      'next/link': path.resolve(__dirname, 'src/compat/next-link.tsx'),
      'next/navigation': path.resolve(__dirname, 'src/compat/next-navigation.ts'),
      'next/image': path.resolve(__dirname, 'src/compat/next-image.tsx'),
      'next/font/local': path.resolve(__dirname, 'src/compat/next-font.ts'),
      'next/font/google': path.resolve(__dirname, 'src/compat/next-font.ts'),
    },
    // CRITICAL: prevent duplicate copies of React and Query from the repo-root
    // node_modules (installed for Next.js web build) from being bundled alongside
    // the /mobile copy. Without this, providers and components end up with
    // different context instances and React Query / Motion crash at runtime.
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@tanstack/react-query',
      'motion',
      'motion/react',
      'framer-motion',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2020',
  },
  // Stub Node-only globals referenced by shared Next.js code so they
  // don't crash in the browser. `process.env.*` references become `undefined`
  // and fall through to the shared runtime defaults.
  define: {
    'process.env.NEXT_PUBLIC_API_BASE_URL': JSON.stringify(
      process.env.VITE_API_BASE_URL ?? '',
    ),
    'process.env.NEXT_PUBLIC_SIGNALR_BASE_URL': JSON.stringify(
      process.env.VITE_SIGNALR_BASE_URL ?? '',
    ),
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV ?? 'production',
    ),
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
