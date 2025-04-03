import styled from "styled-components";

import Button from "../../../../components/Button";
import Text from "../../../../components/Text";
import { CreateWorkspace } from "./Modals";
import { Plus } from "../../../../components/Icons";
import { PgView } from "../../../../utils/pg";

const NoWorkspace = () => {
  const createWorkspace = () => PgView.setModal(CreateWorkspace);

  return (
    <Wrapper>
      <Text>Start by creating a new project.</Text>
      <Button onClick={createWorkspace} fullWidth leftIcon={<Plus />}>
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
