import { ChangeEvent, FC, useEffect, useRef, useState } from "react";

import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import { PgExplorer } from "../../../../../utils/pg";

interface RenameItemProps {
  path: string;
}

export const RenameItem: FC<RenameItemProps> = ({ path }) => {
  // Handle user input
  const itemName = PgExplorer.getItemNameFromPath(path);
  const [newName, setNewName] = useState(itemName);
  const [error, setError] = useState("");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setNewName(ev.target.value);
    setError("");
  };

  const rename = async () => {
    await PgExplorer.renameItem(path, newName);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.setSelectionRange(0, inputRef.current.value.indexOf("."));
  }, []);

  return (
    <Modal
      buttonProps={{
        text: "Rename",
        onSubmit: rename,
        size: "small",
        disabled: !newName || !!error,
        setError,
      }}
      title={`Rename '${itemName}'`}
    >
      <Input
        ref={inputRef}
        autoFocus
        value={newName}
        onChange={handleChange}
        error={error}
        setError={setError}
        validator={PgExplorer.isItemNameValid}
      />
    </Modal>
  );
};
