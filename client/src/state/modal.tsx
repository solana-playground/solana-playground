import { ReactElement } from "react";
import { atom } from "jotai";

export const modalAtom = atom<{ show: boolean; JSX?: ReactElement }>({
  show: false,
});
