import {
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";
import "xterm/css/xterm.css";

import Button from "../../../../../components/Button";
import ProgressBar from "../../../../../components/ProgressBar";
import Resizable from "../../../../../components/Resizable";
import { Close, DoubleArrow, Tick } from "../../../../../components/Icons";
import {
  NullableJSX,
  PgCommon,
  // TODO: Remove
  PgEditor,
  PgTheme,
} from "../../../../../utils/pg";
import { EventName, Id } from "../../../../../constants";
import { useAsyncEffect, useKeybind, useSetStatic } from "../../../../../hooks";
import { MAIN_SECONDARY } from "../../../../../views";

const Secondary = () => {
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
  useSetStatic(setCheckedHeight, EventName.VIEW_MAIN_SECONDARY_HEIGHT_SET);

  const [page, setPage] = useState<MainSecondaryPageName>("Terminal");
  useSetStatic(setPage, EventName.VIEW_MAIN_SECONDARY_PAGE_SET);
  useEffect(() => {
    PgCommon.createAndDispatchCustomEvent(
      EventName.VIEW_ON_DID_CHANGE_MAIN_SECONDARY_PAGE,
      page
    );
  }, [page]);
  const pageInfo = useMemo(() => getPage(page), [page]);

  const [el, setEl] = useState<NullableJSX>(null);
  useAsyncEffect(async () => {
    const { default: PageComponent } = await pageInfo.importElement();
    setEl(<PageComponent />);
  }, [pageInfo]);

  const handleResizeStop = useCallback(
    (_e, _dir, _ref, d) => setCheckedHeight((h) => h + d.height),
    [setCheckedHeight]
  );

  // Buttons
  const toggleMaximize = useCallback(() => {
    setHeight((h) => {
      const maxHeight = getMaxHeight();
      return h === maxHeight ? oldHeight.current : maxHeight;
    });
  }, []);

  const toggleMinimize = useCallback(() => {
    setHeight((h) => {
      const minHeight = getMinHeight();
      if (h === minHeight) pageInfo.focus();
      else PgEditor.focus();
      return h === minHeight ? oldHeight.current : minHeight;
    });
  }, [pageInfo]);

  // Default action keybinds
  useKeybind("Ctrl+M", toggleMaximize, [toggleMaximize]);
  useKeybind("Ctrl+J", toggleMinimize, [toggleMinimize]);

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

  // Page action keybinds
  useKeybind(
    (pageInfo.actions ?? [])
      .filter((a) => a.keybind)
      .map((a) => ({
        keybind: a.keybind!,
        handle: a.run,
      })),
    [pageInfo]
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
          <TerminalProgress />
          <ButtonsWrapper>
            {pageInfo.actions?.map((action) => (
              <Button
                key={action.name}
                kind="icon"
                title={PgCommon.getKeybindTextOS(
                  action.keybind
                    ? `${action.name} (${action.keybind})`
                    : action.name
                )}
                onClick={action.run}
              >
                {action.icon}
              </Button>
            ))}

            <Button
              kind="icon"
              title={PgCommon.getKeybindTextOS("Toggle Maximize (Ctrl+M)")}
              onClick={toggleMaximize}
            >
              {height === getMaxHeight() &&
              getMaxHeight() !== getDefaultHeight() ? (
                <DoubleArrow rotate="180deg" />
              ) : (
                <DoubleArrow />
              )}
            </Button>
            <Button
              kind="icon"
              title={PgCommon.getKeybindTextOS("Toggle Minimize (Ctrl+J)")}
              onClick={toggleMinimize}
            >
              {height === getMinHeight() ? <Tick /> : <Close />}
            </Button>
          </ButtonsWrapper>
        </Topbar>

        {el}
      </Wrapper>
    </Resizable>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.secondary.default)};

    & > div:first-child {
      height: ${getMinHeight()}px;
    }

    & > div:last-child {
      height: calc(100% - ${getMinHeight()}px);
    }
  `}
`;

const Topbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
`;

const TerminalProgress = () => {
  const [progress, setProgress] = useState(0);
  useSetStatic(setProgress, EventName.TERMINAL_PROGRESS_SET);
  return <ProgressBar value={progress} />;
};

const ButtonsWrapper = styled.div`
  display: flex;
  gap: 0.25rem;
  margin-left: 0.5rem;
`;

const getDefaultHeight = () => Math.floor(window.innerHeight / 4);
const getMinHeight = () => 36;
const getMaxHeight = () => {
  const bottomHeight = document
    .getElementById(Id.BOTTOM)
    ?.getBoundingClientRect()?.height;
  return window.innerHeight - (bottomHeight ?? 0);
};

const getPage = (page: MainSecondaryPageName) => {
  return MAIN_SECONDARY.find((p) => p.name === page)!;
};

export default Secondary;
