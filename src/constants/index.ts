import { createHash } from "crypto";
import { HashFunction } from "../types";

/**
 * Default hash function using SHA-256
 */
export const defaultHash: HashFunction = (data: Buffer): Buffer => {
  return createHash("sha256").update(data).digest();
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_LEAF_INDEX: "Invalid leaf index",
  INVALID_PROOF: "Invalid proof",
  INVALID_TREE: "Invalid tree structure",
  EMPTY_TREE: "Cannot create tree from empty data",
} as const;
