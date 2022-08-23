import { useAtom } from "jotai";

import Button from "../../../../Button";
import { explorerAtom } from "../../../../../state";

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
