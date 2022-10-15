/**
 * Represent an item inside a Candy Machine that has been or
 * will eventually be minted into an NFT.
 *
 * It only contains the name and the URI of the NFT to be as
 * the rest of the data is shared by all NFTs and lives
 * in the Candy Machine configurations (e.g. `symbol`, `creators`, etc).
 *
 * @group Models
 */
export declare type CandyMachineItem = {
    /** The index of the config line. */
    readonly index: number;
    /** Whether the item has been minted or not. */
    readonly minted: boolean;
    /** The name of the NFT to be. */
    readonly name: string;
    /** The URI of the NFT to be, pointing to some off-chain JSON Metadata. */
    readonly uri: string;
};
