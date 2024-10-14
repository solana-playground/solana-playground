import { SetStateAction, useCallback, useState } from "react";
import styled, { css } from "styled-components";
import "xterm/css/xterm.css";

import Button from "../../../../../components/Button";
import ProgressBar from "../../../../../components/ProgressBar";
import Resizable from "../../../../../components/Resizable";
import {
  Clear,
  Close,
  DoubleArrow,
  Tick,
} from "../../../../../components/Icons";
import {
  PgCommon,
  // TODO: Remove
  PgEditor,
  // TODO: Remove
  PgTerminal,
  PgTheme,
} from "../../../../../utils/pg";
import { EventName, Id } from "../../../../../constants";
import { useKeybind, useSetStatic } from "../../../../../hooks";

// TODO: Import dynamically
import Terminal from "../../../../../views/main/secondary/Terminal";

const Secondary = () => {
  const [height, setHeight] = useState(getDefaultHeight);
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

  const handleResizeStop = useCallback(
    (_e, _dir, _ref, d) => setCheckedHeight((h) => h + d.height),
    [setCheckedHeight]
  );

  // Buttons
  const toggleMaximize = useCallback(() => {
    setHeight((h) => {
      const maxHeight = getMaxHeight();
      return h === maxHeight ? getDefaultHeight() : maxHeight;
    });
  }, []);

  const toggleMinimize = useCallback(() => {
    setHeight((h) => {
      const minHeight = getMinHeight();
      return h === minHeight ? getDefaultHeight() : minHeight;
    });
  }, []);

  // Keybinds
  useKeybind(
    [
      {
        keybind: "Ctrl+`",
        handle: () => {
          if (PgTerminal.isFocused()) {
            toggleMinimize();
            PgEditor.focus();
          } else {
            if (height === getMinHeight()) toggleMinimize();
            PgTerminal.focus();
          }
        },
      },
      {
        keybind: "Ctrl+M",
        handle: toggleMaximize,
      },
      {
        keybind: "Ctrl+J",
        handle: () => {
          toggleMinimize();
          if (height === getMinHeight()) PgTerminal.focus();
          else PgEditor.focus();
        },
      },
    ],
    [height]
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
            <Button
              kind="icon"
              title={PgCommon.getKeybindTextOS("Clear (Ctrl+L)")}
              onClick={PgTerminal.clear}
            >
              <Clear />
            </Button>
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
              title={PgCommon.getKeybindTextOS("Toggle Close (Ctrl+`)")}
              onClick={toggleMinimize}
            >
              {height === getMinHeight() ? <Tick /> : <Close />}
            </Button>
          </ButtonsWrapper>
        </Topbar>

        <Terminal />
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
  margin-left: 0.5rem;

  & button {
    margin-left: 0.25rem;
  }

  & button.down svg {
    transform: rotate(180deg);
  }
`;

const getDefaultHeight = () => Math.floor(window.innerHeight / 4);
const getMinHeight = () => 36;
const getMaxHeight = () => {
  const bottomHeight = document
    .getElementById(Id.BOTTOM)
    ?.getBoundingClientRect()?.height;
  return window.innerHeight - (bottomHeight ?? 0);
};

export default Secondary;
