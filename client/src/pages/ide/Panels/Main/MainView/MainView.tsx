import { useCallback, useState } from "react";
import styled, { css } from "styled-components";

import { MainViewLoading } from "../../../../../components/Loading";
import { EventName } from "../../../../../constants";
import {
  PgCommon,
  PgRouter,
  PgTheme,
  SetElementAsync,
} from "../../../../../utils/pg";
import { useGetAndSetStatic } from "../../../../../hooks";

const MainView = () => {
  const [El, setEl] = useState<JSX.Element | null>(null);
  const [loading, setLoading] = useState(true);

  const setElWithTransition = useCallback(
    async (SetEl: SetElementAsync | null) => {
      setLoading(true);

      await PgCommon.transition(async () => {
        try {
          SetEl = await (
            SetEl as (El: JSX.Element | null) => Promise<JSX.Element>
          )(El);
          setEl(SetEl);
        } catch (e: any) {
          console.log("MAIN VIEW ERROR:", e.message);
          PgRouter.navigate();
        }
      }, 300);

      setLoading(false);
    },
    [El]
  );

  useGetAndSetStatic(El!, setElWithTransition, EventName.VIEW_MAIN_STATIC);

  return <Wrapper>{loading ? <MainViewLoading /> : El}</Wrapper>;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;

    ${PgTheme.getScrollbarCSS({ allChildren: true })};
    ${PgTheme.convertToCSS(theme.components.main.default)};
  `}
`;

export default MainView;
