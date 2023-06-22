import { useCallback, useState } from "react";
import styled, { css } from "styled-components";

import EditorWithTabs from "./EditorWithTabs";
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
  const [El, setEl] = useState(EditorWithTabs);
  const [loading, setLoading] = useState(true);

  const setElWithTransition = useCallback(
    async (SetEl: SetElementAsync) => {
      setLoading(true);

      await PgCommon.transition(async () => {
        if (!SetEl) SetEl = EditorWithTabs;

        try {
          SetEl = await (SetEl as (El: JSX.Element) => Promise<JSX.Element>)(
            El
          );
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

  useGetAndSetStatic(El, setElWithTransition, EventName.VIEW_MAIN_STATIC);

  return <Wrapper>{loading ? <MainViewLoading /> : El}</Wrapper>;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;

    ${PgTheme.convertToCSS(theme.components.main.default)};

    /* Scrollbar */
    /* Chromium */
    & ::-webkit-scrollbar {
      width: 0.5rem;
      height: 0.5rem;
    }

    & ::-webkit-scrollbar-track {
      background: transparent;
    }

    & ::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.default.borderRadius};
      background: ${theme.default.scrollbar.thumb.color};
    }

    & ::-webkit-scrollbar-thumb:hover {
      background: ${theme.default.scrollbar.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.default.scrollbar.thumb.color};
    }
  `}
`;

export default MainView;
