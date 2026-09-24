import type { TupleFiles } from "../../../utils";

export const files: TupleFiles = [
  ["Cargo.toml", require("./Cargo.toml")],
  ["src/lib.rs", require("./src/lib.rs")],
  ["client/client.ts", require("./client/client.ts.raw")],
  ["tests/anchor.test.ts", require("./tests/anchor.test.ts.raw")],
];
