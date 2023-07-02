import { MutableRefObject, useEffect } from "react";
import { useTheme } from "styled-components";

import { ClassName } from "../../../../../constants";

export const ID_PREFIX = "sidebar";

export const useActiveTab = (
  currentPage: SidebarPageName,
  oldPageRef: MutableRefObject<SidebarPageName>,
  width: number
) => {
  const theme = useTheme();

  useEffect(() => {
    const current = width !== 0 ? currentPage : "Closed";
    changeActiveTab(getId(current), getId(oldPageRef.current));
    oldPageRef.current = currentPage;
  }, [currentPage, oldPageRef, width, theme.name]);
};

const changeActiveTab = (newId: string, oldId: string) => {
  const oldEl = document.getElementById(oldId);
  const newEl = document.getElementById(newId);

  oldEl?.classList.remove(ClassName.ACTIVE);
  newEl?.classList.add(ClassName.ACTIVE);
};

const getId = (id: string) => ID_PREFIX + id;
