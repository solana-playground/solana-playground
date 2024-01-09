# Tutorials

Playground now supports [tutorials](https://beta.solpg.io/tutorials) natively with Markdown text or custom React components.

## How to add a tutorial

The easiest way to add a tutorial is with Markdown text.

> **Note**
>
> You do **NOT** need to know anything about the playground codebase.

There are **3** steps for adding a tutorial:

1. Fork the repository

   Fork the playground repository on Github and [run locally](https://github.com/solana-playground/solana-playground/blob/master/README.md#run-locally).

2. Create a tutorial component

   There is a ready to use template component in `./Template`. You can copy the entire directory and change it based on your needs. Component lives in `Template.tsx`, everything else is tutorial contents.

3. Add an entry for your tutorial

   Open `tutorials.ts` and add an entry to the `TUTORIALS` array like in the existing template.

   ```ts
   {
     name: "Template",
     description: "Simple template tutorial.",
     authors: [
       {
         name: "acheron",
         link: "https://twitter.com/acheroncrypto",
       },
     ],
     level: "Beginner",
     framework: "Anchor",
     languages: ["Rust", "TypeScript"],
     categories: ["Gaming", "Payments"],
   },
   ```

## Storing assets

Tutorial assets can be added to the [assets repository](https://github.com/solana-playground/assets) by creating a pull request.

After your assets are approved, run:

```
git submodule update --remote
```

And commit the changes for the tutorial PR.

> **Warning**
>
> Please try to keep each image less than 1MB, especially the thumbnail. Tutorial thumbnails are shown as `278x216` pixels by default and the assets are used as-is(no altering in order to reduce size) which means there is no reason to upload a 4K 10MB image as a thumbnail.

### Thumbnail

In order to add a thumbnail for your tutorial, put a file named `thumbnail.(png|jpg)` in your tutorial's asset folder. For example, if you have a tutorial named `Cool Tutorial`, add the image to the `/tutorials/cool-tutorial/` directory.

### Show assets in Markdown

The assets can be included in the Markdown files with the following syntax:

```
![<DESCRIPTION>](/tutorials/<TUTORIAL_NAME>/<IMAGE_NAME>)
```

**Example:**

```
![Test UI](/tutorials/hello-seahorse/test-ui.png)
```

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
