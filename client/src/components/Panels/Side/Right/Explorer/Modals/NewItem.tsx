import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import { useAtom } from "jotai";
import styled from "styled-components";

import LangIcon from "../../../../../LangIcon";
import Input, { defaultInputProps } from "../../../../../Input";
import {
  ctxSelectedAtom,
  explorerAtom,
  newItemAtom,
} from "../../../../../../state";
import { PgExplorer } from "../../../../../../utils/pg";

export const NewItem = () => {
  const [explorer] = useAtom(explorerAtom);
  const [el, setEl] = useAtom(newItemAtom);
  const [ctxSelected, setCtxSelected] = useAtom(ctxSelectedAtom);

  const [itemName, setItemName] = useState("");

  const newFileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClickOut = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!newFileRef.current?.contains(e.target as Node)) setEl(null);
    },
    [setEl]
  );

  // Only allow setting filename with Enter
  // Escape closes the input
  const handleKeyPress = useCallback(
    async (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (!itemName || !explorer) return;

        // Check if the command is coming from context menu
        let selected = ctxSelected;
        if (!selected) selected = PgExplorer.getSelectedEl();
        const parentPath =
          PgExplorer.getParentPathFromEl(selected as HTMLDivElement) ?? "/";

        const convertedItemName =
          itemName + (PgExplorer.getItemTypeFromName(itemName).file ? "" : "/");

        const itemPath = parentPath + convertedItemName;

        try {
          await explorer.newItem(itemPath);

          // File add successfull

          // Remove input
          setEl(null);

          // Reset Ctx Selected
          setCtxSelected(null);

          // Select new file
          PgExplorer.setSelectedEl(PgExplorer.getElFromPath(itemPath));
        } catch (e: any) {
          console.log(e.message);
        }
      } else if (e.key === "Escape") setEl(null);
    },
    [itemName, explorer, ctxSelected, setEl, setCtxSelected]
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setItemName(e.target.value);
  }, []);

  useEffect(() => {
    if (el) {
      document.addEventListener("mousedown", handleClickOut);
      document.addEventListener("keydown", handleKeyPress);
      inputRef.current?.focus();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOut);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [el, setEl, handleClickOut, handleKeyPress]);

  const depth = useMemo(() => {
    if (!el) return 0;
    let path = PgExplorer.getItemPathFromEl(el.firstChild as HTMLDivElement);

    // Empty folder
    if (!path) {
      path = PgExplorer.getItemPathFromEl(
        el.parentElement?.firstChild as HTMLDivElement
      );
      if (!path) return 0;
    }
    const itemType = PgExplorer.getItemTypeFromPath(path);

    return (
      path.split(explorer?.currentWorkspacePath!)[1].split("/").length -
      (itemType.folder ? 1 : 0)
    );
  }, [el, explorer?.currentWorkspacePath]);

  return el
    ? ReactDOM.createPortal(
        <Wrapper ref={newFileRef} depth={depth}>
          <LangIcon fileName={itemName} />
          <Input
            ref={inputRef}
            onChange={handleChange}
            {...defaultInputProps}
          />
        </Wrapper>,
        el
      )
    : null;
};

const Wrapper = styled.div<{ depth: number }>`
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
  padding-left: ${({ depth }) => depth + 0.25 + "rem"};

  & > input {
    margin-left: 0.375rem;
  }
`;
