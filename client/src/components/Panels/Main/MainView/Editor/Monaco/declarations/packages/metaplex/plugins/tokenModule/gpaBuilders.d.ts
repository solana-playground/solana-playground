import { PublicKey } from '@solana/web3.js';
import { Metaplex } from '../../Metaplex';
import { GpaBuilder } from '../../utils';
import { BigNumber } from '../../types';
export declare class MintGpaBuilder extends GpaBuilder {
    constructor(metaplex: Metaplex, programId?: PublicKey);
    whereDoesntHaveMintAuthority(): this;
    whereHasMintAuthority(): this;
    whereMintAuthority(mintAuthority: PublicKey): this;
    whereSupply(supply: number | BigNumber): this;
}
export declare class TokenGpaBuilder extends GpaBuilder {
    constructor(metaplex: Metaplex, programId?: PublicKey);
    selectMint(): this;
    whereMint(mint: PublicKey): this;
    selectOwner(): this;
    whereOwner(owner: PublicKey): this;
    selectAmount(): this;
    whereAmount(amount: number | BigNumber): this;
    whereDoesntHaveDelegate(): this;
    whereHasDelegate(): this;
    whereDelegate(delegate: PublicKey): this;
}
