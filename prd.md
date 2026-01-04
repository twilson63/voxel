# Voxel Environment - Product Requirements Document

## Overview
A Minecraft-like voxel environment in a single HTML file using vanilla JavaScript and Three.js. Users can navigate a 3D world, place blocks, and destroy blocks in an immersive first-person experience.

## Technical Stack
- **Three.js** - 3D rendering engine via CDN
- **Vanilla JavaScript** - ES modules
- **Single HTML file** - Self-contained, no build step required

---

## Block Types
1. **Grass** - Top layer blocks (green top, dirt sides)
2. **Dirt** - Surface and subsurface layer (brown)
3. **Stone** - Deep layer blocks (gray)

---

## Technical Specifications

### World
| Property | Value |
|----------|-------|
| Chunk size | 16×64×16 blocks |
| Render distance | 64 blocks (4 chunk radius) |
| World height | 64 blocks (0-63) |
| Max loaded chunks | ~50 |

### Player
| Property | Value |
|----------|-------|
| Height | 1.8 blocks |
| Width | 0.6 blocks |
| Movement speed | Adjustable |
| Jump height | Adjustable |
| Gravity | ~30.0 units/s² |

---

## Architecture

### File Structure
Single HTML file containing:
- HTML structure
- CSS styling
- JavaScript modules (inline)

### JavaScript Modules

#### 1. main.js
- Entry point
- Game loop (requestAnimationFrame)
- Event listeners
- Chunk update scheduling

#### 2. player.js
- Camera management
- PointerLockControls integration
- Movement physics (velocity, friction, gravity)
- Collision detection (AABB)
- Input handling (WASD, space, mouse)

#### 3. voxel-world.js
- Chunk class and management
- Block storage data structures
- Terrain generation (Simplex noise)
- Block placement/removal operations
- Chunk rebuild logic

#### 4. renderer.js
- Three.js scene setup
- InstancedMesh management per block type
- Texture atlas generation
- Lighting setup (ambient + directional)
- Fog configuration

#### 5. noise.js
- Minimal Simplex noise implementation
- Seed-based generation
- Multi-octave noise for natural terrain

#### 6. textures.js
- Canvas-based texture generation
- Texture atlas creation
- UV mapping logic

---

## Data Structures

### Block Database
```javascript
// For quick block position lookups
blocks = new Map<string, Block>(); // Key: "x,y,z"
```

### Chunk Storage
```javascript
chunks = new Map<string, Chunk>(); // Key: "chunkX,chunkZ"
```

### Chunk Object
```javascript
chunk = {
  x: chunkX,           // Chunk grid X
  z: chunkZ,           // Chunk grid Z
  blocks: Set<string>, // Block positions for collision
  meshGrass: InstancedMesh,
  meshDirt: InstancedMesh,
  meshStone: InstancedMesh
}
```

### Block Object
```javascript
block = {
  x: number,
  y: number,
  z: number,
  type: 'grass' | 'dirt' | 'stone'
}
```

---

## Rendering Pipeline

```
World Data → Chunk Generation → Filter Visible Blocks →
InstancedMesh (per type) → Three.js Scene → Canvas
```

### InstancedMesh Strategy
- Separate InstancedMesh for each block type (grass, dirt, stone)
- Single draw call per block type = GPU efficient
- Rebuild chunk mesh only when blocks change
- Hidden blocks: set scale to 0 or move out of view

---

## User Interaction

### Controls
| Key/Action | Function |
|------------|----------|
| Click | Enable pointer lock |
| WASD | Move forward/back/strafe left/right |
| Space | Jump |
| Left Click (LMB) | Place block |
| Right Click (RMB) | Destroy block |
| Mouse | Look around |
| ESC | Disable pointer lock |

### Raycasting
1. Raycast from camera center (crosshair position)
2. Get intersected block and face normal
3. **Place block**: Add at `intersect.point + normal * 0.5`
4. **Destroy block**: Remove intersected block instance

### Crosshair
- Simple CSS overlay centered on screen
- Indicates which block is targeted
- Changes appearance when hovering over valid target

---

## Terrain Generation

### Algorithm
1. **Multi-octave Simplex noise** for heightmap
2. **Height = surface level** at each (x, z)
3. **Block distribution**:
   - y = height: Grass block
   - height - 1 to height - 3: Dirt blocks
   - Below: Stone blocks
   - y = 0: Bedrock (indestructible)

### Noise Parameters
```javascript
{
  amplitude: 1.0,
  frequency: 0.02,
  octaves: 4,
  persistence: 0.5,
  lacunarity: 2.0
}
```

