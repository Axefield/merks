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
 * Represents a Merkle proof item
 */
export interface ProofItem {
  sibling: Buffer;
  position: "left" | "right";
}

/**
 * Represents a Merkle proof
 */
export type MerkleProof = ProofItem[];

/**
 * Supported hash algorithms
 */
export type HashAlgorithm = 
  | "sha1"
  | "sha256"
  | "sha512"
  | "ripemd160"
  | "whirlpool"
  | "md5"
  | "none";

/**
 * Hash function type
 */
export type HashFunction = (data: Buffer) => Buffer;

/**
 * Merkle tree options
 */
export interface MerkleTreeOptions {
  hashFunction?: HashFunction;
  hashAlgorithm?: HashAlgorithm;
  sortPairs?: boolean;
}

/**
 * Represents the serialized form of a Merkle tree
 */
export interface SerializedTree {
  leaves: string[];  // Array of hex strings representing leaf hashes
  tree: string[][];  // 2D array of hex strings representing tree levels
}
