import { createHash } from "crypto";

interface ProofItem {
  sibling: Buffer;
  position: "left" | "right";
}

interface SerializedTree {
  leaves: string[];
  tree: string[][];
}

class MerkleTreeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MerkleTreeError";
  }
}

function defaultHash(data: Buffer): Buffer {
  if (!Buffer.isBuffer(data)) {
    throw new MerkleTreeError("Hash input must be a Buffer");
  }
  return createHash("sha256").update(data).digest();
}

class MerkleTree {
  private _leaves: Buffer[];
  private _tree: Buffer[][];
  public readonly hashFn: (data: Buffer) => Buffer;

  /**
   * @param leaves – raw data for the leaves
   * @param hashFn – (optional) hashing function: Buffer -> Buffer
   * @throws {MerkleTreeError} If leaves array is empty or invalid
   */
  constructor(
    leaves: (Buffer | string)[],
    hashFn: (data: Buffer) => Buffer = defaultHash
  ) {
    if (!Array.isArray(leaves) || leaves.length === 0) {
      throw new MerkleTreeError("Leaves must be a non-empty array");
    }
    if (typeof hashFn !== "function") {
      throw new MerkleTreeError("Hash function must be a function");
    }

    // store the leaf hashes
    this._leaves = leaves.map((l, index) => {
      try {
        return Buffer.isBuffer(l) ? hashFn(l) : hashFn(Buffer.from(String(l)));
      } catch (error) {
        throw new MerkleTreeError(
          `Failed to hash leaf at index ${index}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    });
    this.hashFn = hashFn;
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
  getProof(index: number): ProofItem[] {
    if (!Number.isInteger(index)) {
      throw new MerkleTreeError("Index must be an integer");
    }
    if (index < 0 || index >= this._leaves.length) {
      throw new MerkleTreeError(
        `Leaf index ${index} out of bounds [0, ${this._leaves.length - 1}]`
      );
    }

    const proof: ProofItem[] = [];
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
    proof: ProofItem[],
    root: Buffer,
    hashFn: (data: Buffer) => Buffer = defaultHash
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
    hashFn: (data: Buffer) => Buffer = defaultHash
  ): MerkleTree {
    try {
      const data: SerializedTree = JSON.parse(json);
      const tree = new MerkleTree([], hashFn);
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

// Example usage:
if (require.main === module) {
  // Example data
  const data = ["a", "b", "c", "d"];

  // Create the Merkle tree
  const tree = new MerkleTree(data);

  // Print the Merkle root (as hex)
  console.log("Merkle Root:", tree.root.toString("hex"));

  // Print tree statistics
  console.log("Tree Statistics:");
  console.log("- Leaf Count:", tree.leafCount);
  console.log("- Tree Depth:", tree.depth);

  // Print all levels for debugging
  tree.tree.forEach((level, i) => {
    console.log(`Level ${i}:`);
    level.forEach((hash, j) => console.log(`  [${j}]:`, hash.toString("hex")));
  });

  // Choose a leaf index to prove (e.g., index 2 for 'c')
  const leafIndex = 2;
  const proof = tree.getProof(leafIndex);
  console.log(`Proof for leaf at index ${leafIndex} ('${data[leafIndex]}'):`);
  proof.forEach((item, i) => {
    console.log(
      `  Sibling ${i} (${item.position}):`,
      item.sibling.toString("hex")
    );
  });

  // Verify the proof
  const leafHash = defaultHash(Buffer.from(data[leafIndex]));
  const isValid = MerkleTree.verifyProof(leafHash, proof, tree.root);
  console.log("Proof valid?", isValid);

  // Demonstrate serialization
  const serialized = tree.toJSON();
  console.log("\nSerialized Tree:", serialized);

  const reconstructed = MerkleTree.fromJSON(serialized);
  console.log("Reconstructed Root:", reconstructed.root.toString("hex"));
  console.log("Roots match?", reconstructed.root.equals(tree.root));
}

export {
  MerkleTree,
  MerkleTreeError,
  defaultHash,
  type ProofItem,
  type SerializedTree,
};

export type {
  MerkleNode,
  MerkleProof,
  HashFunction,
  MerkleTreeOptions,
} from "./types";
