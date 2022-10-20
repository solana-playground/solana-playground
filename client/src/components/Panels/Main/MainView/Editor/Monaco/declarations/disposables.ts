import * as monaco from "monaco-editor";
import { PublicKey } from "@solana/web3.js";
import { Idl } from "@project-serum/anchor";

import { PgProgramInfo } from "../../../../../../../utils/pg";

interface DeclarationState {
  disposables: monaco.IDisposable[];
  idl?: Idl;
  programId?: PublicKey;
}

const declarationState: DeclarationState = { disposables: [] };

export const declareDisposableTypes = async () => {
  // Check if idl or program id changed
  let needUpdate = !declarationState.disposables.length;
  const programId = PgProgramInfo.getPk().programPk;
  if (
    programId &&
    !programId.equals(declarationState.programId ?? PublicKey.default)
  ) {
    needUpdate = true;
    declarationState.programId = programId;
  }
  const idl = PgProgramInfo.getProgramInfo().idl;
  if (idl && JSON.stringify(idl) !== JSON.stringify(declarationState.idl)) {
    needUpdate = true;
    declarationState.idl = idl;
  }

  if (!needUpdate) return;

  // Remove the old disposables
  for (const disposable of declarationState.disposables) {
    disposable.dispose();
  }
  declarationState.disposables = [];

  declarationState.disposables.push(
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      (require("./raw/pg.raw.d.ts") as string)
        .replace(
          "// _programId_",
          programId ? "const PROGRAM_ID: web3.PublicKey;" : ""
        )
        .replace(
          "// _program_",
          idl
            ? `const program: anchor.Program<${JSON.stringify(
                convertIdl(idl)
              )}>;`
            : ""
        )
    )
  );
};

/**
 * Convert Anchor IDL's account names into camelCase to be used accuretely for types
 *
 * @param idl Anchor IDL
 * @returns converted Anchor IDL
 */
const convertIdl = (idl: Idl) => {
  if (!idl.accounts) return idl;

  let newIdl: Idl = { ...idl, accounts: [] };

  for (const account of idl.accounts) {
    newIdl.accounts!.push({
      ...account,
      name: account.name[0].toLowerCase() + account.name.substring(1),
    });
  }

  return newIdl;
};
