const webpack = require("webpack");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const fs = require("fs");
const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Resolve WASM and CommonJS
      webpackConfig.resolve.extensions.push(".wasm");
      webpackConfig.experiments = {
        asyncWebAssembly: true,
      };
      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf ?? []).forEach((oneOf) => {
          if (oneOf.type === "asset/resource") {
            // Including .cjs here solves `nanoid is not a function`
            oneOf.exclude.push(/\.wasm$/, /\.cjs$/);
          } else if (new RegExp(oneOf.test).test(".d.ts")) {
            // Exclude declaration files from being loaded by babel
            oneOf.exclude = [/\.d\.ts$/];
          }
        });
      });

      webpackConfig.module.rules.push(
        // Fix process error on @lezer/lr
        {
          test: /@lezer\/lr\/dist\/\w+\.js$/,
          resolve: { fullySpecified: false },
        },

        // Raw imports
        {
          test: /\.(d\.ts|raw|rs|py|md|toml)$/,
          type: "asset/source",
        },

        // Resource query
        {
          resourceQuery: /resource/,
          type: "asset/resource",
        }
      );

      // Resolve node polyfills
      webpackConfig.resolve.fallback = {
        // Mocha
        stream: require.resolve("stream-browserify"),

        // Fix `Module not found: Error: Can't resolve 'perf_hooks'` from typescript
        perf_hooks: false,

        // @metaplex-foundation/js polyfills
        crypto: require.resolve("crypto-browserify"),
        fs: false,
        process: false,
        path: false,
        zlib: false,
      };

      // Plugins
      webpackConfig.plugins.push(
        // Buffer
        new webpack.ProvidePlugin({ Buffer: ["buffer", "Buffer"] }),

        // Process
        new webpack.ProvidePlugin({
          process: "process/browser",
        }),

        // Monaco
        new MonacoWebpackPlugin(),

        // Circular dependencies
        new CircularDependencyPlugin({
          // Excluding terminal commands because circular imports will be resolved
          // by the time the commands are executed.
          exclude: /node_modules|terminal|sugar|client/,
          // Include all src folder
          include: /src/,
          // Add errors to webpack instead of warnings
          failOnError: true,
          // Allow import cycles that include an asynchronous import,
          // e.g. via import(/* webpackMode: "weak" */ './file.js')
          allowAsyncCycles: false,
          // Set the current working directory for displaying module paths
          cwd: process.cwd(),
        }),

        // Ignore `Critical dependency: the request of a dependency is an expression`
        // from typescript and mocha
        new webpack.ContextReplacementPlugin(/^\.$/, (context) => {
          if (/\/node_modules\/(typescript|mocha)\/lib/.test(context.context)) {
            for (const d of context.dependencies) {
              if (d.critical) d.critical = false;
            }
          }
        }),

        // Define globals
        new webpack.DefinePlugin({
          /** All supported crates(Rust Analyzer) */
          CRATES: defineFromPublicDir("crates", (dirItems) => {
            const importable = Object.keys(
              JSON.parse(
                fs.readFileSync(path.join("..", "supported-crates.json"))
              )
            ).map((name) => name.replaceAll("-", "_"));

            const transitive = dirItems
              .filter((name) => name.endsWith(".toml"))
              .map((name) => name.replace(".toml", ""))
              .filter((name) => !importable.includes(name));

            return { importable, transitive };
          }),

          /** Supported packages(TypeScript) */
          PACKAGES: fs.readFileSync(
            path.join("..", "supported-packages.json"),
            "utf8"
          ),

          /** Map of kebab-case tutorial names to thumbnail file names */
          TUTORIAL_THUMBNAIL_MAP: defineFromPublicDir(
            "tutorials",
            (dirItems, tutorialsPath) => {
              return dirItems.reduce((acc, tutorialName) => {
                const thumbnailFileName = fs
                  .readdirSync(path.join(tutorialsPath, tutorialName))
                  .find((name) => name.startsWith("thumbnail"));
                if (thumbnailFileName) acc[tutorialName] = thumbnailFileName;
                return acc;
              }, {});
            }
          ),
        })
      );

      // Do not mangle class names that start with "_Pg" because decorators'
      // main change event name is derived from the class name.
      const terserPlugin = webpackConfig.optimization.minimizer[0];

      // Decarators can be transpiled to either classses or functions, exclude
      // all class/function names that start with "_Pg".
      // See: https://github.com/terser/terser#minify-options-structure
      terserPlugin.options.minimizer.options.keep_classnames = /^_Pg/;
      terserPlugin.options.minimizer.options.keep_fnames = /^_Pg/;

      // Ignore useless warnings
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,

        // https://github.com/GoogleChromeLabs/wasm-bindgen-rayon/issues/23
        /Circular dependency between chunks with runtime/,
      ];

      return webpackConfig;
    },
  },

  devServer: (devServerConfig) => {
    devServerConfig.headers = {
      ...devServerConfig.headers,
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    };

    return devServerConfig;
  },
};

/**
 * Define global variable based on the items in `public` directory.
 *
 * @param {string} dirName directory name inside `public` directory
 * @param {(dirItems: string[], path: string) => string} cb callback to run
 * @returns the stringified result of the callback
 */
const defineFromPublicDir = (dirName, cb) => {
  const publicPath = path.join("public", dirName);

  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath);
  }

  return JSON.stringify(cb(fs.readdirSync(publicPath), publicPath));
};
