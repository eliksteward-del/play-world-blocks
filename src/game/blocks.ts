import * as THREE from "three";

export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  SAND = 6,
  WATER = 7,
  COBBLESTONE = 8,
  PLANKS = 9,
  GLASS = 10,
  BRICK = 11,
}

export const BLOCK_COLORS: Record<number, { top: number; side: number; bottom: number }> = {
  [BlockType.GRASS]: { top: 0x5d9e3c, side: 0x7a5e3a, bottom: 0x6b4423 },
  [BlockType.DIRT]: { top: 0x6b4423, side: 0x6b4423, bottom: 0x6b4423 },
  [BlockType.STONE]: { top: 0x888888, side: 0x808080, bottom: 0x777777 },
  [BlockType.WOOD]: { top: 0x8b6914, side: 0x6b4e2a, bottom: 0x8b6914 },
  [BlockType.LEAVES]: { top: 0x2d7a2d, side: 0x2d6e2d, bottom: 0x2d7a2d },
  [BlockType.SAND]: { top: 0xd4c47c, side: 0xc9b96a, bottom: 0xbfa85c },
  [BlockType.WATER]: { top: 0x3366cc, side: 0x2255bb, bottom: 0x1144aa },
  [BlockType.COBBLESTONE]: { top: 0x6a6a6a, side: 0x636363, bottom: 0x5a5a5a },
  [BlockType.PLANKS]: { top: 0xb08840, side: 0xa57d38, bottom: 0xb08840 },
  [BlockType.GLASS]: { top: 0xc8dce8, side: 0xc8dce8, bottom: 0xc8dce8 },
  [BlockType.BRICK]: { top: 0x964b38, side: 0x8b4234, bottom: 0x964b38 },
};

export const BLOCK_NAMES: Record<number, string> = {
  [BlockType.GRASS]: "Grass",
  [BlockType.DIRT]: "Dirt",
  [BlockType.STONE]: "Stone",
  [BlockType.WOOD]: "Wood",
  [BlockType.LEAVES]: "Leaves",
  [BlockType.SAND]: "Sand",
  [BlockType.COBBLESTONE]: "Cobblestone",
  [BlockType.PLANKS]: "Planks",
  [BlockType.GLASS]: "Glass",
  [BlockType.BRICK]: "Brick",
};

export const HOTBAR_BLOCKS = [
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.WOOD,
  BlockType.PLANKS,
  BlockType.COBBLESTONE,
  BlockType.SAND,
  BlockType.BRICK,
  BlockType.GLASS,
];

// Generate a textured material for a block face
function createBlockTexture(color: number, isTop = false, isGrass = false): THREE.MeshLambertMaterial {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext("2d")!;

  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, 16, 16);

  // Add pixel noise for texture
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const noise = (Math.random() - 0.5) * 20;
      const nr = Math.max(0, Math.min(255, r + noise));
      const ng = Math.max(0, Math.min(255, g + noise));
      const nb = Math.max(0, Math.min(255, b + noise));
      ctx.fillStyle = `rgb(${nr},${ng},${nb})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  if (isGrass && isTop) {
    // Add grass-like spots on top
    for (let i = 0; i < 8; i++) {
      const gx = Math.floor(Math.random() * 14) + 1;
      const gy = Math.floor(Math.random() * 14) + 1;
      ctx.fillStyle = `rgb(${60 + Math.random() * 40},${130 + Math.random() * 40},${40 + Math.random() * 20})`;
      ctx.fillRect(gx, gy, 2, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  const mat = new THREE.MeshLambertMaterial({ map: texture });
  if (color === BLOCK_COLORS[BlockType.GLASS]?.top) {
    mat.transparent = true;
    mat.opacity = 0.4;
  }
  return mat;
}

const materialCache = new Map<string, THREE.MeshLambertMaterial>();

export function getBlockMaterials(blockType: BlockType): THREE.MeshLambertMaterial[] {
const key = `block_${blockType}`;
  const cached = materialCache.get(key);
  if (cached) return cached;

  const colors = BLOCK_COLORS[blockType];
  if (!colors) return [];

  const isGrass = blockType === BlockType.GRASS;
  const top = createBlockTexture(colors.top, true, isGrass);
  const bottom = createBlockTexture(colors.bottom);
  const side = createBlockTexture(colors.side);

  const mats = [side, side, top, bottom, side, side];
  materialCache.set(key, mats);
  return mats;
}
