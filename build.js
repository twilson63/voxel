import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'fs';
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function build() {
  rmSync('dist', { force: true, recursive: true });
  mkdirSync('dist', { recursive: true });

  if (existsSync('public')) {
    cpSync('public', 'dist', { recursive: true });
  }

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

  const htmlTemplate = readFileSync('index.html', 'utf-8');
  const bundle = readFileSync('dist/bundle.js', 'utf-8');

  const bundleMinified = bundle.replace(/export\{.*?\};$/m, '');

  const htmlWithInlineJS = htmlTemplate
    .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '')
    .replace(/<script type="module">\s*import \{ init \} from '\.\/main\.js';[\s\S]*?<\/script>\s*/s, '')
    .replace('</body>', `<script type="module">${bundleMinified}me();</script></body>`);

  const lines = htmlWithInlineJS.split('\n');
  const collapsed = lines.map(l => l.trim()).filter(l => l.length > 0);
  const minifiedHTML = collapsed.join('');

  writeFileSync('dist/index.html', minifiedHTML);

  rmSync('dist/bundle.js');
  rmSync('dist/bundle.js.map');

  const stats = require('fs').statSync('dist/index.html');
  console.log(`✓ Built dist/index.html (${Math.round(stats.size / 1024)}KB)`);
  console.log('✓ Minified and inlined local JS + Three.js');
}

build().catch(() => process.exit(1));