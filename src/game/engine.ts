import * as THREE from "three";
import { BlockType, HOTBAR_BLOCKS } from "./blocks";
import { buildChunkMesh } from "./chunk-mesh";
import {
  generateChunk,
  ChunkData,
  CHUNK_SIZE,
  WORLD_HEIGHT,
  getBlock,
  setBlock,
} from "./terrain";

const RENDER_DISTANCE = 4;
const GRAVITY = -20;
const JUMP_SPEED = 8;
const MOVE_SPEED = 5;
const SPRINT_MULTIPLIER = 1.6;
const PLAYER_HEIGHT = 1.7;
const PLAYER_RADIUS = 0.3;

export class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private chunks = new Map<string, { data: ChunkData; mesh: THREE.Group }>();
  private playerPos = new THREE.Vector3(8, 35, 8);
  private velocity = new THREE.Vector3(0, 0, 0);
  private yaw = 0;
  private pitch = 0;
  private keys = new Set<string>();
  private isPointerLocked = false;
  private onGround = false;
  private selectedSlot = 0;
  private onSlotChange?: (slot: number) => void;
  private animFrameId = 0;
  private lastTime = 0;
  private canvas: HTMLCanvasElement;
  private highlightMesh: THREE.LineSegments;
  private raycaster = new THREE.Raycaster();

  constructor(
    container: HTMLElement,
    onSlotChange: (slot: number) => void
  ) {
    this.onSlotChange = onSlotChange;

    this.canvas = document.createElement("canvas");
    container.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x87ceeb);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x87ceeb, 40, RENDER_DISTANCE * CHUNK_SIZE);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xfff5e0, 0.8);
    sun.position.set(50, 100, 30);
    this.scene.add(sun);

    // Block highlight
    const hlGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const edges = new THREE.EdgesGeometry(hlGeo);
    this.highlightMesh = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    this.highlightMesh.visible = false;
    this.scene.add(this.highlightMesh);

    this.resize();
    window.addEventListener("resize", this.resize);
    document.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("keyup", this.onKeyUp);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("pointerlockchange", this.onPointerLockChange);
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("wheel", this.onWheel);
    this.canvas.addEventListener("click", this.requestPointerLock);

    this.generateInitialChunks();
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  private resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  private requestPointerLock = () => {
    this.canvas.requestPointerLock();
  };

  private onPointerLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.code);
    // Number keys for hotbar
    if (e.code >= "Digit1" && e.code <= "Digit9") {
      this.selectedSlot = parseInt(e.code.replace("Digit", "")) - 1;
      this.onSlotChange?.(this.selectedSlot);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;
    this.yaw -= e.movementX * 0.002;
    this.pitch -= e.movementY * 0.002;
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY > 0) {
      this.selectedSlot = (this.selectedSlot + 1) % 9;
    } else {
      this.selectedSlot = (this.selectedSlot + 8) % 9;
    }
    this.onSlotChange?.(this.selectedSlot);
  };

  private onMouseDown = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;
    const hit = this.raycast();
    if (!hit) return;

    if (e.button === 0) {
      // Break block
      this.setWorldBlock(hit.blockPos.x, hit.blockPos.y, hit.blockPos.z, BlockType.AIR);
    } else if (e.button === 2) {
      // Place block
      e.preventDefault();
      const placePos = {
        x: hit.blockPos.x + hit.normal.x,
        y: hit.blockPos.y + hit.normal.y,
        z: hit.blockPos.z + hit.normal.z,
      };
      // Don't place inside player
      const dx = placePos.x + 0.5 - this.playerPos.x;
      const dz = placePos.z + 0.5 - this.playerPos.z;
      const dy = placePos.y - this.playerPos.y;
      if (Math.abs(dx) < 0.8 && Math.abs(dz) < 0.8 && dy > -PLAYER_HEIGHT && dy < 0.3) return;

      
      this.setWorldBlock(placePos.x, placePos.y, placePos.z, HOTBAR_BLOCKS[this.selectedSlot]);
    }
  };

  private chunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  private getWorldBlock(wx: number, wy: number, wz: number): BlockType {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.chunks.get(this.chunkKey(cx, cz));
    if (!chunk) return BlockType.AIR;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return getBlock(chunk.data, lx, wy, lz);
  }

  private setWorldBlock(wx: number, wy: number, wz: number, block: BlockType) {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const key = this.chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    setBlock(chunk.data, lx, wy, lz, block);
    this.rebuildChunk(cx, cz);
    // Rebuild neighbors if on edge
    if (lx === 0) this.rebuildChunk(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.rebuildChunk(cx + 1, cz);
    if (lz === 0) this.rebuildChunk(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.rebuildChunk(cx, cz + 1);
  }

  private rebuildChunk(cx: number, cz: number) {
    const key = this.chunkKey(cx, cz);
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    this.scene.remove(chunk.mesh);
    chunk.mesh = buildChunkMesh(chunk.data, cx, cz, (wx, wy, wz) => this.getWorldBlock(wx, wy, wz));
    this.scene.add(chunk.mesh);
  }

  private generateInitialChunks() {
    const pcx = Math.floor(this.playerPos.x / CHUNK_SIZE);
    const pcz = Math.floor(this.playerPos.z / CHUNK_SIZE);

    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        this.loadChunk(cx, cz);
      }
    }
  }

  private loadChunk(cx: number, cz: number) {
    const key = this.chunkKey(cx, cz);
    if (this.chunks.has(key)) return;

    const data = generateChunk(cx, cz);
    const mesh = buildChunkMesh(data, cx, cz, (wx, wy, wz) => this.getWorldBlock(wx, wy, wz));
    this.scene.add(mesh);
    this.chunks.set(key, { data, mesh });
  }

  private updateChunks() {
    const pcx = Math.floor(this.playerPos.x / CHUNK_SIZE);
    const pcz = Math.floor(this.playerPos.z / CHUNK_SIZE);

    // Load new chunks
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        if (dx * dx + dz * dz <= RENDER_DISTANCE * RENDER_DISTANCE) {
          this.loadChunk(pcx + dx, pcz + dz);
        }
      }
    }

    // Unload far chunks
    for (const [key, chunk] of this.chunks) {
      const [cx, cz] = key.split(",").map(Number);
      if (Math.abs(cx - pcx) > RENDER_DISTANCE + 1 || Math.abs(cz - pcz) > RENDER_DISTANCE + 1) {
        this.scene.remove(chunk.mesh);
        this.chunks.delete(key);
      }
    }
  }

  private isSolid(wx: number, wy: number, wz: number): boolean {
    const block = this.getWorldBlock(Math.floor(wx), Math.floor(wy), Math.floor(wz));
    return block !== BlockType.AIR && block !== BlockType.WATER;
  }

  private raycast(): { blockPos: THREE.Vector3; normal: THREE.Vector3 } | null {
    const dir = new THREE.Vector3();
    dir.x = Math.sin(this.yaw) * Math.cos(this.pitch);
    dir.y = Math.sin(this.pitch);
    dir.z = Math.cos(this.yaw) * Math.cos(this.pitch);

    const step = 0.05;
    const maxDist = 6;
    const pos = this.camera.position.clone();
    let prevPos = pos.clone();

    for (let d = 0; d < maxDist; d += step) {
      const checkPos = pos.clone().addScaledVector(dir, d);
      const bx = Math.floor(checkPos.x);
      const by = Math.floor(checkPos.y);
      const bz = Math.floor(checkPos.z);

      if (this.isSolid(bx, by, bz)) {
        const prevBx = Math.floor(prevPos.x);
        const prevBy = Math.floor(prevPos.y);
        const prevBz = Math.floor(prevPos.z);
        const normal = new THREE.Vector3(prevBx - bx, prevBy - by, prevBz - bz);
        return {
          blockPos: new THREE.Vector3(bx, by, bz),
          normal,
        };
      }
      prevPos = checkPos;
    }
    return null;
  }

  private loop = (time: number) => {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    this.update(dt);
    this.render();
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // Movement
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const speed = this.keys.has("ShiftLeft") ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;
    const moveDir = new THREE.Vector3();

    if (this.keys.has("KeyW")) moveDir.add(forward);
    if (this.keys.has("KeyS")) moveDir.sub(forward);
    if (this.keys.has("KeyA")) moveDir.sub(right);
    if (this.keys.has("KeyD")) moveDir.add(right);

    if (moveDir.length() > 0) moveDir.normalize();

    this.velocity.x = moveDir.x * speed;
    this.velocity.z = moveDir.z * speed;

    // Gravity
    this.velocity.y += GRAVITY * dt;

    // Jump
    if (this.keys.has("Space") && this.onGround) {
      this.velocity.y = JUMP_SPEED;
      this.onGround = false;
    }

    // Collision detection
    const newPos = this.playerPos.clone();

    // X movement
    newPos.x += this.velocity.x * dt;
    if (this.checkCollision(newPos)) {
      newPos.x = this.playerPos.x;
      this.velocity.x = 0;
    }

    // Z movement
    newPos.z += this.velocity.z * dt;
    if (this.checkCollision(newPos)) {
      newPos.z = this.playerPos.z;
      this.velocity.z = 0;
    }

    // Y movement
    newPos.y += this.velocity.y * dt;
    if (this.checkCollision(newPos)) {
      if (this.velocity.y < 0) this.onGround = true;
      newPos.y = this.playerPos.y;
      this.velocity.y = 0;
    } else {
      this.onGround = false;
    }

    this.playerPos.copy(newPos);

    // Update camera
    this.camera.position.copy(this.playerPos);
    this.camera.position.y += PLAYER_HEIGHT - 0.3;
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw - Math.PI;
    this.camera.rotation.x = this.pitch;

    // Update highlight
    const hit = this.raycast();
    if (hit) {
      this.highlightMesh.visible = true;
      this.highlightMesh.position.set(hit.blockPos.x + 0.5, hit.blockPos.y + 0.5, hit.blockPos.z + 0.5);
    } else {
      this.highlightMesh.visible = false;
    }

    // Update chunks
    this.updateChunks();
  }

  private checkCollision(pos: THREE.Vector3): boolean {
    for (let dy = 0; dy < PLAYER_HEIGHT; dy += 0.5) {
      for (let dx = -PLAYER_RADIUS; dx <= PLAYER_RADIUS; dx += PLAYER_RADIUS * 2) {
        for (let dz = -PLAYER_RADIUS; dz <= PLAYER_RADIUS; dz += PLAYER_RADIUS * 2) {
          if (this.isSolid(pos.x + dx, pos.y + dy, pos.z + dz)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("click", this.requestPointerLock);
    this.renderer.dispose();
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}
