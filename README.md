# Merkle Tree Implementation

A TypeScript implementation of a Merkle tree with support for multiple hash algorithms.

## Features

- Support for multiple hash algorithms (SHA-1, SHA-256, SHA-512, RIPEMD-160, Whirlpool, MD5)
- Custom hash function support
- TypeScript support with full type definitions
- Comprehensive test coverage
- Serialization and deserialization
- Proof generation and verification

## Installation

```bash
npm install merkle-tree-ts
```

## Usage

```typescript
import { MerkleTree } from 'merkle-tree-ts';

// Create a tree with default SHA-256
const tree = new MerkleTree(['a', 'b', 'c', 'd']);

// Create a tree with a specific hash algorithm
const tree = new MerkleTree(['a', 'b', 'c', 'd'], { 
  hashAlgorithm: 'sha512' 
});

// Create a tree with a custom hash function
const customHash = (data: Buffer) => Buffer.from('custom');
const tree = new MerkleTree(['a', 'b', 'c', 'd'], { 
  hashFunction: customHash 
});

// Get the root hash
const root = tree.root;

// Generate a proof for a leaf
const proof = tree.getProof(0);

// Verify a proof
const isValid = tree.verify(proof, 'a', root);

// Serialize the tree
const serialized = tree.toJSON();

// Deserialize the tree
const deserialized = MerkleTree.fromJSON(serialized);
```

## Supported Hash Algorithms

- SHA-1
- SHA-256 (default)
- SHA-512
- RIPEMD-160
- Whirlpool
- MD5

## API

### Constructor

```typescript
new MerkleTree(leaves: (Buffer | string)[], options?: MerkleTreeOptions)
```

#### Options

```typescript
interface MerkleTreeOptions {
  hashAlgorithm?: HashAlgorithm;  // One of: 'sha1', 'sha256', 'sha512', 'ripemd160', 'whirlpool', 'md5'
  hashFunction?: HashFunction;    // Custom hash function: (data: Buffer) => Buffer
}
```

### Methods

- `getRoot(): Buffer` - Get the root hash
- `getProof(index: number): MerkleProof` - Generate a proof for a leaf
- `verify(proof: MerkleProof, leaf: Buffer | string, root: Buffer): boolean` - Verify a proof
- `toJSON(): string` - Serialize the tree
- `static fromJSON(json: string): MerkleTree` - Deserialize the tree

## Types

```typescript
type HashAlgorithm = 'sha1' | 'sha256' | 'sha512' | 'ripemd160' | 'whirlpool' | 'md5';

type HashFunction = (data: Buffer) => Buffer;

interface MerkleProof {
  siblings: Buffer[];
  path: number[];
}

interface MerkleTreeOptions {
  hashAlgorithm?: HashAlgorithm;
  hashFunction?: HashFunction;
}
```

## Error Handling

The library throws `MerkleTreeError` for various error conditions:

- Empty leaves array
- Invalid hash algorithm
- Invalid hash function
- Invalid proof
- Invalid serialized data

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 