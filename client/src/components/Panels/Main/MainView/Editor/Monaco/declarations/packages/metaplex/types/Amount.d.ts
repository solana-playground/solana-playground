import { BigNumber, BigNumberValues } from './BigNumber';
export declare type Amount<T extends Currency = Currency> = {
    basisPoints: BigNumber;
    currency: T;
};
export declare type Currency = {
    symbol: string;
    decimals: number;
    namespace?: 'spl-token';
};
export declare type SplTokenCurrency = {
    symbol: string;
    decimals: number;
    namespace: 'spl-token';
};
export declare type SplTokenAmount = Amount<SplTokenCurrency>;
/** @group Constants */
export declare const SOL: {
    readonly symbol: "SOL";
    readonly decimals: 9;
};
export declare type SolCurrency = typeof SOL;
export declare type SolAmount = Amount<SolCurrency>;
/** @group Constants */
export declare const USD: {
    readonly symbol: "USD";
    readonly decimals: 2;
};
export declare type UsdCurrency = typeof USD;
export declare type UsdAmount = Amount<UsdCurrency>;
export declare const amount: <T extends Currency = Currency>(basisPoints: BigNumberValues, currency: T) => Amount<T>;
export declare const lamports: (lamports: BigNumberValues) => SolAmount;
export declare const sol: (sol: number) => SolAmount;
export declare const usd: (usd: number) => UsdAmount;
export declare const token: (amount: BigNumberValues, decimals?: number, symbol?: string) => SplTokenAmount;
export declare const isSol: (currencyOrAmount: Currency | Amount) => boolean;
export declare const sameAmounts: (left: Amount, right: Amount) => boolean;
export declare const sameCurrencies: (left: Currency | Amount, right: Currency | Amount) => boolean;
export declare function assertCurrency<T extends Currency>(actual: Currency, expected: T): asserts actual is T;
export declare function assertCurrency<T extends Currency>(actual: Amount, expected: T): asserts actual is Amount<T>;
export declare function assertCurrency<T extends Currency>(actual: Currency | Amount, expected: T): asserts actual is T | Amount<T>;
export declare function assertSol(actual: Amount): asserts actual is SolAmount;
export declare function assertSol(actual: Currency): asserts actual is SolCurrency;
export declare function assertSol(actual: Currency | Amount): asserts actual is SolCurrency | SolAmount;
export declare function assertSameCurrencies<L extends Currency, R extends Currency>(left: L | Amount<L>, right: R | Amount<R>, operation?: string): void;
export declare const addAmounts: <T extends Currency>(left: Amount<T>, right: Amount<T>) => Amount<T>;
export declare const subtractAmounts: <T extends Currency>(left: Amount<T>, right: Amount<T>) => Amount<T>;
export declare const multiplyAmount: <T extends Currency>(left: Amount<T>, multiplier: number) => Amount<T>;
export declare const divideAmount: <T extends Currency>(left: Amount<T>, divisor: number) => Amount<T>;
export declare const absoluteAmount: <T extends Currency>(value: Amount<T>) => Amount<T>;
export declare const compareAmounts: <T extends Currency>(left: Amount<T>, right: Amount<T>) => -1 | 0 | 1;
export declare const isEqualToAmount: <T extends Currency>(left: Amount<T>, right: Amount<T>, tolerance?: Amount<T> | undefined) => boolean;
export declare const isLessThanAmount: <T extends Currency>(left: Amount<T>, right: Amount<T>) => boolean;
export declare const isLessThanOrEqualToAmount: <T extends Currency>(left: Amount<T>, right: Amount<T>) => boolean;
export declare const isGreaterThanAmount: <T extends Currency>(left: Amount<T>, right: Amount<T>) => boolean;
export declare const isGreaterThanOrEqualToAmount: <T extends Currency>(left: Amount<T>, right: Amount<T>) => boolean;
export declare const isZeroAmount: (value: Amount) => boolean;
export declare const isPositiveAmount: (value: Amount) => boolean;
export declare const isNegativeAmount: (value: Amount) => boolean;
export declare const formatAmount: (value: Amount) => string;
