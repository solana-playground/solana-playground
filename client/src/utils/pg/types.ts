export type PgMethod<T> = {
  [U in keyof T]?: T[U] extends (...args: any[]) => any ? Parameters<T[U]> : [];
};

export type PgReturnType<T, U> = U extends keyof T
  ? T[U] extends (...args: any[]) => any
    ? Awaited<ReturnType<T[U]>>
    : T[U]
  : never;

export type TupleString = [string, string];

export type PgDisposable = {
  /** Clear registered events */
  dispose: () => void;
};

export type SetElementAsync =
  | JSX.Element
  | ((El: JSX.Element) => JSX.Element)
  | (() => Promise<JSX.Element>);

export type PgSet<T> = T | ((cur: T) => T);
