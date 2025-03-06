import {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";

import Button from "../../../../../components/Button";
import ErrorBoundary from "../../../../../components/ErrorBoundary";
import ProgressBar from "../../../../../components/ProgressBar";
import Resizable from "../../../../../components/Resizable";
import { Close, DoubleArrow, Tick } from "../../../../../components/Icons";
import {
  NullableJSX,
  PgCommon,
  // TODO: Remove
  PgEditor,
  PgTheme,
  PgView,
} from "../../../../../utils/pg";
import { useAsyncEffect, useKeybind, useSetStatic } from "../../../../../hooks";
import { MAIN_SECONDARY } from "../../../../../views";

const Secondary = () => {
  const [page, setPage] = useState<MainSecondaryPageName>("Terminal");
  useSetStatic(setPage, PgView.events.MAIN_SECONDARY_PAGE_SET);
  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      PgView.events.ON_DID_CHANGE_MAIN_SECONDARY_PAGE,
      page
    );
  }, [page]);
  const pageInfo = useMemo(() => getPage(page), [page]);

  const [el, setEl] = useState<NullableJSX>(null);
  useAsyncEffect(async () => {
    const { default: PageComponent } = await pageInfo.importComponent();
    setEl(<PageComponent />);
  }, [pageInfo]);

  const [height, setHeight] = useState(getDefaultHeight);
  const oldHeight = useRef(height);
  useEffect(() => {
    if (height !== getMinHeight() && height !== getMaxHeight()) {
      oldHeight.current = height;
    }
  }, [height]);
  const setCheckedHeight = useCallback((action: SetStateAction<number>) => {
    setHeight((h) => {
      const height = typeof action === "function" ? action(h) : action;
      const minHeight = getMinHeight();
      if (height < minHeight) return minHeight;

      const maxHeight = getMaxHeight();
      if (height > maxHeight) return maxHeight;

      return height;
    });
  }, []);
  useSetStatic(setCheckedHeight, PgView.events.MAIN_SECONDARY_HEIGHT_SET);

  const handleResizeStop = useCallback(
    (_e, _dir, _ref, d) => setCheckedHeight((h) => h + d.height),
    [setCheckedHeight]
  );

  const toggleMinimize = useCallback(() => {
    setHeight((h) => {
      const minHeight = getMinHeight();
      if (h === minHeight) pageInfo.focus();
      else PgEditor.focus();
      return h === minHeight ? oldHeight.current : minHeight;
    });
  }, [pageInfo]);

  // Combine page actions with default actions
  const actions: typeof pageInfo["actions"] = useMemo(
    () => [
      ...(pageInfo.actions ?? []),
      {
        name: "Toggle Maximize",
        keybind: "Ctrl+M",
        icon:
          height === getMaxHeight() && getMaxHeight() !== getDefaultHeight() ? (
            <DoubleArrow rotate="180deg" />
          ) : (
            <DoubleArrow />
          ),
        run: () => {
          setHeight((h) => {
            const maxHeight = getMaxHeight();
            return h === maxHeight ? oldHeight.current : maxHeight;
          });
        },
      },
      {
        name: "Toggle Minimize",
        keybind: "Ctrl+J",
        icon: height === getMinHeight() ? <Tick /> : <Close />,
        run: toggleMinimize,
      },
    ],
    [pageInfo, height, toggleMinimize]
  );

  // Page keybinds
  useKeybind(
    MAIN_SECONDARY.filter((p) => p.keybind).map((p) => ({
      keybind: p.keybind!,
      handle: () => {
        setPage(p.name);
        const { getIsFocused, focus } = getPage(p.name);
        if (getIsFocused()) {
          toggleMinimize();
          PgEditor.focus();
        } else {
          if (height === getMinHeight()) toggleMinimize();
          focus();
        }
      },
    })),
    [height, toggleMinimize]
  );

  // Action keybinds
  useKeybind(
    actions
      .filter((a) => a.keybind)
      .map((a) => ({
        keybind: a.keybind!,
        handle: a.run,
      })),
    [actions]
  );

  return (
    <Resizable
      size={{ height, width: "100%" }}
      minWidth="100%"
      minHeight={getMinHeight()}
      onResizeStop={handleResizeStop}
      enable="top"
    >
      <Wrapper>
        <Topbar>
          {MAIN_SECONDARY.length > 1 && (
            <TabsWrapper>
              {MAIN_SECONDARY.map((p) => (
                <Tab
                  key={p.name}
                  isCurrent={page === p.name}
                  onClick={() => setPage(p.name)}
                >
                  {p.name}
                </Tab>
              ))}
            </TabsWrapper>
          )}

          <Progress />

          <ActionsWrapper>
            {actions.map((action) => (
              <Button
                key={action.name}
                kind="icon"
                title={
                  action.keybind
                    ? `${action.name} (${PgCommon.getKeybindTextOS(
                        action.keybind
                      )})`
                    : action.name
                }
                onClick={action.run}
              >
                {action.icon}
              </Button>
            ))}
          </ActionsWrapper>
        </Topbar>

        <ErrorBoundary>{el}</ErrorBoundary>
      </Wrapper>
    </Resizable>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.main.secondary.default)};

    & > div:first-child {
      height: ${getMinHeight()}px;
    }

    & > div:last-child {
      ${PgTheme.getScrollbarCSS({ allChildren: true })};
      height: calc(100% - ${getMinHeight()}px);
      overflow: hidden;
    }
  `}
`;

const Topbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
`;

const TabsWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.views.main.secondary.tabs.default)};
  `}
`;

const Tab = styled.div<{ isCurrent: boolean }>`
  ${({ theme, isCurrent }) => css`
    ${PgTheme.convertToCSS(theme.views.main.secondary.tabs.tab.default)};
    ${isCurrent &&
    PgTheme.convertToCSS(theme.views.main.secondary.tabs.tab.current)};
  `}
`;

const Progress = () => {
  const [progress, setProgress] = useState(0);
  useSetStatic(setProgress, PgView.events.MAIN_SECONDARY_PROGRESS_SET);
  return <ProgressBar value={progress} />;
};

const ActionsWrapper = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
`;

const getDefaultHeight = () => Math.floor(window.innerHeight / 4);
const getMinHeight = () => 36;
const getMaxHeight = () => {
  const bottomHeight = document
    .getElementById(PgView.ids.BOTTOM)
    ?.getBoundingClientRect()?.height;
  return window.innerHeight - (bottomHeight ?? 0);
};

const getPage = (page: MainSecondaryPageName) => {
  return MAIN_SECONDARY.find((p) => p.name === page)!;
};

export default Secondary;
