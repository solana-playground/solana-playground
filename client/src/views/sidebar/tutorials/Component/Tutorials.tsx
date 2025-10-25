import styled, { css } from "styled-components";

import FilterGroups from "../../../../components/FilterGroups";
import { FILTERS } from "../../../main/primary/Tutorials/filters";
import { PgTutorial } from "../../../../utils/pg";

const Tutorials = () => (
  <Wrapper>
    <FilterGroups filters={FILTERS} items={PgTutorial.all} />
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    font-family: ${theme.font.other.family};
    font-size: ${theme.font.other.size.medium};
  `}
`;

export default Tutorials;
