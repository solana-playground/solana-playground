import { CancelBidBuilderParams, CancelListingBuilderParams, DepositToBuyerAccountBuilderParams, DirectBuyBuilderParams, DirectSellBuilderParams, WithdrawFromBuyerAccountBuilderParams } from './operations';
import { CreateAuctionHouseBuilderParams } from './operations/createAuctionHouse';
import { CreateBidBuilderParams } from './operations/createBid';
import { CreateListingBuilderParams } from './operations/createListing';
import { ExecuteSaleBuilderParams } from './operations/executeSale';
import { UpdateAuctionHouseBuilderParams } from './operations/updateAuctionHouse';
import type { Metaplex } from '../../Metaplex';
import { TransactionBuilderOptions } from '../../utils';
/**
 * This client allows you to access the underlying Transaction Builders
 * for the write operations of the Auction House module.
 *
 * @see {@link AuctionsClient}
 * @group Module Builders
 * */
export declare class AuctionHouseBuildersClient {
    protected readonly metaplex: Metaplex;
    constructor(metaplex: Metaplex);
    /** {@inheritDoc createBidBuilder} */
    bid(input: CreateBidBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").CreateBidBuilderContext>>;
    /** {@inheritDoc directBuyBuilder} */
    buy(input: DirectBuyBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").DirectBuyBuilderContext>>;
    /** {@inheritDoc cancelBidBuilder} */
    cancelBid(input: CancelBidBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<import("./operations").CancelBidBuilderContext>;
    /** {@inheritDoc cancelListingBuilder} */
    cancelListing(input: CancelListingBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<import("./operations").CancelListingBuilderContext>;
    /** {@inheritDoc createAuctionHouseBuilder} */
    createAuctionHouse(input: CreateAuctionHouseBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<import("./operations").CreateAuctionHouseBuilderContext>;
    /** {@inheritDoc depositToBuyerAccountBuilder} */
    depositToBuyerAccount(input: DepositToBuyerAccountBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<import("./operations").DepositToBuyerAccountBuilderContext>;
    /** {@inheritDoc executeSaleBuilder} */
    executeSale(input: ExecuteSaleBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<import("./operations").ExecuteSaleBuilderContext>;
    /** {@inheritDoc createListingBuilder} */
    list(input: CreateListingBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<import("./operations").CreateListingBuilderContext>;
    /** {@inheritDoc directSellBuilder} */
    sell(input: DirectSellBuilderParams, options?: TransactionBuilderOptions): Promise<import("../../utils").TransactionBuilder<import("./operations").DirectSellBuilderContext>>;
    /** {@inheritDoc updateAuctionHouseBuilder} */
    updateAuctionHouse(input: UpdateAuctionHouseBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<object>;
    /** {@inheritDoc withdrawFromBuyerAccountBuilder} */
    withdrawFromBuyerAccount(input: WithdrawFromBuyerAccountBuilderParams, options?: TransactionBuilderOptions): import("../../utils").TransactionBuilder<import("./operations").WithdrawFromBuyerAccountBuilderContext>;
}
