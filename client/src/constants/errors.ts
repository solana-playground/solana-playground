export enum ItemError {
  ALREADY_EXISTS = "Already exists",
  INVALID_NAME = "Invalid name",
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
  a: "Instruction does not support native tokens.",
  b: "Non-native account can only be closed if its balance is zero.",
  c: "Invalid instruction.",
  d: "State is invalid for requested operation.",
  e: "Operation overflowed.",
  f: "Account does not support specified authority type.",
  "10": "This token mint cannot freeze accounts.",
  "11": "Account is frozen, all account operations will fail.",
  "12": "The provided decimals value different from the Mint decimals.",
  "13": "Instruction does not support non-native tokens.",

  /// Anchor Internal Errors in HexCode formate
  // Instructions.
  "64": "InstructionMissing: 8 byte instruction identifier not provided",
  "65": "InstructionFallbackNotFound: Fallback functions are not supported",
  "66": "InstructionDidNotDeserialize: The program could not deserialize the given instruction",
  "67": "InstructionDidNotSerialize: The program could not serialize the given instruction",
  // IDL instructions.
  "3E8": "IdlInstructionStub: The program was compiled without idl instructions",
  "3E9": "IdlInstructionInvalidProgram: Invalid program given to the IDL instruction",
  // Constraints.
  "7D0": "ConstraintMut: A mut constraint was violated",
  "7D1": "ConstraintHasOne: A has one constraint was violated",
  "7D2": "ConstraintSigner: A signer constraint as violated",
  "7D3": "ConstraintRaw: A raw constraint was violated",
  "7D4": "ConstraintOwner: An owner constraint was violated",
  "7D5": "ConstraintRentExempt: A rent exemption constraint was violated",
  "7D6": "ConstraintSeeds: A seeds constraint was violated",
  "7D7": "ConstraintExecutable: An executable constraint was violated",
  "7D8": "ConstraintState: A state constraint was violated",
  "7D9": "ConstraintAssociated: An associated constraint was violated",
  "7DA": "ConstraintAssociatedInit: An associated init constraint was violated",
  "7DB": "ConstraintClose: A close constraint was violated",
  "7DC": "ConstraintAddress: An address constraint was violated",
  "7DD": "ConstraintZero: Expected zero account discriminant",
  "7DE": "ConstraintTokenMint: A token mint constraint was violated",
  "7DF": "ConstraintTokenOwner: A token owner constraint was violated",
  "7E0": "ConstraintMintMintAuthority: A mint mint authority constraint was violated",
  "7E1": "ConstraintMintFreezeAuthority: A mint freeze authority constraint was violated",
  "7E2": "ConstraintMintDecimals: A mint decimals constraint was violated",
  "7E3": "ConstraintSpace: A space constraint was violated",
  // Accounts.
  "BB8": "AccountDiscriminatorAlreadySet: The account discriminator was already set on this account",
  "BB9": "AccountDiscriminatorNotFound: No 8 byte discriminator was found on the account",
  "BBA": "AccountDiscriminatorMismatch: 8 byte discriminator did not match what was expected",
  "BBB": "AccountDidNotDeserialize: Failed to deserialize the account",
  "BBC": "AccountDidNotSerialize: Failed to serialize the account",
  "BBD": "AccountNotEnoughKeys: Not enough account keys given to the instruction",
  "BBE": "AccountNotMutable: The given account is not mutable",
  "BBF": "AccountNotProgramOwned: The given account is not owned by the executing program",
  "BC0": "InvalidProgramId: Program ID was not as expected",
  "BC1": "InvalidProgramExecutable: Program account is not executable",
  "BC2": "AccountNotSigner: The given account did not sign",
  "BC3": "AccountNotSystemOwned: The given account is not owned by the system program",
  "BC4": "AccountNotInitialized: The program expected this account to be already initialized",
  "BC5": "AccountNotProgramData: The given account is not a program data account",
  "BC6": "AccountNotAssociatedTokenAccount: The given account is not the associated token account",
  // State.
  "FA0": "StateInvalidAddress: The given state account does not have the correct address",
  // Used for APIs that shouldn't be used anymore.
  "1388": "Deprecated: The API being used is deprecated and should no longer be used",
};

export const RPC_ERROR: ConvertedError = {
  "503 Service Unavailable":
    "RPC unavailable. Please try a different endpoint from the settings or try again.",
  "429 Too Many Requests":
    "Too many requests for this endpoint. You can change the endpoint from the settings.",
  "Network request failed":
    "RPC endpoint is not responsive. Please change the endpoint from the settings.",
};

export const SERVER_ERROR: ConvertedError = {
  OpenFile: "Please rebuild the project.",
};
