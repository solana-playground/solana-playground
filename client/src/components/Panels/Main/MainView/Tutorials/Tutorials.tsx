import styled, { css } from "styled-components";

import TutorialCard from "./TutorialCard";
import { TUTORIALS } from "../../../../../tutorials";

const Tutorials = () => {
  return (
    <Wrapper>
      <TutorialsWrapper>
        {TUTORIALS.map((t, i) => (
          <TutorialCard key={i} {...t} />
        ))}
      </TutorialsWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    height: 100%;
    flex: 1;
    overflow: auto;
    background-color: ${theme.colors.tutorials?.bg};
    color: ${theme.colors.tutorials?.color};
  `}
`;

const TutorialsWrapper = styled.div``;

export default Tutorials;
