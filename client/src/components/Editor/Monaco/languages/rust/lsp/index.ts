/**
 * Hand-wired Monaco↔LSP integration rather than `monaco-languageclient`: that
 * library requires the `@codingame/monaco-vscode-api` stack (a patched
 * monaco-editor build plus VS Code services) across the whole editor — far
 * more than one opt-in backend justifies. Only the transport comes from a
 * library (`vscode-ws-jsonrpc`); the providers, conversions, and their tests
 * are ours.
 */
export { connect } from "./client";
export { setRestartHandler, setStatus } from "./status";
