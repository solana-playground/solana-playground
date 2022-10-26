# Tutorials

Playground now supports tutorials directly inside it with Markdown text or custom React components.

## How to add a tutorial

The easiest way to add a tutorial is with _Markdown_ text.

There are **3** steps for adding a tutorial:

- Fork the repository
- Create a tutorial component
- Add an entry for your tutorial in `tutorials.ts`

You do **NOT** need to know anything about the playground codebase.

### 1. Fork the repository

Fork the playground repository on Github and [run locally](https://github.com/solana-playground/solana-playground/blob/master/README.md#run-locally).

### 2. Create a tutorial component

There is a ready to use template component in `./Template`. You can copy the entire directory and change it based on your needs. Component lives in `Template.tsx`, everything else is tutorial contents.

### 3. Add an entry for your tutorial

Open `tutorials.ts` and add an entry to the `TUTORIALS` array like in the existing template.

```ts
{
    name: "Template Tutorial",
    description: "Simple template tutorial.",
    imageSrc: getTutorialImgSrc("template/thumbnail.png"),
    authors: [
      {
        name: "acheron",
        link: "https://twitter.com/acheroncrypto",
      },
    ],
    level: TutorialLevel.BEGINNER,
    categories: [TutorialCategory.OTHER],
    elementImport: () => import("./Template"),
  },
```

You can either use an existing url for the `imageSrc` or create one inside `/public/tutorials/<TUTORIAL_NAME>` folder like in the template example (inside client root directory).

## Advanced tutorials

Since tutorials are made with React components, you are not limited to making tutorials with Markdown. Not only you can create and display your own components but you also have access to all of the playground codebase!

For example, you can run any code whenever the user changes the page.

```tsx
<Tutorial
  // ...
  pages={[
    {
      // ...
      onMount: () => PgTerminal.log("I'm controlling the terminal!"),
    },
  ]}
/>
```
