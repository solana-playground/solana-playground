import { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";

import Modal from "../../../../../../../components/Modal";
import useModal from "../../../../../../../components/Modal/useModal";
import Input from "../../../../../../../components/Input";
import { explorerAtom } from "../../../../../../../state";
import { PgExplorer } from "../../../../../../../utils/pg";

interface RenameItemProps {
  path: string;
}

export const RenameItem: FC<RenameItemProps> = ({ path }) => {
  const [explorer] = useAtom(explorerAtom);

  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  const itemName = PgExplorer.getItemNameFromPath(path) ?? "";

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.setSelectionRange(0, itemName.indexOf("."));
    inputRef.current?.focus();
  }, [itemName]);

  // Handle user input
  const [newName, setNewName] = useState(itemName);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    setError("");
  };

  const disableCond = !newName || !explorer || !!error;

  const rename = async () => {
    if (disableCond) return;

    try {
      await explorer.renameItem(path, newName);
      close();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (!itemName) return null;

  return (
    <Modal
      buttonProps={{
        text: "Rename",
        onSubmit: rename,
        size: "small",
        disabled: disableCond,
      }}
      title={`Rename '${itemName}'`}
    >
      <Input
        ref={inputRef}
        onChange={handleChange}
        value={newName}
        error={error}
      />
    </Modal>
  );
};
