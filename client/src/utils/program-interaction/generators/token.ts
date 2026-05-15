import type { Connection, PublicKey } from "@solana/web3.js";

import type { Cluster } from "../../connection";

export interface TokenAccount {
  address: string;
  mint: string;
  amount: string;
}

export interface TokenAccountsData {
  tokenAccounts: TokenAccount[];
  mintAccounts: string[];
}

type ParsedTokenAccounts = Awaited<
  ReturnType<Connection["getParsedTokenAccountsByOwner"]>
>["value"];

type GetTokenAccountsParams = {
  cluster?: Cluster | null;
  owner?: PublicKey | null;
  fetchAccounts?: () => Promise<ParsedTokenAccounts>;
  cache?: TokenAccountsCache;
  now?: number;
};

type CacheEntry = {
  data?: TokenAccountsData;
  timestamp?: number;
  promise?: Promise<TokenAccountsData>;
};

const EMPTY_TOKEN_ACCOUNTS: TokenAccountsData = {
  tokenAccounts: [],
  mintAccounts: [],
};

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const DEFAULT_CACHE_TTL = 30;

const getNow = () => Math.floor(Date.now() / 1000);

export class TokenAccountsCache {
  private readonly _entries: Record<string, CacheEntry> = {};

  constructor(private readonly _ttlSeconds = DEFAULT_CACHE_TTL) {}

  get(key: string) {
    return this._entries[key]?.data ?? EMPTY_TOKEN_ACCOUNTS;
  }

  async getOrInit(
    key: string,
    fetcher: () => Promise<TokenAccountsData>,
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

const tokenAccountsCache = new TokenAccountsCache();

export const normalizeTokenAccounts = (
  accounts: ParsedTokenAccounts
): TokenAccountsData => {
  const tokenAccounts: TokenAccount[] = [];
  const mintAccounts: string[] = [];
  const seenMints = new Set<string>();

  for (const account of accounts) {
    const parsed = account.account.data.parsed as {
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
    mintAccounts.push(mint);
  }

  tokenAccounts.sort(
    (left, right) =>
      left.mint.localeCompare(right.mint) ||
      left.address.localeCompare(right.address)
  );
  mintAccounts.sort((left, right) => left.localeCompare(right));

  return { tokenAccounts, mintAccounts };
};

const getOrInitTokenAccounts = async (params?: GetTokenAccountsParams) => {
  let {
    cluster,
    owner,
    fetchAccounts,
    cache = tokenAccountsCache,
  } = params ?? {};

  if (cluster === undefined || owner === undefined || !fetchAccounts) {
    const [{ PgConnection }, { PgWallet }, { PgWeb3 }] = await Promise.all([
      import("../../connection"),
      import("../../wallet"),
      import("../../web3"),
    ]);

    cluster ??= PgConnection.cluster;
    owner ??= PgWallet.current?.publicKey ?? null;
    fetchAccounts ??= async () => {
      if (!owner) return [];

      const accounts = await PgConnection.current.getParsedTokenAccountsByOwner(
        owner,
        { programId: new PgWeb3.PublicKey(TOKEN_PROGRAM_ID) }
      );
      return accounts.value;
    };
  }

  if (!cluster || !owner || !fetchAccounts) return EMPTY_TOKEN_ACCOUNTS;

  const loadAccounts = fetchAccounts;

  return await cache.getOrInit(
    `${cluster}:${owner.toBase58()}`,
    async () => normalizeTokenAccounts(await loadAccounts()),
    params?.now
  );
};

export const getTokenAccounts = async (params?: GetTokenAccountsParams) => {
  return (await getOrInitTokenAccounts(params)).tokenAccounts;
};

export const getMintAccounts = async (params?: GetTokenAccountsParams) => {
  return (await getOrInitTokenAccounts(params)).mintAccounts;
};
