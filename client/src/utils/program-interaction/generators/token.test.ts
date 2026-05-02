// @ts-nocheck

import assert from "node:assert/strict";
import test from "node:test";

import {
  getOrInitOwnedTokenAccounts,
  normalizeOwnedTokenAccounts,
  OwnedTokenAccountsCache,
  OwnedTokenAccountsData,
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

test("normalizeOwnedTokenAccounts derives token and mint suggestions", () => {
  const normalized = normalizeOwnedTokenAccounts([
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
  assert.deepEqual(normalized.mintAccounts, [
    { address: "mint-1" },
    { address: "mint-2" },
  ]);
});

test("OwnedTokenAccountsCache reuses fresh entries and refreshes expired ones", async () => {
  const cache = new OwnedTokenAccountsCache(30);

  let fetchCount = 0;
  const fetcher = async (): Promise<OwnedTokenAccountsData> => {
    fetchCount += 1;
    return {
      tokenAccounts: [
        {
          address: `token-${fetchCount}`,
          mint: `mint-${fetchCount}`,
          amount: fetchCount.toString(),
        },
      ],
      mintAccounts: [{ address: `mint-${fetchCount}` }],
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
    mintAccounts: [{ address: "mint-2" }],
  });
});

test("OwnedTokenAccountsCache reuses the same in-flight fetch", async () => {
  const cache = new OwnedTokenAccountsCache(30);

  let fetchCount = 0;
  let resolveFetch!: (value: OwnedTokenAccountsData) => void;
  const fetcher = () => {
    fetchCount += 1;
    return new Promise<OwnedTokenAccountsData>((resolve) => {
      resolveFetch = resolve;
    });
  };

  const firstPromise = cache.getOrInit("devnet:owner", fetcher, 200);
  const secondPromise = cache.getOrInit("devnet:owner", fetcher, 200);

  assert.equal(fetchCount, 1);

  const expected = {
    tokenAccounts: [{ address: "token-1", mint: "mint-1", amount: "1" }],
    mintAccounts: [{ address: "mint-1" }],
  };
  resolveFetch(expected);

  assert.deepEqual(await firstPromise, expected);
  assert.deepEqual(await secondPromise, expected);
});

test("getOrInitOwnedTokenAccounts returns an empty result without cluster or owner", async () => {
  let fetchCount = 0;

  const accounts = await getOrInitOwnedTokenAccounts({
    cluster: null,
    owner: null,
    fetchAccounts: async () => {
      fetchCount += 1;
      return [];
    },
  });

  assert.equal(fetchCount, 0);
  assert.deepEqual(accounts, {
    tokenAccounts: [],
    mintAccounts: [],
  });
});
