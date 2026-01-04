import * as THREE from 'three';

const TILE_SIZE = 16;

function createTexture(color, noiseAmount = 20) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

    const imageData = ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * noiseAmount;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

function getTextureAtlas() {
    return {
        grass: createTexture('#567d46', 25),
        dirt: createTexture('#8B5A2B', 30),
        stone: createTexture('#7A7A7A', 40)
    };
}

function getUVs(blockType, face) {
    return { u: 0, v: 0, width: 1, height: 1 };
}

export { getTextureAtlas, getUVs };