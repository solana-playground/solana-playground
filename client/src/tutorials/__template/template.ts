import { createTutorial } from "../create";

export const template = createTutorial({
  name: "Template tutorial",
  description: "Simple template tutorial description",
  authors: [{ name: "acheron", link: "https://twitter.com/acheroncrypto" }],
  level: "Beginner",
  framework: "Anchor",
  languages: ["Rust", "TypeScript"],
});
