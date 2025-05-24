import { MerkleNode, MerkleProof, MerkleTreeOptions, HashFunction } from '../types';
import { defaultHash, ERROR_MESSAGES } from '../constants';
import { createLeafNode, createParentNode, toBuffer, validateProof } from '../utils';

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
    this.leaves = data.map(item => createLeafNode(item, this.hashFn));
    this.tree = this.buildTree();
  }

  /**
   * Gets the Merkle root hash
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
    return this.leaves.map(leaf => leaf.hash);
  }

  /**
   * Generates a proof for a leaf at the specified index
   * @param index Index of the leaf to generate proof for
   */
  getProof(index: number): MerkleProof[] {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error(ERROR_MESSAGES.INVALID_LEAF_INDEX);
    }

    const proof: MerkleProof[] = [];
    let node = this.leaves[index];

    for (let i = 0; i < this.tree.length - 1; i++) {
      const parent = node.parent;
      if (!parent) break;

      const sibling = parent.left === node ? parent.right : parent.left;
      if (!sibling) break;

      proof.push({
        position: parent.left === node ? 'right' : 'left',
        hash: sibling.hash,
      });

      node = parent;
    }

    return proof;
  }

  /**
   * Verifies a proof against a leaf hash and root hash
   * @param leafHash Hash of the leaf
   * @param proof Array of proof objects
   * @param rootHash Root hash to verify against
   */
  static verifyProof(leafHash: Buffer, proof: MerkleProof[], rootHash: Buffer, hashFn: HashFunction = defaultHash): boolean {
    return validateProof(proof, leafHash, rootHash, hashFn);
  }

  /**
   * Builds the Merkle tree structure
   * @private
   */
  private buildTree(): MerkleNode[][] {
    const tree: MerkleNode[][] = [this.leaves];
    let level = this.leaves;

    while (level.length > 1) {
      const nextLevel: MerkleNode[] = [];
      
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left;
        
        if (this.sortPairs) {
          const pair = [left.hash, right.hash].sort(Buffer.compare);
          nextLevel.push(createParentNode(
            { hash: pair[0] },
            { hash: pair[1] },
            this.hashFn
          ));
        } else {
          nextLevel.push(createParentNode(left, right, this.hashFn));
        }
      }
      
      tree.push(nextLevel);
      level = nextLevel;
    }

    return tree;
  }
} 