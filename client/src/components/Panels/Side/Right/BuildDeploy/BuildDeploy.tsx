import styled from "styled-components";

import Build from "./Build";
import Deploy from "./Deploy";

const BuildDeploy = () => {
  return (
    <Wrapper>
      <Build />
      <Deploy />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.default.borderColor};
`;

export default BuildDeploy;
