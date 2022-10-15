import MerkleTree from 'merkletreejs';
/**
 * Describes the required data input for
 * handling Merkle Tree operations.
 */
declare type MerkleTreeInput = Uint8Array | string;
/**
 * Creates a Merkle Tree from the provided data.
 */
export declare const getMerkleTree: (data: MerkleTreeInput[]) => MerkleTree;
/**
 * Creates a Merkle Root from the provided data.
 *
 * This root provides a short identifier for the
 * provided data that is unique and deterministic.
 * This means, we can use this root to verify that
 * a given data is part of the original data set.
 */
export declare const getMerkleRoot: (data: MerkleTreeInput[]) => Uint8Array;
/**
 * Creates a Merkle Proof for a given data item.
 *
 * This proof can be used to verify that the given
 * data item is part of the original data set.
 */
export declare const getMerkleProof: (data: MerkleTreeInput[], leaf: MerkleTreeInput, index?: number | undefined) => Uint8Array[];
/**
 * Creates a Merkle Proof for a data item at a given index.
 *
 * This proof can be used to verify that the data item at
 * the given index is part of the original data set.
 */
export declare const getMerkleProofAtIndex: (data: MerkleTreeInput[], index: number) => Uint8Array[];
export {};
