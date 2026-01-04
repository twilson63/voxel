import * as THREE from 'three';
import { getTextureAtlas } from './textures.js';

const CHUNK_SIZE_X = 16;
const CHUNK_SIZE_Y = 64;
const CHUNK_SIZE_Z = 16;
const RENDER_DISTANCE = 64;
const CHUNK_RENDER_RADIUS = Math.ceil(RENDER_DISTANCE / CHUNK_SIZE_X);

class VoxelRenderer {
    constructor(container) {
        this.container = container;
        this.chunks = new Map();
        this.playerPosition = new THREE.Vector3(0, 32, 0);
        this.raycaster = new THREE.Raycaster();
        this.dummy = new THREE.Object3D();

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.scene.fog = new THREE.Fog(0x87ceeb, RENDER_DISTANCE - 16, RENDER_DISTANCE);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, RENDER_DISTANCE * 2);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 1.0));

        this.setupTextureMaterials();
        this.setupEventListeners();

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupTextureMaterials() {
        const textures = getTextureAtlas();

        this.materials = {
            grass: new THREE.MeshBasicMaterial({ map: textures.grass }),
            dirt: new THREE.MeshBasicMaterial({ map: textures.dirt }),
            stone: new THREE.MeshBasicMaterial({ map: textures.stone })
        };
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    getBlockCountForChunk() {
        return CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;
    }

    createInstancedMesh(blockType, count) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = this.materials[blockType];

        const mesh = new THREE.InstancedMesh(geometry, material, count);
        mesh.name = `instancedMesh_${blockType}`;
        mesh.count = 0;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        return mesh;
    }

    updateChunk(chunk) {
        if (!chunk) return;

        const chunkKey = `${chunk.chunkX},${chunk.chunkZ}`;
        let chunkMeshes = this.chunks.get(chunkKey);

        if (!chunkMeshes) {
            chunkMeshes = {
                grass: this.createInstancedMesh('grass', this.getBlockCountForChunk()),
                dirt: this.createInstancedMesh('dirt', this.getBlockCountForChunk()),
                stone: this.createInstancedMesh('stone', this.getBlockCountForChunk()),
                positions: {}
            };

            this.scene.add(chunkMeshes.grass);
            this.scene.add(chunkMeshes.dirt);
            this.scene.add(chunkMeshes.stone);

            this.chunks.set(chunkKey, chunkMeshes);
        }

        const { grass, dirt, stone, positions } = chunkMeshes;

        const instances = { grass: [], dirt: [], stone: [] };

        chunk.blocks.forEach((block, key) => {
            const type = block.type;
            if (instances[type]) {
                instances[type].push(block);
            }
        });

        this.updateInstancedMesh(grass, instances.grass, chunk, positions, 'grass');
        this.updateInstancedMesh(dirt, instances.dirt, chunk, positions, 'dirt');
        this.updateInstancedMesh(stone, instances.stone, chunk, positions, 'stone');
    }

    updateInstancedMesh(mesh, blocks, chunk, positions, blockType) {
        let instanceIndex = 0;

        blocks.forEach(block => {
            const posKey = `${block.x},${block.y},${block.z}`;
            positions[posKey] = { mesh, index: instanceIndex };

            this.dummy.position.set(
                chunk.chunkX * CHUNK_SIZE_X + block.x,
                block.y,
                chunk.chunkZ * CHUNK_SIZE_Z + block.z
            );
            this.dummy.updateMatrix();
            mesh.setMatrixAt(instanceIndex, this.dummy.matrix);
            instanceIndex++;
        });

        mesh.count = instanceIndex;
        mesh.instanceMatrix.needsUpdate = true;
    }

    removeChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        const chunkMeshes = this.chunks.get(key);

        if (chunkMeshes) {
            this.scene.remove(chunkMeshes.grass);
            this.scene.remove(chunkMeshes.dirt);
            this.scene.remove(chunkMeshes.stone);

            chunkMeshes.grass.geometry.dispose();
            chunkMeshes.dirt.geometry.dispose();
            chunkMeshes.stone.geometry.dispose();

            this.chunks.delete(key);
        }
    }

    setPlayerPosition(pos) {
        if (pos) {
            this.playerPosition.copy(pos);
        }
    }

    getRaycaster() {
        return this.raycaster;
    }

    getCamera() {
        return this.camera;
    }

    getScene() {
        return this.scene;
    }

    getRenderer() {
        return this.renderer;
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    getChunkRenderRadius() {
        return CHUNK_RENDER_RADIUS;
    }

    getChunkSize() {
        return { x: CHUNK_SIZE_X, y: CHUNK_SIZE_Y, z: CHUNK_SIZE_Z };
    }

    dispose() {
        this.chunks.forEach((chunkMeshes, key) => {
            const [cx, cz] = key.split(',').map(Number);
            this.removeChunk(cx, cz);
        });

        Object.values(this.materials).forEach(mat => mat.dispose());

        if (this.renderer.domElement.parentNode) {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();
    }
}

export function createRenderer(container) {
    const renderer = new VoxelRenderer(container);

    return {
        updateChunk: (chunk) => renderer.updateChunk(chunk),
        removeChunk: (chunkX, chunkZ) => renderer.removeChunk(chunkX, chunkZ),
        setPlayerPosition: (pos) => renderer.setPlayerPosition(pos),
        getRaycaster: () => renderer.getRaycaster(),
        getCamera: () => renderer.getCamera(),
        getScene: () => renderer.getScene(),
        getRenderer: () => renderer.getRenderer(),
        render: () => renderer.render(),
        getChunkRenderRadius: () => renderer.getChunkRenderRadius(),
        getChunkSize: () => renderer.getChunkSize(),
        dispose: () => renderer.dispose()
    };
}