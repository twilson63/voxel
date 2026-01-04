import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls';

const PLAYER_HEIGHT = 1.8;
const PLAYER_WIDTH = 0.6;
const PLAYER_HALF_WIDTH = PLAYER_WIDTH / 2;
const GRAVITY = 30.0;
const DEFAULT_MOVE_SPEED = 8.0;
const DEFAULT_JUMP_HEIGHT = 5.0;
const FRICTION = 10.0;
const AIR_CONTROL = 0.3;

class PlayerController {
    constructor(position, camera, controls) {
        this.camera = camera;
        this.controls = controls;

        this.position = new THREE.Vector3(position.x, position.y, position.z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3();

        this.moveSpeed = DEFAULT_MOVE_SPEED;
        this.jumpHeight = DEFAULT_JUMP_HEIGHT;

        this.onGround = false;
        this.blocks = new Map();

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.vec = new THREE.Vector3();

        this._setupInput();
    }

    _setupInput() {
        document.addEventListener('keydown', (event) => this._onKeyDown(event));
        document.addEventListener('keyup', (event) => this._onKeyUp(event));
    }

    _onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true;
                break;
            case 'Space':
                if (this.onGround) {
                    this.velocity.y = this.jumpHeight;
                    this.onGround = false;
                }
                break;
            case 'KeyQ':
                if (this.requestDestroyBlock) {
                    console.log('Q pressed - destroy block');
                    this.requestDestroyBlock();
                }
                break;
            case 'KeyE':
                if (this.requestPlaceBlock) {
                    console.log('E pressed - place block');
                    this.requestPlaceBlock();
                }
                break;
        }
    }

    _onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false;
                break;
        }
    }

    updateBlocks(blocks) {
        this.blocks = blocks;
    }

    update(dt, blocks) {
        if (blocks) {
            this.blocks = blocks;
        }

        const delta = Math.min(dt, 0.1);

        this._applyGravity(delta);
        this._applyFriction(delta);
        this._handleMovement(delta);
        this._applyVelocity(delta);

        this._updateCameraPosition();

        return this.position.clone();
    }

    _applyGravity(delta) {
        this.velocity.y -= GRAVITY * delta;
    }

    _applyFriction(delta) {
        const frictionFactor = FRICTION * delta;
        this.velocity.x *= (1 - frictionFactor);
        this.velocity.z *= (1 - frictionFactor);
    }

    _handleMovement(delta) {
        const speed = this.moveSpeed;
        const controlFactor = this.onGround ? 1.0 : AIR_CONTROL;

        this.direction.set(0, 0, 0);

        if (this.moveForward) this.direction.z -= 1;
        if (this.moveBackward) this.direction.z += 1;
        if (this.moveLeft) this.direction.x -= 1;
        if (this.moveRight) this.direction.x += 1;

        if (this.direction.lengthSq() > 0) {
            this.direction.normalize();
        }

        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.x = 0;
        this.euler.z = 0;

        this.vec.copy(this.direction).applyEuler(this.euler);

        this.velocity.x += this.vec.x * speed * controlFactor * 10 * delta;
        this.velocity.z += this.vec.z * speed * controlFactor * 10 * delta;
    }

    _applyVelocity(delta) {
        const newPos = this.position.clone();

        newPos.x += this.velocity.x * delta;
        if (this._checkCollision(newPos, 'x')) {
            newPos.x = this.position.x;
            this.velocity.x = 0;
        }

        newPos.z += this.velocity.z * delta;
        if (this._checkCollision(newPos, 'z')) {
            newPos.z = this.position.z;
            this.velocity.z = 0;
        }

        newPos.y += this.velocity.y * delta;
        const yCollision = this._checkCollision(newPos, 'y');
        if (yCollision) {
            if (this.velocity.y < 0) {
                this.onGround = true;
            }
            newPos.y = this.position.y;
            this.velocity.y = 0;
        } else {
            this.onGround = false;
        }

        this.position.copy(newPos);
    }

    _checkCollision(pos, axis) {
        const minX = pos.x - PLAYER_HALF_WIDTH;
        const maxX = pos.x + PLAYER_HALF_WIDTH;
        const minY = pos.y;
        const maxY = pos.y + PLAYER_HEIGHT;
        const minZ = pos.z - PLAYER_HALF_WIDTH;
        const maxZ = pos.z + PLAYER_HALF_WIDTH;

        const checkXMin = Math.floor(minX);
        const checkXMax = Math.floor(maxX);
        const checkYMin = Math.floor(minY);
        const checkYMax = Math.floor(maxY);
        const checkZMin = Math.floor(minZ);
        const checkZMax = Math.floor(maxZ);

        for (let x = checkXMin; x <= checkXMax; x++) {
            for (let y = checkYMin; y <= checkYMax; y++) {
                for (let z = checkZMin; z <= checkZMax; z++) {
                    const key = `${x},${y},${z}`;
                    if (this.blocks.has(key)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    _updateCameraPosition() {
        this.camera.position.copy(this.position);
        this.camera.position.y += 1.6;
    }

    getPosition() {
        return this.position.clone();
    }

    setPosition(pos) {
        this.position.copy(pos);
        this._updateCameraPosition();
    }

    setMoveSpeed(speed) {
        this.moveSpeed = speed;
    }

    setJumpHeight(height) {
        this.jumpHeight = height;
    }

    getCamera() {
        return this.camera;
    }

    getControls() {
        return this.controls;
    }

    getDimensions() {
        return { height: PLAYER_HEIGHT, width: PLAYER_WIDTH, halfWidth: PLAYER_HALF_WIDTH };
    }
}

export function createPlayer(position, camera) {
    const controls = new PointerLockControls(camera, document.body);

    camera.position.copy(position);
    camera.position.y += 1.6;

    return new PlayerController(position, camera, controls);
}