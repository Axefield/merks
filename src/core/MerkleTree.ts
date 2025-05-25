import {
  MerkleNode,
  MerkleProof,
  MerkleTreeOptions,
  HashFunction,
  ProofItem
} from "../types";
import { defaultHash, ERROR_MESSAGES } from "../constants";
import { createLeafNode, createParentNode, validateProof } from "../utils";

/**
 * A production-ready Merkle tree implementation
 */
export class MerkleTree {
  private readonly hashFn: HashFunction;
  private readonly sortPairs: boolean;
  private readonly leaves: MerkleNode[];
  private readonly tree: MerkleNode[][];

  /**
   * Creates a new Merkle tree from an array of data
   * @param data Array of data to create leaves from
   * @param options Optional configuration
   */
  constructor(data: (string | Buffer)[], options: MerkleTreeOptions = {}) {
    if (!data.length) {
      throw new Error(ERROR_MESSAGES.EMPTY_TREE);
    }

    this.hashFn = options.hashFunction || defaultHash;
    this.sortPairs = options.sortPairs || false;
    this.leaves = data.map((item) => createLeafNode(item, this.hashFn));
    this.tree = this.buildTree();
  }

  /**
   * Builds the Merkle tree structure
   */
  private buildTree(): MerkleNode[][] {
    const levels: MerkleNode[][] = [this.leaves];
    let currentLevel = this.leaves;

    while (currentLevel.length > 1) {
      const nextLevel: MerkleNode[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        nextLevel.push(createParentNode(left, right, this.hashFn, this.sortPairs));
      }
      levels.push(nextLevel);
      currentLevel = nextLevel;
    }

    return levels;
  }

  /**
   * Generates a proof for a leaf at the specified index
   */
  getProof(index: number): MerkleProof {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error(ERROR_MESSAGES.INVALID_LEAF_INDEX);
    }

    const proof: MerkleProof = [];
    let node = this.leaves[index];

    for (let level = 0; level < this.tree.length - 1; level++) {
      const parent = node.parent;
      if (!parent) break;

      const sibling = parent.left === node ? parent.right : parent.left;
      if (!sibling) break;

      proof.push({
        sibling: sibling.hash,
        position: parent.left === node ? "right" : "left"
      });

      node = parent;
    }

    return proof;
  }

  /**
   * Verifies a proof against a leaf hash and root hash
   */
  verifyProof(leafHash: Buffer, proof: MerkleProof, rootHash: Buffer): boolean {
    validateProof(proof);
    let currentHash = leafHash;

    for (const { sibling, position } of proof) {
      const pair = position === "left" ? [sibling, currentHash] : [currentHash, sibling];
      currentHash = this.hashFn(Buffer.concat(pair));
    }

    return currentHash.equals(rootHash);
  }

  /**
   * Gets the root hash of the tree
   */
  get root(): Buffer {
    return this.tree[this.tree.length - 1][0].hash;
  }

  /**
   * Gets the number of leaves in the tree
   */
  get leafCount(): number {
    return this.leaves.length;
  }

  /**
   * Gets the depth of the tree
   */
  get depth(): number {
    return this.tree.length;
  }

  /**
   * Gets a leaf hash by index
   * @param index Index of the leaf
   */
  getLeaf(index: number): Buffer {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error(ERROR_MESSAGES.INVALID_LEAF_INDEX);
    }
    return this.leaves[index].hash;
  }

  /**
   * Gets all leaf hashes
   */
  getLeaves(): Buffer[] {
    return this.leaves.map((leaf) => leaf.hash);
  }
}
