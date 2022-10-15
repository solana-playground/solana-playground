import { AuthorityScope } from '@metaplex-foundation/mpl-auction-house';
import { PublicKey } from '@solana/web3.js';
import { SendAndConfirmTransactionResponse } from '../../rpcModule';
import { AuctionHouse } from '../models/AuctionHouse';
import { TransactionBuilder, TransactionBuilderOptions } from '../../../utils';
import { Operation, OperationHandler, Pda, Signer } from '../../../types';
import type { Metaplex } from '../../../Metaplex';
declare const Key: "CreateAuctionHouseOperation";
/**
 * Creates an Auction House.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .create({ sellerFeeBasisPoints: 500 }); // 5% fee
 * ```
 *
 * Provide `auctioneerAuthority` in case you want to enable Auctioneer.
 *
 * ```ts
 * await metaplex
 *   .auctionHouse()
 *   .create({ sellerFeeBasisPoints: 500, auctioneerAuthority: mx.identity().publicKey };
 * ```
 *
 * @group Operations
 * @category Constructors
 */
export declare const createAuctionHouseOperation: import("../../../types").OperationConstructor<CreateAuctionHouseOperation, "CreateAuctionHouseOperation", CreateAuctionHouseInput, CreateAuctionHouseOutput>;
/**
 * @group Operations
 * @category Types
 */
export declare type CreateAuctionHouseOperation = Operation<typeof Key, CreateAuctionHouseInput, CreateAuctionHouseOutput>;
/**
 * @group Operations
 * @category Inputs
 */
export declare type CreateAuctionHouseInput = {
    /** The share of the sale the auction house takes on all NFTs as a fee. */
    sellerFeeBasisPoints: number;
    /**
     * This allows the centralised authority to gate which NFT can be listed, bought and sold.
     *
     * @defaultValue `canChangeSalePrice`
     */
    requiresSignOff?: boolean;
    /**
     * Is intended to be used with the Auction House that requires sign off.
     * If the seller intentionally lists their NFT for a price of 0, a new FreeSellerTradeState is made.
     * The Auction House can then change the price to match a matching Bid that is greater than 0.
     *
     * @defaultValue `false`
     */
    canChangeSalePrice?: boolean;
    /**
     * The list of scopes available to the user in the Auctioneer.
     * For example Bid, List, Execute Sale.
     *
     * Only takes place when Auction House has Auctioneer enabled.
     *
     * @defaultValue `All scopes available`
     */
    auctioneerScopes?: AuthorityScope[];
    /**
     * The address of the Auction House treasury mint.
     * The token you accept as the purchase currency.
     *
     * @defaultValue `WRAPPED_SOL_MINT`
     */
    treasuryMint?: PublicKey;
    /**
     * The Authority wallet of the Auction House.
     * It is used to sign off listings and bids in case `requiresSignOff` is true.
     *
     * @defaultValue `metaplex.identity()`
     */
    authority?: PublicKey | Signer;
    /**
     * The account that is marked as a destination of withdrawal from the fee account.
     *
     * @defaultValue `metaplex.identity()`
     */
    feeWithdrawalDestination?: PublicKey;
    /**
     * The account that is marked as the owner of treasury withdrawal destination.
     *
     * @defaultValue `metaplex.identity()`
     */
    treasuryWithdrawalDestinationOwner?: PublicKey;
    /**
     * The Auctioneer authority key.
     * It is required when Auction House is going to have Auctioneer enabled.
     *
     * @defaultValue No default value.
     */
    auctioneerAuthority?: PublicKey;
};
/**
 * @group Operations
 * @category Outputs
 */
export declare type CreateAuctionHouseOutput = {
    /** The address of the Auction House. */
    auctionHouseAddress: Pda;
    /** The account that used to pay the fees for selling and buying. */
    auctionHouseFeeAccountAddress: Pda;
    /** The account that receives the AuctionHouse fees. */
    auctionHouseTreasuryAddress: Pda;
    /** The account that is marked as a destination of withdrawal from the treasury account. */
    treasuryWithdrawalDestinationAddress: PublicKey;
    /** Auction House model. */
    auctionHouse: AuctionHouse;
    /** The blockchain response from sending and confirming the transaction. */
    response: SendAndConfirmTransactionResponse;
};
/**
 * @group Operations
 * @category Handlers
 */
export declare const createAuctionHouseOperationHandler: OperationHandler<CreateAuctionHouseOperation>;
/**
 * @group Transaction Builders
 * @category Inputs
 */
export declare type CreateAuctionHouseBuilderParams = Omit<CreateAuctionHouseInput, 'confirmOptions'> & {
    instructionKey?: string;
    delegateAuctioneerInstructionKey?: string;
};
/**
 * @group Transaction Builders
 * @category Contexts
 */
export declare type CreateAuctionHouseBuilderContext = Omit<CreateAuctionHouseOutput, 'response' | 'auctionHouse'>;
/**
 * Creates an Auction House.
 *
 * ```ts
 * const transactionBuilder = metaplex
 *   .auctionHouse()
 *   .builders()
 *   .createAuctionHouse({ sellerFeeBasisPoints: 500 }) // 5% fee
 * ```
 *
 * @group Transaction Builders
 * @category Constructors
 */
export declare const createAuctionHouseBuilder: (metaplex: Metaplex, params: CreateAuctionHouseBuilderParams, options?: TransactionBuilderOptions) => TransactionBuilder<CreateAuctionHouseBuilderContext>;
export {};
