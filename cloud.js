import { createNoise, fbm } from './noise.js';

class Cloud {
    constructor(x, y, z, size = 3) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.size = size;
        this.opacity = 0.8;
        this.driftSpeed = 0.5 + Math.random() * 0.5;
        this.blocks = [];
        this.generateBlocks();
    }

    generateBlocks() {
        const halfSize = Math.floor(this.size / 2);
        for (let dx = -halfSize; dx <= halfSize; dx++) {
            for (let dy = 0; dy < 2; dy++) {
                for (let dz = -halfSize; dz <= halfSize; dz++) {
                    if (Math.random() > 0.3) {
                        this.blocks.push({
                            dx: dx,
                            y: this.y + dy,
                            dz: dz
                        });
                    }
                }
            }
        }
    }

    update(deltaTime) {
        this.x += this.driftSpeed * deltaTime;
    }

    getBlocks() {
        return this.blocks.map(block => ({
            x: this.x + block.dx,
            y: block.y,
            z: this.z + block.dz
        }));
    }
}

class CloudManager {
    constructor(seed = Math.random()) {
        this.noise = createNoise(seed);
        this.clouds = [];
        this.cloudChunks = new Map();
        this.spawnThreshold = 0.4;
        this.minSize = 3;
        this.maxSize = 6;
        this.chunkSize = 16;
        this.cloudAltitude = 80;
        this.cloudAltitudeRange = 20;
        this.spawnRadius = 4;
    }

    generateClouds(centerChunkX, centerChunkZ) {
        const generatedBlocks = [];

        for (let dx = -this.spawnRadius; dx <= this.spawnRadius; dx++) {
            for (let dz = -this.spawnRadius; dz <= this.spawnRadius; dz++) {
                const chunkX = centerChunkX + dx;
                const chunkZ = centerChunkZ + dz;
                const chunkKey = `${chunkX},${chunkZ}`;

                if (this.cloudChunks.has(chunkKey)) {
                    continue;
                }

                const noiseValue = fbm(
                    this.noise,
                    chunkX * this.chunkSize * 0.1,
                    chunkZ * this.chunkSize * 0.1,
                    2, 0.5, 2.0, 1.0, 0.05
                );

                if (noiseValue > this.spawnThreshold) {
                    const size = Math.floor(
                        this.minSize + Math.random() * (this.maxSize - this.minSize)
                    );
                    const y = this.cloudAltitude +
                        Math.floor(Math.random() * this.cloudAltitudeRange);
                    const worldX = chunkX * this.chunkSize;
                    const worldZ = chunkZ * this.chunkSize;

                    const cloudX = worldX + (Math.random() * this.chunkSize);
                    const cloudZ = worldZ + (Math.random() * this.chunkSize);

                    const cloud = new Cloud(cloudX, y, cloudZ, size);
                    this.clouds.push(cloud);
                    this.cloudChunks.set(chunkKey, true);
                }
            }
        }

        this.updateClouds(0);
        return this.getCloudBlocks();
    }

    updateClouds(deltaTime) {
        const bounds = this.getViewBounds();

        this.clouds.forEach(cloud => {
            cloud.update(deltaTime);
        });

        this.cleanupClouds(bounds);
    }

    getViewBounds() {
        const playerChunkX = Math.floor(this.clouds.length > 0 ?
            this.clouds[0].x / this.chunkSize : 0);
        const playerChunkZ = Math.floor(this.clouds.length > 0 ?
            this.clouds[0].z / this.chunkSize : 0);

        return {
            minX: playerChunkX - this.spawnRadius * 2,
            maxX: playerChunkX + this.spawnRadius * 2,
            minZ: playerChunkZ - this.spawnRadius * 2,
            maxZ: playerChunkZ + this.spawnRadius * 2
        };
    }

    cleanupClouds(bounds) {
        this.clouds = this.clouds.filter(cloud => {
            const cloudChunkX = Math.floor(cloud.x / this.chunkSize);
            const cloudChunkZ = Math.floor(cloud.z / this.chunkSize);

            return cloudChunkX >= bounds.minX - 2 &&
                   cloudChunkX <= bounds.maxX + 2 &&
                   cloudChunkZ >= bounds.minZ - 2 &&
                   cloudChunkZ <= bounds.maxZ + 2;
        });

        const activeChunks = new Set();
        this.clouds.forEach(cloud => {
            const cloudChunkX = Math.floor(cloud.x / this.chunkSize);
            const cloudChunkZ = Math.floor(cloud.z / this.chunkSize);
            activeChunks.add(`${cloudChunkX},${cloudChunkZ}`);
        });

        for (const [key] of this.cloudChunks) {
            if (!activeChunks.has(key)) {
                this.cloudChunks.delete(key);
            }
        }
    }

    getCloudBlocks() {
        const allBlocks = [];
        this.clouds.forEach(cloud => {
            const blocks = cloud.getBlocks();
            blocks.forEach(block => {
                allBlocks.push(block);
            });
        });
        return allBlocks;
    }

    reset() {
        this.clouds = [];
        this.cloudChunks.clear();
    }
}

export { Cloud, CloudManager };