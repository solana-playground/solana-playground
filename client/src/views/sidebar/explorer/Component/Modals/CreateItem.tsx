import { FC, useCallback, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";

import Input from "../../../../../components/Input";
import LangIcon from "../../../../../components/LangIcon";
import { Fn, PgCommon, PgExplorer, PgView } from "../../../../../utils/pg";
import {
  useKeybind,
  useOnClickOutside,
  useSetStatic,
} from "../../../../../hooks";

export const CreateItem = () => {
  const [El, setEl] = useState<Element | null>(null);

  useSetStatic(PgView.events.NEW_ITEM_PORTAL_SET, setEl);

  const hide = useCallback(() => setEl(null), []);

  return El
    ? ReactDOM.createPortal(<CreateItemInput El={El} hide={hide} />, El)
    : null;
};

interface CreateItemInputProps {
  El: Element;
  hide: Fn;
}

const CreateItemInput: FC<CreateItemInputProps> = ({ El, hide }) => {
  const [itemName, setItemName] = useState("");
  const [error, setError] = useState(false);

  const newFileRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(newFileRef, hide);

  // Handle keybinds
  useKeybind(
    [
      {
        keybind: "Enter",
        handle: async () => {
          if (!itemName) return;

          setError(false);

          // Check if the command is coming from context menu
          const selected =
            PgExplorer.getCtxSelectedEl() ?? PgExplorer.getSelectedEl();
          const parentPath =
            PgExplorer.getParentPathFromEl(selected as HTMLDivElement) ??
            PgExplorer.PATHS.ROOT_DIR_PATH;

          try {
            // Create item
            const itemPath = PgExplorer.getCanonicalPath(
              PgCommon.joinPaths(parentPath, itemName)
            );
            await PgExplorer.createItem(itemPath);

            // Hide input
            hide();

            // Reset Ctx Selected
            PgExplorer.removeCtxSelectedEl();

            // Select new file
            const newEl = PgExplorer.getElFromPath(itemPath);
            if (newEl) PgExplorer.setSelectedEl(newEl);
          } catch (e: any) {
            console.log(e.message);
            setError(true);
          }
        },
      },
      {
        keybind: "Escape",
        handle: hide,
      },
    ],
    [itemName]
  );

  const depth = useMemo(() => {
    if (!El) return 0;
    let path = PgExplorer.getItemPathFromEl(El.firstChild as HTMLDivElement);
    const isEmptyFolder = !path;

    // Empty folder
    if (!path) {
      path = PgExplorer.getItemPathFromEl(
        El.parentElement?.firstChild as HTMLDivElement
      );
      if (!path) return 2;
    }
    const itemType = PgExplorer.getItemTypeFromPath(path);

    // Make `path` relative for consistency between temporary and normal projects
    if (PgExplorer.isTemporary) path = path.slice(1);
    else path = PgExplorer.getRelativePath(path);

    return path.split("/").length - (itemType.file || isEmptyFolder ? 0 : 1);
  }, [El]);

  return (
    <Wrapper ref={newFileRef} depth={depth}>
      <LangIcon path={itemName} />
      <Input
        autoFocus
        value={itemName}
        onChange={(ev) => setItemName(ev.target.value)}
        error={error}
        setError={setError}
        validator={PgExplorer.isItemNameValid}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div<{ depth: number }>`
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
  padding-left: ${({ depth }) => depth + "rem"};

  & > input {
    height: 1.5rem;
    margin-left: 0.375rem;
  }
`;
