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

import Input from "../../../../../components/Input";
import LangIcon from "../../../../../components/LangIcon";
import { ctxSelectedAtom, newItemAtom } from "../../../../../state";
import { PgExplorer } from "../../../../../utils/pg";
import { useOnClickOutside } from "../../../../../hooks";

export const NewItem = () => {
  const [el, setEl] = useAtom(newItemAtom);
  const [ctxSelected, setCtxSelected] = useAtom(ctxSelectedAtom);

  const [itemName, setItemName] = useState("");

  const newFileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hide = useCallback(() => setEl(null), [setEl]);

  useOnClickOutside(newFileRef, hide, !!el);

  // Only allow setting filename with Enter
  // Escape closes the input
  const handleKeyPress = useCallback(
    async (ev: KeyboardEvent) => {
      if (ev.key === "Enter") {
        if (!itemName) return;

        // Check if the command is coming from context menu
        let selected = ctxSelected;
        if (!selected) selected = PgExplorer.getSelectedEl();
        const parentPath =
          PgExplorer.getParentPathFromEl(selected as HTMLDivElement) ?? "/";

        const convertedItemName =
          itemName + (PgExplorer.getItemTypeFromName(itemName).file ? "" : "/");

        const itemPath = parentPath + convertedItemName;

        try {
          await PgExplorer.newItem(itemPath);

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
      } else if (ev.key === "Escape") setEl(null);
    },
    [itemName, ctxSelected, setEl, setCtxSelected]
  );

  const handleChange = useCallback((ev: ChangeEvent<HTMLInputElement>) => {
    setItemName(ev.target.value);
  }, []);

  useEffect(() => {
    if (!el) return;

    inputRef.current?.focus();

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [el, handleKeyPress]);

  // Reset item name on element change
  useEffect(() => {
    if (!el) setItemName("");
  }, [el]);

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

    if (!PgExplorer.isTemporary) path = PgExplorer.getRelativePath(path);

    const depth = path.split("/").length - (itemType.folder ? 1 : 0);
    return PgExplorer.isTemporary ? depth - 1 : depth;
  }, [el]);

  return el
    ? ReactDOM.createPortal(
        <Wrapper ref={newFileRef} depth={depth}>
          <LangIcon fileName={itemName} />
          <Input ref={inputRef} onChange={handleChange} />
        </Wrapper>,
        el
      )
    : null;
};

const Wrapper = styled.div<{ depth: number }>`
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
  padding-left: ${({ depth }) => depth + "rem"};

  & > input {
    margin-left: 0.375rem;
  }
`;
