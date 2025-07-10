import { useEffect, useRef, useState } from "react";

import Input from "../../../../../components/Input";
import Modal from "../../../../../components/Modal";
import { PgCommon, PgExplorer, PgView } from "../../../../../utils/pg";

export const RenameWorkspace = () => {
  const workspaceName = PgExplorer.currentWorkspaceName!;
  const [newName, setNewName] = useState(workspaceName);
  const [error, setError] = useState("");

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
        disabled: !!error,
        size: "small",
      }}
    >
      <Input
        ref={inputRef}
        value={newName}
        onChange={(ev) => setNewName(ev.target.value)}
        validator={PgExplorer.isWorkspaceNameValid}
        error={error}
        setError={setError}
      />
    </Modal>
  );
};
