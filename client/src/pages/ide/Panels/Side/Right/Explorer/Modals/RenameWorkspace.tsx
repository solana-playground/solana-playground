import { ChangeEvent, useEffect, useRef, useState } from "react";

import Modal from "../../../../../../../components/Modal";
import useModal from "../../../../../../../components/Modal/useModal";
import Input from "../../../../../../../components/Input";
import { PgExplorer } from "../../../../../../../utils/pg";

export const RenameWorkspace = () => {
  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select input on mount
  useEffect(() => {
    inputRef.current?.select();
    inputRef.current?.focus();
  }, []);

  const workspaceName = PgExplorer.currentWorkspaceName ?? "";

  // Handle user input
  const [newName, setNewName] = useState(workspaceName);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
    setError("");
  };

  const renameWorkspace = async () => {
    try {
      await PgExplorer.renameWorkspace(newName);
      close();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Modal
      buttonProps={{
        text: "Rename",
        onSubmit: renameWorkspace,
        disabled: !newName || !!error || !PgExplorer,
        size: "small",
      }}
      title={`Rename workspace '${workspaceName}'`}
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
