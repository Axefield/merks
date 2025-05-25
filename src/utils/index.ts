import { Buffer } from "buffer";
import { MerkleNode, MerkleProof, SerializedTree } from "../types";

/**
 * Converts a string or Buffer to a Buffer
 */
export function toBuffer(data: string | Buffer): Buffer {
  return Buffer.isBuffer(data) ? data : Buffer.from(data);
}

/**
 * Creates a leaf node from data
 */
export function createLeafNode(
  data: string | Buffer,
  hashFn: (data: Buffer) => Buffer
): MerkleNode {
  return {
    hash: hashFn(toBuffer(data)),
  };
}

/**
 * Creates a parent node from two child nodes
 */
export function createParentNode(
  left: MerkleNode,
  right: MerkleNode,
  hashFn: (data: Buffer) => Buffer
): MerkleNode {
  const parentHash = hashFn(Buffer.concat([left.hash, right.hash]));
  const parent: MerkleNode = {
    hash: parentHash,
    left,
    right,
  };
  left.parent = parent;
  right.parent = parent;
  return parent;
}

/**
 * Validates a Merkle proof
 */
export function validateProof(
  proof: MerkleProof[],
  leafHash: Buffer,
  rootHash: Buffer,
  hashFn: (data: Buffer) => Buffer
): boolean {
  let currentHash = leafHash;

  for (const { position, hash } of proof) {
    const pair =
      position === "left" ? [hash, currentHash] : [currentHash, hash];
    currentHash = hashFn(Buffer.concat(pair));
  }

  return currentHash.equals(rootHash);
}

/**
 * Validates serialized tree data
 * @throws {Error} If the data is invalid
 */
export function validateSerializedTree(data: SerializedTree): void {
  // Validate the structure
  if (!Array.isArray(data.leaves) || !Array.isArray(data.tree)) {
    throw new Error("Invalid tree structure: leaves and tree must be arrays");
  }

  // Validate hex strings
  const isValidHex = (str: string) => /^[0-9a-fA-F]+$/.test(str);
  
  if (!data.leaves.every(isValidHex)) {
    throw new Error("Invalid hex string in leaves array");
  }
  
  if (!data.tree.every(level => 
    Array.isArray(level) && level.every(isValidHex)
  )) {
    throw new Error("Invalid hex string in tree array");
  }
}
