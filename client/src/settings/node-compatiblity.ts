// This file is responsible for making sure `settings.ts` can run in a Node
// environment.
//
// Certain globals, such as `self`, `window` and `indexedDB`, only exist in
// browsers by default. This causes problems when we run `settings.ts` in Node
// environment (via `tsx`) because of how imports work. Essentially, when we
// import from `pg`, all playground libraries get imported and their codes run,
// eventually causing errors such as `ReferenceError: self is not defined`.
//
// Rather than forcing all settings to use specific paths, we just add dummy
// impls here to avoid errors. Since the problematic libraries, such as `xterm`,
// are not going to be used during setting definitions, this shouldn't have any
// adverse effects.
//
// @ts-nocheck

export const IS_NODE = typeof window === "undefined";

if (IS_NODE) {
  const f = () => ({});

  global.self = global;
  global.window = global;
  global.indexedDB = { open: f, onerror: f };
  global.GLOBAL_SETTINGS = { default: {} };
  global.document = { addEventListener: f };
}
