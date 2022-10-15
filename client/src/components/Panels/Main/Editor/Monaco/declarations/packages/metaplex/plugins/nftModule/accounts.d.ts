import { Edition, MasterEditionV1, MasterEditionV2, Metadata } from '@metaplex-foundation/mpl-token-metadata';
import { Account } from '../../types';
/** @group Accounts */
export declare type MetadataAccount = Account<Metadata>;
/** @group Account Helpers */
export declare const parseMetadataAccount: import("../../types").AccountParsingFunction<Metadata>;
/** @group Account Helpers */
export declare const toMetadataAccount: import("../../types").AccountParsingAndAssertingFunction<Metadata>;
/** @group Accounts */
export declare type OriginalOrPrintEditionAccountData = OriginalEditionAccountData | PrintEditionAccountData;
/** @group Accounts */
export declare type OriginalOrPrintEditionAccount = Account<OriginalOrPrintEditionAccountData>;
/** @group Account Helpers */
export declare const parseOriginalOrPrintEditionAccount: import("../../types").AccountParsingFunction<OriginalOrPrintEditionAccountData>;
/** @group Account Helpers */
export declare const toOriginalOrPrintEditionAccount: import("../../types").AccountParsingAndAssertingFunction<OriginalOrPrintEditionAccountData>;
/** @group Account Helpers */
export declare const isOriginalEditionAccount: (account: OriginalOrPrintEditionAccount) => account is OriginalEditionAccount;
/** @group Account Helpers */
export declare const isPrintEditionAccount: (account: OriginalOrPrintEditionAccount) => account is PrintEditionAccount;
/** @group Accounts */
export declare type OriginalEditionAccountData = MasterEditionV1 | MasterEditionV2;
/** @group Accounts */
export declare type OriginalEditionAccount = Account<OriginalEditionAccountData>;
/** @group Account Helpers */
export declare const parseOriginalEditionAccount: import("../../types").AccountParsingFunction<OriginalEditionAccountData>;
/** @group Account Helpers */
export declare const toOriginalEditionAccount: import("../../types").AccountParsingAndAssertingFunction<OriginalEditionAccountData>;
/** @group Accounts */
export declare type PrintEditionAccountData = Edition;
/** @group Accounts */
export declare type PrintEditionAccount = Account<PrintEditionAccountData>;
/** @group Account Helpers */
export declare const parsePrintEditionAccount: import("../../types").AccountParsingFunction<Edition>;
/** @group Account Helpers */
export declare const toPrintEditionAccount: import("../../types").AccountParsingAndAssertingFunction<Edition>;
