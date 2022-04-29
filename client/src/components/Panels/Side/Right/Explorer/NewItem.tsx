import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useAtom } from "jotai";

import {
  ctxSelectedAtom,
  explorerAtom,
  newItemAtom,
  refreshExplorerAtom,
} from "../../../../../state";
import Input, { defaultInputProps } from "../../../../Input";
import LangIcon from "../../../../LangIcon";
import { PgExplorer } from "../../../../../utils/pg/explorer";

const NewItem = () => {
  const [explorer] = useAtom(explorerAtom);
  const [, refresh] = useAtom(refreshExplorerAtom);
  const [el, setEl] = useAtom(newItemAtom);
  const [ctxSelected, setCtxSelected] = useAtom(ctxSelectedAtom);

  const [itemName, setItemName] = useState("");

  const newFileRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClickOut = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!newFileRef.current!.contains(e.target as Node)) setEl(null);
    },
    [setEl]
  );

  // Only allow setting filename with Enter
  // Escape closes the input
  const handleKeyPress = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (!itemName) return;

        // Check if the command is coming from context menu
        let selected = ctxSelected;
        if (!selected) selected = PgExplorer.getSelectedEl();
        const parentPath =
          PgExplorer.getParentPathFromEl(selected as HTMLDivElement) ?? "/";

        const convertedItemName =
          itemName + (PgExplorer.getItemTypeFromName(itemName).file ? "" : "/");

        const itemPath = parentPath + convertedItemName;

        const newItemRes = explorer?.newItem(itemPath);

        // TODO: Proper error handling
        if (newItemRes?.err) {
          console.log(newItemRes.err);
          return;
        }

        // File add successfull

        // Remove input
        setEl(null);

        // Reset Ctx Selected
        setCtxSelected(null);

        // Trigger refresh on components that have explorerRefreshAtom
        refresh();

        // Select new file
        PgExplorer.setSelectedEl(PgExplorer.getElFromPath(itemPath));
      } else if (e.key === "Escape") setEl(null);
    },
    [itemName, explorer, setEl, refresh, ctxSelected, setCtxSelected]
  );

  useEffect(() => {
    if (el) {
      document.body.addEventListener("mousedown", handleClickOut);
      document.body.addEventListener("keydown", handleKeyPress);
      inputRef.current!.focus();
    }

    return () => {
      document.body.removeEventListener("mousedown", handleClickOut);
      document.body.removeEventListener("keydown", handleKeyPress);
    };
  }, [el, setEl, handleClickOut, handleKeyPress]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setItemName(e.target.value);
    },
    [setItemName]
  );

  return el
    ? ReactDOM.createPortal(
        <div
          ref={newFileRef}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0.25rem 0",
          }}
        >
          <LangIcon fileName={itemName} />
          <Input
            style={{ marginLeft: "0.375rem" }}
            ref={inputRef}
            onChange={handleChange}
            {...defaultInputProps}
          />
        </div>,
        el
      )
    : null;
};

export default NewItem;
