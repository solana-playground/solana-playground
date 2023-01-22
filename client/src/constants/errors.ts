import { GITHUB_URL } from "./project";

export enum ItemError {
  ALREADY_EXISTS = "Already exists",
  INVALID_NAME = "Invalid name",
  TYPE_MISMATCH = "Types don't match",
  SRC_DELETE = "Cannot delete src folder",
  SRC_RENAME = "Cannot rename src folder",
}

export enum WorkspaceError {
  ALREADY_EXISTS = "Already exists",
  INVALID_NAME = "Invalid name",
  NOT_FOUND = "Workspace not found",
  CURRENT_NOT_FOUND = "Current workspace not found",
}

export enum GithubError {
  INVALID_URL = "Invalid program url",
  INVALID_REPO = "Invalid program repository",
}

interface ConvertedError {
  [key: string]: string;
}

export const PROGRAM_ERROR: ConvertedError = {
  "0": "Either an account has already been initialized or an account balance is below rent-exempt threshold.",
  "1": "Insufficient funds.",
  "2": "Invalid Mint(token address).",
  "3": "Account not associated with this Mint(token address).",
  "4": "Owner does not match.",
  "5": "This token's supply is fixed and new tokens cannot be minted.",
  "6": "The account cannot be initialized because it is already being used.",
  "7": "Invalid number of provided signers.",
  "8": "Invalid number of required signers.",
  "9": "State is unititialized.",
  A: "Instruction does not support native tokens.",
  B: "Non-native account can only be closed if its balance is zero.",
  C: "Invalid instruction.",
  D: "State is invalid for requested operation.",
  E: "Operation overflowed.",
  F: "Account does not support specified authority type.",
  "10": "This token mint cannot freeze accounts.",
  "11": "Account is frozen, all account operations will fail.",
  "12": "The provided decimals value different from the Mint decimals.",
  "13": "Instruction does not support non-native tokens.",

  /// Anchor Errors
  // Instructions
  "64": "8 byte instruction identifier not provided.",
  "65": "This function does not exists on-chain. Did you forget to redeploy?",
  "66": "The program could not deserialize the given instruction.",
  "67": "The program could not serialize the given instruction.",

  // IDL instructions
  "3E8": "The program was compiled without idl instructions.",
  "3E9": "Invalid program given to the IDL instruction.",

  // Constraints
  "7D0": "A mut constraint was violated.",
  "7D1": "A has one constraint was violated.",
  "7D2": "A signer constraint as violated.",
  "7D3": "A raw constraint was violated.",
  "7D4": "An owner constraint was violated.",
  "7D5": "A rent exemption constraint was violated.",
  "7D6": "A seeds constraint was violated.",
  "7D7": "An executable constraint was violated.",
  "7D8": "A state constraint was violated.",
  "7D9": "An associated constraint was violated.",
  "7DA": "An associated init constraint was violated.",
  "7DB": "A close constraint was violated.",
  "7DC": "An address constraint was violated.",
  "7DD": "Expected zero account discriminant.",
  "7DE": "A token mint constraint was violated.",
  "7DF": "A token owner constraint was violated.",
  "7E0": "A mint mint authority constraint was violated.",
  "7E1": "A mint freeze authority constraint was violated.",
  "7E2": "A mint decimals constraint was violated.",
  "7E3": "A space constraint was violated.",

  // Accounts
  BB8: "The account discriminator was already set on this account.",
  BB9: "No 8 byte discriminator was found on the account.",
  BBA: "8 byte discriminator did not match what was expected.",
  BBB: "Failed to deserialize the account.",
  BBC: "Failed to serialize the account.",
  BBD: "Not enough account keys given to the instruction.",
  BBE: "The given account is not mutable.",
  BBF: "The given account is not owned by the executing program.",
  BC0: "Program ID was not as expected.",
  BC1: "Program account is not executable.",
  BC2: "The given account did not sign.",
  BC3: "The given account is not owned by the system program.",
  BC4: "The program expected this account to be already initialized.",
  BC5: "The given account is not a program data account.",
  BC6: "The given account is not the associated token account.",
  BC7: "The given public key does not match the required sysvar.",

  // State
  FA0: "The given state account does not have the correct address.",

  // Used for APIs that shouldn't be used anymore
  "1388": "The API being used is deprecated and should no longer be used.",

  // Other
  "1004": "The declared program id does not match the actual program id.",
};

export const RPC_ERROR: ConvertedError = {
  "503,":
    "RPC unavailable. Please try a different endpoint from the settings or try again.",
  "429,":
    "Too many requests for this endpoint. You can change the endpoint from the settings or try again later.",
  "Network request failed":
    "RPC endpoint is not responsive. Please change the endpoint from the settings.",
};

export const SERVER_ERROR: ConvertedError = {
  OpenFile: "Please rebuild the project.",
};

export const OTHER_ERROR: ConvertedError = {
  "Failed to fetch": `Unable to build. If the problem persists, please consider creating an issue about the problem in ${GITHUB_URL}/issues`,
  "unable to infer src variant": "Enum variant does not exist.",
  "program.methods[txVals.name] is not a function":
    "Test component is not up to date.",
};
