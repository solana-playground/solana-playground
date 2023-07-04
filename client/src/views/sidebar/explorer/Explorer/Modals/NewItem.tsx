import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useAtom } from "jotai";
import styled from "styled-components";

import Input from "../../../../../components/Input";
import LangIcon from "../../../../../components/LangIcon";
import { ctxSelectedAtom, newItemAtom } from "../../../../../state";
import { PgExplorer } from "../../../../../utils/pg";
import { useKeybind, useOnClickOutside } from "../../../../../hooks";

export const NewItem = () => {
  const [el] = useAtom(newItemAtom);

  return el ? ReactDOM.createPortal(<NewItemInput />, el) : null;
};

const NewItemInput = () => {
  const [el, setEl] = useAtom(newItemAtom);
  const [ctxSelected, setCtxSelected] = useAtom(ctxSelectedAtom);

  const [itemName, setItemName] = useState("");

  const newFileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hide = useCallback(() => setEl(null), [setEl]);

  useOnClickOutside(newFileRef, hide);

  // Handle keybinds
  useKeybind(
    [
      {
        keybind: "Enter",
        handle: async () => {
          if (!itemName) return;

          // Check if the command is coming from context menu
          const selected = ctxSelected ?? PgExplorer.getSelectedEl();
          const parentPath =
            PgExplorer.getParentPathFromEl(selected as HTMLDivElement) ?? "/";

          const convertedItemName =
            itemName +
            (PgExplorer.getItemTypeFromName(itemName).file ? "" : "/");

          const itemPath = parentPath + convertedItemName;

          try {
            // Create item
            await PgExplorer.newItem(itemPath);

            // Remove input
            setEl(null);

            // Reset Ctx Selected
            setCtxSelected(null);

            // Select new file
            PgExplorer.setSelectedEl(PgExplorer.getElFromPath(itemPath));
          } catch (e: any) {
            console.log(e.message);
          }
        },
      },
      {
        keybind: "Escape",
        handle: () => {
          setEl(null);
        },
      },
    ],
    [itemName, ctxSelected]
  );

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

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Wrapper ref={newFileRef} depth={depth}>
      <LangIcon fileName={itemName} />
      <Input ref={inputRef} onChange={(ev) => setItemName(ev.target.value)} />
    </Wrapper>
  );
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
