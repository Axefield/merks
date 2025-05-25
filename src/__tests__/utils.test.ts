import { describe, expect, it } from "@jest/globals";
import { validateSerializedTree, toBuffer, createLeafNode, validateProof } from "../utils";
import { defaultHash } from "../index";
import { Buffer } from "buffer";
import { MerkleNode, MerkleProof, SerializedTree } from "../types";

describe("Utility Functions", () => {
  describe("validateSerializedTree", () => {
    it("should accept valid tree data", () => {
      const validData: SerializedTree = {
        leaves: ["a1b2c3", "d4e5f6"],
        tree: [["a1b2c3", "d4e5f6"], ["abcdef"]]
      };
      expect(() => validateSerializedTree(validData)).not.toThrow();
    });

    it("should throw on non-array leaves", () => {
      const invalidData = {
        leaves: "not an array",
        tree: [["a1b2c3"]]
      };
      expect(() => validateSerializedTree(invalidData as unknown as SerializedTree)).toThrow("Invalid tree structure");
    });

    it("should throw on non-array tree", () => {
      const invalidData = {
        leaves: ["a1b2c3"],
        tree: "not an array"
      };
      expect(() => validateSerializedTree(invalidData as unknown as SerializedTree)).toThrow("Invalid tree structure");
    });

    it("should throw on invalid hex in leaves", () => {
      const invalidData: SerializedTree = {
        leaves: ["a1b2c3", "not hex"],
        tree: [["a1b2c3", "d4e5f6"], ["abcdef"]]
      };
      expect(() => validateSerializedTree(invalidData)).toThrow("Invalid hex string in leaves array");
    });

    it("should throw on invalid hex in tree", () => {
      const invalidData: SerializedTree = {
        leaves: ["a1b2c3", "d4e5f6"],
        tree: [["a1b2c3", "d4e5f6"], ["not hex"]]
      };
      expect(() => validateSerializedTree(invalidData)).toThrow("Invalid hex string in tree array");
    });

    it("should throw on non-array tree level", () => {
      const invalidData = {
        leaves: ["a1b2c3", "d4e5f6"],
        tree: [["a1b2c3", "d4e5f6"], "not an array"]
      };
      expect(() => validateSerializedTree(invalidData as unknown as SerializedTree)).toThrow("Invalid hex string in tree array");
    });

    it("should handle empty arrays", () => {
      const emptyData: SerializedTree = {
        leaves: [],
        tree: [[]]
      };
      expect(() => validateSerializedTree(emptyData)).not.toThrow();
    });

    it("should handle malformed tree structure", () => {
      const malformedData = {
        leaves: ["a1b2c3"],
        tree: [["a1b2c3"], ["abcdef"], "not an array"]
      };
      expect(() => validateSerializedTree(malformedData as unknown as SerializedTree)).toThrow("Invalid hex string in tree array");
    });
  });

  describe("toBuffer", () => {
    it("should convert string to Buffer", () => {
      const result = toBuffer("test");
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe("test");
    });

    it("should return Buffer unchanged", () => {
      const buffer = Buffer.from("test");
      const result = toBuffer(buffer);
      expect(result).toBe(buffer);
    });
  });

  describe("createLeafNode", () => {
    it("should create node from string", () => {
      const node = createLeafNode("test", defaultHash);
      expect(node).toEqual({
        hash: expect.any(Buffer)
      });
      expect(Buffer.isBuffer(node.hash)).toBe(true);
    });

    it("should create node from Buffer", () => {
      const buffer = Buffer.from("test");
      const node = createLeafNode(buffer, defaultHash);
      expect(node).toEqual({
        hash: expect.any(Buffer)
      });
      expect(Buffer.isBuffer(node.hash)).toBe(true);
    });
  });

  describe("validateProof", () => {
    it("should validate correct proof", () => {
      const leafHash = defaultHash(Buffer.from("leaf"));
      const siblingHash = defaultHash(Buffer.from("sibling"));
      const rootHash = defaultHash(Buffer.concat([leafHash, siblingHash]));
      
      const proof: MerkleProof[] = [{
        position: "right",
        hash: siblingHash
      }];

      expect(validateProof(proof, leafHash, rootHash, defaultHash)).toBe(true);
    });

    it("should reject incorrect proof", () => {
      const leafHash = defaultHash(Buffer.from("leaf"));
      const wrongSiblingHash = defaultHash(Buffer.from("wrong"));
      const rootHash = defaultHash(Buffer.from("correct root"));
      
      const proof: MerkleProof[] = [{
        position: "right",
        hash: wrongSiblingHash
      }];

      expect(validateProof(proof, leafHash, rootHash, defaultHash)).toBe(false);
    });

    it("should handle multiple proof steps", () => {
      const leafHash = defaultHash(Buffer.from("leaf"));
      const sibling1Hash = defaultHash(Buffer.from("sibling1"));
      const sibling2Hash = defaultHash(Buffer.from("sibling2"));
      
      // Create a two-level proof
      const intermediateHash = defaultHash(Buffer.concat([leafHash, sibling1Hash]));
      const rootHash = defaultHash(Buffer.concat([intermediateHash, sibling2Hash]));
      
      const proof: MerkleProof[] = [
        {
          position: "right",
          hash: sibling1Hash
        },
        {
          position: "right",
          hash: sibling2Hash
        }
      ];

      expect(validateProof(proof, leafHash, rootHash, defaultHash)).toBe(true);
    });
  });
}); 