import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'fs';
import * as esbuild from 'esbuild';
import { minify } from 'html-minifier';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
  const bundleMinified = bundle.replace(/export\{.*?\};$/m, '').replace(/\n/g, '').replace(/\s{2,}/g, ' ');
  const htmlWithInlineJS = htmlTemplate
    .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '')
    .replace(/<script type="module">\s*import \{ init \} from '\.\/main\.js';[\s\S]*?<\/script>\s*/s, '')
    .replace('</body>', `<script type="module">${bundleMinified}me();</script></body>`);

  // Minify HTML with html-minifier (preserve module scripts)
  const minifiedHTML = minify(htmlWithInlineJS, {
    collapseWhitespace: true,
    removeComments: true,
    removeOptionalTags: true,
    removeRedundantAttributes: true,
    removeTagWhitespace: true,
    minifyCSS: true,
    minifyJS: false, // JS already minified by esbuild
    ignoreCustomFragments: [/<script[^>]*>[\s\S]*?<\/script>/gi]
  });

  // Write dist/index.html
  writeFileSync('dist/index.html', minifiedHTML);

  // Cleanup temp files
  rmSync('dist/bundle.js');
  rmSync('dist/bundle.js.map');

  console.log('✓ Built dist/index.html');
  console.log('✓ Minified and inlined local JS + Three.js');
  console.log('✓ Copied assets from public/');
}

build().catch(() => process.exit(1));