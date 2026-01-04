# Feature Plan: Trees, Water & Clouds

## Overview
Three features with overlapping dependencies, designed for parallel implementation:

```
Parallel Tracks:
├── Track A: Block/Texture Setup (Prerequisite)
├── Track B: Terrain Generation (Trees + Water Level)
├── Track C: Player Physics (Swimming)
└── Track D: Renderer Updates (Transparency + Cloud Rendering)
```

---

## Configuration Specs

### Cloud Specs
- Rendering: White cubes in clusters
- Altitude: y=80-100
- Movement: Slow drift east/west

### Water Specs
- Opacity: 50% transparent
- Water Level: y=20 (can be adjusted)
- Physics: Swimming with buoyancy

### Tree Specs
- Density: 3-4 trees per 16x16 chunk area
- Simple structure: 1x3 trunk + 3x3x2 leaves
- Block types: wood, leaves

---

## Track A: Block & Texture Setup (Prerequisite)
**Must complete before other tracks**

| Step | Task | Files | Time |
|------|------|-------|------|
| A1 | Add wood/leaves/water block types to block database | voxel-world.js | 15min |
| A2 | Create wood texture (brown, vertical grain) | textures.js | 20min |
| A3 | Create leaves texture (green, translucent) | textures.js | 20min |
| A4 | Create water texture (blue, 50% opacity) | textures.js | 20min |

---

## Track B: Terrain Generation

### B: Trees (3-4 per 16x16 chunk)
| Step | Task | Files | Time |
|------|------|-------|------|
| B1 | Create tree generation algorithm (simple) | voxel-world.js | 45min |
| B2 | Add tree placement to chunk generation | voxel-world.js | 30min |
| B3 | Ensure trees spawn on surface only | voxel-world.js | 15min |

### C: Water (50% transparent, level at y=20)
| Step | Task | Files | Time |
|------|------|-------|------|
| C1 | Define WATER_LEVEL = 20 constant | voxel-world.js | 10min |
| C2 | Add water block placement in chunk gen | voxel-world.js | 30min |
| C3 | Fill caves below water level | voxel-world.js | 30min |

### D: Clouds (White cube clusters at y=80-100)
| Step | Task | Files | Time |
|------|------|-------|------|
| D1 | Create cloud class (position, size, opacity) | cloud.js (new) | 20min |
| D2 | Cloud generation using noise clusters | cloud.js | 30min |
| D3 | Cloud movement system (slow drift) | cloud.js | 20min |

---

## Track C: Player Physics (Swimming)
**Dependent on Track A**

| Step | Task | Files | Time |
|------|------|-------|------|
| C1 | Add water detection (is player in water?) | player.js | 15min |
| C2 | Implement buoyancy (float up when in water) | player.js | 30min |
| C3 | Add water drag (slower movement in water) | player.js | 20min |
| C4 | Water jump vs swimming jump | player.js | 15min |

---

## Track D: Renderer Updates

### D1: Transparency for Water
| Step | Task | Files | Time |
|------|------|-------|------|
| D1 | Update renderer for transparent materials | renderer.js | 30min |
| D2 | Handle depth sorting for water blocks | renderer.js | 20min |
| D3 | Create water material with 50% opacity | renderer.js | 15min |

### D2: New Block Materials
| Step | Task | Files | Time |
|------|------|-------|------|
| D4 | Add wood/leaves materials to renderer | renderer.js | 20min |
| D5 | Update InstancedMesh for wood/leaves | renderer.js | 30min |

### D3: Cloud Rendering
| Step | Task | Files | Time |
|------|------|-------|------|
| D6 | Create cloud renderer (white cubes) | cloud.js | 30min |
| D7 | Integrate cloud rendering into game loop | main.js | 15min |

---

## Files Modified/Created

