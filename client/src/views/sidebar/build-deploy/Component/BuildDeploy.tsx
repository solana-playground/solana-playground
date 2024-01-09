import styled from "styled-components";

import Build from "./Build";
import Deploy from "./Deploy";
import ProgramSettings from "./ProgramSettings";

const BuildDeploy = () => (
  <Wrapper>
    <Build />
    <Deploy />
    <ProgramSettings />
  </Wrapper>
);

const Wrapper = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.default.border};
`;

export default BuildDeploy;
