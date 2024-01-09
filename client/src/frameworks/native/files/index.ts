import type { TupleFiles } from "../../../utils/pg";

export const files: TupleFiles = [
  ["src/lib.rs", require("./src/lib.rs")],
  ["client/client.ts", require("./client/client.ts.raw")],
  ["tests/native.test.ts", require("./tests/native.test.ts.raw")],
];
