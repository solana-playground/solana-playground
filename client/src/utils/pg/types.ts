export type PgMethod<T> = {
  [U in keyof T]?: T[U] extends (...args: any[]) => any ? Parameters<T[U]> : [];
};

export type PgReturnType<T, U> = U extends keyof T
  ? T[U] extends (...args: any[]) => any
    ? Awaited<ReturnType<T[U]>>
    : T[U]
  : never;

export type TupleString = [string, string];
