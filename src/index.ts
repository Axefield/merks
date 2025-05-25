import { createHash } from "crypto";
import { createHashFunction, defaultHash, isValidHashAlgorithm } from "./utils/hash";
import { validateSerializedTree } from "./utils";
import { HashAlgorithm, HashFunction, MerkleNode, MerkleProof, MerkleTreeOptions, ProofItem, SerializedTree } from "./types";

class MerkleTreeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MerkleTreeError";
  }
}

class MerkleTree {
  private _leaves: Buffer[];
  private _tree: Buffer[][];
  public readonly hashFn: HashFunction;

  /**
   * @param leaves – raw data for the leaves
   * @param options – (optional) configuration options
   * @throws {MerkleTreeError} If leaves array is empty or invalid
   */
  constructor(
    leaves: (Buffer | string)[],
    options: MerkleTreeOptions = {}
  ) {
    if (!Array.isArray(leaves) || leaves.length === 0) {
      throw new MerkleTreeError("Leaves must be a non-empty array");
    }

    // Set up hash function
    if (options.hashFunction) {
      if (typeof options.hashFunction !== "function") {
        throw new MerkleTreeError("Hash function must be a function");
      }
      this.hashFn = options.hashFunction;
    } else if (options.hashAlgorithm) {
      if (!isValidHashAlgorithm(options.hashAlgorithm)) {
        throw new MerkleTreeError(`Unsupported hash algorithm: ${options.hashAlgorithm}`);
      }
      this.hashFn = createHashFunction(options.hashAlgorithm);
    } else {
      this.hashFn = defaultHash;
    }

    // store the leaf hashes
    this._leaves = leaves.map((l, index) => {
      try {
        return Buffer.isBuffer(l) ? this.hashFn(l) : this.hashFn(Buffer.from(String(l)));
      } catch (error) {
        throw new MerkleTreeError(
          `Failed to hash leaf at index ${index}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });

    // build the tree levels
    this._tree = [this._leaves];
    this._buildTree();
  }

  // internal: build all upper levels until you get a single root hash
  private _buildTree(): void {
    let level = this._leaves;
    while (level.length > 1) {
      const next: Buffer[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : left;
        next.push(this.hashFn(Buffer.concat([left, right])));
      }
      this._tree.push(next);
      level = next;
    }
  }

  /** Returns the full tree as an array of levels, bottom-up */
  get tree(): Buffer[][] {
    return this._tree;
  }

  /** Returns the Merkle root (the single hash at the top level) */
  get root(): Buffer {
    const topLevel = this._tree[this._tree.length - 1];
    return topLevel[0];
  }

  /**
   * Builds a proof for leaf at `index`, as an array of { sibling, position } items
   * where position is 'left' or 'right'
   * @throws {MerkleTreeError} If index is invalid
   */
  getProof(index: number): MerkleProof {
    if (!Number.isInteger(index)) {
      throw new MerkleTreeError("Index must be an integer");
    }
    if (index < 0 || index >= this._leaves.length) {
      throw new MerkleTreeError(
        `Leaf index ${index} out of bounds [0, ${this._leaves.length - 1}]`
      );
    }

    const proof: MerkleProof = [];
    let idx = index;

    for (let level = 0; level < this._tree.length - 1; level++) {
      const currentLevel = this._tree[level];
      const isRightNode = idx % 2 === 1;
      const siblingIndex = isRightNode ? idx - 1 : idx + 1;

      // if siblingIndex is out-of-bounds, we just duplicate the node itself
      const siblingHash = currentLevel[siblingIndex] || currentLevel[idx];
      proof.push({
        sibling: siblingHash,
        position: isRightNode ? "left" : "right",
      });

      // move to parent index
      idx = Math.floor(idx / 2);
    }

    return proof;
  }

  /**
   * Static helper to verify a proof
   * @throws {MerkleTreeError} If any input is invalid
   */
  static verifyProof(
    leafHash: Buffer,
    proof: MerkleProof,
    root: Buffer,
    hashFn: HashFunction = defaultHash
  ): boolean {
    if (!Buffer.isBuffer(leafHash)) {
      throw new MerkleTreeError("Leaf hash must be a Buffer");
    }
    if (!Array.isArray(proof)) {
      throw new MerkleTreeError("Proof must be an array");
    }
    if (!Buffer.isBuffer(root)) {
      throw new MerkleTreeError("Root must be a Buffer");
    }
    if (typeof hashFn !== "function") {
      throw new MerkleTreeError("Hash function must be a function");
    }

    try {
      return proof
        .reduce((computedHash, { sibling, position }) => {
          if (!Buffer.isBuffer(sibling)) {
            throw new MerkleTreeError("Proof sibling must be a Buffer");
          }
          if (position !== "left" && position !== "right") {
            throw new MerkleTreeError(
              'Proof position must be either "left" or "right"'
            );
          }
          if (position === "left") {
            return hashFn(Buffer.concat([sibling, computedHash]));
          } else {
            return hashFn(Buffer.concat([computedHash, sibling]));
          }
        }, leafHash)
        .equals(root);
    } catch (error) {
      throw new MerkleTreeError(
        `Proof verification failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Serialize the tree to a JSON string
   * @returns {string} JSON string representation of the tree
   */
  toJSON(): string {
    return JSON.stringify({
      leaves: this._leaves.map((hash) => hash.toString("hex")),
      tree: this._tree.map((level) =>
        level.map((hash) => hash.toString("hex"))
      ),
    });
  }

  /**
   * Create a MerkleTree instance from a JSON string
   * @param json JSON string representation of the tree
   * @param hashFn Hash function to use
   * @returns {MerkleTree} New MerkleTree instance
   */
  static fromJSON(
    json: string,
    hashFn: HashFunction = defaultHash
  ): MerkleTree {
    try {
      const data: SerializedTree = JSON.parse(json);
      validateSerializedTree(data);
      
      // Create a new instance with dummy data to satisfy constructor
      const tree = new MerkleTree(["dummy"], { hashFunction: hashFn });
      
      // Replace the internal state with deserialized data
      tree._leaves = data.leaves.map((h) => Buffer.from(h, "hex"));
      tree._tree = data.tree.map((level) =>
        level.map((h) => Buffer.from(h, "hex"))
      );
      
      return tree;
    } catch (error) {
      throw new MerkleTreeError(
        `Failed to deserialize tree: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Get the number of leaves in the tree
   * @returns {number} Number of leaves
   */
  get leafCount(): number {
    return this._leaves.length;
  }

  /**
   * Get the depth of the tree
   * @returns {number} Tree depth
   */
  get depth(): number {
    return this._tree.length;
  }

  /**
   * Get a leaf hash by index
   * @param index Leaf index
   * @returns {Buffer} Leaf hash
   * @throws {MerkleTreeError} If index is invalid
   */
  getLeaf(index: number): Buffer {
    if (!Number.isInteger(index)) {
      throw new MerkleTreeError("Index must be an integer");
    }
    if (index < 0 || index >= this._leaves.length) {
      throw new MerkleTreeError(
        `Leaf index ${index} out of bounds [0, ${this._leaves.length - 1}]`
      );
    }
    return this._leaves[index];
  }

  /**
   * Get all leaves
   * @returns {Buffer[]} Array of leaf hashes
   */
  getLeaves(): Buffer[] {
    return [...this._leaves];
  }
}

export {
  MerkleTree,
  MerkleTreeError,
  defaultHash,
  createHashFunction,
  isValidHashAlgorithm,
  type HashAlgorithm,
  type HashFunction,
  type MerkleTreeOptions,
  type MerkleNode,
  type MerkleProof,
  type ProofItem,
  type SerializedTree,
};