// @ts-nocheck

import assert from "node:assert/strict";
import test from "node:test";

import {
  getMintAccounts,
  getTokenAccounts,
  normalizeTokenAccounts,
  TokenAccountsCache,
  TokenAccountsData,
} from "./token";

const createPubkey = (value: string) => ({
  toBase58: () => value,
});

const createParsedTokenAccount = (
  address: string,
  mint: string,
  amount: string,
  type: string = "account"
) => ({
  pubkey: createPubkey(address),
  account: {
    data: {
      parsed: {
        type,
        info: {
          mint,
          tokenAmount: {
            amount,
            uiAmountString: amount,
          },
        },
      },
    },
  },
});

test("normalizeTokenAccounts derives token and mint suggestions", () => {
  const normalized = normalizeTokenAccounts([
    createParsedTokenAccount("token-b", "mint-2", "2"),
    createParsedTokenAccount("token-c", "mint-1", "3"),
    createParsedTokenAccount("ignored", "mint-3", "1", "mint"),
    createParsedTokenAccount("token-a", "mint-1", "1"),
  ]);

  assert.deepEqual(normalized.tokenAccounts, [
    { address: "token-a", mint: "mint-1", amount: "1" },
    { address: "token-c", mint: "mint-1", amount: "3" },
    { address: "token-b", mint: "mint-2", amount: "2" },
  ]);
  assert.deepEqual(normalized.mintAccounts, ["mint-1", "mint-2"]);
});

test("TokenAccountsCache reuses fresh entries and refreshes expired ones", async () => {
  const cache = new TokenAccountsCache(30);

  let fetchCount = 0;
  const fetcher = async (): Promise<TokenAccountsData> => {
    fetchCount += 1;
    return {
      tokenAccounts: [
        {
          address: `token-${fetchCount}`,
          mint: `mint-${fetchCount}`,
          amount: fetchCount.toString(),
        },
      ],
      mintAccounts: [`mint-${fetchCount}`],
    };
  };

  const first = await cache.getOrInit("devnet:owner", fetcher, 100);
  const second = await cache.getOrInit("devnet:owner", fetcher, 120);
  const third = await cache.getOrInit("devnet:owner", fetcher, 131);

  assert.equal(fetchCount, 2);
  assert.equal(second, first);
  assert.notEqual(third, first);
  assert.deepEqual(third, {
    tokenAccounts: [{ address: "token-2", mint: "mint-2", amount: "2" }],
    mintAccounts: ["mint-2"],
  });
});

test("TokenAccountsCache reuses the same in-flight fetch", async () => {
  const cache = new TokenAccountsCache(30);

  let fetchCount = 0;
  let resolveFetch!: (value: TokenAccountsData) => void;
  const fetcher = () => {
    fetchCount += 1;
    return new Promise<TokenAccountsData>((resolve) => {
      resolveFetch = resolve;
    });
  };

  const firstPromise = cache.getOrInit("devnet:owner", fetcher, 200);
  const secondPromise = cache.getOrInit("devnet:owner", fetcher, 200);

  assert.equal(fetchCount, 1);

  const expected = {
    tokenAccounts: [{ address: "token-1", mint: "mint-1", amount: "1" }],
    mintAccounts: ["mint-1"],
  };
  resolveFetch(expected);

  assert.deepEqual(await firstPromise, expected);
  assert.deepEqual(await secondPromise, expected);
});

test("getTokenAccounts returns an empty result without cluster or owner", async () => {
  let fetchCount = 0;

  const accounts = await getTokenAccounts({
    cluster: null,
    owner: null,
    fetchAccounts: async () => {
      fetchCount += 1;
      return [];
    },
  });

  assert.equal(fetchCount, 0);
  assert.deepEqual(accounts, []);
});

test("getTokenAccounts and getMintAccounts share the same cached fetch", async () => {
  let fetchCount = 0;
  const cache = new TokenAccountsCache(30);

  const fetchAccounts = async () => {
    fetchCount += 1;
    return [
      createParsedTokenAccount("token-b", "mint-2", "2"),
      createParsedTokenAccount("token-a", "mint-1", "1"),
    ];
  };

  const owner = createPubkey("owner");
  const tokenAccounts = await getTokenAccounts({
    cluster: "devnet",
    owner,
    fetchAccounts,
    cache,
    now: 100,
  });
  const mintAccounts = await getMintAccounts({
    cluster: "devnet",
    owner,
    fetchAccounts,
    cache,
    now: 100,
  });

  assert.equal(fetchCount, 1);
  assert.deepEqual(tokenAccounts, [
    { address: "token-a", mint: "mint-1", amount: "1" },
    { address: "token-b", mint: "mint-2", amount: "2" },
  ]);
  assert.deepEqual(mintAccounts, ["mint-1", "mint-2"]);
});
