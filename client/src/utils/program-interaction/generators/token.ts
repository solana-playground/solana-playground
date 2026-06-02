import { PgCommon } from "../../common";
import { PgConnection } from "../../connection";
import { PgTx } from "../../tx";
import { PgWallet } from "../../wallet";
import { PgWeb3 } from "../../web3";

/** A single SPL token account owned by the current wallet */
interface TokenAccount {
  address: string;
  mint: string;
  amount: string;
}

/** Token accounts and the unique mints derived from them */
interface TokenAccountsData {
  tokenAccounts: TokenAccount[];
  mintAccounts: string[];
}

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

/** Get the current wallet's token accounts for the connected cluster. */
export const getTokenAccounts = async () => {
  return (await getOrInitTokenAccounts()).tokenAccounts;
};

/** Get the unique mints from the current wallet's token accounts. */
export const getMintAccounts = async () => {
  return (await getOrInitTokenAccounts()).mintAccounts;
};

/** Get or fetch the wallet's token accounts, cached per cluster/owner. */
const getOrInitTokenAccounts = async () => {
  const cluster = PgConnection.cluster;
  const owner = PgWallet.current?.publicKey ?? null;
  if (!cluster || !owner) return EMPTY_TOKEN_ACCOUNTS;

  setInvalidationListener();

  const entry = (tokenAccountsCache[`${cluster}:${owner.toBase58()}`] ??= {});

  const now = PgCommon.getUnixTimestamp();
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
      const data = await fetchTokenAccounts(owner);
      entry.data = data;
      entry.timestamp = PgCommon.getUnixTimestamp();
      return data;
    } finally {
      entry.promise = null;
    }
  })();

  return await entry.promise;
};

/** Fetch and normalize the current wallet's Token and Token-2022 accounts. */
const fetchTokenAccounts = async (owner: PgWeb3.PublicKey) => {
  const connection = PgConnection.current;
  const results = await Promise.all(
    TOKEN_PROGRAM_IDS.map((programId) =>
      connection.getParsedTokenAccountsByOwner(owner, {
        programId: new PgWeb3.PublicKey(programId),
      })
    )
  );

  const tokenAccounts: TokenAccount[] = [];
  const mints = new Set<string>();

  for (const { account, pubkey } of results.flatMap((result) => result.value)) {
    const parsed = account.data.parsed as {
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
      address: pubkey.toBase58(),
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

/** Remove all cached token accounts. */
const clearTokenAccountsCache = () => {
  for (const key in tokenAccountsCache) delete tokenAccountsCache[key];
};

/** Invalidate the cache when a transaction is sent (registers only once). */
const setInvalidationListener = () => {
  if (isInvalidationListenerSet) return;
  isInvalidationListenerSet = true;

  PgTx.onDidSend(clearTokenAccountsCache);
};
