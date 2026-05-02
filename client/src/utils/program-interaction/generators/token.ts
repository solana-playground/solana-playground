export interface OwnedTokenAccount {
  address: string;
  mint: string;
  amount: string;
}

export interface OwnedMintAccount {
  address: string;
}

export interface OwnedTokenAccountsData {
  tokenAccounts: OwnedTokenAccount[];
  mintAccounts: OwnedMintAccount[];
}

export interface ParsedTokenAccountLike {
  pubkey: string | { toBase58(): string };
  account: {
    data?: {
      parsed?: {
        type?: string;
        accountType?: string;
        info?: {
          mint?: string;
          tokenAmount?: {
            amount?: string;
            uiAmountString?: string;
          };
        };
      };
    };
  };
}

type OwnerLike = { toBase58(): string };

type CacheEntry = {
  data?: OwnedTokenAccountsData;
  timestamp?: number;
  promise?: Promise<OwnedTokenAccountsData>;
};

const EMPTY_OWNED_TOKEN_ACCOUNTS: OwnedTokenAccountsData = {
  tokenAccounts: [],
  mintAccounts: [],
};

const DEFAULT_CACHE_TTL = 30;

const getNow = () => Math.floor(Date.now() / 1000);

export class OwnedTokenAccountsCache {
  private readonly _entries: Record<string, CacheEntry> = {};

  constructor(private readonly _ttlSeconds = DEFAULT_CACHE_TTL) {}

  get(key: string) {
    return this._entries[key]?.data ?? EMPTY_OWNED_TOKEN_ACCOUNTS;
  }

  async getOrInit(
    key: string,
    fetcher: () => Promise<OwnedTokenAccountsData>,
    now: number = getNow()
  ) {
    const entry = (this._entries[key] ??= {});

    if (
      entry.data &&
      entry.timestamp !== undefined &&
      now <= entry.timestamp + this._ttlSeconds
    ) {
      return entry.data;
    }

    if (entry.promise) return await entry.promise;

    entry.promise = fetcher()
      .then((data) => {
        entry.data = data;
        entry.timestamp = now;
        entry.promise = undefined;
        return data;
      })
      .catch((error) => {
        entry.promise = undefined;
        throw error;
      });

    return await entry.promise;
  }

  clear(key?: string) {
    if (key) {
      delete this._entries[key];
      return;
    }

    for (const existingKey of Object.keys(this._entries)) {
      delete this._entries[existingKey];
    }
  }
}

const ownedTokenAccountsCache = new OwnedTokenAccountsCache();

export const normalizeOwnedTokenAccounts = (
  accounts: ParsedTokenAccountLike[]
): OwnedTokenAccountsData => {
  const tokenAccounts: OwnedTokenAccount[] = [];
  const mintAccounts: OwnedMintAccount[] = [];
  const seenMints = new Set<string>();

  for (const account of accounts) {
    const parsed = account.account.data?.parsed;
    if (!parsed) continue;

    const parsedType = parsed.type ?? parsed.accountType;
    if (parsedType && parsedType !== "account") continue;

    const mint = parsed.info?.mint;
    if (!mint) continue;

    const address =
      typeof account.pubkey === "string"
        ? account.pubkey
        : account.pubkey.toBase58();

    tokenAccounts.push({
      address,
      mint,
      amount:
        parsed.info?.tokenAmount?.uiAmountString ??
        parsed.info?.tokenAmount?.amount ??
        "",
    });

    if (seenMints.has(mint)) continue;
    seenMints.add(mint);
    mintAccounts.push({ address: mint });
  }

  tokenAccounts.sort(
    (left, right) =>
      left.mint.localeCompare(right.mint) ||
      left.address.localeCompare(right.address)
  );
  mintAccounts.sort((left, right) => left.address.localeCompare(right.address));

  return { tokenAccounts, mintAccounts };
};

export const getOrInitOwnedTokenAccounts = async (params: {
  cluster?: string | null;
  owner?: OwnerLike | null;
  fetchAccounts: () => Promise<ParsedTokenAccountLike[]>;
  cache?: OwnedTokenAccountsCache;
  now?: number;
}) => {
  const {
    cluster,
    owner,
    fetchAccounts,
    cache = ownedTokenAccountsCache,
  } = params;

  if (!cluster || !owner) return EMPTY_OWNED_TOKEN_ACCOUNTS;

  return await cache.getOrInit(
    `${cluster}:${owner.toBase58()}`,
    async () => normalizeOwnedTokenAccounts(await fetchAccounts()),
    params.now
  );
};
