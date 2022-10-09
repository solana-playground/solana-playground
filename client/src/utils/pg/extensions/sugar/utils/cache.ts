import { findCandyMachineCreatorPda, Option } from "@metaplex-foundation/js";
import { ConfigLine } from "@metaplex-foundation/mpl-candy-machine";
import { PublicKey } from "@solana/web3.js";

import { PgCommon } from "../../../common";
import { PgExplorer } from "../../../explorer";

class CandyCache {
  program: CacheProgram;
  items: CacheItems;

  constructor(cache?: CandyCache) {
    if (cache) {
      this.program = cache.program;
      this.items = cache.items;
    } else {
      this.program = new CacheProgram();
      this.items = {};
    }
  }

  async writeToFile(path: string) {
    await PgExplorer.run({
      newItem: [path, PgCommon.prettyJSON(this)],
    });
  }

  async syncFile(open?: boolean) {
    await PgExplorer.run({
      newItem: [
        PgExplorer.PATHS.CANDY_MACHINE_CACHE_FILEPATH,
        PgCommon.prettyJSON(this),
        { dontOpen: !open, override: true },
      ],
    });
  }

  updateItemAtIndex(index: number, newValue: Partial<CacheItem>) {
    this.items[index].update(newValue);
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

  update(newValue: Partial<CacheItem>) {
    if (newValue.name !== undefined) {
      this.name = newValue.name;
    }
    if (newValue.image_hash !== undefined) {
      this.image_hash = newValue.image_hash;
    }
    if (newValue.image_link !== undefined) {
      this.image_link = newValue.image_link;
    }
    if (newValue.metadata_hash !== undefined) {
      this.metadata_hash = newValue.metadata_hash;
    }
    if (newValue.metadata_link !== undefined) {
      this.metadata_link = newValue.metadata_link;
    }
    if (newValue.onChain !== undefined) {
      this.onChain = newValue.onChain;
    }
    if (newValue.animation_hash !== undefined) {
      this.animation_hash = newValue.animation_hash;
    }
    if (newValue.animation_link !== undefined) {
      this.animation_link = newValue.animation_link;
    }
  }
}

export const loadCache = async () => {
  const cacheFile = await PgExplorer.run({
    getFileContent: [PgExplorer.PATHS.CANDY_MACHINE_CACHE_FILEPATH],
  });
  if (!cacheFile) {
    // Cache file doesn't exist, return default
    return new CandyCache();
  }

  return new CandyCache(JSON.parse(cacheFile));
};
