import * as THREE from 'three';
import { createRenderer } from './renderer.js';
import { createPlayer } from './player.js';
import { createWorld, loadChunks, getAllBlocks, placeBlock as worldPlaceBlock, destroyBlock as worldDestroyBlock, markChunkDirty, getChunk } from './voxel-world.js';
import { CloudManager } from './cloud.js';

let isRunning = false;
let lastTime = 0;
let renderer, player, world;
let blocksMap = new Map();
let chunksToUpdate = new Set();
let selectedBlockType = 'dirt';
let cloudManager;
let lastCloudUpdate = 0;

export function init() {
  if (isRunning) return;

  const container = document.getElementById('game-container');
  renderer = createRenderer(container);
  world = createWorld(12345);

  const startPos = { x: 0, y: 55, z: 0 };
  player = createPlayer(startPos, renderer.getCamera());

  player.requestPlaceBlock = () => placeBlock();
  player.requestDestroyBlock = () => destroyBlock();
  player.onBlockSelect = (type) => {
    selectedBlockType = type;
    requestAnimationFrame(() => updateBlockSelectorUI());
  };

  requestAnimationFrame(() => updateBlockSelectorUI());

  setupEventListeners();

  loadChunks(0, 0, 2);
  blocksMap = getAllBlocks();
  player.updateBlocks(blocksMap);

  cloudManager = new CloudManager(12345);

  const initialChunks = [];
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const chunk = getChunk(dx, dz);
      if (chunk) {
        initialChunks.push(chunk);
      }
    }
  }
  initialChunks.forEach(chunk => {
    renderer.updateChunk(chunk);
    chunk.dirty = false;
  });

  updateDirtyChunks();

  isRunning = true;
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

export function reset() {
  isRunning = false;
  if (renderer) renderer.dispose();
  if (world) world = null;
  if (player) player = null;
}

function gameLoop(currentTime) {
  if (!isRunning) return;

  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  update(deltaTime);
  render();

  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  const pos = player.update(deltaTime);
  player.updateBlocks(getAllBlocks());

  if (cloudManager) {
    cloudManager.updateClouds(deltaTime);

    const chunkX = Math.floor(pos.x / 16);
    const chunkZ = Math.floor(pos.z / 16);
    const cloudBlocks = cloudManager.generateClouds(chunkX, chunkZ);
    renderer.updateClouds(cloudBlocks);
  }

  loadChunks(Math.floor(pos.x / 16), Math.floor(pos.z / 16), 1);
  blocksMap = getAllBlocks();
  player.updateBlocks(blocksMap);
  updateDirtyChunks();
}

function render() {
  renderer.render();
}

function setupEventListeners() {
  const instructions = document.getElementById('instructions');
  if (instructions) {
    instructions.addEventListener('click', () => {
      player.getControls().lock();
    });
  }

  player.getControls().addEventListener('lock', () => {
    if (instructions) instructions.classList.add('hidden');
  });

  player.getControls().addEventListener('unlock', () => {
    if (instructions) instructions.classList.remove('hidden');
  });
}

function placeBlock() {
  const camera = renderer.getCamera();
  const allBlocks = getAllBlocks();

  if (allBlocks.size === 0) return;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  let closestDist = Infinity;
  let closestBlock = null;
  let closestNormal = null;

  allBlocks.forEach((block, key) => {
    const [bx, by, bz] = key.split(',').map(Number);
    const blockCenter = new THREE.Vector3(bx + 0.5, by + 0.5, bz + 0.5);
    const dist = camera.position.distanceTo(blockCenter);

    if (dist < closestDist && dist < 8) {
      const toBlock = blockCenter.clone().sub(camera.position).normalize();
      if (direction.dot(toBlock) > 0.9) {
        const hit = rayBoxIntersect(camera.position, direction, bx, by, bz);
        if (hit && hit.t < closestDist) {
          closestDist = hit.t;
          closestBlock = { x: bx, y: by, z: bz };
          closestNormal = hit.normal;
        }
      }
    }
  });

  if (closestBlock && closestNormal) {
    const placePos = {
      x: closestBlock.x + closestNormal.x,
      y: closestBlock.y + closestNormal.y,
      z: closestBlock.z + closestNormal.z
    };

    const chunkX = Math.floor(placePos.x / 16);
    const chunkZ = Math.floor(placePos.z / 16);
    worldPlaceBlock(placePos.x, placePos.y, placePos.z, selectedBlockType);
    chunksToUpdate.add(`${chunkX},${chunkZ}`);
    markChunkDirty(chunkX, chunkZ);
  }
}

