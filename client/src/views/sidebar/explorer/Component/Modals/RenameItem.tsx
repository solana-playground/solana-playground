import { FC, useEffect, useRef, useState } from "react";

import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import { PgCommon, PgExplorer } from "../../../../../utils/pg";

interface RenameItemProps {
  path: string;
}

export const RenameItem: FC<RenameItemProps> = ({ path }) => {
  const itemName = PgExplorer.getItemNameFromPath(path);
  const [newName, setNewName] = useState(itemName);
  const [error, setError] = useState("");

  const rename = async () => {
    const newPath = PgCommon.joinPaths(
      PgExplorer.getParentPathFromPath(path),
      newName
    );
    await PgExplorer.renameItem(path, newPath);
  };

  // Select the file name without the extension on mount
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.setSelectionRange(0, inputRef.current.value.indexOf("."));
  }, []);

  return (
    <Modal
      title={`Rename '${itemName}'`}
      buttonProps={{
        text: "Rename",
        onSubmit: rename,
        size: "small",
        disabled: !!error,
      }}
    >
      <Input
        ref={inputRef}
        autoFocus
        value={newName}
        onChange={(ev) => setNewName(ev.target.value)}
        validator={PgExplorer.isItemNameValid}
        error={error}
        setError={setError}
      />
    </Modal>
  );
};