---

## Collision Detection

### AABB (Axis-Aligned Bounding Box)
- Player represented as box: 0.6×1.8×0.6
- Check collisions against nearby blocks
- Separate axis resolution (X, Y, Z independently)

### Collision Flow
1. Calculate intended movement for each axis
2. Check collision with blocks in path
3. If collision: set velocity to 0, stop movement
4. Ground detection for jump capability

### Optimization
- Only check blocks within player chunk + neighbors
- Spatial query using block position map

---

## Graphics & Visuals

### Textures
- **Procedurally generated** using Canvas API
- **Pixelated** look (NearestFilter for mag/min filter)
- **Atlas** combining all block textures

### Texture Atlas Layout
- Grid of 16×16 tiles
- Each tile: 16×16 pixels
- Block types assigned to specific tiles

### Lighting
- **AmbientLight**: Soft global illumination
- **DirectionalLight**: Sun-like, with shadows
- **Fog**: Distance-based fog for depth perception

### Sky
- Solid color background (light blue)
- Or simple gradient if performance allows

---

## Chunk Management

### Chunk Loading
```javascript
// Determine which chunks to load
playerChunkX = floor(playerX / CHUNK_SIZE)
playerChunkZ = floor(playerZ / CHUNK_SIZE)

for dx = -RENDER_DISTANCE to RENDER_DISTANCE:
  for dz = -RENDER_DISTANCE to RENDER_DISTANCE:
    loadChunk(playerChunkX + dx, playerChunkZ + dz)
```

### Chunk Unloading
- Remove chunks beyond render distance
- Dispose Three.js resources (geometries, materials)
- Clear from data structures

### Chunk Rebuild
When block modified:
1. Mark chunk as dirty
2. Rebuild InstancedMesh for affected chunk
3. Update instance matrices
4. Set `instanceMatrix.needsUpdate = true`

---

## Performance Optimizations

| Technique | Benefit |
|-----------|---------|
| InstancedMesh | Single draw call per block type |
| Face culling | Don't render hidden faces (future) |
| Chunk LOD | Lower detail for distant chunks (future) |
| Object pooling | Reuse vector/matrix objects |
| Dirty flags | Only rebuild modified chunks |

---

## Implementation Order

### Phase 1: Foundation
1. [ ] Setup Three.js scene with camera and renderer
2. [ ] Add PointerLockControls
3. [ ] Implement basic WASD movement
4. [ ] Add simple ground plane (testing)

### Phase 2: Voxel System
5. [ ] Create texture atlas generator
6. [ ] Implement noise.js module
7. [ ] Build chunk generation with terrain
8. [ ] Add InstancedMesh rendering

### Phase 3: Interaction
9. [ ] Implement raycasting for block selection
10. [ ] Add block placement logic
11. [ ] Add block destruction logic
12. [ ] Create crosshair UI

### Phase 4: Physics & Polish
13. [ ] Implement collision detection
14. [ ] Add gravity and jumping
15. [ ] Configure lighting and fog
16. [ ] Dynamic chunk loading
17. [ ] Instruction overlay

---

## User Interface

### Initial Screen
```
┌─────────────────────────────┐
│                             │
│     Click to Play           │
│                             │
│     WASD - Move             │
│     Space - Jump            │
│     Left Click - Place      │
│     Right Click - Destroy   │
│     ESC - Release Mouse     │
│                             │
└─────────────────────────────┘
```

### In-Game HUD
- Crosshair (centered)
- (Optional) Selected block type indicator

---

## Constraints & Limitations

1. **Single file** - All code in one HTML file
2. **No external assets** - Textures generated procedurally
3. **No build step** - Direct browser execution
4. **Browser compatibility** - Modern browsers (ES6 modules)

---

## Future Enhancements (Out of Scope)

- Multiple biomes
- Trees and vegetation
- Water and liquids
- Ores and mineral deposits
- Caves and ravines
- Save/load world
- Multiplayer
- Inventory system
- Different block textures
- Sound effects
- Shadow mapping

---

## Dependencies

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.170.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.170.0/examples/jsm/"
  }
}
</script>
```

---

## Success Criteria

- [ ] User can navigate 3D world in first-person
- [ ] World generates procedurally with varied terrain
- [ ] User can place blocks at targeted locations
- [ ] User can destroy placed/natural blocks
- [ ] Physics (gravity, jumping, collision) work correctly
- [ ] Performance remains smooth (60 FPS target)
- [ ] Single HTML file loads without errors