import {
  ChangeEvent,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Input, { defaultInputProps } from "../../../../Input";
import ModalInside from "../../../../Modal/ModalInside";
import { explorerAtom, refreshExplorerAtom } from "../../../../../state";
import { PgExplorer } from "../../../../../utils/pg";

interface RenameItemProps {
  path: string;
}

const RenameItem: FC<RenameItemProps> = ({ path }) => {
  const [explorer] = useAtom(explorerAtom);
  const [, refresh] = useAtom(refreshExplorerAtom);

  // Focus on input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle user input
  const [newName, setNewName] = useState("");
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
  };

  const rename = useCallback(() => {
    if (!newName) return;
    const renameResult = explorer?.renameItem(path, newName);

    if (renameResult?.err) {
      console.log(renameResult.err);
      return;
    }

    refresh();
  }, [explorer, path, newName, refresh]);

  const itemName = PgExplorer.getItemNameFromPath(path);

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <ModalInside buttonProps={{ name: "Rename", onSubmit: rename }}>
      <Content>
        <Text>Rename '{itemName}'</Text>
        <Input onChange={handleChange} ref={inputRef} {...defaultInputProps} />
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
