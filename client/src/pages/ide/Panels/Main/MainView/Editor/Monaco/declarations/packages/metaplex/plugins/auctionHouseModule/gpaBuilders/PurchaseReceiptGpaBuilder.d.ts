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
export declare class PurchaseReceiptGpaBuilder extends GpaBuilder {
    whereDiscriminator(discrimator: AccountDiscriminator): this;
    purchaseReceiptAccounts(): this;
    whereBuyer(buyerAddress: PublicKey): this;
    whereSeller(sellerAddress: PublicKey): this;
    whereAuctionHouse(auctionHouseAddress: PublicKey): this;
    whereMetadata(metadataAddress: PublicKey): this;
}
export {};
