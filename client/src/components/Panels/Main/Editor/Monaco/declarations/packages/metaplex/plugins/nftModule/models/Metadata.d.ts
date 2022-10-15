import { TokenStandard, UseMethod } from '@metaplex-foundation/mpl-token-metadata';
import { PublicKey } from '@solana/web3.js';
import { MetadataAccount } from '../accounts';
import { JsonMetadata } from './JsonMetadata';
import { Option } from '../../../utils';
import { BigNumber, Creator, Pda } from '../../../types';
/** @group Models */
export declare type Metadata<Json extends object = JsonMetadata> = {
    /** A model identifier to distinguish models in the SDK. */
    readonly model: 'metadata';
    /** The address of the Metadata account. */
    readonly address: Pda;
    /** The address of the Mint account. */
    readonly mintAddress: PublicKey;
    /**
     * The address of the authority that is allowed
     * to make changes to the Metadata account.
     */
    readonly updateAuthorityAddress: PublicKey;
    /** The JSON metadata associated with the metadata acount. */
    readonly json: Option<Json>;
    /**
     * Whether or not the JSON metadata was loaded in the first place.
     * When this is `false`, the `json` property is should be ignored.
     */
    readonly jsonLoaded: boolean;
    /**
     * The on-chain name of the asset, stored in the Metadata account.
     * E.g. "My NFT #123"
     */
    readonly name: string;
    /**
     * The on-chain symbol of the asset, stored in the Metadata account.
     * E.g. "MYNFT"
     */
    readonly symbol: string;
    /**
     * The URI that points to the JSON metadata of the asset.
     * This URI is used to load the `json` property of this object.
     */
    readonly uri: string;
    /**
     * Whether or not the asset is mutable.
     * When set to `false` no one can update the Metadata account,
     * not even the update authority.
     */
    readonly isMutable: boolean;
    /**
     * Whether or not the asset has already been sold to its first buyer.
     * When set to `false`, all royalties should be paid to the creators.
     * When set to `true`, royalties should be calculate as usual.
     */
    readonly primarySaleHappened: boolean;
    /**
     * The royalties in percent basis point (i.e. 250 is 2.5%) that
     * should be paid to the creators on each secondary sale.
     */
    readonly sellerFeeBasisPoints: number;
    /** Stores the bump of the edition PDA. */
    readonly editionNonce: Option<number>;
    /**
     * The creators of the asset.
     * Each object within the array contains the address,
     * the shares in percent (i.e. 5 is 5%) and whether or not the
     * creator is verified (i.e. they signed the asset).
     */
    readonly creators: Creator[];
    /**
     * This enum indicates which type of asset we are dealing with.
     * It can be an NFT, a limited edition of an original NFT,
     * a fungible asset (i.e. it has zero decimals)
     * or a fungible token (i.e. it has more than zero decimals).
     */
    readonly tokenStandard: Option<TokenStandard>;
    /**
     * The parent collection the asset belongs to.
     */
    readonly collection: Option<{
        /** The mint address of the collection asset. */
        address: PublicKey;
        /**
         * Whether a collection authority signed this asset to
         * ensure it is part of the collection.
         * If `verified` is `false`, you should not trust
         * the asset as being part of the collection.
         */
        verified: boolean;
    }>;
    /**
     * When this field is not `null`, it indicates that
     * the asset is a collection. Everytime an asset is
     * verified/unverified as part of this collection,
     * the `size` field inside this object will be updated accordingly.
     */
    readonly collectionDetails: Option<{
        /** The collection details version. For now, there's only one version. */
        version: 'V1';
        /** The size of the collection, automatically kept up-to-date by the program. */
        size: BigNumber;
    }>;
    /**
     * When this field is not `null`, it indicates that the asset
     * can be "used" by its owner or any approved "use authorities".
     */
    readonly uses: Option<{
        /** An enum selecting a strategy for using the asset. */
        useMethod: UseMethod;
        /** The amount of remaining uses. */
        remaining: BigNumber;
        /** The total amount of uses that was initially allowed. */
        total: BigNumber;
    }>;
};
/** @group Model Helpers */
export declare const isMetadata: (value: any) => value is Metadata<JsonMetadata<string>>;
/** @group Model Helpers */
export declare function assertMetadata(value: any): asserts value is Metadata;
/** @group Model Helpers */
export declare const toMetadata: (account: MetadataAccount, json?: Option<JsonMetadata<string>> | undefined) => Metadata;
