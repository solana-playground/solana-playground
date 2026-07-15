import webpack from "webpack";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export default {
  mode: "production",
  target: ["web", "es2020"],
  output: {
    library: { type: "module" },
  },
  experiments: {
    outputModule: true,
  },
  // Resolve Node polyfills
  plugins: [
    new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),
    new webpack.ProvidePlugin({ process: "process/browser" }),
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
