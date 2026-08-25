import path from "path";
import { createRequire } from "module";
import { execSync } from "child_process";

import PgImportChunkPlugin from "./plugins/pg-import-chunk.js";

const require = createRequire(import.meta.url);
const webpack = require((process.env.NODE_PATH = path.join(
  execSync("yarn global dir", { encoding: "utf-8" }).trim(),
  "node_modules",
  "webpack"
)));

export default {
  mode: "production",
  target: ["web", "es2020"],
  entry: {
    /* <DYNAMIC_ENTRIES> */
  },
  output: {
    path: path.resolve("dist"), // already the default but keep for safety
    filename: "[name]/bundle.js", // split each package to a its own dir
    library: { type: "module" }, // required ESM
    chunkLoading: "import", // required for `PgImportChunkPlugin`
  },
  experiments: {
    outputModule: true,
  },
  plugins: [
    // Resolve Node polyfills
    new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
    new webpack.ProvidePlugin({ process: "process/browser" }),

    // Playground chunk loader
    new PgImportChunkPlugin(),
  ],
  resolve: {
    fallback: {
      // Fix `Module not found: Error: Can't resolve 'perf_hooks'` from typescript
      perf_hooks: false,

      // `mocha`
      stream: require.resolve("stream-browserify"),

      // `@metaplex-foundation/js` polyfills
      crypto: require.resolve("crypto-browserify"),
      fs: false,
      process: false,
      path: false,
      zlib: false,
    },
  },
};
