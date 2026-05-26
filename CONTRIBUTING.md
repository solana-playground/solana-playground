# Contribution Guidelines

Thank you for your interest in contributing to Solana Playground! These guidelines will help ensure a smooth contribution process.

These are not rules, but following them will greatly improve the chances of getting your PR merged in the shortest time possible.

## General

### Size

- Prefer smaller PRs over large ones
- If making a large PR (large in terms of effort), create an issue about it first

### Title

- Try to write clear, present-tense commit messages (e.g. "Add feature" not "added feature")
- Prefix the commit message with the change location (e.g. for server, use "server: Add feature" not "feat(server): add feature")
- If making a client PR, do not add any prefix to messages (e.g. "Add feature" not "client: Add feature")

### Description

- Briefly mention the problem you're solving
- Summarize the important changes
- Keep the description concise (no slop)

### Testing

- Test your changes locally before making a PR
- Adding test code is not required
- Only include tests that you think is useful, not just for the sake of adding a test

### LLM

If you're using LLMs, make sure to understand the changes you're making.

## Code styles

Try to follow the existing styles.

### General

- Prefer inlining over creating a new function (if the function is used only once)
- Order functions based on importance and usage order (i.e. the main function at the top, the last function to call at the bottom)
- Prefer no new dependency when feasible
- Avoid too much duplication
- Do not use non-[ASCII](https://en.wikipedia.org/wiki/ASCII) characters (e.g. emojis) in source code (fine for MarkDown)

### TypeScript

- Follow general JS/TS conventions (e.g. casing, 80 char limit, 2 whitespace indentation; these are checked in CI)
- Avoid disabling TS checks with things like `any` and `// @ts-ignore`
- Avoid importing `@solana/web3.js` directly (use `PgWeb3` instead)
- Avoid importing Anchor package(s) directly (WIP to reduce dependence)
- Prefer `react external internal` import order (with an extra newline between `external` and `internal`)
- Prefer `import type` for types
- Prefer default exports for React components and named exports for everything else
- Prefer lazy loading for big imports
- Prefer functional programming over [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming) (no inheritence)
- Prefer constant functions `const f = () => {}` over regular `function f() {}`
- Prefer at most 1 optional function parameter (if multiple, use a single object parameter for all optionals `opts?: {...}`)
- Prefer less than 4 function parameters (create an object parameter(s) instead)
- Prefer verb + object naming convention for functions (e.g. `doSomething`)
- Prefer a single function definition without overrides
- Prefer `async/await/try/catch/finally` over `Promise/then/catch/finally`
- Prefer `null` over `undefined` when setting or passing a value
- Prefer omitting `undefined` over explicitly setting or passing
- Prefer using `index.ts` files for import/export logic only
- Prefer not creating a new scope (`{ ... }`) for single statements if it fits into a single line (create a new scope if it doesn't fit)
- Prefer explicit returns inside closures if the implicit return results in an indented statement in the next line
- Add TSDoc comments to all outer definitions in `/utils`

### Rust

- Follow general Rust conventions (e.g. casing, 100 char limit, 4 whitespace indentation; these are checked in CI)
