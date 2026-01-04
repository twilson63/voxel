import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'fs';
import * as esbuild from 'esbuild';

async function build() {
  rmSync('dist', { force: true, recursive: true });
  mkdirSync('dist', { recursive: true });

  if (existsSync('public')) {
    cpSync('public', 'dist', { recursive: true });
  }

  await esbuild.build({
    entryPoints: ['main.js'],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    minify: true,
    outfile: 'dist/bundle.js',
    sourcemap: false,
    external: [],
    globalName: 'VoxelApp',
  });

  // Read bundle
  const bundleBytes = readFileSync('dist/bundle.js');
  const bundleStr = bundleBytes.toString('utf8');
  const bundleClean = bundleStr
    .replace(/\/\/#\s*sourceMappingURL=.*$/gm, '');
  const bundleCleanBytes = Buffer.from(bundleClean, 'utf8');

  // Read template
  const templateBytes = readFileSync('index.html');
  const templateStr = templateBytes.toString('utf8');
  
  // Remove importmap and module scripts first (as strings)
  const templateNoScripts = templateStr
    .replace(/<script type="importmap">[\s\S]*?<\/script>\s*/, '')
    .replace(/<script type="module">\s*import \{ init \} from '\.\/main\.js';[\s\S]*?<\/script>\s*/s, '');

  // Convert back to bytes
  const templateNoScriptsBytes = Buffer.from(templateNoScripts, 'utf8');
  
  // Find </body>
  const bodyTag = Buffer.from('</body>', 'utf8');
  const bodyPos = templateNoScriptsBytes.indexOf(bodyTag);
  
  if (bodyPos === -1) {
    throw new Error('Could not find </body> in template');
  }
  
  // Create pieces: beforeBody + script + afterBody
  const beforeBody = templateNoScriptsBytes.slice(0, bodyPos);
  const afterBody = templateNoScriptsBytes.slice(bodyPos);
  
  const scriptOpen = Buffer.from('<script type="module">', 'utf8');
  const scriptClose = Buffer.from('</script>', 'utf8');
  const meCall = Buffer.from('VoxelApp.init();', 'utf8');
  
  const resultBytes = Buffer.concat([
    beforeBody,
    scriptOpen,
    bundleCleanBytes,
    meCall,
    scriptClose,
    afterBody
  ]);
  
  writeFileSync('dist/index.html', resultBytes);
  rmSync('dist/bundle.js');

  // Verify
  const resultStr = resultBytes.toString('utf8');
  const bodyCount = (resultStr.match(/<\/body>/g) || []).length;
  const importCount = (resultStr.match(/import \{ init \}/g) || []).length;
  
  console.log(`Result size: ${resultBytes.length}`);
  console.log(`</body> count: ${bodyCount}`);
  console.log(`import { init } count: ${importCount}`);
  
  if (importCount > 0) {
    console.error('ERROR: import statement still present!');
    process.exit(1);
  }
  
  const stats = require('fs').statSync('dist/index.html');
  console.log(`✓ Built dist/index.html (${Math.round(stats.size / 1024)}KB)`);
}

build().catch(() => process.exit(1));