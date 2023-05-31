/** Methods of the given object */
export type Methods<T> = {
  [U in keyof T]?: T[U] extends (...args: any[]) => any ? Parameters<T[U]> : [];
};

/** Return type of the methods of an object */
export type ClassReturnType<T, U> = U extends keyof T
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
export type TupleString = Tuple<string, 2>;

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

export type Disposable = {
  /** Clear registered events */
  dispose: () => void;
};

export type SetElementAsync =
  | JSX.Element
  | ((El: JSX.Element) => JSX.Element)
  | (() => Promise<JSX.Element>);

export type SetState<T> = T | ((cur: T) => T);

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

/** Make all properties readonly recursively */
export type AllReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? AllReadonly<T[K]> : T[K];
};

/** Make all properties partial recursively */
export type AllPartial<T> = {
  [K in keyof T]?: T[K] extends object ? AllPartial<T[K]> : T[K];
};

/** Get object with only optional key-values */
export type OnlyOptional<T> = {
  [K in OptionalKeys<T>]?: OnlyOptional<NonNullable<T[K]>>;
};

/** Get optional property keys */
type OptionalKeys<T> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? never : K;
  }[keyof T],
  undefined
>;

/** Noop function type */
export type Fn = () => void;

/** Normal or `Promise` version of the type */
export type SyncOrAsync<T> = T | Promise<T>;

/** A `Promise` or a callback that returns a `Promise` */
export type Promisable<T> = SyncOrAsync<T> | (() => SyncOrAsync<T>);

/** Make every property (... | null) */
export type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

/** Single type, or array of the same type */
export type Arrayable<T> = T | T[];
