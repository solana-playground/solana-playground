import { atom } from "jotai";

import { TutorialData } from "../utils/pg";

export const tutorialAtom = atom<TutorialData | null>(null);
