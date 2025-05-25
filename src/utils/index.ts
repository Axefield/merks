import { Buffer } from "buffer";
import { MerkleNode, MerkleProof, ProofItem, SerializedTree } from "../types";

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
  hashFn: (data: Buffer) => Buffer,
  sortPairs: boolean = false
): MerkleNode {
  const pair = sortPairs 
    ? [left.hash, right.hash].sort((a, b) => a.compare(b))
    : [left.hash, right.hash];
  const parentHash = hashFn(Buffer.concat(pair));
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
 * Validates a Merkle proof structure
 * @throws {Error} If the proof is invalid
 */
export function validateProof(proof: MerkleProof): void {
  if (!Array.isArray(proof)) {
    throw new Error("Proof must be an array");
  }

  for (const item of proof) {
    if (!item || typeof item !== "object") {
      throw new Error("Proof item must be an object");
    }

    if (!Buffer.isBuffer(item.sibling)) {
      throw new Error("Proof sibling must be a Buffer");
    }

    if (item.position !== "left" && item.position !== "right") {
      throw new Error('Proof position must be either "left" or "right"');
    }
  }
}

/**
 * Validates serialized tree data
 * @throws {Error} If the data is invalid
 */
export function validateSerializedTree(data: SerializedTree): void {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid tree data: must be an object");
  }

  if (!Array.isArray(data.leaves)) {
    throw new Error("Invalid tree data: leaves must be an array");
  }

  if (!Array.isArray(data.tree)) {
    throw new Error("Invalid tree data: tree must be an array");
  }

  // Validate hex strings
  const hexRegex = /^[0-9a-fA-F]+$/;
  
  for (const leaf of data.leaves) {
    if (typeof leaf !== "string" || !hexRegex.test(leaf)) {
      throw new Error("Invalid tree data: leaves must be hex strings");
    }
  }

  for (const level of data.tree) {
    if (!Array.isArray(level)) {
      throw new Error("Invalid tree data: tree levels must be arrays");
    }
    for (const hash of level) {
      if (typeof hash !== "string" || !hexRegex.test(hash)) {
        throw new Error("Invalid tree data: tree hashes must be hex strings");
      }
    }
  }
}
