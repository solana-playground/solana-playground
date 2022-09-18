const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Resolve .wasm
      webpackConfig.resolve.extensions.push(".wasm");
      webpackConfig.experiments = {
        asyncWebAssembly: true,
      };
      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.type === "asset/resource") {
            oneOf.exclude.push(/\.wasm$/);
          }
        });
      });

      // Resolve node polyfills
      webpackConfig.resolve.fallback = {
        // Fix `Module not found: Error: Can't resolve 'perf_hooks'` from typescript
        perf_hooks: false,
      };

      // Plugins
      webpackConfig.plugins.push(
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
