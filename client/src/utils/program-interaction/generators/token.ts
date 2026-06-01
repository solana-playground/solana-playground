import { PgCommon } from "../../common";
import type { PgWeb3 } from "../../web3";

/** A single SPL token account owned by the current wallet */
export interface TokenAccount {
  address: string;
  mint: string;
  amount: string;
}

/** Token accounts and the unique mints derived from them */
export interface TokenAccountsData {
  tokenAccounts: TokenAccount[];
  mintAccounts: string[];
}

type ParsedTokenAccounts = Awaited<
  ReturnType<PgWeb3.Connection["getParsedTokenAccountsByOwner"]>
>["value"];

type CacheEntry = {
  data?: TokenAccountsData;
  timestamp?: number;
  promise?: Promise<TokenAccountsData> | null;
};

/** Token and Token-2022 program ids to fetch accounts from */
const TOKEN_PROGRAM_IDS = [
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
];

/** Number of seconds to keep fetched token accounts before refetching */
const CACHE_TTL = 30;

const EMPTY_TOKEN_ACCOUNTS: TokenAccountsData = {
  tokenAccounts: [],
  mintAccounts: [],
};

/** Fetched token accounts keyed by `cluster:owner` */
const tokenAccountsCache: Record<string, CacheEntry> = {};

let isInvalidationListenerSet = false;

/** Remove all cached token accounts. */
const clearTokenAccountsCache = () => {
  for (const key in tokenAccountsCache) delete tokenAccountsCache[key];
};

/** Invalidate the cache when a transaction is sent (registers only once). */
const setInvalidationListener = async () => {
  if (isInvalidationListenerSet) return;
  isInvalidationListenerSet = true;

  const { PgTx } = await import("../../tx");
  PgTx.onDidSend(clearTokenAccountsCache);
};

/** Fetch the current wallet's Token and Token-2022 accounts. */
const fetchTokenAccounts = async (
  owner: PgWeb3.PublicKey
): Promise<ParsedTokenAccounts> => {
  const [{ PgConnection }, { PgWeb3 }] = await Promise.all([
    import("../../connection"),
    import("../../web3"),
  ]);

  const connection = PgConnection.current;
  const results = await Promise.all(
    TOKEN_PROGRAM_IDS.map((programId) =>
      connection.getParsedTokenAccountsByOwner(owner, {
        programId: new PgWeb3.PublicKey(programId),
      })
    )
  );

  return results.flatMap((result) => result.value);
};

/** Derive sorted token accounts and unique mints from parsed accounts. */
const normalizeTokenAccounts = (
  accounts: ParsedTokenAccounts
): TokenAccountsData => {
  const tokenAccounts: TokenAccount[] = [];
  const mints = new Set<string>();

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

    tokenAccounts.push({
      address: account.pubkey.toBase58(),
      mint,
      amount:
        parsed.info?.tokenAmount?.uiAmountString ??
        parsed.info?.tokenAmount?.amount ??
        "",
    });
    mints.add(mint);
  }

  tokenAccounts.sort(
    (left, right) =>
      left.mint.localeCompare(right.mint) ||
      left.address.localeCompare(right.address)
  );
  const mintAccounts = [...mints].sort((left, right) =>
    left.localeCompare(right)
  );

  return { tokenAccounts, mintAccounts };
};

/** Get or fetch the wallet's token accounts, cached per cluster/owner. */
const getOrInitTokenAccounts = async (): Promise<TokenAccountsData> => {
  const [{ PgConnection }, { PgWallet }] = await Promise.all([
    import("../../connection"),
    import("../../wallet"),
  ]);

  const cluster = PgConnection.cluster;
  const owner = PgWallet.current?.publicKey ?? null;
  if (!cluster || !owner) return EMPTY_TOKEN_ACCOUNTS;

  setInvalidationListener();

  const entry = (tokenAccountsCache[`${cluster}:${owner.toBase58()}`] ??= {});

  const now = PgCommon.getUnixTimstamp();
  if (
    entry.data &&
    entry.timestamp !== undefined &&
    now <= entry.timestamp + CACHE_TTL
  ) {
    return entry.data;
  }

  if (entry.promise) return await entry.promise;

  entry.promise = (async () => {
    try {
      const data = normalizeTokenAccounts(await fetchTokenAccounts(owner));
      entry.data = data;
      entry.timestamp = PgCommon.getUnixTimstamp();
      return data;
    } finally {
      entry.promise = null;
    }
  })();

  return await entry.promise;
};

/** Get the current wallet's token accounts for the connected cluster. */
export const getTokenAccounts = async () => {
  return (await getOrInitTokenAccounts()).tokenAccounts;
};

/** Get the unique mints from the current wallet's token accounts. */
export const getMintAccounts = async () => {
  return (await getOrInitTokenAccounts()).mintAccounts;
};
