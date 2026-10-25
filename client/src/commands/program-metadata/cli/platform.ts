export type Console = Pick<typeof import("console"), "log" | "table">;
export let console: Console;
export const setConsole = (v: Console) => (console = v);

export type Fs = Pick<
  typeof import("fs/promises"),
  "readFile" | "writeFile" | "mkdir"
> & { exists: (path: string) => Promise<boolean> };
export let fs: Fs;
export const setFs = (v: Fs) => (fs = v);

export type Os = Pick<typeof import("os"), "homedir">;
export let os: Os;
export const setOs = (v: Os) => (os = v);

export type Path = Pick<typeof import("path"), "dirname" | "extname" | "join">;
export let path: Path;
export const setPath = (v: Path) => (path = v);
