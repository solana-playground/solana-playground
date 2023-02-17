import type { PublicKey } from '@solana/web3.js';
import type { Nft, NftWithToken, Sft, SftWithToken } from './models';
import type { Metadata } from './models/Metadata';
import { PublicKeyValues } from '../../types';
export declare type HasMintAddress = Nft | Sft | NftWithToken | SftWithToken | Metadata | PublicKey;
export declare const toMintAddress: (value: PublicKeyValues | HasMintAddress) => PublicKey;
