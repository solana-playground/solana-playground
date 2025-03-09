import { FC } from "react";
import styled, { css } from "styled-components";

import FilterGroups from "../../../../components/FilterGroups";
import { FILTERS } from "../../../main/primary/Programs/filters";

interface ProgramsProps {
  // TODO: Proper type
  programs: any[];
}

const Programs: FC<ProgramsProps> = ({ programs }) => (
  <Wrapper>
    <FilterGroups filters={FILTERS} items={programs} />
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    font-family: ${theme.font.other.family};
    font-size: ${theme.font.other.size.medium};
  `}
`;

export default Programs;
