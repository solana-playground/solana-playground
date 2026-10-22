import { PgCommon } from "../../common";
import { PgProgramInfo } from "../../program-info";
import { PgWeb3 } from "../../web3";
import type { Arrayable } from "../../types";

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
    programId: PgWeb3.SystemProgram.programId.toBase58(),
  },
  {
    name: "Token",
    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  },
  {
    name: "Token 2022",
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  },
  {
    name: "Associated Token",
    programId: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  },
  {
    name: "Token Metadata",
    programId: "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
  },
].map((program) => {
  const nameSnake = PgCommon.toSnakeCase(program.name);
  const alias = [nameSnake, nameSnake + "_program"];
  return { ...program, alias };
});

/**
 * Get known program names and their public keys.
 *
 * @returns the programs
 */
export const getPrograms = () => {
  if (PgProgramInfo.latestIdl && PgProgramInfo.pk) {
    const currentProgram: Readonly<Program> = {
      name: PgCommon.toTitleFromSnake(PgProgramInfo.latestIdl.metadata.name),
      programId: PgProgramInfo.getPkStr()!,
    };
    return [currentProgram].concat(PROGRAMS);
  }

  return PROGRAMS;
};
