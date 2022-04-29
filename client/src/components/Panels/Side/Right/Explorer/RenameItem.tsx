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

import { explorerAtom, refreshExplorerAtom } from "../../../../../state";
import { PgExplorer } from "../../../../../utils/pg/explorer";
import Button from "../../../../Button";
import Input, { defaultInputProps } from "../../../../Input";
import useModal from "../../../../Modal/useModal";
import ModalInside from "../../../../Modal/ModalInside";

interface RenameItemProps {
  path: string;
}

const RenameItem: FC<RenameItemProps> = ({ path }) => {
  const [explorer] = useAtom(explorerAtom);
  const [, refresh] = useAtom(refreshExplorerAtom);
  const { close } = useModal();

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

    close();
    refresh();
  }, [explorer, path, newName, close, refresh]);

  useEffect(() => {
    const handleEnter = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") rename();
    };

    document.addEventListener("keydown", handleEnter);
    return () => document.removeEventListener("keydown", handleEnter);
  }, [rename]);

  const itemName = PgExplorer.getItemNameFromPath(path);

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <ModalInside>
      <Content>
        <Text>Rename '{itemName}'</Text>
        <Input onChange={handleChange} ref={inputRef} {...defaultInputProps} />
      </Content>
      <ButtonWrapper>
        <Button onClick={close}>Cancel</Button>
        <Button onClick={rename}>Rename</Button>
      </ButtonWrapper>
    </ModalInside>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Text = styled.div`
  margin: 1rem 0;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: 0.75rem 0;
`;

export default RenameItem;
