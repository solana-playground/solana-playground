import { PublicKey } from '@solana/web3.js';
import { GpaBuilder } from '../../utils';
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
export declare class CandyMachineV2GpaBuilder extends GpaBuilder {
    whereDiscriminator(discrimator: AccountDiscriminator): this;
    candyMachineAccounts(): this;
    candyMachineAccountsForWallet(wallet: PublicKey): this;
    candyMachineAccountsForAuthority(authority: PublicKey): this;
}
export {};
