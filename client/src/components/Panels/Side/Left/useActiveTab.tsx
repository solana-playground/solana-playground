import { MutableRefObject, useEffect } from "react";
import { useTheme } from "styled-components";

const changeActiveTab = (newId: string, oldId: string) => {
  const oldEl = document.getElementById(oldId);
  const newEl = document.getElementById(newId);

  oldEl?.classList.remove("active");
  newEl?.classList.add("active");
};

const getId = (prefix: string, id: string) => {
  return prefix + id;
};

const useActiveTab = <T extends string>(
  currentState: T,
  oldStateRef: MutableRefObject<T>,
  idPrefix: string
) => {
  const theme = useTheme();

  useEffect(() => {
    changeActiveTab(
      getId(idPrefix, currentState),
      getId(idPrefix, oldStateRef.current)
    );
    oldStateRef.current = currentState;
  }, [currentState, oldStateRef, idPrefix, theme.name]);
};

export default useActiveTab;
