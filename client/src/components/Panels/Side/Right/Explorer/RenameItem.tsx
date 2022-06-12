import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import ModalInside from "../../../../Modal/ModalInside";
import useModal from "../../../../Modal/useModal";
import Input, { defaultInputProps } from "../../../../Input";
import { explorerAtom, refreshExplorerAtom } from "../../../../../state";
import { PgExplorer } from "../../../../../utils/pg";

interface RenameItemProps {
  path: string;
}

const RenameItem: FC<RenameItemProps> = ({ path }) => {
  const [explorer] = useAtom(explorerAtom);
  const [, refresh] = useAtom(refreshExplorerAtom);

  const { close } = useModal();

  const itemName = PgExplorer.getItemNameFromPath(path) ?? "";

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.setSelectionRange(0, itemName.indexOf("."));
    inputRef.current?.focus();
  }, [itemName]);

  // Handle user input
  const [newName, setNewName] = useState(itemName);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
  };

  const rename = () => {
    if (!newName || !explorer) return;
    const renameResult = explorer.renameItem(path, newName);

    if (renameResult?.err) {
      console.log(renameResult.err);
      return;
    }

    refresh();
    close();
  };

  if (!itemName) return null;

  return (
    <ModalInside
      buttonProps={{ name: "Rename", onSubmit: rename }}
      closeOnSubmit={false}
    >
      <Content>
        <Text>Rename '{itemName}'</Text>
        <Input
          ref={inputRef}
          onChange={handleChange}
          value={newName}
          {...defaultInputProps}
        />
      </Content>
    </ModalInside>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
`;

const Text = styled.div`
  margin: 1rem 0;
`;

export default RenameItem;
