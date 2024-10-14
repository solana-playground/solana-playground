import { useEffect, useRef } from "react";
import styled, { css } from "styled-components";

import FilterGroup from "../../../../components/FilterGroup";
import { FILTERS } from "../../../main/primary/Programs/filters";
import { PgRouter, PgView } from "../../../../utils/pg";
import { useAsyncEffect } from "../../../../hooks";

const Programs = () => {
  // Handle path
  useAsyncEffect(async () => {
    const PROGRAMS_PATH: RoutePath = "/programs";
    const { pathname } = await PgRouter.getLocation();
    if (!pathname.startsWith(PROGRAMS_PATH)) {
      await PgRouter.navigate(PROGRAMS_PATH);
    }

    // This will fix the case where going back from `/programs` to `/` with
    // browser's navigations would cause this component to be still mounted
    // instead of switching to `Explorer`
    const { dispose } = PgRouter.onDidChangePath((path) => {
      if (!path.startsWith(PROGRAMS_PATH)) {
        PgView.setSidebarPage((state) => {
          if (state === "Programs") return "Explorer";
          return state;
        });
      }
    });
    return () => dispose();
  }, []);

  // Minimize secondary main view on mount and reopen on unmount
  const mainSecondaryHeight = useRef(0);
  useEffect(() => {
    PgView.setMainSecondaryHeight((h) => {
      mainSecondaryHeight.current = h;
      return 0;
    });
    return () => PgView.setMainSecondaryHeight(mainSecondaryHeight.current);
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
