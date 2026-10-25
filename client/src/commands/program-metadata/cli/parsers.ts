import { Address, address } from "@solana/kit";
import { Encoding } from "@solana-program/program-metadata";

import { logErrorAndExit } from "./logs";

export const addressParser =
  (identifier: string) =>
  (value: string): Address => {
    try {
      return address(value);
    } catch {
      logErrorAndExit(`Invalid ${identifier} address: "${value}"`);
    }
  };

export const addressOrBooleanParser =
  (identifier: string) =>
  (value: string | undefined): Address | boolean => {
    if (value === undefined) return true;
    return addressParser(identifier)(value);
  };

export const encodingParser = (value: string): Encoding => {
  switch (value) {
    case "none":
      return Encoding.None;
    case "utf8":
      return Encoding.Utf8;
    case "base58":
      return Encoding.Base58;
    case "base64":
      return Encoding.Base64;
    default:
      logErrorAndExit(`Invalid encoding option: ${value}`);
  }
};
