# Feature Plan: Single HTML Build

## Overview

Create a build system that bundles all local JavaScript files into a single inline HTML file for easy distribution while keeping Three.js loaded from CDN for caching.

---

## Objectives

1. **Bundle local JS** - Combine 7 source files into 1 inline script
2. **Minify output** - Reduce bundle size (~30KB vs ~50KB)
3. **Copy assets** - Copy any files from `public/` to `dist/`
4. **Auto-rebuild on serve** - Development server auto-rebuilds before serving

---

## File Structure

### Before Build
```
voxel/
├── index.html          (dev - ES modules)
├── main.js             (source)
├── renderer.js         (source)
├── player.js           (source)
├── voxel-world.js      (source)
├── textures.js         (source)
├── noise.js            (source)
├── cloud.js            (source)
├── build.js            (NEW - build script)
├── package.json        (MODIFIED - add esbuild, scripts)
├── public/             (OPTIONAL - assets to copy)
└── dist/               (GENERATED)
    └── index.html      (production build)
```

### After Build
```
voxel/dist/
├── index.html          (single file, all JS inline)
└── ...                 (copied assets from public/)
```

---

## Build Script (`build.js`)

```javascript
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

  // Bundle JS (minified)
  await esbuild.build({
    entryPoints: ['main.js'],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    outfile: 'dist/bundle.js',
    sourcemap: true,
  });

  // Read source HTML and bundled JS
  const htmlTemplate = readFileSync('index.html', 'utf-8');
  const bundle = readFileSync('dist/bundle.js', 'utf-8');

  // Inline bundle into HTML
  const htmlWithInlineJS = htmlTemplate
    .replace(/<script type="module">[\s\S]*?<\/script>/, '')
    .replace('</body>', `  <script type="module">\n${bundle}\n  </script>\n</body>`);

  // Write dist/index.html
  writeFileSync('dist/index.html', htmlWithInlineJS);

  // Cleanup temp files
  rmSync('dist/bundle.js');
  rmSync('dist/bundle.js.map');

  console.log('✓ Built dist/index.html');
  console.log('✓ Minified and inlined local JS');
  console.log('✓ Copied assets from public/');
}

build().catch(() => process.exit(1));
```

---

## Package.json Updates

```json
{
  "type": "module",
  "devDependencies": {
    "esbuild": "^0.20.0"
  },
  "scripts": {
    "build": "node build.js",
    "serve": "python3 -m http.server 8080",
    "serve:dist": "npm run build && python3 -m http.server 8080 --directory dist"
  }
}
```

---

## Commands

| Command | Action |
|---------|--------|
| `npm install` | Install esbuild |
| `npm run build` | Build dist/index.html |
| `npm run serve` | Serve dev on http://localhost:8080 |
| `npm run serve:dist` | Auto-rebuild + serve dist on http://localhost:8080 |

---

## Output Comparison

| Aspect | `./index.html` (dev) | `dist/index.html` (prod) |
|--------|---------------------|--------------------------|
| Local JS | 7 separate ES modules | 1 inline bundle (~30KB minified) |
| Three.js | CDN | CDN |
| HTTP requests | 8 initial (7 JS + HTML) | 1 (HTML with inline JS) |
| Development | Full source, debugging | Bundled, minified |
| Distribution | Requires all source files | Single file |

---

## How It Works

### Step 1: Clean & Setup
- Remove existing `dist/` directory
- Create fresh `dist/` directory
- Copy assets from `public/` (if exists)

### Step 2: Bundle with esbuild
- Entry point: `main.js`
- Output: `dist/bundle.js` (ES module format, minified)
- Three.js imports resolve via importmap in HTML

### Step 3: Inline into HTML
- Read `index.html` template
- Remove existing module script
- Read bundled JS
- Insert bundled JS into `<script type="module">` tag before `</body>`
- Write to `dist/index.html`

### Step 4: Cleanup
- Remove temporary `dist/bundle.js`
- Remove source map

### Step 5: Serve (dev command)
- Run build script
- Start HTTP server on `dist/` directory
- Changes to source require rebuild

---

## esbuild Configuration

| Option | Value | Purpose |
|--------|-------|---------|
| entryPoints | `['main.js']` | Entry module |
| bundle | `true` | Include all dependencies |
| format | `'esm'` | ES modules for browser |
| platform | `'browser'` | Browser target |
| minify | `true` | Minify output |
| outfile | `'dist/bundle.js'` | Output path |

---

## Assets Handling

### Public Directory
```
voxel/
└── public/
    ├── textures/
    │   └── grass.png
    └── sounds/
        └── ambient.mp3
```

After build:
```
voxel/dist/
├── index.html
├── textures/
│   └── grass.png
└── sounds/
    └── ambient.mp3
```

### Rules
- Files in `public/` are copied recursively to `dist/`
- Create `public/` directory to enable asset copying
- Omit `public/` if no assets needed

---

## Development Workflow

### Daily Development
```bash
npm run serve  # Serve ./index.html on 8080
# Edit source files, refresh browser
```

### Production Build
```bash
npm run serve:dist  # Builds, serves dist/ on 8080
# Test production build
```

### Distribution
```bash
npm run build
# Upload dist/ folder
```

---

## Estimated Time: **30 minutes**

- Create build.js: 10 min
- Update package.json: 5 min
- Test build process: 10 min
- Test serve:dist command: 5 min

---

## Files Modified/Created

| File | Action | Notes |
|------|--------|-------|
| `build.js` | Create | Build script |
| `package.json` | Modify | Add esbuild, scripts |
| `public/` | Optional | Create for assets |
| `dist/index.html` | Generate | Production build |

---

## Success Criteria

- [ ] `npm run build` produces valid `dist/index.html`
- [ ] `dist/index.html` loads without errors in browser
- [ ] `npm run serve:dist` auto-rebuilds and serves dist/
- [ ] All local JS files bundled and minified
- [ ] Assets from `public/` copied to `dist/`
- [ ] Three.js still loads from CDN (not bundled)
- [ ] `./index.html` still works for development

---

## Troubleshooting

### Error: Cannot use import statement outside a module
**Cause:** HTML still uses `src="./main.js"` instead of inline script
**Fix:** Ensure build script correctly removes and replaces module script

### Error: Three.js not found
**Cause:** Importmap missing or incorrect CDN URL
**Fix:** Verify importmap in index.html points to correct Three.js version

### Error: Asset files not found
**Cause:** `public/` directory doesn't exist or empty
**Fix:** Create `public/` directory with files, re-run build

### Error: Build fails
**Cause:** Syntax error in source files or missing dependencies
**Fix:** Run `npm install` first, check console for errors

---

## Future Enhancements

1. **Watch mode** - Auto-rebuild on file changes
2. **Source maps** - Keep sourcemaps for debugging
3. **Different formats** - IIFE format for non-module browsers
4. **Environment config** - Different configs for dev/prod
5. **Versioned builds** - Append version to dist/index.html