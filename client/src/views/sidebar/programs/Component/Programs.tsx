import styled, { css } from "styled-components";

import FilterGroups from "../../../../components/FilterGroups";
import { FILTERS } from "../../../main/primary/Programs/filters";

const Programs = () => (
  <Wrapper>
    <FilterGroups filters={FILTERS} />
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    font-family: ${theme.font.other.family};
    font-size: ${theme.font.other.size.medium};
  `}
`;

export default Programs;
