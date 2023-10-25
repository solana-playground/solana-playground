import type { UnionToTuple } from "../types";

export const TUTORIAL_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
] as const;

export const TUTORIAL_FRAMEWORKS: UnionToTuple<FrameworkName> = [
  "Native",
  "Anchor",
  "Seahorse",
];

export const TUTORIAL_LANGUAGES = ["Rust", "Python", "TypeScript"] as const;

export const TUTORIAL_CATEGORIES = [
  "DeFi",
  "NFTs",
  "Gaming",
  "Payments",
  "Staking",
  "Other",
] as const;
