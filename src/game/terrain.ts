import { BlockType } from "./blocks";

// Simple noise function for terrain generation
function hash(x: number, z: number): number {
  let h = x * 374761393 + z * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return h;
}

function smoothNoise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;

  const a = (hash(ix + seed, iz) & 0xffff) / 0xffff;
  const b = (hash(ix + 1 + seed, iz) & 0xffff) / 0xffff;
  const c = (hash(ix + seed, iz + 1) & 0xffff) / 0xffff;
  const d = (hash(ix + 1 + seed, iz + 1) & 0xffff) / 0xffff;

  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);

  return a * (1 - sx) * (1 - sz) + b * sx * (1 - sz) + c * (1 - sx) * sz + d * sx * sz;
}

function noise(x: number, z: number, seed: number = 0): number {
  let val = 0;
  let amp = 1;
  let freq = 1;
  let maxVal = 0;

  for (let i = 0; i < 4; i++) {
    val += smoothNoise(x * freq * 0.02, z * freq * 0.02, seed + i * 1000) * amp;
    maxVal += amp;
    amp *= 0.5;
    freq *= 2;
  }

  return val / maxVal;
}

export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 64;
const BASE_HEIGHT = 20;
const HEIGHT_RANGE = 15;
const WATER_LEVEL = 18;

export type ChunkData = Uint8Array;

export function generateChunk(chunkX: number, chunkZ: number): ChunkData {
  const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wx = chunkX * CHUNK_SIZE + lx;
      const wz = chunkZ * CHUNK_SIZE + lz;

      const h = Math.floor(noise(wx, wz, 42) * HEIGHT_RANGE + BASE_HEIGHT);
      const biomeVal = noise(wx, wz, 999);

      for (let y = 0; y < WORLD_HEIGHT; y++) {
        const idx = lx * WORLD_HEIGHT * CHUNK_SIZE + y * CHUNK_SIZE + lz;

        if (y === 0) {
          data[idx] = BlockType.STONE;
        } else if (y < h - 4) {
          data[idx] = BlockType.STONE;
        } else if (y < h) {
          data[idx] = biomeVal > 0.6 ? BlockType.SAND : BlockType.DIRT;
        } else if (y === h) {
          if (biomeVal > 0.6) {
            data[idx] = BlockType.SAND;
          } else {
            data[idx] = BlockType.GRASS;
          }
        } else if (y <= WATER_LEVEL && y > h) {
          data[idx] = BlockType.WATER;
        } else {
          data[idx] = BlockType.AIR;
        }
      }

      // Trees
      if (h > WATER_LEVEL && biomeVal < 0.55) {
        const treeChance = hash(wx * 7, wz * 13) & 0xff;
        if (treeChance < 6) {
          const treeHeight = 4 + (hash(wx, wz * 3) & 0x3);
          for (let ty = 1; ty <= treeHeight; ty++) {
            const y = h + ty;
            if (y < WORLD_HEIGHT) {
              const idx = lx * WORLD_HEIGHT * CHUNK_SIZE + y * CHUNK_SIZE + lz;
              data[idx] = BlockType.WOOD;
            }
          }
          // Leaves (simple sphere)
          for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
              for (let dy = -1; dy <= 2; dy++) {
                if (dx === 0 && dz === 0 && dy <= 0) continue;
                const nlx = lx + dx;
                const nlz = lz + dz;
                const ny = h + treeHeight + dy;
                if (nlx >= 0 && nlx < CHUNK_SIZE && nlz >= 0 && nlz < CHUNK_SIZE && ny < WORLD_HEIGHT) {
                  if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) < 4) {
                    const idx = nlx * WORLD_HEIGHT * CHUNK_SIZE + ny * CHUNK_SIZE + nlz;
                    if (data[idx] === BlockType.AIR) {
                      data[idx] = BlockType.LEAVES;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return data;
}

export function getBlock(data: ChunkData, x: number, y: number, z: number): BlockType {
  if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
    return BlockType.AIR;
  }
  return data[x * WORLD_HEIGHT * CHUNK_SIZE + y * CHUNK_SIZE + z] as BlockType;
}

export function setBlock(data: ChunkData, x: number, y: number, z: number, block: BlockType): void {
  if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= CHUNK_SIZE) return;
  data[x * WORLD_HEIGHT * CHUNK_SIZE + y * CHUNK_SIZE + z] = block;
}
