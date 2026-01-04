# AGENTS.md - Voxel Environment Development Guide

This document provides guidelines for AI agents working on the Voxel Environment codebase.

## Build/Lint/Test Commands

```bash
# Development
npm run serve              # Dev server at http://localhost:8080 (uses CDN Three.js)
npm run serve:dist         # Build + serve production locally

# Build & Deploy
npm run build              # Creates dist/index.html (~480KB single file)
npm run deploy             # Build + git commit/push + ZenBin deploy

# Manual build
node build.js              # esbuild bundling to dist/
node deploy.js             # GitHub + ZenBin deployment
```

No test framework is currently configured. When adding tests, prefer:
- Run specific test: `node --test testfile.js` (native Node test runner)
- Or: `vitest run testfile.test.js` (if using Vitest)

## Code Style Guidelines

### Imports
- Use ES modules: `import { func } from './module.js';`
- Third-party imports first, then local imports
- Three.js: `import * as THREE from 'three';`
- Order: standard library → dependencies → local modules

### Formatting
- 4-space indentation (matches existing codebase)
- No trailing whitespace
- One blank line between function definitions
- No extra blank lines at file end
- Avoid inline comments unless explaining non-obvious logic

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `VoxelRenderer` |
| Functions | camelCase | `loadChunks` |
| Variables | camelCase | `isRunning` |
| Constants | UPPER_SNAKE_CASE | `CHUNK_SIZE_X` |
| Module files | kebab-case | `voxel-world.js` |
| Private methods | underscore prefix | `_setupInput()` |

### Error Handling
- Use try/catch for async operations (see `deploy.js:6-13`)
- Exit with `process.exit(1)` on fatal build errors
- Log error message to console before exiting
- Validate inputs at function boundaries

### Three.js Patterns
- Use `InstancedMesh` per block type (single draw call per material)
- Always dispose resources in cleanup: `geometry.dispose()`, `material.dispose()`
- Reuse `THREE.Vector3` and `Object3D` as dummies for matrix operations
- Set `instanceMatrix.setUsage(THREE.DynamicDrawUsage)` for frequently updated meshes

### Memory Management
- Dispose THREE.js resources (geometries, materials, renderers)
- Clear arrays/sets that accumulate data per-frame
- Remove event listeners on cleanup
- Use `WeakMap` for object-to-data mappings

### Module Responsibilities
| Module | Responsibility |
|--------|----------------|
| `main.js` | Game loop, state management, chunk scheduling |
| `player.js` | Physics, movement, AABB collision, controls |
| `renderer.js` | Three.js scene, instanced meshes, textures |
| `voxel-world.js` | Chunk data, terrain generation, block CRUD |
| `textures.js` | Canvas-based procedural textures |
| `noise.js` | Simplex noise implementation |
| `cloud.js` | Cloud spawning, drift system |

### Physics Constants
Define at module top with descriptive names:
```javascript
const PLAYER_HEIGHT = 1.8;
const PLAYER_WIDTH = 0.6;
const GRAVITY = 20.0;
const DEFAULT_MOVE_SPEED = 8.0;
const DEFAULT_JUMP_HEIGHT = 10.0;
```

### Performance Guidelines
- Batch instanced mesh updates: set count last, mark needsUpdate once
- Use spatial hashing for collision detection (not O(n³) iteration)
- Reuse vectors/matrices instead of creating new objects per frame
- Debounce chunk loading and expensive operations

### Git Workflow
- Run `npm run serve:dist` before committing to verify build
- Update README.md if adding significant features
- Commit message: describe the "why" not just the "what"

### Code Patterns to Follow
- Class-based architecture with one class per file
- Main module exports `init()` and optionally `reset()`
- Renderer returns facade object with subset of methods
- Constants exported from defining module only

### Patterns to Avoid
- Don't import unused symbols
- Don't create Vector3/objects in hot paths
- Don't mutate function arguments without clear side effects
- Don't use magic numbers; define as constants