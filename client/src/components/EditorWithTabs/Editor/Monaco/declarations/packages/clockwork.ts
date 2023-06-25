import * as monaco from "monaco-editor";

export default function declareClockwork() {
  /* ------------------ Begin @clockwork-xyz/sdk ------------------ */
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/index.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/old-index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/ClockworkProvider.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/ClockworkProvider.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/accounts/Thread.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/accounts/Thread.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/accounts/index.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/accounts/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/constants/index.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/constants/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/models/ClockData.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/models/ClockData.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/models/CrateInfo.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/models/CrateInfo.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/models/ExecContext.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/models/ExecContext.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/models/SerializableInstruction.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/models/SerializableInstruction.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/models/ThreadSettings.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/models/ThreadSettings.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/models/Trigger.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/models/Trigger.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/models/TriggerContext.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/models/TriggerContext.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/models/index.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/models/index.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/programs/thread/types.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/programs/thread/types.d.ts"
  );
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    require("/node_modules/@clockwork-xyz/sdk/lib/utils.d.ts"),
    "node_modules/clockwork-xyz/sdk/lib/utils.d.ts"
  );

  // Renaming exports allows us to use '@' and export everything
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `declare module "@clockwork-xyz/sdk" {
  export * from "node_modules/clockwork-xyz/sdk/lib/old-index"
}`,
    "node_modules/clockwork-xyz/sdk/lib/index.d.ts"
  );
  /* ------------------ End @clockwork-xyz/sdk ------------------ */
}
