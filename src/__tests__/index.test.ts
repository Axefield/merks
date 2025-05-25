import { describe, expect, it } from "@jest/globals";
import { MerkleTree, MerkleTreeError, defaultHash, createHashFunction, isValidHashAlgorithm } from "../index";
import { Buffer } from "buffer";
import { HashAlgorithm } from "../types";

describe("MerkleTree", () => {
  describe("Constructor", () => {
    it("should create a tree with valid data", () => {
      const data = ["a", "b", "c", "d"];
      const tree = new MerkleTree(data);
      expect(tree).toBeDefined();
      expect(tree.root).toBeDefined();
      expect(tree.leafCount).toBe(4);
      expect(tree.depth).toBe(3);
    });

    it("should throw on empty array", () => {
      expect(() => new MerkleTree([])).toThrow(MerkleTreeError);
    });

    it("should throw on invalid hash function", () => {
      expect(() => new MerkleTree(["a"], "not a function" as any)).toThrow(MerkleTreeError);
    });

    it("should handle single leaf", () => {
      const tree = new MerkleTree(["a"]);
      expect(tree.leafCount).toBe(1);
      expect(tree.depth).toBe(1);
      expect(tree.root).toBeDefined();
    });

    it("should handle odd number of leaves", () => {
      const tree = new MerkleTree(["a", "b", "c"]);
      expect(tree.leafCount).toBe(3);
      expect(tree.depth).toBe(3);
    });

    it("should handle large number of leaves", () => {
      const data = Array.from({ length: 1000 }, (_, i) => `data${i}`);
      const tree = new MerkleTree(data);
      expect(tree.leafCount).toBe(1000);
      expect(tree.depth).toBe(11); // log2(1000) rounded up
    });

    it("should handle Buffer inputs", () => {
      const data = [Buffer.from("a"), Buffer.from("b")];
      const tree = new MerkleTree(data);
      expect(tree.leafCount).toBe(2);
    });

    it("should handle mixed string and Buffer inputs", () => {
      const data = ["a", Buffer.from("b")];
      const tree = new MerkleTree(data);
      expect(tree.leafCount).toBe(2);
    });
  });

  describe("Tree Structure", () => {
    it("should have correct tree levels", () => {
      const tree = new MerkleTree(["a", "b", "c", "d"]);
      expect(tree.tree.length).toBe(3); // 4 leaves -> 2 nodes -> 1 root
      expect(tree.tree[0].length).toBe(4); // leaves
      expect(tree.tree[1].length).toBe(2); // intermediate
      expect(tree.tree[2].length).toBe(1); // root
    });

    it("should handle duplicate leaves", () => {
      const tree = new MerkleTree(["a", "a", "a", "a"]);
      const uniqueHashes = new Set(tree.getLeaves().map(h => h.toString("hex")));
      expect(uniqueHashes.size).toBe(1);
    });
  });

  describe("Proof Generation", () => {
    it("should generate valid proof for first leaf", () => {
      const tree = new MerkleTree(["a", "b", "c", "d"]);
      const proof = tree.getProof(0);
      expect(proof.length).toBe(2);
      expect(proof[0].position).toBe("right");
    });

    it("should generate valid proof for last leaf", () => {
      const tree = new MerkleTree(["a", "b", "c", "d"]);
      const proof = tree.getProof(3);
      expect(proof.length).toBe(2);
      expect(proof[0].position).toBe("left");
    });

    it("should throw on invalid index", () => {
      const tree = new MerkleTree(["a", "b", "c", "d"]);
      expect(() => tree.getProof(-1)).toThrow(MerkleTreeError);
      expect(() => tree.getProof(4)).toThrow(MerkleTreeError);
      expect(() => tree.getProof(1.5)).toThrow(MerkleTreeError);
    });

    it("should generate consistent proofs", () => {
      const tree = new MerkleTree(["a", "b", "c", "d"]);
      const proof1 = tree.getProof(1);
      const proof2 = tree.getProof(1);
      expect(proof1).toEqual(proof2);
    });
  });

  describe("Proof Verification", () => {
    it("should verify valid proof", () => {
      const tree = new MerkleTree(["a", "b", "c", "d"]);
      const proof = tree.getProof(2);
      const leafHash = tree.getLeaf(2);
      expect(MerkleTree.verifyProof(leafHash, proof, tree.root)).toBe(true);
    });

    it("should reject invalid proof", () => {
      const tree = new MerkleTree(["a", "b", "c", "d"]);
      const proof = tree.getProof(2);
      const wrongLeafHash = tree.getLeaf(1);
      expect(MerkleTree.verifyProof(wrongLeafHash, proof, tree.root)).toBe(false);
    });

    it("should throw on invalid proof format", () => {
      const tree = new MerkleTree(["a", "b"]);
      expect(() => MerkleTree.verifyProof(
        tree.getLeaf(0),
        [{ sibling: "invalid" as any, position: "right" }],
        tree.root
      )).toThrow(MerkleTreeError);
    });
  });

  describe("Serialization", () => {
    it("should serialize and deserialize correctly", () => {
      const original = new MerkleTree(["a", "b", "c", "d"]);
      const serialized = original.toJSON();
      const reconstructed = MerkleTree.fromJSON(serialized);
      
      expect(reconstructed.root).toEqual(original.root);
      expect(reconstructed.leafCount).toBe(original.leafCount);
      expect(reconstructed.depth).toBe(original.depth);
    });

    it("should throw on invalid JSON", () => {
      expect(() => MerkleTree.fromJSON("invalid json")).toThrow(MerkleTreeError);
    });

    it("should throw on malformed tree data", () => {
      const invalidData = JSON.stringify({
        leaves: ["invalid"],
        tree: [["invalid"]]
      });
      expect(() => MerkleTree.fromJSON(invalidData)).toThrow(MerkleTreeError);
    });
  });

  describe("Custom Hash Function", () => {
    it("should work with custom hash function", () => {
      const customHash = (data: Buffer) => Buffer.from("custom" + data.toString());
      const tree = new MerkleTree(["a", "b"], customHash);
      expect(tree.root).toBeDefined();
    });

    it("should maintain consistency with custom hash", () => {
      const customHash = (data: Buffer) => Buffer.from("custom" + data.toString());
      const tree1 = new MerkleTree(["a", "b"], customHash);
      const tree2 = new MerkleTree(["a", "b"], customHash);
      expect(tree1.root).toEqual(tree2.root);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long input strings", () => {
      const longString = "a".repeat(10000);
      const tree = new MerkleTree([longString]);
      expect(tree.root).toBeDefined();
    });

    it("should handle special characters", () => {
      const data = ["!@#$%^&*()", "你好世界", "🌍"];
      const tree = new MerkleTree(data);
      expect(tree.root).toBeDefined();
    });

    it("should handle empty strings", () => {
      const tree = new MerkleTree(["", "b"]);
      expect(tree.root).toBeDefined();
    });

    it("should handle repeated patterns", () => {
      const data = Array(100).fill("a");
      const tree = new MerkleTree(data);
      expect(tree.root).toBeDefined();
    });
  });

  describe("Hash Algorithms", () => {
    const testData = ["a", "b", "c", "d"];

    it("should use default SHA-256 when no algorithm specified", () => {
      const tree = new MerkleTree(testData);
      expect(tree.root.toString("hex")).toBe(
        "58c89d709329eb37285837b042ab6ff72c7c8f74de0446b091b6a0131c102cfd"
      );
    });

    it.each([
      "sha1",
      "sha256",
      "sha512",
      "ripemd160",
      "whirlpool",
      "md5",
    ] as HashAlgorithm[])("should work with %s algorithm", (algorithm) => {
      const tree = new MerkleTree(testData, { hashAlgorithm: algorithm });
      expect(tree.root).toBeDefined();
      expect(tree.root.length).toBeGreaterThan(0);
    });

    it("should throw error for unsupported algorithm", () => {
      expect(() => {
        new MerkleTree(testData, { hashAlgorithm: "unsupported" as HashAlgorithm });
      }).toThrow(MerkleTreeError);
    });

    it("should allow custom hash function", () => {
      const customHash = (data: Buffer) => Buffer.from("custom");
      const tree = new MerkleTree(testData, { hashFunction: customHash });
      expect(tree.root.toString()).toBe("custom");
    });

    it("should validate hash algorithms", () => {
      expect(isValidHashAlgorithm("sha256")).toBe(true);
      expect(isValidHashAlgorithm("unsupported" as HashAlgorithm)).toBe(false);
    });

    it("should create hash functions for all supported algorithms", () => {
      const algorithms: HashAlgorithm[] = [
        "sha1",
        "sha256",
        "sha512",
        "ripemd160",
        "whirlpool",
        "md5",
      ];
      
      algorithms.forEach((algorithm) => {
        const hashFn = createHashFunction(algorithm);
        expect(typeof hashFn).toBe("function");
        const result = hashFn(Buffer.from("test"));
        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});
