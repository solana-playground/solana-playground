import * as monaco from "monaco-editor";

import { PgProgramInfo } from "../../../../../../utils/pg";

interface DeclarationState {
  disposables: monaco.IDisposable[];
  isDefaultsSet?: boolean;
  isTest?: boolean;
}

const declarationState: DeclarationState = { disposables: [] };
const removeDisposable = (i: number) => {
  declarationState.disposables = declarationState.disposables.filter(
    (d, j) => i === j
  );
};

export const setDeclarations = (isTest?: boolean) => {
  /* -------------------------- Begin disposable types -------------------------- */
  // Remove the old disposables
  let i = 0;
  for (const disposable of declarationState.disposables) {
    disposable.dispose();
    removeDisposable(i);
    i++;
  }

  // Playground
  const anchorIdl = PgProgramInfo.getProgramInfo().idl;
  const programPk = PgProgramInfo.getPk().programPk;
  declarationState.disposables.push(
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      (require("./pg.raw.d.ts") as string)
        .replace(
          "// _programId_",
          programPk ? "const PROGRAM_ID: web3.PublicKey;" : ""
        )
        .replace(
          "// _program_",
          anchorIdl ? "const program: anchor.Program;" : ""
        )
    )
  );

  // Mocha
  if (!declarationState.isTest && isTest) {
    declarationState.disposables.push(
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        require("@types/mocha/index.d.ts")
      )
    );
  }
  declarationState.isTest = isTest;

  /* -------------------------- End disposable types -------------------------- */

  if (declarationState.isDefaultsSet) return;

  /* -------------------------- Begin types -------------------------- */
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./console.raw.d.ts")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("@solana/web3.js/lib/index.d.ts")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("@types/node/assert.d.ts")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    declare("bn.js", require("@types/bn.js/index.d.ts"))
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("@types/node/buffer.d.ts")
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    declare("borsh", require("borsh/lib/index.d.ts"))
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    declare(
      "@solana/buffer-layout",
      require("@solana/buffer-layout/lib/Layout.d.ts")
    )
  );
  /* -------------------------- End types -------------------------- */

  /* -------------------------- Begin namespaces -------------------------- */
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./pg-ns.raw.d.ts"),
    "pg-ns.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./web3js-ns.raw.d.ts"),
    "web3js-ns.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./assert-ns.raw.d.ts"),
    "assert-ns.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./bn-ns.raw.d.ts"),
    "bn-ns.raw.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./borsh-ns.raw.d.ts"),
    "borsh-ns.raw.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./buffer-layout-ns.raw.d.ts"),
    "buffer-layout-ns.raw.d.ts"
  );
  /* -------------------------- End namespaces -------------------------- */

  // Globals
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./globals.raw.d.ts")
  );

  declarationState.isDefaultsSet = true;
};

const declare = (moduleName: string, module: string) => {
  return `declare module "${moduleName}" { ${module} }`;
};
