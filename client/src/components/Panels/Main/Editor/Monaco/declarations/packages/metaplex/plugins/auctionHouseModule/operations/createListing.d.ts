import { PublicKey } from '@solana/web3.js';
import type { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse, Listing } from '../models';
import { Option, TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Pda, Signer, SolAmount, SplTokenAmount } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "CreateListingOperation";
/**
 * Creates a listing on a given asset.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .createListing({ auctionHouse, mintAccount };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const createListingOperation: import("../../../types").OperationConstructor<CreateListingOperation, "CreateListingOperation", CreateListingInput, CreateListingOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type CreateListingOperation = Operation<typeof Key, CreateListingInput, CreateListingOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CreateListingInput = {
    /** A model of the Auction House related to this listing. */
    auctionHouse: AuctionHouse;
    /**
     * Creator of a listing.
     *
     * The wallet being a signer is the only condition in which an NFT can sell at a price of 0.
     * If the user does list at 0 then auction house can change the sale price if the 'can_change_sale_price' option is true.
     * If the trade is not priced at 0, the wallet holder has to be a signer since auction house cannot sign if listing over 0.
     * There must be one and only one signer; Authority or Seller must sign.
     *
     * @defaultValue `metaplex.identity()`
     */
    seller?: PublicKey | Signer;
    /**
     * The Auction House authority.
     *
     * There must be one and only one signer; Authority or Seller must sign.
     * Auction house should be the signer for changing the price instead of user wallet for cases when seller lists at 0.
     *
     * @defaultValue `auctionHouse.authority`
     */
    authority?: PublicKey | Signer;
    /**
     * The Auctioneer authority key.
     * It is required when Auction House has Auctioneer enabled.
     *
     * @defaultValue No default value.
     */
    auctioneerAuthority?: Signer;
    /**
     * The mint account to create a listing for.
     * This is used to find the metadata.
     */
    mintAccount: PublicKey;
    /**
     * The token account address that's associated to the asset a listing created is for.
     *
     * @defaultValue Seller's Associated Token Account.
     */
    tokenAccount?: PublicKey;
    /**
     * The listing price.
     *
     * @defaultValue 0 SOLs or tokens.
     */
    price?: SolAmount | SplTokenAmount;
    /**
     * The number of tokens to list.
     * For an NFT listing it must be 1 token.
     *
     * When a Fungible Asset is put on sale.
     * The buyer can then create a buy order of said assets that is
     * less than the token_size of the sell order.
     *
     * @defaultValue 1 token.
     */
    tokens?: SplTokenAmount;
    /**
     * The address of the bookkeeper wallet responsible for the receipt.
     *
     * @defaultValue `metaplex.identity()`
     */
    bookkeeper?: Signer;
    /**
     * Prints the listing receipt.
     * The receipt holds information about the listing,
     * So it's important to print it if you want to use the `Listing` model
     *
     * The receipt printing is skipped for the Auctioneer Auction House
     * Since it currently doesn't support it.
     *
     * @defaultValue `true`
     */
    printReceipt?: boolean;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type CreateListingOutput = {
    /** Seller trade state account PDA encoding the listing order. */
    sellerTradeState: Pda;
    /** Seller free trade state account PDA encoding the free listing order. */
    freeSellerTradeState: Pda;
    /** The asset's token account address. */
    tokenAccount: PublicKey;
    /** The asset's metadata PDA. */
    metadata: Pda;
    /** The seller address. */
    seller: PublicKey;
    /** The PDA of the receipt account in case it was printed. */
    receipt: Option<Pda>;
    /** The address of the bookkeeper account responsible for the receipt. */
    bookkeeper: Option<PublicKey>;
    /** The listing price. */
    price: SolAmount | SplTokenAmount;
    /** The number of tokens listed. */
    tokens: SplTokenAmount;
    /** A model that keeps information about the Listing. */
    listing: Listing;
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const createListingOperationHandler: OperationHandler<CreateListingOperation>;
/**
 * Creates a listing on a given asset.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .createListing({ auctionHouse, mintAccount });
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare type CreateListingBuilderParams = Omit<CreateListingInput, 'confirmOptions'> & {
    instructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CreateListingBuilderContext = Omit<CreateListingOutput, 'response' | 'listing'>;
/**
 * @group Transaction Builders
 * @category Constructors
 */
export declare const createListingBuilder: (metaplex: Metaplex, params: CreateListingBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder<CreateListingBuilderContext>;
export {};
