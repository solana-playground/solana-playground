const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Resolve WASM and CommonJS
      webpackConfig.resolve.extensions.push(".wasm");
      webpackConfig.experiments = {
        asyncWebAssembly: true,
      };
      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.type === "asset/resource") {
            // Including .cjs here solves `nanoid is not a function`
            oneOf.exclude.push(/\.wasm$/, /\.cjs$/);
          }
        });
      });

      // Fix process error on @lezer/lr
      webpackConfig.module.rules.push({
        test: /@lezer\/lr\/dist\/\w+\.js$/,
        resolve: { fullySpecified: false },
      });

      // Resolve node polyfills
      webpackConfig.resolve.fallback = {
        // Mocha depends on stream
        stream: require.resolve("stream-browserify"),
        // Fix `Module not found: Error: Can't resolve 'perf_hooks'` from typescript
        perf_hooks: false,
      };

      // Plugins
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
        }),
        // Ignore `Critical dependency: the request of a dependency is an expression`
        // from typescript
        new webpack.ContextReplacementPlugin(/^\.$/, (context) => {
          if (/\/node_modules\/typescript\/lib/.test(context.context)) {
            for (const d of context.dependencies) {
              if (d.critical) d.critical = false;
            }
          }
        })
      );

      return webpackConfig;
    },
  },
};
