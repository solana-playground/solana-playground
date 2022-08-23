import { useAtom } from "jotai";

import { explorerAtom } from "../../../../../state";
import Button from "../../../../Button";

const CreateNewWorkspace = () => {
  const [explorer] = useAtom(explorerAtom);

  if (!explorer) return null;

  const handleNew = async () => {
    await explorer.newWorkspace("new-workspace");
  };

  return (
    <Button kind="outline" onClick={handleNew}>
      Create a new workspace
    </Button>
  );
};

export default CreateNewWorkspace;
