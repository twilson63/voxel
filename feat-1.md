# Feature Plan: Jump Physics & Block Selector

## Feature 1: Jump Physics Fix ✅ COMPLETED

### Problem
Player cannot jump over 1-block high obstacles. Current physics:
- Gravity: 30.0 units/s²
- Jump height: 5.0
- Result: ~0.4 blocks max jump height

### Solution
Adjust physics parameters:
- GRAVITY = 20.0 (from 30.0)
- DEFAULT_JUMP_HEIGHT = 10.0 (from 5.0)
- FRICTION = 8.0 (from 10.0)

### Expected Result ✅ VERIFIED
- Jump height: ~2.5 blocks
- Player can clear terrain obstacles
- Tighter movement with reduced friction

### Files
- `player.js` lines 7-10

---

## Feature 2: Block Type Selector HUD ✅ COMPLETED

### Problem
Can only place dirt blocks (hardcoded in `placeBlock()`). No way to select grass or stone.

### Solution ✅ IMPLEMENTED
1. Add HUD at bottom-center showing current block selection
2. Keyboard controls: `1` = grass, `2` = dirt, `3` = stone
3. Update `placeBlock()` to use selected block type

### UI Design
```
┌─────────────────────┐
│  [1] GRASS  [2] DIRT  [3] STONE  │
│       Current: DIRT              │
└─────────────────────┘
```

### Controls
| Key | Action |
|-----|--------|
| `1` | Select Grass |
| `2` | Select Dirt |
| `3` | Select Stone |

### Files
- `index.html` - Add HUD HTML/CSS
- `main.js` - Add selectedBlockType state, key handlers, HUD update function
- `player.js` - Add key listeners for Digit1/Digit2/Digit3

---

## Implementation Checklist

### Feature 1: Jump Physics ✅
- [x] player.js: Set GRAVITY = 20.0
- [x] player.js: Set DEFAULT_JUMP_HEIGHT = 10.0
- [x] player.js: Set FRICTION = 8.0

### Feature 2: Block Selector ✅
- [x] index.html: Add HUD div at bottom-center
- [x] index.html: Style HUD with CSS
- [x] main.js: Add selectedBlockType variable
- [x] main.js: Add updateBlockSelectorUI() function
- [x] main.js: Add key handlers for 1/2/3
- [x] main.js: Modify placeBlock() to use selectedBlockType
- [x] player.js: Forward 1/2/3 key events to main.js

---

## Testing ✅
1. Jump test: Walk to a 1-block high obstacle, verify player can jump over it
2. Block selector test: Press 1/2/3, verify HUD updates, verify placed blocks match selection

---

## Commits
- `e9f62bb` - Initial voxel environment
- `c70b403` - feat: Jump physics fix and block selector HUD
- `101be30` - fix: Clean up duplicate code in player.js