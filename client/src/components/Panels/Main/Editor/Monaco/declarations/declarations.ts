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

  /* ------------------ Begin Anchor ------------------ */
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

  // These needs to come after other anchor imports
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    anchorIndex,
    "node_modules/project-serum/anchor/dist/browser/types/src/anchor.d.ts"
  );
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
      "node_modules/project-serum/anchor/dist/browser/types/src/index.d.ts"
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
  /* ------------------ End Anchor ------------------ */

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
