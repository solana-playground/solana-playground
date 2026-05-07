// `share.ts` transitively imports `./server` and `./explorer`, which pull in
// build-time-generated globals (`GLOBAL_SETTINGS`). Stub them out so the
// validator can be tested in isolation.
jest.mock("./server", () => ({}));
jest.mock("./explorer", () => ({}));

import { v4 as uuidv4 } from "uuid";

import { PgShare } from "./share";

describe("PgShare.isValidId", () => {
  test("accepts a UUID (postgres)", () => {
    expect(PgShare.isValidId(uuidv4())).toBe(true);
  });

  test.each([
    "507f1f77bcf86cd799439011",
    "69fd158574a75cd49b9875f3",
  ])("accepts legacy ObjectId %s", (id) => {
    expect(PgShare.isValidId(id)).toBe(true);
  });

  test.each([
    ["empty", ""],
    ["malformed UUID (underscores)", "78d89d13_f581_4b4c_aa04_fa9f60ff4fb8"],
    ["legacy wrong length", "507f1f77bcf86cd79943901"],
    ["legacy non-hex", "ABCDEFGHIJKLMNOPQRSTUVWX"],
    ["legacy with 0x prefix", "0x507f1f77bcf86cd799439011"],
  ])("rejects %s", (_label, id) => {
    expect(PgShare.isValidId(id)).toBe(false);
  });
});
