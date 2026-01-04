# Voxel Environment

A Minecraft-like 3D voxel world built with Three.js - procedurally generated terrain,
block placement/destruction, and player physics in a single HTML file.

## Quick Links

- **Live Demo**: https://zenbin.onrender.com/p/vox-v8
- **Source**: https://github.com/twilson63/voxel

## Features

- First-person exploration with pointer lock controls
- Procedurally generated terrain using 4-octave simplex noise
- Place blocks (E) and destroy blocks (Q) with raycasting
- 3 block types: Grass, Dirt, Stone
- Dynamic chunk loading/unloading (64-block render distance)
- Floating cloud system with procedural drift
- AABB collision detection with gravity and jumping
- Single-file production build (~484KB) with no external dependencies

## Quick Start

```bash
npm install                    # Install dependencies
npm run serve                  # Dev server (CDN Three.js)
npm run serve:dist            # Build + serve production locally
npm run build                 # Creates dist/index.html
npm run deploy                # Build + push GitHub + deploy ZenBin
```

## Controls

| Key/Action | Function |
|------------|----------|
| Click | Enable pointer lock |
| WASD / Arrow Keys | Move forward/back/strafe |
| Space | Jump |
| E | Place block |
| Q | Destroy block |
| 1 / 2 / 3 | Select block type |
| ESC | Release mouse |

## Project Structure

```
voxel/
├── index.html           # Dev template (CDN Three.js)
├── main.js              # Entry point, game loop, state management
├── player.js            # Physics, movement, controls, collision
├── renderer.js          # Three.js scene, instanced meshes, textures
├── voxel-world.js       # Chunk/terrain generation, block operations
├── textures.js          # Canvas-based procedural textures
├── noise.js             # Simplex noise implementation
├── cloud.js             # Cloud spawning & drift system
├── build.js             # esbuild bundling for production
├── deploy.js            # GitHub + ZenBin deployment
├── package.json         # Dependencies & npm scripts
└── README.md            # This file
```

## Code Architecture

### Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| main.js | Game initialization, loop orchestration, chunk update scheduling |
| player.js | Physics engine, WASD movement, jump/gravity, AABB collision |
| renderer.js | Three.js scene setup, InstancedMesh per block type |
| voxel-world.js | Chunk data structures, terrain generation, block CRUD |
| textures.js | Procedural 16x16 pixel textures via Canvas API |
| noise.js | Simplex noise with configurable octaves |
| cloud.js | Cloud chunks, floating block management, drift physics |

### Data Flow

- `main.js init()` creates the renderer, world, and player
- `renderer.js` sets up Three.js scene, camera, and InstancedMeshes for each block type
- `voxel-world.js` generates initial terrain chunks around the spawn point
- `player.js` attaches PointerLockControls and starts the physics loop
- In `gameLoop`:
  - `player.update(deltaTime)` handles movement, gravity, and collision
  - `cloudManager.update(deltaTime)` spawns and drifts clouds
  - `loadChunks()` loads new chunks near the player position
  - `updateDirtyChunks()` rebuilds InstancedMeshes for modified chunks
  - `renderer.render()` draws the final frame

## Technical Details

- **Chunk Size**: 16x64x16 blocks (16,384 blocks per chunk)
- **Render Distance**: 64 blocks (4 chunk radius)
- **Block Cache**: 50 chunks maximum
- **Physics**: AABB (0.6x1.8x0.6 player dimensions)
- **Terrain**: Simplex noise (4 octaves, 0.02 frequency)
- **Rendering**: InstancedMesh per block type (single draw call)
- **Textures**: Procedural Canvas generation, 16x16 pixels, NearestFilter

## Technology Stack

- **Three.js 0.160.0** - 3D rendering engine
- **Vanilla JavaScript** - ES modules (no transpilation)
- **esbuild** - Production bundling to single HTML
- **Node.js** - Build tooling and scripts
- **ZenBin** - Single-file static hosting

## Deployment

### Automatic Deployment

```bash
npm run deploy  # Runs: build + git add/commit/push + ZenBin POST
```

### URLs

- GitHub: https://github.com/twilson63/voxel
- Production: https://zenbin.onrender.com/p/vox-v8

## Contributing Guidelines

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes to source files in root directory
4. Test with `npm run serve` and `npm run serve:dist`
5. Commit: `git add -A && git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

### Coding Standards

- ES modules (import/export syntax)
- No external CDN imports in source files (use npm packages)
- Run `npm run serve:dist` before committing to verify build
- Update README.md if adding significant new features
- Keep modules focused (single responsibility principle)

### Development Setup

```bash
# Requires Node.js 18+
npm install
npm run serve   # Visit http://localhost:8080
```

## Acknowledgments

- **Three.js** - https://threejs.org/ (MIT License)
- **Simplex Noise** - Original implementation by Stefan Gustavson

## License

MIT License - Copyright (c) 2025 rakis

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the
Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.