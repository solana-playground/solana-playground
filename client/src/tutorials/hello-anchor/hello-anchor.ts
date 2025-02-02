import { createTutorial } from "../create";

export const helloAnchor = createTutorial({
  name: "Hello Anchor",
  description: "Hello world program with Anchor framework.",
  authors: [{ name: "acheron", link: "https://twitter.com/acheroncrypto" }],
  level: "Beginner",
  framework: "Anchor",
  languages: ["Rust", "TypeScript"],
});
