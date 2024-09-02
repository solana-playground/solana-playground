import styled from "styled-components";

import Button from "../../../../components/Button";
import Text from "../../../../components/Text";
import { NewWorkspace } from "./Modals";
import { Plus } from "../../../../components/Icons";
import { PgView } from "../../../../utils/pg";

const NoWorkspace = () => {
  const newWorkspace = () => PgView.setModal(NewWorkspace);

  return (
    <Wrapper>
      <Text>Start by creating a new project.</Text>
      <Button onClick={newWorkspace} fullWidth leftIcon={<Plus />}>
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

    & svg {
      margin-right: 0.5rem !important;
    }
  }
`;

export default NoWorkspace;
