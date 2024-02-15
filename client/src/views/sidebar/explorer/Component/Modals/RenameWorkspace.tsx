import { ChangeEvent, useEffect, useRef, useState } from "react";

import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import { PgCommon, PgExplorer, PgView } from "../../../../../utils/pg";

export const RenameWorkspace = () => {
  const workspaceName = PgExplorer.currentWorkspaceName!;
  const [newName, setNewName] = useState(workspaceName);
  const [error, setError] = useState("");

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    setNewName(ev.target.value);
    setError("");
  };

  const renameWorkspace = async () => {
    if (PgExplorer.currentWorkspaceName === newName) return;

    try {
      PgView.setSidebarLoading(true);
      await PgCommon.transition(PgExplorer.renameWorkspace(newName));
    } finally {
      PgView.setSidebarLoading(false);
    }
  };
  // Select input text on mount
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.select();
  }, []);

  return (
    <Modal
      title={`Rename workspace '${workspaceName}'`}
      buttonProps={{
        text: "Rename",
        onSubmit: renameWorkspace,
        disabled: !newName,
        size: "small",
      }}
      error={error}
      setError={setError}
    >
      <Input
        ref={inputRef}
        onChange={handleChange}
        value={newName}
        error={error}
        setError={setError}
        validator={PgExplorer.isWorkspaceNameValid}
      />
    </Modal>
  );
};
