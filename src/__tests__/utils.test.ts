import { describe, expect, it } from "@jest/globals";
import { validateSerializedTree, toBuffer, createLeafNode, validateProof } from "../utils";
import { defaultHash } from "../index";
import { Buffer } from "buffer";
import { MerkleNode, MerkleProof, SerializedTree, ProofItem } from "../types";

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
      expect(() => validateSerializedTree(invalidData as unknown as SerializedTree)).toThrow("Invalid tree data: leaves must be an array");
    });

    it("should throw on non-array tree", () => {
      const invalidData = {
        leaves: ["a1b2c3"],
        tree: "not an array"
      };
      expect(() => validateSerializedTree(invalidData as unknown as SerializedTree)).toThrow("Invalid tree data: tree must be an array");
    });

    it("should throw on invalid hex in leaves", () => {
      const invalidData: SerializedTree = {
        leaves: ["a1b2c3", "not hex"],
        tree: [["a1b2c3", "d4e5f6"], ["abcdef"]]
      };
      expect(() => validateSerializedTree(invalidData)).toThrow("Invalid tree data: leaves must be hex strings");
    });

    it("should throw on invalid hex in tree", () => {
      const invalidData: SerializedTree = {
        leaves: ["a1b2c3", "d4e5f6"],
        tree: [["a1b2c3", "d4e5f6"], ["not hex"]]
      };
      expect(() => validateSerializedTree(invalidData)).toThrow("Invalid tree data: tree hashes must be hex strings");
    });

    it("should throw on non-array tree level", () => {
      const invalidData = {
        leaves: ["a1b2c3", "d4e5f6"],
        tree: [["a1b2c3", "d4e5f6"], "not an array"]
      };
      expect(() => validateSerializedTree(invalidData as unknown as SerializedTree)).toThrow("Invalid tree data: tree levels must be arrays");
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
      expect(() => validateSerializedTree(malformedData as unknown as SerializedTree)).toThrow("Invalid tree data: tree levels must be arrays");
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
      const proof: MerkleProof = [
        {
          sibling: Buffer.from("test"),
          position: "right"
        }
      ];
      expect(() => validateProof(proof)).not.toThrow();
    });

    it("should throw on invalid proof structure", () => {
      const invalidProof = [
        {
          position: "right",
          hash: Buffer.from("test")
        }
      ] as unknown as MerkleProof;
      expect(() => validateProof(invalidProof)).toThrow();
    });

    it("should throw on invalid position", () => {
      const invalidProof: MerkleProof = [
        {
          sibling: Buffer.from("test"),
          position: "invalid" as "left" | "right"
        }
      ];
      expect(() => validateProof(invalidProof)).toThrow();
    });

    it("should throw on invalid sibling", () => {
      const invalidProof: MerkleProof = [
        {
          sibling: "not a buffer" as unknown as Buffer,
          position: "right"
        }
      ];
      expect(() => validateProof(invalidProof)).toThrow();
    });

    it("should validate multiple proof items", () => {
      const proof: MerkleProof = [
        {
          sibling: Buffer.from("test1"),
          position: "right"
        },
        {
          sibling: Buffer.from("test2"),
          position: "left"
        }
      ];
      expect(() => validateProof(proof)).not.toThrow();
    });
  });
}); 