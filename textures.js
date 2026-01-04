import * as THREE from 'three';

const TILE_SIZE = 16;

function createTexture(color, noiseAmount = 20, pattern = null) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const data = imageData.data;

    if (pattern === 'grain') {
        for (let y = 0; y < TILE_SIZE; y++) {
            for (let x = 0; x < TILE_SIZE; x++) {
                const i = (y * TILE_SIZE + x) * 4;
                const grainIntensity = Math.sin(x * 0.5) * 15;
                data[i] = Math.min(255, Math.max(0, data[i] + grainIntensity));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grainIntensity));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grainIntensity));
            }
        }
    } else {
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * noiseAmount;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

function createLeavesTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 30;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + 10));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.transparent = true;
    return texture;
}

function createWaterTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1E88E5';
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + 20));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + 40));
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.transparent = true;
    texture.opacity = 0.5;
    return texture;
}

function getTextureAtlas() {
    return {
        grass: createTexture('#567d46', 25),
        dirt: createTexture('#8B5A2B', 30),
        stone: createTexture('#7A7A7A', 40),
        wood: createTexture('#5D4037', 20, 'grain'),
        leaves: createLeavesTexture(),
        water: createWaterTexture()
    };
}

function getUVs(blockType, face) {
    return { u: 0, v: 0, width: 1, height: 1 };
}

export { getTextureAtlas, getUVs };