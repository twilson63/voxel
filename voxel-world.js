import { createNoise, fbm, DEFAULT_OPTIONS } from './noise.js';

const CHUNK_SIZE_X = 16;
const CHUNK_SIZE_Y = 64;
const CHUNK_SIZE_Z = 16;
const WORLD_HEIGHT = 64;
const MAX_LOADED_CHUNKS = 50;
const WATER_LEVEL = 20;

const BLOCK_TYPES = {
    bedrock: { color: '#1A1A1A', solid: true },
    grass: { color: '#567d46', solid: true },
    dirt: { color: '#8B5A2B', solid: true },
    stone: { color: '#7A7A7A', solid: true },
    wood: { color: '#5D4037', solid: true },
    leaves: { color: '#2E7D32', solid: false, transparent: true },
    water: { color: '#1E88E5', solid: false, transparent: true, opacity: 0.5 }
};

const chunks = new Map();
const blocks = new Map();
let worldSeed = 0;

function generateTree(chunk, worldX, worldZ, groundY) {
    for (let ty = 1; ty <= 3; ty++) {
        if (!chunk.hasBlock(worldX, groundY + ty, worldZ)) {
            chunk.setBlock(worldX, groundY + ty, worldZ, 'wood');
        }
    }
    
    for (let lx = -1; lx <= 1; lx++) {
        for (let lz = -1; lz <= 1; lz++) {
            for (let ly = 0; ly <= 1; ly++) {
                if (lx === 0 && lz === 0 && ly === 0) continue;
                if (!chunk.hasBlock(worldX + lx, groundY + 3 + ly, worldZ + lz)) {
                    chunk.setBlock(worldX + lx, groundY + 3 + ly, worldZ + lz, 'leaves');
                }
            }
        }
    }
}

function placeTreesInChunk(chunk, chunkX, chunkZ) {
    const startX = chunkX * CHUNK_SIZE_X;
    const startZ = chunkZ * CHUNK_SIZE_Z;
    const numTrees = Math.floor(Math.random() * 2) + 3;
    
    for (let t = 0; t < numTrees; t++) {
        const localX = Math.floor(Math.random() * CHUNK_SIZE_X);
        const localZ = Math.floor(Math.random() * CHUNK_SIZE_Z);
        const worldX = startX + localX;
        const worldZ = startZ + localZ;
        const groundY = generateTerrainHeight(worldX, worldZ);
        
        if (groundY < WATER_LEVEL - 2) continue;
        
        const chunkLocalX = worldX - chunkX * CHUNK_SIZE_X;
        const chunkLocalZ = worldZ - chunkZ * CHUNK_SIZE_Z;
        
        if (!chunk.hasBlock(chunkLocalX, groundY, chunkLocalZ)) {
            continue;
        }
        
        generateTree(chunk, chunkLocalX, chunkLocalZ, groundY);
    }
}

function fillWaterBelowLevel(chunk, chunkX, chunkZ) {
    const startX = chunkX * CHUNK_SIZE_X;
    const startZ = chunkZ * CHUNK_SIZE_Z;
    
    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
            const worldX = startX + x;
            const worldZ = startZ + z;
            const terrainHeight = generateTerrainHeight(worldX, worldZ);
            
            for (let y = 0; y < WATER_LEVEL; y++) {
                if (!chunk.hasBlock(x, y, z)) {
                    chunk.setBlock(x, y, z, 'water');
                }
            }
        }
    }
}

class Chunk {
    constructor(chunkX, chunkZ) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.blocks = new Map();
        this.dirty = false;
        this.blockSet = new Set();
    }

    getBlockKey(x, y, z) {
        return `${x},${y},${z}`;
    }

    setBlock(x, y, z, type) {
        const key = this.getBlockKey(x, y, z);
        this.blocks.set(key, { x, y, z, type });
        this.blockSet.add(key);
        this.dirty = true;
    }

    removeBlock(x, y, z) {
        const key = this.getBlockKey(x, y, z);
        this.blocks.delete(key);
        this.blockSet.delete(key);
        this.dirty = true;
    }

    getBlock(x, y, z) {
        const key = this.getBlockKey(x, y, z);
        return this.blocks.get(key) || null;
    }

    hasBlock(x, y, z) {
        const key = this.getBlockKey(x, y, z);
        return this.blockSet.has(key);
    }
}

export function createWorld(seed = Math.random()) {
    worldSeed = seed;
    chunks.clear();
    blocks.clear();
}

function getChunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`;
}

function getBlockWorldKey(x, y, z) {
    return `${x},${y},${z}`;
}

export function getChunk(chunkX, chunkZ) {
    const key = getChunkKey(chunkX, chunkZ);
    return chunks.get(key) || null;
}

export function generateTerrainHeight(x, z) {
    const noise = createNoise(worldSeed);
    const height = fbm(noise, x, z, DEFAULT_OPTIONS.octaves, DEFAULT_OPTIONS.persistence, DEFAULT_OPTIONS.lacunarity, DEFAULT_OPTIONS.amplitude, DEFAULT_OPTIONS.frequency);
    const normalizedHeight = (height + 1) / 2;
    const worldHeight = Math.floor(normalizedHeight * 30) + 8;
    return Math.max(0, Math.min(WORLD_HEIGHT - 1, worldHeight));
}

function generateChunk(chunkX, chunkZ) {
    const chunk = new Chunk(chunkX, chunkZ);
    const startX = chunkX * CHUNK_SIZE_X;
    const startZ = chunkZ * CHUNK_SIZE_Z;

    for (let x = 0; x < CHUNK_SIZE_X; x++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
            const worldX = startX + x;
            const worldZ = startZ + z;
            const height = generateTerrainHeight(worldX, worldZ);

            for (let y = 0; y <= height; y++) {
                let type;
                if (y === 0) {
                    type = 'bedrock';
                } else if (y === height) {
                    type = 'grass';
                } else if (y >= height - 3) {
                    type = 'dirt';
                } else {
                    type = 'stone';
                }
                chunk.setBlock(x, y, z, type);
            }
        }
    }

    placeTreesInChunk(chunk, chunkX, chunkZ);
    fillWaterBelowLevel(chunk, chunkX, chunkZ);

    return chunk;
}

export function loadChunks(centerX, centerZ, radius) {
    const renderDistance = Math.ceil(radius);
    const newChunkKeys = new Set();

    for (let dx = -renderDistance; dx <= renderDistance; dx++) {
        for (let dz = -renderDistance; dz <= renderDistance; dz++) {
            const chunkX = centerX + dx;
            const chunkZ = centerZ + dz;
            const key = getChunkKey(chunkX, chunkZ);
            newChunkKeys.add(key);

            if (!chunks.has(key)) {
                const chunk = generateChunk(chunkX, chunkZ);
                chunks.set(key, chunk);
                for (const [blockKey, block] of chunk.blocks) {
                    const worldBlockKey = getBlockWorldKey(
                        chunkX * CHUNK_SIZE_X + block.x,
                        block.y,
                        chunkZ * CHUNK_SIZE_Z + block.z
                    );
                    blocks.set(worldBlockKey, { ...block, chunkX, chunkZ });
                }
            }
        }
    }

    if (chunks.size > MAX_LOADED_CHUNKS) {
        const keysToRemove = [];
        for (const [key, chunk] of chunks) {
            if (!newChunkKeys.has(key)) {
                keysToRemove.push(key);
            }
        }
        for (const key of keysToRemove) {
            const chunk = chunks.get(key);
            for (const blockKey of chunk.blockSet) {
                const block = chunk.blocks.get(blockKey);
                if (block) {
                    const worldBlockKey = getBlockWorldKey(
                        chunk.chunkX * CHUNK_SIZE_X + block.x,
                        block.y,
                        chunk.chunkZ * CHUNK_SIZE_Z + block.z
                    );
                    blocks.delete(worldBlockKey);
                }
            }
            chunks.delete(key);
        }
    }
}

export function placeBlock(x, y, z, type) {
    if (y < 0 || y >= WORLD_HEIGHT) return false;

    const chunkX = Math.floor(x / CHUNK_SIZE_X);
    const chunkZ = Math.floor(z / CHUNK_SIZE_Z);
    const localX = x - chunkX * CHUNK_SIZE_X;
    const localZ = z - chunkZ * CHUNK_SIZE_Z;

    let chunk = getChunk(chunkX, chunkZ);
    if (!chunk) {
        chunk = generateChunk(chunkX, chunkZ);
        chunks.set(getChunkKey(chunkX, chunkZ), chunk);
    }

    if (type === 'bedrock') return false;

    chunk.setBlock(localX, y, localZ, type);
    blocks.set(getBlockWorldKey(x, y, z), { x: localX, y, z, type, chunkX, chunkZ });

    return true;
}

export function destroyBlock(x, y, z) {
    if (y < 0 || y >= WORLD_HEIGHT) return false;

    const chunkX = Math.floor(x / CHUNK_SIZE_X);
    const chunkZ = Math.floor(z / CHUNK_SIZE_Z);
    const localX = x - chunkX * CHUNK_SIZE_X;
    const localZ = z - chunkZ * CHUNK_SIZE_Z;

    const chunk = getChunk(chunkX, chunkZ);
    if (!chunk) return false;

    const block = chunk.getBlock(localX, y, localZ);
    if (!block) return false;

    if (block.type === 'bedrock') return false;

    chunk.removeBlock(localX, y, localZ);
    blocks.delete(getBlockWorldKey(x, y, z));

    return true;
}

export function getBlock(x, y, z) {
    if (y < 0 || y >= WORLD_HEIGHT) return null;
    return blocks.get(getBlockWorldKey(x, y, z)) || null;
}

export function getAllBlocks() {
    return new Map(blocks);
}

export function isValidBlockType(type) {
    return type in BLOCK_TYPES;
}

export function getBlockType(type) {
    return BLOCK_TYPES[type] || null;
}

export function markChunkDirty(chunkX, chunkZ) {
    const chunk = getChunk(chunkX, chunkZ);
    if (chunk) {
        chunk.dirty = true;
    }
}

export { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, WORLD_HEIGHT, WATER_LEVEL, BLOCK_TYPES };