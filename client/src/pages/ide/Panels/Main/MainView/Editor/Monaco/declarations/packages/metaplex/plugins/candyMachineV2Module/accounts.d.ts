import { CandyMachine, CollectionPDA } from '@metaplex-foundation/mpl-candy-machine';
import { Account, MaybeAccount } from '../../types';
/** @group Accounts */
export declare type CandyMachineV2Account = Account<CandyMachine>;
/** @group Account Helpers */
export declare const parseCandyMachineV2Account: import("../../types").AccountParsingFunction<CandyMachine>;
/** @group Account Helpers */
export declare const toCandyMachineV2Account: import("../../types").AccountParsingAndAssertingFunction<CandyMachine>;
/** @group Accounts */
export declare type CandyMachineV2CollectionAccount = Account<CollectionPDA>;
/** @group Accounts */
export declare type MaybeCandyMachineV2CollectionAccount = MaybeAccount<CollectionPDA>;
/** @group Account Helpers */
export declare const parseCandyMachineV2CollectionAccount: import("../../types").AccountParsingFunction<CollectionPDA>;
/** @group Account Helpers */
export declare const toCandyMachineV2CollectionAccount: import("../../types").AccountParsingAndAssertingFunction<CollectionPDA>;
