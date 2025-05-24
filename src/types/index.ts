/**
 * Represents a node in the Merkle tree
 */
export interface MerkleNode {
  hash: Buffer;
  left?: MerkleNode;
  right?: MerkleNode;
  parent?: MerkleNode;
}

/**
 * Represents a Merkle proof
 */
export interface MerkleProof {
  position: 'left' | 'right';
  hash: Buffer;
}

/**
 * Hash function type
 */
export type HashFunction = (data: Buffer) => Buffer;

/**
 * Merkle tree options
 */
export interface MerkleTreeOptions {
  hashFunction?: HashFunction;
  sortPairs?: boolean;
} 