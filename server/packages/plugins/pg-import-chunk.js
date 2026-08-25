export default class PgImportChunkPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap("PgImportChunkPlugin", (compilation) => {
      compilation.hooks.processAssets.tapPromise(
        {
          name: "PgImportChunkPlugin",
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
        },
        async (assets) => {
          for (const fileName in assets) {
            if (!fileName.endsWith(".js")) continue;

            const src = assets[fileName].source().replaceAll(
              // import("./" + __webpack_require__.u(chunkId))...
              /import\(((?:[^()]|\([^()]*\))*)\)/g,
              (match, inner) => `window.__pgImportChunk(${inner})`
            );

            assets[fileName] = new compiler.webpack.sources.RawSource(src);
          }
        }
      );
    });
  }
}
