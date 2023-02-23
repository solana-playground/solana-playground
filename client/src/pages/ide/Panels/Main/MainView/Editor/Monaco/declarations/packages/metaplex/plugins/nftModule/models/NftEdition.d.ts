import { PublicKey } from '@solana/web3.js';
import { OriginalEditionAccount, OriginalOrPrintEditionAccount, PrintEditionAccount } from '../accounts';
import { BigNumber } from '../../../types';
import { Option } from '../../../utils';
/** @group Models */
export declare type NftEdition = NftOriginalEdition | NftPrintEdition;
/** @group Model Helpers */
export declare const isNftEdition: (value: any) => value is NftEdition;
/** @group Model Helpers */
export declare function assertNftEdition(value: any): asserts value is NftEdition;
/** @group Model Helpers */
export declare const toNftEdition: (account: OriginalOrPrintEditionAccount) => NftEdition;
/** @group Models */
export declare type NftOriginalEdition = {
    /** A model identifier to distinguish models in the SDK. */
    readonly model: 'nftEdition';
    /**
     * Whether or not this is an original edition.
     * This field helps distinguish between the `NftOriginalEdition`
     * and the `NftPrintEdition` models.
     */
    readonly isOriginal: true;
    /** The address of the edition account. */
    readonly address: PublicKey;
    /** The current supply of printed editions. */
    readonly supply: BigNumber;
    /**
     * The maximum supply of printed editions.
     * When this is `null`, an unlimited amount of editions
     * can be printed from the original edition.
     */
    readonly maxSupply: Option<BigNumber>;
};
/** @group Model Helpers */
export declare const isNftOriginalEdition: (value: any) => value is NftOriginalEdition;
/** @group Model Helpers */
export declare function assertNftOriginalEdition(value: any): asserts value is NftOriginalEdition;
/** @group Model Helpers */
export declare const toNftOriginalEdition: (account: OriginalEditionAccount) => NftOriginalEdition;
/** @group Models */
export declare type NftPrintEdition = {
    /** A model identifier to distinguish models in the SDK. */
    readonly model: 'nftEdition';
    /**
     * Whether or not this is an original edition.
     * This field helps distinguish between the `NftOriginalEdition`
     * and the `NftPrintEdition` models.
     */
    readonly isOriginal: false;
    /** The address of the edition account. */
    readonly address: PublicKey;
    /** The address of the original edition account this was printed from. */
    readonly parent: PublicKey;
    /**
     * The number of this printed edition.
     *
     * For instance, `1` means this was the very first edition printed
     * from the original edition. This is a key difference between
     * printed editions and SFTs as SFTs do not keep track of any
     * ordering.
     */
    readonly number: BigNumber;
};
/** @group Model Helpers */
export declare const isNftPrintEdition: (value: any) => value is NftPrintEdition;
/** @group Model Helpers */
export declare function assertNftPrintEdition(value: any): asserts value is NftPrintEdition;
/** @group Model Helpers */
export declare const toNftPrintEdition: (account: PrintEditionAccount) => NftPrintEdition;
