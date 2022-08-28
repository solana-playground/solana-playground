import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../Button";
import Text from "../../../../Text";
import { NewWorkspace } from "./Modals";
import { modalAtom } from "../../../../../state";
import { Plus } from "../../../../Icons";

const NoWorkspace = () => {
  const [, setModal] = useAtom(modalAtom);

  const handleClick = () => {
    setModal(<NewWorkspace />);
  };

  return (
    <Wrapper>
      <Text>Start by creating a new project.</Text>
      <Button
        onClick={handleClick}
        kind="outline"
        fullWidth
        leftIcon={<Plus />}
      >
        Create a new project
      </Button>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding: 1.5rem 1rem;
  display: flex;
  justify-content: center;
  flex-direction: column;

  & > button {
    margin-top: 1rem;
  }
`;

export default NoWorkspace;
