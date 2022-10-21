import { atom } from "jotai";

import { TutorialData } from "../components/Tutorial";

export const tutorialAtom = atom<TutorialData | null>(null);