function destroyBlock() {
  const camera = renderer.getCamera();
  const allBlocks = getAllBlocks();

  if (allBlocks.size === 0) return;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);

  let closestDist = Infinity;
  let closestBlock = null;

  allBlocks.forEach((block, key) => {
    const [bx, by, bz] = key.split(',').map(Number);
    const blockCenter = new THREE.Vector3(bx + 0.5, by + 0.5, bz + 0.5);
    const dist = camera.position.distanceTo(blockCenter);

    if (dist < closestDist && dist < 8) {
      const toBlock = blockCenter.clone().sub(camera.position).normalize();
      if (direction.dot(toBlock) > 0.9) {
        const hit = rayBoxIntersect(camera.position, direction, bx, by, bz);
        if (hit && hit.t < closestDist) {
          closestDist = hit.t;
          closestBlock = { x: bx, y: by, z: bz, type: block.type, key };
        }
      }
    }
  });

  if (closestBlock && closestBlock.type !== 'bedrock') {
    const chunkX = Math.floor(closestBlock.x / 16);
    const chunkZ = Math.floor(closestBlock.z / 16);
    worldDestroyBlock(closestBlock.x, closestBlock.y, closestBlock.z);
    chunksToUpdate.add(`${chunkX},${chunkZ}`);
    markChunkDirty(chunkX, chunkZ);
  }
}

function rayBoxIntersect(origin, direction, bx, by, bz) {
  const min = new THREE.Vector3(bx, by, bz);
  const max = new THREE.Vector3(bx + 1, by + 1, bz + 1);

  let tmin = (min.x - origin.x) / direction.x;
  let tmax = (max.x - origin.x) / direction.x;

  if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

  let tymin = (min.y - origin.y) / direction.y;
  let tymax = (max.y - origin.y) / direction.y;

  if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

  if ((tmin > tymax) || (tymin > tmax)) return null;

  if (tymin > tmin) tmin = tymin;
  if (tymax < tmax) tmax = tymax;

  let tzmin = (min.z - origin.z) / direction.z;
  let tzmax = (max.z - origin.z) / direction.z;

  if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

  if ((tmin > tzmax) || (tzmin > tmax)) return null;

  if (tzmin > tmin) tmin = tzmin;

  if (tmin < 0) return null;

  const hitPoint = origin.clone().add(direction.clone().multiplyScalar(tmin));
  const normal = new THREE.Vector3(0, 0, 0);

  const epsilon = 0.001;
  if (Math.abs(hitPoint.x - min.x) < epsilon) normal.x = -1;
  else if (Math.abs(hitPoint.x - max.x) < epsilon) normal.x = 1;
  else if (Math.abs(hitPoint.y - min.y) < epsilon) normal.y = -1;
  else if (Math.abs(hitPoint.y - max.y) < epsilon) normal.y = 1;
  else if (Math.abs(hitPoint.z - min.z) < epsilon) normal.z = -1;
  else if (Math.abs(hitPoint.z - max.z) < epsilon) normal.z = 1;

  return { t: tmin, normal, point: hitPoint };
}

function updateDirtyChunks() {
  chunksToUpdate.forEach(key => {
    const [cx, cz] = key.split(',').map(Number);
    const chunk = getChunk(cx, cz);
    if (chunk) {
      renderer.updateChunk(chunk);
      chunk.dirty = false;
    }
  });
  chunksToUpdate.clear();
}

function updateBlockSelectorUI() {
  const options = document.querySelectorAll('.block-option');
  options.forEach(opt => {
    opt.classList.remove('active');
    if (opt.dataset.type === selectedBlockType) {
      opt.classList.add('active');
    }
  });
}