// Generate crates for Rust Analyzer.

import path from "path";
import fs from "fs/promises";
import { homedir } from "os";
import { execSync, spawnSync } from "child_process";

/** All supported crate names */
const crates = JSON.parse(
  await fs.readFile(path.join("..", "..", "supported-crates.json"))
);

/** Crate output directory */
const CRATES_PATH = path.join("..", "public", "crates");

/** `syn-file-expand-cli` name */
const CLI_NAME = "syn-file-expand-cli";

const registryPath = path.join(homedir(), ".cargo", "registry", "src");
const registries = await fs.readdir(registryPath);
const cratesIoRegistry = registries.find((registry) => {
  return registry.startsWith("index.crates.io");
});
if (!cratesIoRegistry) throw new Error("crates.io registry not found");

const cratesIoRegistryPath = path.join(registryPath, cratesIoRegistry);
const allCrates = await fs.readdir(cratesIoRegistryPath);

// Install `syn-file-expand-cli` if it's not installed
try {
  execSync(`${CLI_NAME} --help`, { stdio: "ignore" });
} catch {
  spawnSync("cargo", ["install", CLI_NAME, "--version", "0.3.0", "--locked"]);
}

for (const name in crates) {
  const version = crates[name];
  const dirName = allCrates.find((crate) => crate === `${name}-${version}`);
  if (!dirName) throw new Error(`Crate '${name}' not found`);

  const dirPath = path.join(cratesIoRegistryPath, dirName);
  const snakeCaseName = name.replaceAll("-", "_");

  // Generate crate
  const result = spawnSync(CLI_NAME, [
    path.join(dirPath, "src", "lib.rs"),
    "--loopify",
    "--cfg-true-by-default",
    "--output",
    path.join(CRATES_PATH, `${snakeCaseName}.rs`),
  ]);
  if (result.status !== 0) throw new Error(result.stderr.toString());

  // Get `Cargo.toml`
  await fs.copyFile(
    path.join(dirPath, "Cargo.toml.orig"),
    path.join(CRATES_PATH, `${snakeCaseName}.toml`)
  );
}
