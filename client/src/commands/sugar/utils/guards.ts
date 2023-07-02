import {
  Option,
  sol,
  toBigNumber,
  toDateTime,
  token,
} from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";

import type { ConfigData, ToPrimitive } from "../types";

export const parseGuards = (
  guards: ToPrimitive<Option<ConfigData["guards"]>>
) => {
  if (!guards) return null;

  _parseGuards(guards.default);
  if (guards.groups) {
    guards.groups.map((g) => _parseGuards(g.guards));
  }

  return guards as ConfigData["guards"];
};

const _parseGuards = (guards: { [key: string]: any }) => {
  for (const key in guards) {
    switch (key) {
      case "addressGate":
        guards[key] = {
          address: new PublicKey(guards[key].address),
        };
        break;

      case "allowList":
        guards[key] = {
          merkleRoot: Uint8Array.from(Buffer.from(guards[key].merkleRoot)),
        };
        break;

      case "botTax":
        guards[key] = {
          lamports: sol(guards[key].value),
          lastInstruction: guards[key].lastInstruction,
        };
        break;

      case "endDate":
        guards[key] = {
          date: toDateTime(guards[key].date),
        };
        break;

      case "gatekeeper":
        guards[key] = {
          network: new PublicKey(guards[key].gatekeeperNetwork),
          expireOnUse: guards[key].expireOnUse,
        };
        break;

      case "mintLimit":
        guards[key] = {
          id: guards[key].id,
          limit: guards[key].limit,
        };
        break;

      case "nftBurn":
        guards[key] = {
          requiredCollection: new PublicKey(guards[key].requiredCollection),
        };
        break;

      case "nftGate":
        guards[key] = {
          requiredCollection: new PublicKey(guards[key].requiredCollection),
        };
        break;

      case "nftPayment":
        guards[key] = {
          requiredCollection: new PublicKey(guards[key].requiredCollection),
          destination: new PublicKey(guards[key].destination),
        };
        break;

      case "redeemedAmount":
        guards[key] = {
          maximum: toBigNumber(guards[key].maximum),
        };
        break;

      case "solPayment":
        guards[key] = {
          amount: sol(guards[key].value),
          destination: new PublicKey(guards[key].destination),
        };
        break;

      case "startDate":
        guards[key] = {
          date: toDateTime(guards[key].date),
        };
        break;

      case "thirdPartySigner":
        guards[key] = {
          signerKey: new PublicKey(guards[key].signerKey),
        };
        break;

      case "tokenBurn":
        guards[key] = {
          amount: token(guards[key].amount),
          mint: new PublicKey(guards[key].mint),
        };
        break;

      case "tokenGate":
        guards[key] = {
          amount: token(guards[key].amount),
          mint: new PublicKey(guards[key].mint),
        };
        break;

      case "tokenPayment":
        guards[key] = {
          amount: token(guards[key].amount),
          tokenMint: new PublicKey(guards[key].mint),
          destinationAta: new PublicKey(guards[key].destination),
        };
        break;
    }
  }

  return guards as ConfigData["guards"];
};
