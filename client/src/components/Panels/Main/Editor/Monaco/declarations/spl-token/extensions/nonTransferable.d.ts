import type { Mint } from '../state/mint.js';
/** Non-transferable state as stored by the program */
export interface NonTransferable {
}
/** Buffer layout for de/serializing an account */
export declare const NonTransferableLayout: import("@solana/buffer-layout").Structure<NonTransferable>;
export declare const NON_TRANSFERABLE_SIZE: number;
export declare function getNonTransferable(mint: Mint): NonTransferable | null;
//# sourceMappingURL=nonTransferable.d.ts.map