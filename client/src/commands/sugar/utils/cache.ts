import {
  CandyMachineItem,
  Option,
  findCandyMachineV2CreatorPda,
} from "@metaplex-foundation/js";
import { ConfigLine } from "@metaplex-foundation/mpl-candy-machine-core";

import { PgSugar } from "../processor";
import { PgCommon, PgExplorer, PgWeb3 } from "../../../utils/pg";

export class CandyCache {
  program: CacheProgram;
  items: CacheItems;

  constructor(cache?: CandyCache) {
    this.items = {};

    if (cache) {
      this.program = new CacheProgram(cache.program);
      for (const i in cache.items) {
        this.items[i] = new CacheItem(cache.items[i]);
      }
    } else {
      this.program = new CacheProgram();
    }
  }

  async syncFile(onlyRefreshIfAlreadyOpen: boolean = true) {
    await PgExplorer.newItem(
      PgSugar.PATHS.CANDY_MACHINE_CACHE_FILEPATH,
      PgCommon.prettyJSON(this),
      {
        override: true,
        openOptions: { dontOpen: true, onlyRefreshIfAlreadyOpen },
      }
    );
  }

  updateItemAtIndex(index: number, newValue: Partial<CacheItem>) {
    this.items[index].update(newValue);
  }

  removeItemAtIndex(index: number) {
    delete this.items[index];
  }

  isItemsEmpty() {
    return Object.keys(this.items).length === 0;
  }

  getConfigLineChunks() {
    const RAW_TX_LEN = 440;
    const MAX_TX_LEN = 1232;

    const configLineChunks = [];
    let configLines: {
      items: Pick<CandyMachineItem, "name" | "uri">[];
      indices: number[];
    } = {
      items: [],
      indices: [],
    };

    let txLen = RAW_TX_LEN;
    for (const i in this.items) {
      const configLine = this.items[i].toConfigLine();
      if (configLine) {
        const configLineLen = configLine.name.length + configLine.uri.length;
        if (txLen + configLineLen > MAX_TX_LEN) {
          txLen = RAW_TX_LEN + configLineLen;
          configLineChunks.push(configLines);
          configLines = { items: [configLine], indices: [+i] };
        } else {
          txLen += configLineLen;
          configLines.items.push(configLine);
          configLines.indices.push(+i);
        }
      }
    }
    configLineChunks.push(configLines);

    return configLineChunks;
  }
}

class CacheProgram {
  candyMachine: string;
  candyGuard: string;
  candyMachineCreator: string;
  collectionMint: string;

  constructor(cacheProgram?: Omit<CacheProgram, "setCandyMachine">) {
    if (cacheProgram) {
      this.candyMachine = cacheProgram.candyMachine;
      this.candyGuard = cacheProgram.candyGuard;
      this.candyMachineCreator = cacheProgram.candyMachineCreator;
      this.collectionMint = cacheProgram.collectionMint;
    } else {
      this.candyMachine = "";
      this.candyGuard = "";
      this.candyMachineCreator = "";
      this.collectionMint = "";
    }
  }

  setCandyMachine(candyMachinePk: PgWeb3.PublicKey) {
    this.candyMachine = candyMachinePk.toBase58();
    this.candyMachineCreator =
      findCandyMachineV2CreatorPda(candyMachinePk).toBase58();
  }
}

type CacheItems = { [key: string]: CacheItem };

// NOTE: These snake case names are standard metaplex names
export class CacheItem {
  name: string;
  image_hash: string;
  image_link: string;
  metadata_hash: string;
  metadata_link: string;
  onChain: boolean;
  animation_hash?: string;
  animation_link?: string;

  constructor(cacheItem: Omit<CacheItem, "toConfigLine" | "update">) {
    this.name = cacheItem.name;
    this.image_hash = cacheItem.image_hash;
    this.image_link = cacheItem.image_link;
    this.metadata_hash = cacheItem.metadata_hash;
    this.metadata_link = cacheItem.metadata_link;
    this.onChain = cacheItem.onChain;
    this.animation_hash = cacheItem.animation_hash;
    this.animation_link = cacheItem.animation_link;
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
  const cacheFile = PgExplorer.getFileContent(
    PgSugar.PATHS.CANDY_MACHINE_CACHE_FILEPATH
  );
  if (!cacheFile) {
    // Cache file doesn't exist, return default
    return new CandyCache();
  }

  return new CandyCache(JSON.parse(cacheFile));
};
