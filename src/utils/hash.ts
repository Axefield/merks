import { createHash } from "crypto";
import { HashAlgorithm, HashFunction } from "../types";

/**
 * Creates a hash function for the specified algorithm
 * @param algorithm The hash algorithm to use
 * @returns A hash function that takes a Buffer and returns a Buffer
 * @throws {Error} If the algorithm is not supported
 */
export function createHashFunction(algorithm: HashAlgorithm): HashFunction {
  if (algorithm === "none") {
    return (data: Buffer): Buffer => data;
  }

  return (data: Buffer): Buffer => {
    if (!Buffer.isBuffer(data)) {
      throw new Error("Hash input must be a Buffer");
    }
    return createHash(algorithm).update(data).digest();
  };
}

/**
 * Default hash function using SHA-256
 */
export const defaultHash: HashFunction = createHashFunction("sha256");

/**
 * List of all supported hash algorithms
 */
export const supportedAlgorithms: HashAlgorithm[] = [
  "sha1",
  "sha256",
  "sha512",
  "ripemd160",
  "whirlpool",
  "md5",
  "none"
];

/**
 * Validates if a string is a supported hash algorithm
 * @param algorithm The algorithm to validate
 * @returns True if the algorithm is supported
 */
export function isValidHashAlgorithm(algorithm: string): algorithm is HashAlgorithm {
  return supportedAlgorithms.includes(algorithm as HashAlgorithm);
} 