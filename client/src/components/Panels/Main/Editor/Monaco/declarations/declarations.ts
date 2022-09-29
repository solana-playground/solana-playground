import * as monaco from "monaco-editor";
import { Idl } from "@project-serum/anchor";

import { PgProgramInfo } from "../../../../../../utils/pg";

interface DeclarationState {
  disposables: monaco.IDisposable[];
  isDefaultsSet?: boolean;
}

const declarationState: DeclarationState = { disposables: [] };
const removeDisposable = (i: number) => {
  declarationState.disposables = declarationState.disposables.filter(
    (d, j) => i === j
  );
};

interface SetDeclarationsProps {
  isTest: boolean;
}

export const setDeclarations = ({ isTest }: SetDeclarationsProps) => {
  /* -------------------------- Begin disposable types -------------------------- */
  // Remove the old disposables
  let i = 0;
  for (const disposable of declarationState.disposables) {
    disposable.dispose();
    removeDisposable(i);
    i++;
  }

  // Playground
  const idl = PgProgramInfo.getProgramInfo().idl;
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
          idl
            ? `const program: anchor.Program<${JSON.stringify(
                convertIdl(idl)
              )}>;`
            : ""
        )
    )
  );

  // Mocha
  if (isTest) {
    declarationState.disposables.push(
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        require("@types/mocha/index.d.ts")
      )
    );
  }

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

  /* ------------------ Begin @project-serum/anchor ------------------ */
  // Imports
  const anchorCoderBorshAccounts = require("@project-serum/anchor/dist/browser/types/src/coder/borsh/accounts.d.ts");
  const anchorCoderBorshEvent = require("@project-serum/anchor/dist/browser/types/src/coder/borsh/event.d.ts");
  const anchorCoderBorshIdl = require("@project-serum/anchor/dist/browser/types/src/coder/borsh/idl.d.ts");
  const anchorCoderBorshIndex = require("@project-serum/anchor/dist/browser/types/src/coder/borsh/index.d.ts");
  const anchorCoderBorshInstruction = require("@project-serum/anchor/dist/browser/types/src/coder/borsh/instruction.d.ts");
  const anchorCoderBorshState = require("@project-serum/anchor/dist/browser/types/src/coder/borsh/state.d.ts");
  const anchorCoderCommon = require("@project-serum/anchor/dist/browser/types/src/coder/common.d.ts");
  const anchorCoderIndex = require("@project-serum/anchor/dist/browser/types/src/coder/index.d.ts");
  const anchorCoderSplTokenAccounts = require("@project-serum/anchor/dist/browser/types/src/coder/spl-token/accounts.d.ts");
  const anchorCoderSplTokenBufferLayout = require("@project-serum/anchor/dist/browser/types/src/coder/spl-token/buffer-layout.d.ts");
  const anchorCoderSplTokenEvents = require("@project-serum/anchor/dist/browser/types/src/coder/spl-token/events.d.ts");
  const anchorCoderSplTokenIndex = require("@project-serum/anchor/dist/browser/types/src/coder/spl-token/index.d.ts");
  const anchorCoderSplTokenInstruction = require("@project-serum/anchor/dist/browser/types/src/coder/spl-token/instruction.d.ts");
  const anchorCoderSplTokenState = require("@project-serum/anchor/dist/browser/types/src/coder/spl-token/state.d.ts");
  const anchorError = require("@project-serum/anchor/dist/browser/types/src/error.d.ts");
  const anchorIdl = require("@project-serum/anchor/dist/browser/types/src/idl.d.ts");
  const anchorIndex = require("@project-serum/anchor/dist/browser/types/src/index.d.ts");
  const anchorNodewallet = require("@project-serum/anchor/dist/browser/types/src/nodewallet.d.ts");
  const anchorProgramAccountsResolver = require("@project-serum/anchor/dist/browser/types/src/program/accounts-resolver.d.ts");
  const anchorProgramCommon = require("@project-serum/anchor/dist/browser/types/src/program/common.d.ts");
  const anchorProgramContext = require("@project-serum/anchor/dist/browser/types/src/program/context.d.ts");
  const anchorProgramEvent = require("@project-serum/anchor/dist/browser/types/src/program/event.d.ts");
  const anchorProgramIndex = require("@project-serum/anchor/dist/browser/types/src/program/index.d.ts");
  const anchorProgramNamespaceAccount = require("@project-serum/anchor/dist/browser/types/src/program/namespace/account.d.ts");
  const anchorProgramNamespaceIndex = require("@project-serum/anchor/dist/browser/types/src/program/namespace/index.d.ts");
  const anchorProgramNamespaceInstruction = require("@project-serum/anchor/dist/browser/types/src/program/namespace/instruction.d.ts");
  const anchorProgramNamespaceMethods = require("@project-serum/anchor/dist/browser/types/src/program/namespace/methods.d.ts");
  const anchorProgramNamespaceRpc = require("@project-serum/anchor/dist/browser/types/src/program/namespace/rpc.d.ts");
  const anchorProgramNamespaceSimulate = require("@project-serum/anchor/dist/browser/types/src/program/namespace/simulate.d.ts");
  const anchorProgramNamespaceState = require("@project-serum/anchor/dist/browser/types/src/program/namespace/state.d.ts");
  const anchorProgramNamespaceTransaction = require("@project-serum/anchor/dist/browser/types/src/program/namespace/transaction.d.ts");
  const anchorProgramNamespaceTypes = require("@project-serum/anchor/dist/browser/types/src/program/namespace/types.d.ts");
  const anchorProvider = require("@project-serum/anchor/dist/browser/types/src/provider.d.ts");
  const anchorSplIndex = require("@project-serum/anchor/dist/browser/types/src/spl/index.d.ts");
  const anchorSplToken = require("@project-serum/anchor/dist/browser/types/src/spl/token.d.ts");
  const anchorUtilsBytesBase64 = require("@project-serum/anchor/dist/browser/types/src/utils/bytes/base64.d.ts");
  const anchorUtilsBytesBs58 = require("@project-serum/anchor/dist/browser/types/src/utils/bytes/bs58.d.ts");
  const anchorUtilsBytesHex = require("@project-serum/anchor/dist/browser/types/src/utils/bytes/hex.d.ts");
  const anchorUtilsBytesIndex = require("@project-serum/anchor/dist/browser/types/src/utils/bytes/index.d.ts");
  const anchorUtilsBytesUtf8 = require("@project-serum/anchor/dist/browser/types/src/utils/bytes/utf8.d.ts");
  const anchorUtilsCommon = require("@project-serum/anchor/dist/browser/types/src/utils/common.d.ts");
  const anchorUtilsFeatures = require("@project-serum/anchor/dist/browser/types/src/utils/features.d.ts");
  const anchorUtilsIndex = require("@project-serum/anchor/dist/browser/types/src/utils/index.d.ts");
  const anchorUtilsPubkey = require("@project-serum/anchor/dist/browser/types/src/utils/pubkey.d.ts");
  const anchorUtilsRegistry = require("@project-serum/anchor/dist/browser/types/src/utils/registry.d.ts");
  const anchorUtilsRpc = require("@project-serum/anchor/dist/browser/types/src/utils/rpc.d.ts");
  const anchorUtilsSha256 = require("@project-serum/anchor/dist/browser/types/src/utils/sha256.d.ts");
  const anchorUtilsToken = require("@project-serum/anchor/dist/browser/types/src/utils/token.d.ts");
  const anchorWorkspace = require("@project-serum/anchor/dist/browser/types/src/workspace.d.ts");

  // Libs
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderBorshAccounts,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/accounts.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderBorshEvent,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/event.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderBorshIdl,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/idl.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderBorshIndex,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderBorshInstruction,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/instruction.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderBorshState,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/state.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderCommon,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/common.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderIndex,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderSplTokenAccounts,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/accounts.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderSplTokenBufferLayout,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/buffer-layout.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderSplTokenEvents,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/events.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderSplTokenIndex,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderSplTokenInstruction,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/instruction.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorCoderSplTokenState,
    "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/state.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorError,
    "node_modules/project-serum/anchor/dist/browser/types/src/error.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorIdl,
    "node_modules/project-serum/anchor/dist/browser/types/src/idl.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorIndex,
    "node_modules/project-serum/anchor/dist/browser/types/src/anchor.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorNodewallet,
    "node_modules/project-serum/anchor/dist/browser/types/src/nodewallet.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramAccountsResolver,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/accounts-resolver.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramCommon,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/common.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramContext,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/context.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramEvent,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/event.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramIndex,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramNamespaceAccount,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/account.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramNamespaceIndex,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramNamespaceInstruction,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/instruction.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramNamespaceMethods,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/methods.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramNamespaceRpc,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/rpc.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramNamespaceSimulate,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/simulate.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramNamespaceState,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/state.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramNamespaceTransaction,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/transaction.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProgramNamespaceTypes,
    "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/types.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorProvider,
    "node_modules/project-serum/anchor/dist/browser/types/src/provider.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorSplIndex,
    "node_modules/project-serum/anchor/dist/browser/types/src/spl/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorSplToken,
    "node_modules/project-serum/anchor/dist/browser/types/src/spl/token.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsBytesBase64,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/bytes/base64.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsBytesBs58,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/bytes/bs58.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsBytesHex,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/bytes/hex.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsBytesIndex,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/bytes/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsBytesUtf8,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/bytes/utf8.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsCommon,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/common.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsFeatures,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/features.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsIndex,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsPubkey,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/pubkey.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsRegistry,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/registry.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsRpc,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/rpc.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsSha256,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/sha256.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorUtilsToken,
    "node_modules/project-serum/anchor/dist/browser/types/src/utils/token.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorWorkspace,
    "node_modules/project-serum/anchor/dist/browser/types/src/workspace.d.ts"
  );

  // Renaming exports allows us to use '@' and export everything
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `declare module "@project-serum/anchor" {
  export * from "node_modules/project-serum/anchor/dist/browser/types/src/anchor"
}`,
    "node_modules/project-serum/anchor/dist/browser/types/src/index.d.ts"
  );

  // Models
  monaco.editor.createModel(
    anchorCoderBorshAccounts,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/accounts.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderBorshEvent,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/event.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderBorshIdl,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/idl.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderBorshIndex,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/index.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderBorshInstruction,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/instruction.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderBorshState,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/borsh/state.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderCommon,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/common.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderIndex,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/index.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderSplTokenAccounts,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/accounts.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderSplTokenBufferLayout,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/buffer-layout.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderSplTokenEvents,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/events.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderSplTokenIndex,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/index.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderSplTokenInstruction,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/instruction.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorCoderSplTokenState,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/coder/spl-token/state.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorError,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/error.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorIdl,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/idl.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorIndex,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/anchor.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorNodewallet,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/nodewallet.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramAccountsResolver,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/accounts-resolver.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramCommon,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/common.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramContext,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/context.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramEvent,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/event.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramIndex,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/index.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramNamespaceAccount,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/account.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramNamespaceIndex,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/index.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramNamespaceInstruction,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/instruction.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramNamespaceMethods,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/methods.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramNamespaceRpc,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/rpc.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramNamespaceSimulate,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/simulate.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramNamespaceState,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/state.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramNamespaceTransaction,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/transaction.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProgramNamespaceTypes,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/program/namespace/types.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorProvider,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/provider.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorSplIndex,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/spl/index.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorSplToken,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/spl/token.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsBytesBase64,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/bytes/base64.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsBytesBs58,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/bytes/bs58.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsBytesHex,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/bytes/hex.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsBytesIndex,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/bytes/index.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsBytesUtf8,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/bytes/utf8.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsCommon,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/common.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsFeatures,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/features.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsIndex,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/index.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsPubkey,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/pubkey.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsRegistry,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/registry.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsRpc,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/rpc.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsSha256,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/sha256.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorUtilsToken,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/utils/token.d.ts"
    )
  );
  monaco.editor.createModel(
    anchorWorkspace,
    "typescript",
    monaco.Uri.parse(
      "node_modules/project-serum/anchor/dist/browser/types/src/workspace.d.ts"
    )
  );

  /* ------------------ End @project-serum/anchor ------------------ */

  // TODO: Find a way to load this without making load times incredibly slow
  //   /* ------------------ Begin @solana/spl-token ------------------ */
  //   // Imports
  //   const splTokenActionsAmountToUiAmount = require("./spl-token/actions/amountToUiAmount.d.ts");
  //   const splTokenActionsApprove = require("./spl-token/actions/approve.d.ts");
  //   const splTokenActionsApproveChecked = require("./spl-token/actions/approveChecked.d.ts");
  //   const splTokenActionsBurn = require("./spl-token/actions/burn.d.ts");
  //   const splTokenActionsBurnChecked = require("./spl-token/actions/burnChecked.d.ts");
  //   const splTokenActionsCloseAccount = require("./spl-token/actions/closeAccount.d.ts");
  //   const splTokenActionsCreateAccount = require("./spl-token/actions/createAccount.d.ts");
  //   const splTokenActionsCreateAssociatedTokenAccount = require("./spl-token/actions/createAssociatedTokenAccount.d.ts");
  //   const splTokenActionsCreateMint = require("./spl-token/actions/createMint.d.ts");
  //   const splTokenActionsCreateMultisig = require("./spl-token/actions/createMultisig.d.ts");
  //   const splTokenActionsCreateNativeMint = require("./spl-token/actions/createNativeMint.d.ts");
  //   const splTokenActionsCreateWrappedNativeAccount = require("./spl-token/actions/createWrappedNativeAccount.d.ts");
  //   const splTokenActionsFreezeAccount = require("./spl-token/actions/freezeAccount.d.ts");
  //   const splTokenActionsGetOrCreateAssociatedTokenAccount = require("./spl-token/actions/getOrCreateAssociatedTokenAccount.d.ts");
  //   const splTokenActionsIndex = require("./spl-token/actions/index.d.ts");
  //   const splTokenActionsInternal = require("./spl-token/actions/internal.d.ts");
  //   const splTokenActionsMintTo = require("./spl-token/actions/mintTo.d.ts");
  //   const splTokenActionsMintToChecked = require("./spl-token/actions/mintToChecked.d.ts");
  //   const splTokenActionsRevoke = require("./spl-token/actions/revoke.d.ts");
  //   const splTokenActionsSetAuthority = require("./spl-token/actions/setAuthority.d.ts");
  //   const splTokenActionsSyncNative = require("./spl-token/actions/syncNative.d.ts");
  //   const splTokenActionsThawAccount = require("./spl-token/actions/thawAccount.d.ts");
  //   const splTokenActionsTransfer = require("./spl-token/actions/transfer.d.ts");
  //   const splTokenActionsTransferChecked = require("./spl-token/actions/transferChecked.d.ts");
  //   const splTokenActionsUiAmountToAmount = require("./spl-token/actions/uiAmountToAmount.d.ts");
  //   const splTokenConstants = require("./spl-token/constants.d.ts");
  //   const splTokenErrors = require("./spl-token/errors.d.ts");
  //   const splTokenExtensionsAccountType = require("./spl-token/extensions/accountType.d.ts");
  //   const splTokenExtensionsDefaultAccountStateActions = require("./spl-token/extensions/defaultAccountState/actions.d.ts");
  //   const splTokenExtensionsDefaultAccountStateIndex = require("./spl-token/extensions/defaultAccountState/index.d.ts");
  //   const splTokenExtensionsDefaultAccountStateInstructions = require("./spl-token/extensions/defaultAccountState/instructions.d.ts");
  //   const splTokenExtensionsDefaultAccountStateState = require("./spl-token/extensions/defaultAccountState/state.d.ts");
  //   const splTokenExtensionsExtensionType = require("./spl-token/extensions/extensionType.d.ts");
  //   const splTokenExtensionsImmutableOwner = require("./spl-token/extensions/immutableOwner.d.ts");
  //   const splTokenExtensionsIndex = require("./spl-token/extensions/index.d.ts");
  //   const splTokenExtensionsInterestBearingMintActions = require("./spl-token/extensions/interestBearingMint/actions.d.ts");
  //   const splTokenExtensionsInterestBearingMintIndex = require("./spl-token/extensions/interestBearingMint/index.d.ts");
  //   const splTokenExtensionsInterestBearingMintInstructions = require("./spl-token/extensions/interestBearingMint/instructions.d.ts");
  //   const splTokenExtensionsInterestBearingMintState = require("./spl-token/extensions/interestBearingMint/state.d.ts");
  //   const splTokenExtensionsMemoTransferActions = require("./spl-token/extensions/memoTransfer/actions.d.ts");
  //   const splTokenExtensionsMemoTransferIndex = require("./spl-token/extensions/memoTransfer/index.d.ts");
  //   const splTokenExtensionsMemoTransferInstructions = require("./spl-token/extensions/memoTransfer/instructions.d.ts");
  //   const splTokenExtensionsMemoTransferState = require("./spl-token/extensions/memoTransfer/state.d.ts");
  //   const splTokenExtensionsMintCloseAuthority = require("./spl-token/extensions/mintCloseAuthority.d.ts");
  //   const splTokenExtensionsNonTransferable = require("./spl-token/extensions/nonTransferable.d.ts");
  //   const splTokenExtensionsTransferFeeActions = require("./spl-token/extensions/transferFee/actions.d.ts");
  //   const splTokenExtensionsTransferFeeIndex = require("./spl-token/extensions/transferFee/index.d.ts");
  //   const splTokenExtensionsTransferFeeInstructions = require("./spl-token/extensions/transferFee/instructions.d.ts");
  //   const splTokenExtensionsTransferFeeState = require("./spl-token/extensions/transferFee/state.d.ts");
  //   const splTokenIndex = require("./spl-token/index.d.ts");
  //   const splTokenInstructionsAmountToUiAmount = require("./spl-token/instructions/amountToUiAmount.d.ts");
  //   const splTokenInstructionsApprove = require("./spl-token/instructions/approve.d.ts");
  //   const splTokenInstructionsApproveChecked = require("./spl-token/instructions/approveChecked.d.ts");
  //   const splTokenInstructionsAssociatedTokenAccount = require("./spl-token/instructions/associatedTokenAccount.d.ts");
  //   const splTokenInstructionsBurn = require("./spl-token/instructions/burn.d.ts");
  //   const splTokenInstructionsBurnChecked = require("./spl-token/instructions/burnChecked.d.ts");
  //   const splTokenInstructionsCloseAccount = require("./spl-token/instructions/closeAccount.d.ts");
  //   const splTokenInstructionsCreateNativeMint = require("./spl-token/instructions/createNativeMint.d.ts");
  //   const splTokenInstructionsDecode = require("./spl-token/instructions/decode.d.ts");
  //   const splTokenInstructionsFreezeAccount = require("./spl-token/instructions/freezeAccount.d.ts");
  //   const splTokenInstructionsIndex = require("./spl-token/instructions/index.d.ts");
  //   const splTokenInstructionsInitializeAccount = require("./spl-token/instructions/initializeAccount.d.ts");
  //   const splTokenInstructionsInitializeAccount2 = require("./spl-token/instructions/initializeAccount2.d.ts");
  //   const splTokenInstructionsInitializeAccount3 = require("./spl-token/instructions/initializeAccount3.d.ts");
  //   const splTokenInstructionsInitializeImmutableOwner = require("./spl-token/instructions/initializeImmutableOwner.d.ts");
  //   const splTokenInstructionsInitializeMint = require("./spl-token/instructions/initializeMint.d.ts");
  //   const splTokenInstructionsInitializeMint2 = require("./spl-token/instructions/initializeMint2.d.ts");
  //   const splTokenInstructionsInitializeMintCloseAuthority = require("./spl-token/instructions/initializeMintCloseAuthority.d.ts");
  //   const splTokenInstructionsInitializeMultisig = require("./spl-token/instructions/initializeMultisig.d.ts");
  //   const splTokenInstructionsInitializeMultisig2 = require("./spl-token/instructions/initializeMultisig2.d.ts");
  //   const splTokenInstructionsInitializeNonTransferableMint = require("./spl-token/instructions/initializeNonTransferableMint.d.ts");
  //   const splTokenInstructionsInternal = require("./spl-token/instructions/internal.d.ts");
  //   const splTokenInstructionsMintTo = require("./spl-token/instructions/mintTo.d.ts");
  //   const splTokenInstructionsMintToChecked = require("./spl-token/instructions/mintToChecked.d.ts");
  //   const splTokenInstructionsReallocate = require("./spl-token/instructions/reallocate.d.ts");
  //   const splTokenInstructionsRevoke = require("./spl-token/instructions/revoke.d.ts");
  //   const splTokenInstructionsSetAuthority = require("./spl-token/instructions/setAuthority.d.ts");
  //   const splTokenInstructionsSyncNative = require("./spl-token/instructions/syncNative.d.ts");
  //   const splTokenInstructionsThawAccount = require("./spl-token/instructions/thawAccount.d.ts");
  //   const splTokenInstructionsTransfer = require("./spl-token/instructions/transfer.d.ts");
  //   const splTokenInstructionsTransferChecked = require("./spl-token/instructions/transferChecked.d.ts");
  //   const splTokenInstructionsTypes = require("./spl-token/instructions/types.d.ts");
  //   const splTokenInstructionsUiAmountToAmount = require("./spl-token/instructions/uiAmountToAmount.d.ts");
  //   const splTokenStateAccount = require("./spl-token/state/account.d.ts");
  //   const splTokenStateIndex = require("./spl-token/state/index.d.ts");
  //   const splTokenStateMint = require("./spl-token/state/mint.d.ts");
  //   const splTokenStateMultisig = require("./spl-token/state/multisig.d.ts");

  //   // Libs
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsAmountToUiAmount,
  //     "node_modules/solana/spl-token/lib/types/actions/amountToUiAmount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsApprove,
  //     "node_modules/solana/spl-token/lib/types/actions/approve.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsApproveChecked,
  //     "node_modules/solana/spl-token/lib/types/actions/approveChecked.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsBurn,
  //     "node_modules/solana/spl-token/lib/types/actions/burn.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsBurnChecked,
  //     "node_modules/solana/spl-token/lib/types/actions/burnChecked.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsCloseAccount,
  //     "node_modules/solana/spl-token/lib/types/actions/closeAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsCreateAccount,
  //     "node_modules/solana/spl-token/lib/types/actions/createAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsCreateAssociatedTokenAccount,
  //     "node_modules/solana/spl-token/lib/types/actions/createAssociatedTokenAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsCreateMint,
  //     "node_modules/solana/spl-token/lib/types/actions/createMint.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsCreateMultisig,
  //     "node_modules/solana/spl-token/lib/types/actions/createMultisig.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsCreateNativeMint,
  //     "node_modules/solana/spl-token/lib/types/actions/createNativeMint.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsCreateWrappedNativeAccount,
  //     "node_modules/solana/spl-token/lib/types/actions/createWrappedNativeAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsFreezeAccount,
  //     "node_modules/solana/spl-token/lib/types/actions/freezeAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsGetOrCreateAssociatedTokenAccount,
  //     "node_modules/solana/spl-token/lib/types/actions/getOrCreateAssociatedTokenAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsIndex,
  //     "node_modules/solana/spl-token/lib/types/actions/index.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsInternal,
  //     "node_modules/solana/spl-token/lib/types/actions/internal.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsMintTo,
  //     "node_modules/solana/spl-token/lib/types/actions/mintTo.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsMintToChecked,
  //     "node_modules/solana/spl-token/lib/types/actions/mintToChecked.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsRevoke,
  //     "node_modules/solana/spl-token/lib/types/actions/revoke.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsSetAuthority,
  //     "node_modules/solana/spl-token/lib/types/actions/setAuthority.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsSyncNative,
  //     "node_modules/solana/spl-token/lib/types/actions/syncNative.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsThawAccount,
  //     "node_modules/solana/spl-token/lib/types/actions/thawAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsTransfer,
  //     "node_modules/solana/spl-token/lib/types/actions/transfer.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsTransferChecked,
  //     "node_modules/solana/spl-token/lib/types/actions/transferChecked.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenActionsUiAmountToAmount,
  //     "node_modules/solana/spl-token/lib/types/actions/uiAmountToAmount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenConstants,
  //     "node_modules/solana/spl-token/lib/types/constants.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenErrors,
  //     "node_modules/solana/spl-token/lib/types/errors.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsAccountType,
  //     "node_modules/solana/spl-token/lib/types/extensions/accountType.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsDefaultAccountStateActions,
  //     "node_modules/solana/spl-token/lib/types/extensions/defaultAccountState/actions.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsDefaultAccountStateIndex,
  //     "node_modules/solana/spl-token/lib/types/extensions/defaultAccountState/index.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsDefaultAccountStateInstructions,
  //     "node_modules/solana/spl-token/lib/types/extensions/defaultAccountState/instructions.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsDefaultAccountStateState,
  //     "node_modules/solana/spl-token/lib/types/extensions/defaultAccountState/state.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsExtensionType,
  //     "node_modules/solana/spl-token/lib/types/extensions/extensionType.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsImmutableOwner,
  //     "node_modules/solana/spl-token/lib/types/extensions/immutableOwner.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsIndex,
  //     "node_modules/solana/spl-token/lib/types/extensions/index.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsInterestBearingMintActions,
  //     "node_modules/solana/spl-token/lib/types/extensions/interestBearingMint/actions.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsInterestBearingMintIndex,
  //     "node_modules/solana/spl-token/lib/types/extensions/interestBearingMint/index.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsInterestBearingMintInstructions,
  //     "node_modules/solana/spl-token/lib/types/extensions/interestBearingMint/instructions.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsInterestBearingMintState,
  //     "node_modules/solana/spl-token/lib/types/extensions/interestBearingMint/state.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsMemoTransferActions,
  //     "node_modules/solana/spl-token/lib/types/extensions/memoTransfer/actions.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsMemoTransferIndex,
  //     "node_modules/solana/spl-token/lib/types/extensions/memoTransfer/index.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsMemoTransferInstructions,
  //     "node_modules/solana/spl-token/lib/types/extensions/memoTransfer/instructions.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsMemoTransferState,
  //     "node_modules/solana/spl-token/lib/types/extensions/memoTransfer/state.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsMintCloseAuthority,
  //     "node_modules/solana/spl-token/lib/types/extensions/mintCloseAuthority.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsNonTransferable,
  //     "node_modules/solana/spl-token/lib/types/extensions/nonTransferable.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsTransferFeeActions,
  //     "node_modules/solana/spl-token/lib/types/extensions/transferFee/actions.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsTransferFeeIndex,
  //     "node_modules/solana/spl-token/lib/types/extensions/transferFee/index.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsTransferFeeInstructions,
  //     "node_modules/solana/spl-token/lib/types/extensions/transferFee/instructions.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenExtensionsTransferFeeState,
  //     "node_modules/solana/spl-token/lib/types/extensions/transferFee/state.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenIndex,
  //     "node_modules/solana/spl-token/lib/types/splToken.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsAmountToUiAmount,
  //     "node_modules/solana/spl-token/lib/types/instructions/amountToUiAmount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsApprove,
  //     "node_modules/solana/spl-token/lib/types/instructions/approve.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsApproveChecked,
  //     "node_modules/solana/spl-token/lib/types/instructions/approveChecked.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsAssociatedTokenAccount,
  //     "node_modules/solana/spl-token/lib/types/instructions/associatedTokenAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsBurn,
  //     "node_modules/solana/spl-token/lib/types/instructions/burn.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsBurnChecked,
  //     "node_modules/solana/spl-token/lib/types/instructions/burnChecked.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsCloseAccount,
  //     "node_modules/solana/spl-token/lib/types/instructions/closeAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsCreateNativeMint,
  //     "node_modules/solana/spl-token/lib/types/instructions/createNativeMint.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsDecode,
  //     "node_modules/solana/spl-token/lib/types/instructions/decode.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsFreezeAccount,
  //     "node_modules/solana/spl-token/lib/types/instructions/freezeAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsIndex,
  //     "node_modules/solana/spl-token/lib/types/instructions/index.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInitializeAccount,
  //     "node_modules/solana/spl-token/lib/types/instructions/initializeAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInitializeAccount2,
  //     "node_modules/solana/spl-token/lib/types/instructions/initializeAccount2.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInitializeAccount3,
  //     "node_modules/solana/spl-token/lib/types/instructions/initializeAccount3.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInitializeImmutableOwner,
  //     "node_modules/solana/spl-token/lib/types/instructions/initializeImmutableOwner.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInitializeMint,
  //     "node_modules/solana/spl-token/lib/types/instructions/initializeMint.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInitializeMint2,
  //     "node_modules/solana/spl-token/lib/types/instructions/initializeMint2.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInitializeMintCloseAuthority,
  //     "node_modules/solana/spl-token/lib/types/instructions/initializeMintCloseAuthority.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInitializeMultisig,
  //     "node_modules/solana/spl-token/lib/types/instructions/initializeMultisig.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInitializeMultisig2,
  //     "node_modules/solana/spl-token/lib/types/instructions/initializeMultisig2.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInitializeNonTransferableMint,
  //     "node_modules/solana/spl-token/lib/types/instructions/initializeNonTransferableMint.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsInternal,
  //     "node_modules/solana/spl-token/lib/types/instructions/internal.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsMintTo,
  //     "node_modules/solana/spl-token/lib/types/instructions/mintTo.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsMintToChecked,
  //     "node_modules/solana/spl-token/lib/types/instructions/mintToChecked.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsReallocate,
  //     "node_modules/solana/spl-token/lib/types/instructions/reallocate.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsRevoke,
  //     "node_modules/solana/spl-token/lib/types/instructions/revoke.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsSetAuthority,
  //     "node_modules/solana/spl-token/lib/types/instructions/setAuthority.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsSyncNative,
  //     "node_modules/solana/spl-token/lib/types/instructions/syncNative.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsThawAccount,
  //     "node_modules/solana/spl-token/lib/types/instructions/thawAccount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsTransfer,
  //     "node_modules/solana/spl-token/lib/types/instructions/transfer.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsTransferChecked,
  //     "node_modules/solana/spl-token/lib/types/instructions/transferChecked.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsTypes,
  //     "node_modules/solana/spl-token/lib/types/instructions/types.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenInstructionsUiAmountToAmount,
  //     "node_modules/solana/spl-token/lib/types/instructions/uiAmountToAmount.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenStateAccount,
  //     "node_modules/solana/spl-token/lib/types/state/account.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenStateIndex,
  //     "node_modules/solana/spl-token/lib/types/state/index.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenStateMint,
  //     "node_modules/solana/spl-token/lib/types/state/mint.d.ts"
  //   );
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     splTokenStateMultisig,
  //     "node_modules/solana/spl-token/lib/types/state/multisig.d.ts"
  //   );

  //   // Renaming exports allows us to use '@' and export everything
  //   monaco.languages.typescript.typescriptDefaults.addExtraLib(
  //     `declare module "@solana/spl-token" {
  //   export * from "node_modules/solana/spl-token/lib/types/splToken"
  // }`,
  //     "node_modules/solana/spl-token/lib/types/index.d.ts"
  //   );

  //   // Models
  //   monaco.editor.createModel(
  //     splTokenActionsAmountToUiAmount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/amountToUiAmount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsApprove,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/approve.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsApproveChecked,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/approveChecked.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsBurn,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/burn.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsBurnChecked,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/burnChecked.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsCloseAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/closeAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsCreateAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/createAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsCreateAssociatedTokenAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/createAssociatedTokenAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsCreateMint,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/createMint.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsCreateMultisig,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/createMultisig.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsCreateNativeMint,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/createNativeMint.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsCreateWrappedNativeAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/createWrappedNativeAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsFreezeAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/freezeAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsGetOrCreateAssociatedTokenAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/getOrCreateAssociatedTokenAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsIndex,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/index.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsInternal,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/internal.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsMintTo,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/mintTo.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsMintToChecked,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/mintToChecked.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsRevoke,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/revoke.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsSetAuthority,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/setAuthority.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsSyncNative,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/syncNative.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsThawAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/thawAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsTransfer,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/transfer.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsTransferChecked,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/transferChecked.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenActionsUiAmountToAmount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/actions/uiAmountToAmount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenConstants,
  //     "typescript",
  //     monaco.Uri.parse("node_modules/solana/spl-token/lib/types/constants.d.ts")
  //   );
  //   monaco.editor.createModel(
  //     splTokenErrors,
  //     "typescript",
  //     monaco.Uri.parse("node_modules/solana/spl-token/lib/types/errors.d.ts")
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsAccountType,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/accountType.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsDefaultAccountStateActions,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/defaultAccountState/actions.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsDefaultAccountStateIndex,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/defaultAccountState/index.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsDefaultAccountStateInstructions,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/defaultAccountState/instructions.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsDefaultAccountStateState,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/defaultAccountState/state.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsExtensionType,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/extensionType.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsImmutableOwner,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/immutableOwner.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsIndex,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/index.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsInterestBearingMintActions,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/interestBearingMint/actions.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsInterestBearingMintIndex,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/interestBearingMint/index.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsInterestBearingMintInstructions,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/interestBearingMint/instructions.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsInterestBearingMintState,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/interestBearingMint/state.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsMemoTransferActions,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/memoTransfer/actions.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsMemoTransferIndex,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/memoTransfer/index.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsMemoTransferInstructions,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/memoTransfer/instructions.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsMemoTransferState,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/memoTransfer/state.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsMintCloseAuthority,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/mintCloseAuthority.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsNonTransferable,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/nonTransferable.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsTransferFeeActions,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/transferFee/actions.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsTransferFeeIndex,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/transferFee/index.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsTransferFeeInstructions,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/transferFee/instructions.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenExtensionsTransferFeeState,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/extensions/transferFee/state.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenIndex,
  //     "typescript",
  //     monaco.Uri.parse("node_modules/solana/spl-token/lib/types/splToken.d.ts")
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsAmountToUiAmount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/amountToUiAmount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsApprove,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/approve.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsApproveChecked,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/approveChecked.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsAssociatedTokenAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/associatedTokenAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsBurn,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/burn.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsBurnChecked,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/burnChecked.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsCloseAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/closeAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsCreateNativeMint,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/createNativeMint.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsDecode,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/decode.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsFreezeAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/freezeAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsIndex,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/index.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInitializeAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/initializeAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInitializeAccount2,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/initializeAccount2.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInitializeAccount3,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/initializeAccount3.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInitializeImmutableOwner,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/initializeImmutableOwner.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInitializeMint,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/initializeMint.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInitializeMint2,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/initializeMint2.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInitializeMintCloseAuthority,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/initializeMintCloseAuthority.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInitializeMultisig,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/initializeMultisig.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInitializeMultisig2,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/initializeMultisig2.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInitializeNonTransferableMint,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/initializeNonTransferableMint.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsInternal,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/internal.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsMintTo,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/mintTo.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsMintToChecked,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/mintToChecked.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsReallocate,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/reallocate.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsRevoke,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/revoke.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsSetAuthority,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/setAuthority.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsSyncNative,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/syncNative.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsThawAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/thawAccount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsTransfer,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/transfer.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsTransferChecked,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/transferChecked.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsTypes,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/types.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenInstructionsUiAmountToAmount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/instructions/uiAmountToAmount.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenStateAccount,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/state/account.d.ts"
  //     )
  //   );
  //   monaco.editor.createModel(
  //     splTokenStateIndex,
  //     "typescript",
  //     monaco.Uri.parse("node_modules/solana/spl-token/lib/types/state/index.d.ts")
  //   );
  //   monaco.editor.createModel(
  //     splTokenStateMint,
  //     "typescript",
  //     monaco.Uri.parse("node_modules/solana/spl-token/lib/types/state/mint.d.ts")
  //   );
  //   monaco.editor.createModel(
  //     splTokenStateMultisig,
  //     "typescript",
  //     monaco.Uri.parse(
  //       "node_modules/solana/spl-token/lib/types/state/multisig.d.ts"
  //     )
  //   );

  //   /* ------------------ End @solana/spl-token ------------------ */

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
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./anchor-ns.raw.d.ts"),
    "anchor-ns.raw.d.ts"
  );

  /* -------------------------- End namespaces -------------------------- */

  // Globals
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("./globals.raw.d.ts")
  );

  declarationState.isDefaultsSet = true;
};

/**
 * Some declaration files need to be declared for them to be referenced by other
 * declaration files.
 *
 * @param moduleName module name to be referenced in declaration files
 * @param module contents of the module
 * @returns declared version  of the module with `moduleName`
 */
const declare = (moduleName: string, module: string) => {
  return `declare module "${moduleName}" { ${module} }`;
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
