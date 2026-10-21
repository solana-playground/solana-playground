/** Get the keys of `T` (strings) */
export type KeyOf<T> = Extract<keyof T, string>;

/** Get value of the given object */
export type ValueOf<T extends object> = T[keyof T];

/** Method parameters of the given object */
export type MethodParameters<T> = {
  [K in keyof T]?: T[K] extends (...args: any[]) => any ? Parameters<T[K]> : [];
};

/** Convert the return types of the methods of the object to `Promise` */
export type ToAsyncMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R
    ? (...args: Parameters<T[K]>) => Promise<Awaited<R>>
    : never;
};

/** Return type of the methods of an object */
export type ClassReturnType<T, K> = K extends keyof T
  ? T[K] extends (...args: any[]) => any
    ? Awaited<ReturnType<T[K]>>
    : T[K]
  : never;

/** Create tuples with the same element type */
export type Tuple<
  T,
  L extends number,
  R extends unknown[] = []
> = R["length"] extends L ? R : Tuple<T, L, [T, ...R]>;

/** Map union to tuple */
export type UnionToTuple<U> = MergeUnion<
  U extends never ? never : (union: U) => U
> extends (_: never) => infer R
  ? [...UnionToTuple<Exclude<U, R>>, R]
  : [];

/** Merge union */
export type MergeUnion<U> = (
  U extends unknown ? (arg: U) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

/** An object that can be disposed */
export type Disposable = {
  /** Dispose; clear all listeners */
  dispose: () => void;
};

/** Set state type */
export type SetState<T> = T | ((cur: T) => T);

/** Make the given keys required */
export type RequiredKey<T, P extends string> = [P] extends [never]
  ? T
  : MergeUnion<P extends unknown ? RequiredKeyInner<T, P> : never>;

/** Recursively get the inner keys (paths) */
type RequiredKeyInner<T, P extends string> = T extends unknown
  ? P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? Omit<T, K> & {
          [P in K]-?: RequiredKeyInner<NonNullable<T[K]>, Rest>;
        }
      : T
    : P extends keyof T
    ? Omit<T, P> & {
        [K in P]-?: NonNullable<T[K]>;
      }
    : T
  : never;

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

/** Make all properties required recursively */
export type AllRequired<T> = {
  [K in keyof T]-?: AllRequired<T[K]>;
};

/** Make all properties partial recursively */
export type AllPartial<T> = {
  [K in keyof T]?: T[K] extends object ? AllPartial<T[K]> : T[K];
};

/** Noop function type */
export type Fn = () => void;

/** Normal or `Promise` version of the type */
export type SyncOrAsync<T = unknown> = T | Promise<T>;

/** A `Promise` or a callback that returns a `Promise` */
export type Promisable<T> = Getable<SyncOrAsync<T>>;

/** Make every property (... | null) */
export type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

/** Single type, or array of the same type */
export type Arrayable<T> = T | T[];

/** Property or a function to get the property */
export type Getable<T> = T | (() => T);

/** Given type `T` or `string` with intellisense for the initial type */
export type OrString<T> = T | (string & {});

/** Property accessor (`"outer.inner"` is the same as `["outer", "inner"]`) */
export type Accessor = Arrayable<string>;

/** Types that can be converted to an `Element` */
export type Elementable<
  P extends Record<string, unknown> = Record<string, unknown>,
  R extends JSX.Element | null = JSX.Element | null
> = R | ((props: P & { children?: R }) => R);

/** Add optional `React.DependencyList` for parameters */
export type WithOptionalDependencyList<T extends unknown[]> =
  | T
  | [...T, React.DependencyList];
