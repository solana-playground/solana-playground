import type { TupleFiles } from "../../../utils/pg";

export const files: TupleFiles = [
  ["src/fizzbuzz.py", require("./src/fizzbuzz.py")],
  ["client/client.ts", require("./client/client.ts.raw")],
  ["tests/seahorse.test.ts", require("./tests/seahorse.test.ts.raw")],
];
