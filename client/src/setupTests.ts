// jest 27's jsdom lacks the encoding API `vscode-jsonrpc` needs
import { TextDecoder, TextEncoder } from "util";

Object.assign(globalThis, { TextEncoder, TextDecoder });
