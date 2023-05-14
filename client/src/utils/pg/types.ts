export type PgMethod<T> = {
  [U in keyof T]?: T[U] extends (...args: any[]) => any ? Parameters<T[U]> : [];
};

export type PgReturnType<T, U> = U extends keyof T
  ? T[U] extends (...args: any[]) => any
    ? Awaited<ReturnType<T[U]>>
    : T[U]
  : never;

/** Create tuples with the same element type */
export type Tuple<
  T,
  L extends number,
  R extends unknown[] = []
> = R["length"] extends L ? R : Tuple<T, L, [T, ...R]>;

/** Tuple double string */
export type TupleString = [string, string];

/** Map union to tuple */
export type UnionToTuple<U> = UnionReturnType<
  U extends never ? never : (union: U) => U
> extends (_: never) => infer R
  ? [...UnionToTuple<Exclude<U, R>>, R]
  : [];

type UnionReturnType<U> = (
  U extends never ? never : (union: U) => never
) extends (ret: infer R) => never
  ? R
  : never;

export type PgDisposable = {
  /** Clear registered events */
  dispose: () => void;
};

export type SetElementAsync =
  | JSX.Element
  | ((El: JSX.Element) => JSX.Element)
  | (() => Promise<JSX.Element>);

export type PgSet<T> = T | ((cur: T) => T);

/** Make properties required for depth 1 and 2 */
export type NestedRequired<T> = {
  [K in keyof T]-?: Required<T[K]>;
};

/** Make properties required for depth 2 */
export type ChildRequired<
  T,
  K extends keyof T = keyof T,
  K2 extends keyof NonNullable<T[K]> = NonNullable<keyof T[K]>
> = {
  [P in K]: {
    [P2 in K2]-?: NonNullable<T[K]>[K2];
  };
};

/** Makes every prop required until `U` */
export type RequiredUntil<T, U> = T extends U
  ? { [K in keyof T]: T[K] }
  : {
      [K in keyof T]-?: RequiredUntil<T[K], U>;
    };

/** Make all properties required recursively */
export type AllRequired<T> = {
  [K in keyof T]-?: AllRequired<T[K]>;
};

/** Noop function type */
export type Fn = () => void;

/** Normal or `Promise` version of the type */
export type SyncOrAsync<T> = T | Promise<T>;
