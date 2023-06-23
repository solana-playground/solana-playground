import { ChangeEvent, FC, useEffect, useRef, useState } from "react";

import Modal from "../../../../../../../components/Modal";
import Input from "../../../../../../../components/Input";
import { PgExplorer } from "../../../../../../../utils/pg";

interface RenameItemProps {
  path: string;
}

export const RenameItem: FC<RenameItemProps> = ({ path }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const itemName = PgExplorer.getItemNameFromPath(path);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.setSelectionRange(0, itemName.indexOf("."));
    inputRef.current?.focus();
  }, [itemName]);

  // Handle user input
  const [newName, setNewName] = useState(itemName);
  const [error, setError] = useState("");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setNewName(ev.target.value);
    setError("");
  };

  const rename = async () => {
    await PgExplorer.renameItem(path, newName);
  };

  return (
    <Modal
      buttonProps={{
        text: "Rename",
        onSubmit: rename,
        closeOnSubmit: true,
        size: "small",
        disabled: !newName || !!error,
        setError,
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
