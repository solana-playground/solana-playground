import styled, { css } from "styled-components";

import FilterGroup from "../../../../components/FilterGroup";
import { FILTERS } from "../../../main/primary/Programs/filters";
import { PgRouter } from "../../../../utils/pg";
import { useAsyncEffect } from "../../../../hooks";

const Programs = () => {
  // TODO: Handle this from sidebar page impl
  // Handle path
  useAsyncEffect(async () => {
    const PROGRAMS_PATH: RoutePath = "/programs";
    const { pathname } = await PgRouter.getLocation();
    if (!pathname.startsWith(PROGRAMS_PATH)) {
      await PgRouter.navigate(PROGRAMS_PATH);
    }
  }, []);

  return (
    <Wrapper>
      {FILTERS.map((f) => (
        <FilterGroup key={f.param} {...f} />
      ))}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    font-family: ${theme.font.other.family};
    font-size: ${theme.font.other.size.medium};
  `}
`;

export default Programs;
