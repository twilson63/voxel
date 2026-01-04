import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'fs';
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function build() {
  // Clean and create dist
  rmSync('dist', { force: true, recursive: true });
  mkdirSync('dist', { recursive: true });

  // Copy any assets from public/ to dist/
  if (existsSync('public')) {
    cpSync('public', 'dist', { recursive: true });
  }

  // Bundle JS with Three.js included
  await esbuild.build({
    entryPoints: ['main.js'],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    outfile: 'dist/bundle.js',
    sourcemap: true,
    external: [],
  });

  // Read source HTML and bundled JS
  const htmlTemplate = readFileSync('index.html', 'utf-8');
  const bundle = readFileSync('dist/bundle.js', 'utf-8');

  // Remove importmap and inline bundle with Three.js
  const bundleWithCall = bundle.replace(/export\{.*?\};$/m, '');
  const htmlWithInlineJS = htmlTemplate
    .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '')
    .replace(/<script type="module">\s*import \{ init \} from '\.\/main\.js';[\s\S]*?<\/script>\s*/s, '')
    .replace('</body>', `  <script type="module">\n${bundleWithCall}\nme();\n  </script>\n</body>`);

  // Write dist/index.html
  writeFileSync('dist/index.html', htmlWithInlineJS);

  // Cleanup temp files
  rmSync('dist/bundle.js');
  rmSync('dist/bundle.js.map');

  console.log('✓ Built dist/index.html');
  console.log('✓ Minified and inlined local JS + Three.js');
  console.log('✓ Copied assets from public/');
}

build().catch(() => process.exit(1));