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
    format: 'esm',
    platform: 'browser',
    minify: true,
    outfile: 'dist/bundle.js',
    sourcemap: false,
    external: [],
  });

  // Read bundle
  const bundleBytes = readFileSync('dist/bundle.js');
  
  // Remove export and sourcemap
  const bundleStr = bundleBytes.toString('utf8');
  const bundleClean = bundleStr
    .replace(/export\{.*?\};?$/m, '')
    .replace(/\/\/#\s*sourceMappingURL=.*$/gm, '');
  const bundleCleanBytes = Buffer.from(bundleClean, 'utf8');

  // Read template
  const templateBytes = readFileSync('index.html');
  
  // Find </body>
  const bodyTag = Buffer.from('</body>', 'utf8');
  const bodyPos = templateBytes.indexOf(bodyTag);
  
  console.log(`Template size: ${templateBytes.length}`);
  console.log(`</body> at position: ${bodyPos}`);
  
  // Create pieces
  const beforeBody = templateBytes.slice(0, bodyPos);
  const afterBody = templateBytes.slice(bodyPos);
  // afterBody starts with </body>
  
  console.log(`beforeBody size: ${beforeBody.length}`);
  console.log(`afterBody starts with: ${afterBody.slice(0, 20)}`);
  
  // Create the script tag content
  const scriptOpen = Buffer.from('<script type="module">', 'utf8');
  const scriptClose = Buffer.from('</script>', 'utf8');
  const meCall = Buffer.from('me();', 'utf8');
  
  // Assemble: beforeBody + scriptOpen + bundle + meCall + scriptClose + afterBody
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
  console.log(`Result size: ${resultBytes.length}`);
  console.log(`</body> count in result: ${bodyCount}`);
  
  const stats = require('fs').statSync('dist/index.html');
  console.log(`✓ Built dist/index.html (${Math.round(stats.size / 1024)}KB)`);
}

build().catch(() => process.exit(1));