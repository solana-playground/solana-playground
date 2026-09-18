import path from "path";
import { execSync } from "child_process";
import { createRequire } from "module";

import PgImportChunkPlugin from "./plugins/pg-import-chunk.js";

const require = createRequire(path.resolve("polyfills", "package.json"));
const webpack = require("webpack");

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
    new PgImportChunkPlugin(),
    new webpack.ProvidePlugin({
      process: require.resolve("process/browser"),
      Buffer: [require.resolve("buffer"), "Buffer"],
    }),
  ],
  resolve: {
    fallback: {
      assert: require.resolve("assert/"),
      buffer: require.resolve("buffer/"),
      crypto: require.resolve("crypto-browserify"),
      events: require.resolve("events/"),
      path: require.resolve("path-browserify"),
      process: require.resolve("process/browser"),
      stream: require.resolve("stream-browserify"),
      url: require.resolve("url/"),
      util: require.resolve("util/"),
      child_process: false,
      cluster: false,
      dgram: false,
      fs: false,
      inspector: false,
      net: false,
      perf_hooks: false,
      repl: false,
      tls: false,
      vm: false,
      worker_threads: false,
      zlib: false,
    },
  },
};
