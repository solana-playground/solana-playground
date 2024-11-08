import styled, { css } from "styled-components";

import FilterGroup from "../../../../components/FilterGroup";
import { FILTERS } from "../../../main/primary/Programs/filters";

const Programs = () => (
  <Wrapper>
    {FILTERS.map((f) => (
      <FilterGroup key={f.param} {...f} />
    ))}
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    font-family: ${theme.font.other.family};
    font-size: ${theme.font.other.size.medium};
  `}
`;

export default Programs;
