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
export declare class BidReceiptGpaBuilder extends GpaBuilder {
    whereDiscriminator(discrimator: AccountDiscriminator): this;
    bidReceiptAccounts(): this;
    whereAuctionHouse(auctionHouseAddress: PublicKey): this;
    whereBuyer(buyerAddress: PublicKey): this;
    whereMetadata(metadataAddress: PublicKey): this;
}
export {};
