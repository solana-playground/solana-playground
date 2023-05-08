import type { ClientPackageName } from "../../../../../../../../utils/pg/client/package";

const getImportRegex = (name: ClientPackageName) => {
  return new RegExp(`("|')${name}("|')`, "gm");
};

const CLOCKWORK_REGEX = getImportRegex("@clockwork-xyz/sdk");
const METAPLEX_REGEX = getImportRegex("@metaplex-foundation/js");
const SPL_TOKEN_REGEX = getImportRegex("@solana/spl-token");

const loaded = {
  clockwork: false,
  metaplex: false,
  splToken: false,
};

export const declareOptionalTypes = async (content: string) => {
  if (!loaded.clockwork && CLOCKWORK_REGEX.test(content)) {
    const { loadClockworkTypes } = await import("./packages/clockwork");
    loadClockworkTypes();
    loaded.clockwork = true;
  }

  if (!loaded.metaplex && METAPLEX_REGEX.test(content)) {
    const { loadMetaplexTypes } = await import("./packages/metaplex");
    loadMetaplexTypes();
    loaded.metaplex = true;
  }

  if (!loaded.splToken && SPL_TOKEN_REGEX.test(content)) {
    const { loadSplTokenTypes } = await import("./packages/spl-token");
    loadSplTokenTypes();
    loaded.splToken = true;
  }
};
