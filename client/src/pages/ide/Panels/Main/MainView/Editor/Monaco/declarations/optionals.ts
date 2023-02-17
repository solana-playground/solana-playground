import { ClientPackage } from "../../../../../../../../utils/pg/client/package";

const getImportRegex = (packageName: string) =>
  new RegExp(`("|')${packageName}("|')`, "gm");

const SPL_TOKEN_REGEX = getImportRegex(ClientPackage.SOLANA_SPL_TOKEN);
// const METAPLEX_REGEX = getImportRegex(ClientPackage.METAPLEX_JS);

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
  // TODO: takes forever to load and doesn't work properly
  // if (!loaded.metaplex && METAPLEX_REGEX.test(content)) {
  //   const { loadMetaplexTypes } = await import("./packages/metaplex");
  //   loadMetaplexTypes();
  //   loaded.metaplex = true;
  // }
};
