import { useCallback, useState } from "react";
import styled, { css } from "styled-components";

import EditorWithTabs from "./EditorWithTabs";
import { MainViewLoading } from "../../../../../components/Loading";
import { EventName } from "../../../../../constants";
import { PgCommon, SetElementAsync } from "../../../../../utils/pg";
import { PgThemeManager } from "../../../../../utils/pg/theme";
import { useGetAndSetStatic } from "../../../../../hooks";

const MainView = () => {
  const [El, setEl] = useState(EditorWithTabs);
  const [loading, setLoading] = useState(true);

  const setElWithTransition = useCallback(async (El: SetElementAsync) => {
    setLoading(true);

    await PgCommon.transition(
      (async () => {
        if (!El) El = EditorWithTabs;
        El = await (El as () => Promise<JSX.Element>)();
        setEl(El);
      })(),
      300
    );

    setLoading(false);
  }, []);

  useGetAndSetStatic(El, setElWithTransition, EventName.VIEW_MAIN_STATIC);

  return <Wrapper>{loading ? <MainViewLoading /> : El}</Wrapper>;
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;

    ${PgThemeManager.convertToCSS(theme.components.main.default)};

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
