import { MerkleTree } from '../index';

describe('MerkleTree', () => {
  it('should create a new Merkle tree', () => {
    const data = ['a', 'b', 'c', 'd'];
    const tree = new MerkleTree(data);
    expect(tree).toBeDefined();
    expect(tree.root).toBeDefined();
  });

  it('should generate a valid proof', () => {
    const data = ['a', 'b', 'c', 'd'];
    const tree = new MerkleTree(data);
    const proof = tree.getProof(2); // Proof for 'c'
    expect(proof).toBeDefined();
    expect(Array.isArray(proof)).toBe(true);
  });

  it('should verify a valid proof', () => {
    const data = ['a', 'b', 'c', 'd'];
    const tree = new MerkleTree(data);
    const proof = tree.getProof(2);
    const leafHash = tree.getLeaf(2);
    const isValid = MerkleTree.verifyProof(leafHash, proof, tree.root);
    expect(isValid).toBe(true);
  });
}); 