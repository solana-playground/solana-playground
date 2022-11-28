import * as path from "path";

export const PATHS = {
  DIRS: {
    APP: "app",
    MIGRATIONS: "migrations",
    PROGRAM: "program",
    PROGRAMS: "programs",
    TESTS: "tests",
    SRC: "src",
    PROGRAMS_PY: "programs_py",
    SEAHORSE: "seahorse",
    NODE_MODULES: "node_modules",
    TARGET: "target",
    get DEPLOY() {
      return path.join(this.TARGET, "deploy");
    },
    get IDL() {
      return path.join(this.TARGET, "idl");
    },
  },
  FILES: {
    GITIGNORE: ".gitignore",
    PRETTIERIGNORE: ".prettierignore",
    ANCHOR_TOML: "Anchor.toml",
    CARGO_TOML: "Cargo.toml",
    XARGO_TOML: "Xargo.toml",
    PACKAGE_JSON: "package.json",
    TSCONFIG_JSON: "tsconfig.json",
    DEPLOY_TS: "deploy.ts",
    LIB_RS: "lib.rs",
    INIT_PY: "__init__.py",
    PRELUDE_PY: "prelude.py",
  },
};
