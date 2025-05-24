# Merkla

A production-ready Merkle tree implementation in JavaScript.

## Features

- Efficient Merkle tree construction and verification
- Support for custom hash functions
- Comprehensive error handling
- Serialization and deserialization
- TypeScript-friendly with JSDoc comments
- Buffer-based implementation for optimal performance
- Production-ready with proper validation and error handling

## Installation

```bash
npm install merkla
```

## Usage

```javascript
const { MerkleTree, defaultHash } = require('merkla');

// Create a new Merkle tree from an array of data
const data = ['a', 'b', 'c', 'd'];
const tree = new MerkleTree(data);

// Get the Merkle root
const root = tree.root;

// Generate a proof for a specific leaf
const proof = tree.getProof(2); // Proof for 'c'

// Verify a proof
const leafHash = defaultHash(Buffer.from('c'));
const isValid = MerkleTree.verifyProof(leafHash, proof, root);

// Serialize the tree
const serialized = tree.toJSON();

// Reconstruct the tree from serialized data
const reconstructed = MerkleTree.fromJSON(serialized);
```

## API

### MerkleTree

#### Constructor

```javascript
new MerkleTree(leaves: Buffer[]|string[], hashFn?: Function)
```

Creates a new Merkle tree from an array of leaves. Each leaf can be either a Buffer or a string.

#### Properties

- `root`: Buffer - The Merkle root hash
- `tree`: Buffer[][] - The complete tree structure
- `leafCount`: number - Number of leaves in the tree
- `depth`: number - Depth of the tree

#### Methods

- `getProof(index: number)`: Generate a proof for a leaf at the specified index
- `getLeaf(index: number)`: Get a leaf hash by index
- `getLeaves()`: Get all leaf hashes
- `toJSON()`: Serialize the tree to a JSON string

#### Static Methods

- `verifyProof(leafHash: Buffer, proof: Array, root: Buffer, hashFn?: Function)`: Verify a proof
- `fromJSON(json: string, hashFn?: Function)`: Create a tree from a JSON string

### MerkleTreeError

Custom error class for Merkle tree operations.

## Error Handling

The library uses a custom `MerkleTreeError` class for all errors. All methods include proper validation and error handling:

```javascript
try {
    const tree = new MerkleTree(data);
    const proof = tree.getProof(index);
} catch (error) {
    if (error instanceof MerkleTreeError) {
        // Handle Merkle tree specific errors
    }
}
```

## Performance

The implementation is optimized for performance:
- Uses Node.js native Buffer for efficient binary data handling
- Minimizes memory allocations
- Efficient tree construction algorithm
- Optimized proof generation and verification

## Security

- Uses SHA-256 by default (can be customized)
- Proper input validation
- No direct exposure of internal tree structure
- Immutable leaf hashes

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT 