const getImportRegex = (packageName: string) =>
  new RegExp(`("|')${packageName}("|')`, "gm");

const SPL_TOKEN_REGEX = getImportRegex("@solana/spl-token");
const METAPLEX_REGEX = getImportRegex("@metaplex-foundation/js");

const loaded = {
  splToken: false,
  metaplex: false,
};

export const declareOptionalTypes = async (content: string) => {
  if (!loaded.splToken && SPL_TOKEN_REGEX.test(content)) {
    const { loadSplTokenTypes } = await import("./packages/spl-token");
    loadSplTokenTypes();
    loaded.splToken = true;
  }
  if (!loaded.metaplex && METAPLEX_REGEX.test(content)) {
    const { loadMetaplexTypes } = await import("./packages/metaplex");
    loadMetaplexTypes();
    loaded.metaplex = true;
  }
};
