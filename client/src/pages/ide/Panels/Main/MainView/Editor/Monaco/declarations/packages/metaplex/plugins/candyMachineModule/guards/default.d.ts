import { AddressGateGuardSettings } from './addressGate';
import { AllowListGuardRouteSettings, AllowListGuardSettings } from './allowList';
import { BotTaxGuardSettings } from './botTax';
import { CandyGuardsMintSettings, CandyGuardsRouteSettings, CandyGuardsSettings } from './core';
import { EndDateGuardSettings } from './endDate';
import { GatekeeperGuardMintSettings, GatekeeperGuardSettings } from './gatekeeper';
import { MintLimitGuardSettings } from './mintLimit';
import { NftBurnGuardMintSettings, NftBurnGuardSettings } from './nftBurn';
import { NftGateGuardMintSettings, NftGateGuardSettings } from './nftGate';
import { NftPaymentGuardMintSettings, NftPaymentGuardSettings } from './nftPayment';
import { RedeemedAmountGuardSettings } from './redeemedAmount';
import { SolPaymentGuardSettings } from './solPayment';
import { StartDateGuardSettings } from './startDate';
import { ThirdPartySignerGuardMintSettings, ThirdPartySignerGuardSettings } from './thirdPartySigner';
import { TokenBurnGuardSettings } from './tokenBurn';
import { TokenGateGuardMintSettings, TokenGateGuardSettings } from './tokenGate';
import { TokenPaymentGuardSettings } from './tokenPayment';
import { Option } from '../../../utils';
/**
 * The settings for all default Candy Machine guards.
 */
export declare type DefaultCandyGuardSettings = CandyGuardsSettings & {
    botTax: Option<BotTaxGuardSettings>;
    solPayment: Option<SolPaymentGuardSettings>;
    tokenPayment: Option<TokenPaymentGuardSettings>;
    startDate: Option<StartDateGuardSettings>;
    thirdPartySigner: Option<ThirdPartySignerGuardSettings>;
    tokenGate: Option<TokenGateGuardSettings>;
    gatekeeper: Option<GatekeeperGuardSettings>;
    endDate: Option<EndDateGuardSettings>;
    allowList: Option<AllowListGuardSettings>;
    mintLimit: Option<MintLimitGuardSettings>;
    nftPayment: Option<NftPaymentGuardSettings>;
    redeemedAmount: Option<RedeemedAmountGuardSettings>;
    addressGate: Option<AddressGateGuardSettings>;
    nftGate: Option<NftGateGuardSettings>;
    nftBurn: Option<NftBurnGuardSettings>;
    tokenBurn: Option<TokenBurnGuardSettings>;
};
/**
 * The mint settings for all default Candy Machine guards.
 */
export declare type DefaultCandyGuardMintSettings = CandyGuardsMintSettings & {
    thirdPartySigner: Option<ThirdPartySignerGuardMintSettings>;
    tokenGate: Option<TokenGateGuardMintSettings>;
    gatekeeper: Option<GatekeeperGuardMintSettings>;
    nftPayment: Option<NftPaymentGuardMintSettings>;
    nftGate: Option<NftGateGuardMintSettings>;
    nftBurn: Option<NftBurnGuardMintSettings>;
};
/**
 * The mint settings for all default Candy Machine guards.
 */
export declare type DefaultCandyGuardRouteSettings = CandyGuardsRouteSettings & {
    allowList: AllowListGuardRouteSettings;
};