| File | Action | Notes |
|------|--------|-------|
| voxel-world.js | Modified | Add wood/leaves/water, tree gen, water level |
| textures.js | Modified | Add wood/leaves/water textures |
| renderer.js | Modified | New materials, transparency handling |
| player.js | Modified | Swimming physics, buoyancy, water detection |
| main.js | Modified | Cloud integration into game loop |
| cloud.js | **New** | Cloud class, generation, movement, rendering |
| feat-2.md | **New** | This plan document |

---

## Block Type Definitions

```javascript
const BLOCK_TYPES = {
    grass: { color: '#567d46', solid: true },
    dirt: { color: '#8B5A2B', solid: true },
    stone: { color: '#7A7A7A', solid: true },
    bedrock: { color: '#333333', solid: true, indestructible: true },
    wood: { color: '#5D4037', solid: true },
    leaves: { color: '#2E7D32', solid: false, transparent: true },
    water: { color: '#1E88E5', solid: false, transparent: true, opacity: 0.5 }
};
```

---

## Water Physics Algorithm

```
When player position.y < WATER_LEVEL:
    if player.velocity.y < 0:
        player.velocity.y = Math.max(player.velocity.y, -2) // Fall slower
    else:
        player.velocity.y -= buoyancy_force // Float up

    // Reduce horizontal movement
    player.velocity.x *= water_drag
    player.velocity.z *= water_drag

    // Enable swimming jump
    if onGround and Space pressed:
        player.velocity.y = swimming_jump_height
```

---

## Tree Generation Algorithm (Simple)

```
generateTree(x, z, groundY):
    // Trunk: 3 blocks high
    setBlock(x, groundY + 1, z, 'wood')
    setBlock(x, groundY + 2, z, 'wood')
    setBlock(x, groundY + 3, z, 'wood')

    // Leaves: 3x3x2 cube around top
    for lx in [-1, 0, 1]:
        for lz in [-1, 0, 1]:
            for ly in [0, 1]:
                if (lx == 0 and lz == 0 and ly == 0): continue // Skip trunk top
                setBlock(x + lx, groundY + 3 + ly, z + lz, 'leaves')
```

---

## Cloud Generation Algorithm

```
generateClouds():
    // Use 2D noise at high altitude (y=80-100)
    for each cloud_chunk:
        noise_value = noise2D(chunkX, chunkZ)
        if noise_value > threshold:
            // Create cloud cluster
            size = random(3, 6)
            for dx in [-size, size]:
                for dz in [-size, size]:
                    if noise2D(dx, dz) > 0.3:
                        createCloudBlock(x + dx, y, z + dz)
```

---

## Implementation Schedule

### Sprint 1 (Days 1-3): Foundation
- **Day 1:** A1-A4 (Block types, textures)
- **Day 2:** B1-B3 (Tree generation), D4-D5 (Wood/leaves materials)
- **Day 3:** C1-C4 (Swimming physics)

### Sprint 2 (Days 4-6): Polish
- **Day 4:** C1-C3 (Water level generation), D1-D3 (Transparency)
- **Day 5:** D1-D7 (Cloud class, generation, rendering)
- **Day 6:** Testing, fixes, integration

---

## Testing Checklist

### Trees
- [ ] Trees spawn at correct density (3-4 per chunk)
- [ ] Trees spawn on surface, not underground
- [ ] Wood/leaves blocks have correct textures
- [ ] Trees don't overlap terrain too much

### Water
- [ ] Water level visible at y=20
- [ ] Can see through water (50% opacity)
- [ ] Player floats when entering water
- [ ] Movement slower in water
- [ ] Can swim/jump out of water

### Clouds
- [ ] Clouds visible at y=80-100
- [ ] White cube rendering
- [ ] Clouds move slowly (drift)
- [ ] Clouds spawn in clusters

---

## Estimated Total Time: **8-10 hours**

- Sprint 1: 6 hours
- Sprint 2: 4 hours

---

## Success Criteria

- [ ] Player can swim in water at y=20
- [ ] 3-4 trees spawn per 16x16 chunk area
- [ ] Water is 50% transparent
- [ ] Clouds visible at high altitude, moving slowly
- [ ] Performance remains smooth (60 FPS target)