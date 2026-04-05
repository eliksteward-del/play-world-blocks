import * as THREE from "three";
import { BlockType, getBlockMaterials } from "./blocks";
import { ChunkData, CHUNK_SIZE, WORLD_HEIGHT, getBlock } from "./terrain";

const faceDirections = [
  { dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },   // +x
  { dir: [-1, 0, 0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] },  // -x
  { dir: [0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },   // +y
  { dir: [0, -1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },  // -y
  { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },   // +z
  { dir: [0, 0, -1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] },  // -z
];

export function buildChunkMesh(
  chunkData: ChunkData,
  chunkX: number,
  chunkZ: number,
  getNeighborBlock?: (wx: number, wy: number, wz: number) => BlockType
): THREE.Group {
  const group = new THREE.Group();

  // Group faces by block type and face direction for batching
  const geometriesByMaterial = new Map<string, { positions: number[]; normals: number[]; uvs: number[]; indices: number[] }>();

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const block = getBlock(chunkData, x, y, z);
        if (block === BlockType.AIR || block === BlockType.WATER) continue;

        for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
          const face = faceDirections[faceIdx];
          const nx = x + face.dir[0];
          const ny = y + face.dir[1];
          const nz = z + face.dir[2];

          let neighbor: BlockType;
          if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < WORLD_HEIGHT && nz >= 0 && nz < CHUNK_SIZE) {
            neighbor = getBlock(chunkData, nx, ny, nz);
          } else if (getNeighborBlock) {
            const wx = chunkX * CHUNK_SIZE + nx;
            const wz = chunkZ * CHUNK_SIZE + nz;
            neighbor = getNeighborBlock(wx, ny, wz);
          } else {
            neighbor = BlockType.AIR;
          }

          if (neighbor !== BlockType.AIR && neighbor !== BlockType.WATER && neighbor !== BlockType.GLASS) continue;

          const key = `${block}_${faceIdx}`;
          if (!geometriesByMaterial.has(key)) {
            geometriesByMaterial.set(key, { positions: [], normals: [], uvs: [], indices: [] });
          }
          const geo = geometriesByMaterial.get(key)!;
          const vertexOffset = geo.positions.length / 3;

          for (const corner of face.corners) {
            geo.positions.push(x + corner[0], y + corner[1], z + corner[2]);
            geo.normals.push(face.dir[0], face.dir[1], face.dir[2]);
          }
          geo.uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
          geo.indices.push(
            vertexOffset, vertexOffset + 1, vertexOffset + 2,
            vertexOffset, vertexOffset + 2, vertexOffset + 3
          );
        }
      }
    }
  }

  for (const [key, geo] of geometriesByMaterial) {
    if (geo.positions.length === 0) continue;

    const [blockStr, faceStr] = key.split("_");
    const blockType = parseInt(blockStr) as BlockType;
    const faceIdx = parseInt(faceStr);

    const bufGeo = new THREE.BufferGeometry();
    bufGeo.setAttribute("position", new THREE.Float32BufferAttribute(geo.positions, 3));
    bufGeo.setAttribute("normal", new THREE.Float32BufferAttribute(geo.normals, 3));
    bufGeo.setAttribute("uv", new THREE.Float32BufferAttribute(geo.uvs, 2));
    bufGeo.setIndex(geo.indices);

    const mats = getBlockMaterials(blockType);
    const mat = mats[faceIdx] || mats[0];

    const mesh = new THREE.Mesh(bufGeo, mat);
    group.add(mesh);
  }

  group.position.set(chunkX * CHUNK_SIZE, 0, chunkZ * CHUNK_SIZE);
  return group;
}
