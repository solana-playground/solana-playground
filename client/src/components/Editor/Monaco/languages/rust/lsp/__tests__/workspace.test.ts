import { Workspace } from "../workspace";
import type { WorkspaceInfo } from "../workspace";

// Only the path helpers `Workspace` uses; importing `utils` pulls the browser
// runtime.
jest.mock("../../../../../../../utils", () => ({
  PgCommon: {
    appendSlash: (s: string) => (s.endsWith("/") ? s : `${s}/`),
    joinPaths: (...parts: string[]) => parts.join("/"),
  },
  PgExplorer: {
    getCurrentSrcPath: () => "/program/src",
    getProjectRootPath: () => "/program",
    toRelativePath: (p: string) => p.replace(/^\/program\//, ""),
    toAbsolutePath: (p: string) => `/program/${p}`,
    files: {} as Record<string, { content?: string }>,
  },
}));

jest.mock(
  "monaco-editor",
  () => ({
    Uri: { parse: (path: string) => ({ path }) },
    editor: { getModel: () => null },
  }),
  { virtual: true }
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PgExplorer } = require("../../../../../../../utils");

const info: WorkspaceInfo = {
  rootUri: "file:///home/solpg",
  programPath: "programs/program",
  template: "anchor-1.1.2",
};
const PREFIX = "file:///home/solpg/programs/program/";

describe("Workspace path mapping", () => {
  it("should round-trip an explorer path through the server URI", () => {
    const workspace = new Workspace(info);
    const uri = workspace.toUri("/program/src/lib.rs");
    expect(uri).toBe(`${PREFIX}src/lib.rs`);
    expect(workspace.toPath(uri)).toBe("/program/src/lib.rs");
  });

  it("should return null for a URI outside the project", () => {
    const workspace = new Workspace(info);
    expect(workspace.toPath("file:///registry/anchor/lib.rs")).toBeNull();
    expect(workspace.toModelUri("file:///registry/anchor/lib.rs")).toBeNull();
  });

  it("should decode percent-encoded segments in a URI", () => {
    const workspace = new Workspace(info);
    expect(workspace.toPath(`${PREFIX}src/my%20mod.rs`)).toBe(
      "/program/src/my mod.rs"
    );
  });
});

describe("Workspace.isProjectSource", () => {
  it("should accept Rust files under src and reject the rest", () => {
    expect(Workspace.isProjectSource("/program/src/lib.rs")).toBe(true);
    expect(Workspace.isProjectSource("/program/src/state/mod.rs")).toBe(true);
    expect(Workspace.isProjectSource("/program/tests/t.rs")).toBe(false);
    expect(Workspace.isProjectSource("/program/src/notes.txt")).toBe(false);
  });
});

describe("Workspace file collection", () => {
  beforeEach(() => {
    PgExplorer.files = {
      "/program/src/lib.rs": { content: "fn main() {}" },
      "/program/Cargo.toml": { content: "[package]" },
      "/program/Cargo.lock": { content: "lock" },
      "/program/tests/t.rs": { content: "test" },
    };
  });

  it("should collect sources plus the root cargo files for open", () => {
    expect(Workspace.getFiles()).toEqual([
      ["src/lib.rs", "fn main() {}"],
      ["Cargo.toml", "[package]"],
      ["Cargo.lock", "lock"],
    ]);
  });

  it("should collect only sources for sync", () => {
    expect(Workspace.getSourceFiles()).toEqual([["src/lib.rs", "fn main() {}"]]);
  });
});
