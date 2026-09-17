import fs from "fs";
import path from "path";

const TEMPLATE_DIR = path.resolve(
  __dirname,
  "../../../../..",
  "server",
  "templates",
  "anchor-1.1.2"
);

// The server selects the build image by byte-comparing the manifest, so the
// client copy must never drift from the server template
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
});
