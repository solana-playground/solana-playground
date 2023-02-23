import { RawAccount as SplTokenAccount, RawMint as SplMintAccount } from '@solana/spl-token';
import { Account } from '../../types';
/** @group Accounts */
export declare type MintAccount = Account<SplMintAccount>;
/** @group Account Helpers */
export declare const parseMintAccount: import("../../types").AccountParsingFunction<SplMintAccount>;
/** @group Account Helpers */
export declare const toMintAccount: import("../../types").AccountParsingAndAssertingFunction<SplMintAccount>;
/** @group Accounts */
export declare type TokenAccount = Account<SplTokenAccount>;
/** @group Account Helpers */
export declare const parseTokenAccount: import("../../types").AccountParsingFunction<SplTokenAccount>;
/** @group Account Helpers */
export declare const toTokenAccount: import("../../types").AccountParsingAndAssertingFunction<SplTokenAccount>;
