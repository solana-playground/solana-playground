import { AnchorProvider, Program as AnchorProgram } from "@coral-xyz/anchor";
import {
  ASSOCIATED_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@coral-xyz/anchor/dist/cjs/utils/token";
import { SystemProgram } from "@solana/web3.js";

import { PgCommon } from "../common";
import { PgConnection } from "../connection";
import { PgProgramInfo } from "../program-info";
import { PgWallet } from "../wallet";
import type { Arrayable } from "../types";

/** Program data */
interface Program {
  /** Title Case name of the program */
  name: string;
  /** Program's public key */
  programId: string;
  /** Program name alias to match against account name */
  alias?: Arrayable<string>;
}

/** Known programs */
const PROGRAMS: Readonly<Program[]> = [
  {
    name: "System",
    programId: SystemProgram.programId.toBase58(),
  },
  {
    name: "Token",
    programId: TOKEN_PROGRAM_ID.toBase58(),
  },
  {
    name: "Token 2022",
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  },
  {
    name: "Associated Token",
    programId: ASSOCIATED_PROGRAM_ID.toBase58(),
  },
  {
    name: "Token Metadata",
    programId: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
  },
].map((program) => {
  const nameCamel = PgCommon.toCamelCase(program.name);
  const alias = [nameCamel, nameCamel + "Program"];
  return { ...program, alias };
});

/**
 * Get known program names and their public keys.
 *
 * @returns the programs
 */
export const getPrograms = () => {
  if (PgProgramInfo.idl && PgProgramInfo.pk) {
    const currentProgram: Readonly<Program> = {
      name: PgCommon.toTitleFromSnake(PgProgramInfo.idl.name),
      programId: PgProgramInfo.getPkStr()!,
    };
    return [currentProgram].concat(PROGRAMS);
  }

  return PROGRAMS;
};

/**
 * Create an Anchor program instance.
 *
 * @param params optional overrides of the default playground values
 * @returns the created Anchor program instance.
 */
export const getAnchorProgram = (params?: {
  connection?: typeof PgConnection["current"];
  wallet?: typeof PgWallet["current"];
  programId?: typeof PgProgramInfo["pk"];
  idl?: typeof PgProgramInfo["idl"];
}) => {
  const { connection, wallet, programId, idl } = PgCommon.setDefault(params, {
    connection: PgConnection.current,
    wallet: PgWallet.current,
    programId: PgProgramInfo.pk,
    idl: PgProgramInfo.idl,
  });

  if (!wallet) throw new Error("Not connected");
  if (!programId) throw new Error("Program ID not found");
  if (!idl) throw new Error("Anchor IDL not found");

  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  return new AnchorProgram(idl, programId, provider);
};
