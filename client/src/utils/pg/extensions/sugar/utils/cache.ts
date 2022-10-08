import { findCandyMachineCreatorPda, Option } from "@metaplex-foundation/js";
import { ConfigLine } from "@metaplex-foundation/mpl-candy-machine";
import { PublicKey } from "@solana/web3.js";

import { PgCommon } from "../../../common";
import { PgExplorer } from "../../../explorer";

class CandyCache {
  program: CacheProgram;
  items: CacheItems;
  filePath: string;

  constructor(cache?: CandyCache) {
    if (cache) {
      this.program = cache.program;
      this.items = cache.items;
      this.filePath = cache.filePath;
    } else {
      this.program = new CacheProgram();
      this.items = {};
      this.filePath = PgExplorer.PATHS.CANDY_MACHINE_CACHE_FILEPATH;
    }
  }

  async writeToFile(path: string) {
    await PgExplorer.run({
      newItem: [path, PgCommon.prettyJSON(this)],
    });
  }

  async syncFile() {
    await PgExplorer.run({
      newItem: [this.filePath, PgCommon.prettyJSON(this), { override: true }],
    });
  }
}

class CacheProgram {
  candyMachine: string;
  candyMachineCreator: string;
  collectionMint: string;

  constructor(candyMachinePk?: PublicKey) {
    if (candyMachinePk) {
      this.candyMachine = candyMachinePk.toBase58();
      this.candyMachineCreator =
        findCandyMachineCreatorPda(candyMachinePk).toBase58();
      this.collectionMint = "";
    } else {
      this.candyMachine = "";
      this.candyMachineCreator = "";
      this.collectionMint = "";
    }
  }
}

type CacheItems = { [key: string]: CacheItem };

// NOTE: These snake case names are standart metaplex names
export class CacheItem {
  name: string;
  image_hash: string;
  image_link: string;
  metadata_hash: string;
  metadata_link: string;
  onChain: boolean;
  animation_hash?: string;
  animation_link?: string;

  constructor(
    name: string,
    imageHash: string,
    imageLink: string,
    metadataHash: string,
    metadataLink: string,
    onChain: boolean,
    animationHash?: string,
    animationLink?: string
  ) {
    this.name = name;
    this.image_hash = imageHash;
    this.image_link = imageLink;
    this.metadata_hash = metadataHash;
    this.metadata_link = metadataLink;
    this.onChain = onChain;
    this.animation_hash = animationHash;
    this.animation_link = animationLink;
  }

  toConfigLine(): Option<ConfigLine> {
    if (!this.onChain) {
      return { name: this.name, uri: this.metadata_link };
    } else {
      return null;
    }
  }
}

export const loadCache = async () => {
  const cacheFile = await PgExplorer.run({
    getFileContent: [PgExplorer.PATHS.CANDY_MACHINE_CACHE_FILEPATH],
  });
  if (!cacheFile) {
    // Cache file doesn't exist, create it
    return new CandyCache();
  }

  return new CandyCache(JSON.parse(cacheFile));
};
