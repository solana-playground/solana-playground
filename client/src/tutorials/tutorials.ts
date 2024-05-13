import { createTutorials } from "./create";

/** All visible tutorials at `/tutorials`(in order) */
export const TUTORIALS = createTutorials(
  {
    name: "Hello Aelf",
    description: "Hello world program with Native AElf.",
    authors: [],
    level: "Beginner",
    framework: "Native",
    languages: ["CSharp", "TypeScript"],
  },
);
