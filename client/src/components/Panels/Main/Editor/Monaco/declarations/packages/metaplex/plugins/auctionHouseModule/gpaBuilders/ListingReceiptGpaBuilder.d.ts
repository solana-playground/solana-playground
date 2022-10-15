import { PublicKey } from '@solana/web3.js';
import { GpaBuilder } from '../../../utils';
declare type AccountDiscriminator = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
];
export declare class ListingReceiptGpaBuilder extends GpaBuilder {
    whereDiscriminator(discrimator: AccountDiscriminator): this;
    listingReceiptAccounts(): this;
    whereAuctionHouse(auctionHouseAddress: PublicKey): this;
    whereSeller(sellerAddress: PublicKey): this;
    whereMetadata(metadataAddress: PublicKey): this;
}
export {};
