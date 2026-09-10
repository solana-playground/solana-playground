import fs from "fs";
import path from "path";

import { CARGO_FILES, withCargoLock } from "../cargo";
import type { TupleFiles } from "../../../utils";

const TEMPLATE_DIR = path.resolve(
  __dirname,
  "../../../../..",
  "server",
  "templates",
  "anchor-1.1.2"
);

// The server selects the build image by byte-comparing the `cargo` files, so
// the client copies must never drift from the server template
describe("anchor cargo files — real template files on disk", () => {
  it("should ship a Cargo.toml byte-identical to the server template", () => {
    const client = fs.readFileSync(
      path.join(__dirname, "../files/Cargo.toml"),
      "utf8"
    );
    const server = fs.readFileSync(
      path.join(TEMPLATE_DIR, "programs", "program", "Cargo.toml"),
      "utf8"
    );
    expect(client).toBe(server);
  });

  it("should ship a Cargo.lock byte-identical to the server template", () => {
    const client = fs.readFileSync(
      path.join(__dirname, "../Cargo.lock.raw"),
      "utf8"
    );
    const server = fs.readFileSync(
      path.join(TEMPLATE_DIR, "Cargo.lock"),
      "utf8"
    );
    expect(client).toBe(server);
  });
});

describe("withCargoLock", () => {
  it("should append the canonical lock when only a manifest exists", () => {
    const files = withCargoLock([["Cargo.toml", "x"]]);
    expect(files).toContainEqual(["Cargo.lock", CARGO_FILES.lock]);
  });

  it("should keep the prefix style of the manifest path", () => {
    const files = withCargoLock([["/Cargo.toml", "x"]]);
    expect(files).toContainEqual(["/Cargo.lock", CARGO_FILES.lock]);
  });

  it("should not change files that already carry a lock", () => {
    const input: TupleFiles = [
      ["Cargo.toml", "x"],
      ["Cargo.lock", "y"],
    ];
    expect(withCargoLock(input)).toBe(input);
  });

  it("should not change files without a manifest", () => {
    const input: TupleFiles = [["src/lib.rs", "x"]];
    expect(withCargoLock(input)).toBe(input);
  });
});
