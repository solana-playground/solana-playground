import { MutableRefObject, useEffect } from "react";
import { useTheme } from "styled-components";

import { ClassName } from "../../../../constants";
import { Sidebar } from "../sidebar-state";

export const ID_PREFIX = "Icon";

const useActiveTab = (
  currentState: Sidebar,
  oldStateRef: MutableRefObject<Sidebar>,
  width: number
) => {
  const theme = useTheme();

  useEffect(() => {
    const current = width !== 0 ? currentState : "Closed";

    changeActiveTab(getId(current), getId(oldStateRef.current));
    oldStateRef.current = currentState;
  }, [currentState, oldStateRef, width, theme.name]);
};

const changeActiveTab = (newId: string, oldId: string) => {
  const oldEl = document.getElementById(oldId);
  const newEl = document.getElementById(newId);

  oldEl?.classList.remove(ClassName.ACTIVE);
  newEl?.classList.add(ClassName.ACTIVE);
};

const getId = (id: string) => {
  return ID_PREFIX + id;
};

export default useActiveTab;
