import { useCallback, useState } from "react";
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
import { EventName } from "../../../../../constants";
import { useKeybind, useSetStatic } from "../../../../../hooks";

// TODO: Import dynamically
import Terminal from "../../../../../views/main/secondary/Terminal";

const Secondary = () => {
  // Resize
  const [height, setHeight] = useState(PgTerminal.DEFAULT_HEIGHT);
  useSetStatic(setHeight, EventName.TERMINAL_HEIGHT_SET);

  const handleResizeStop = useCallback((_e, _dir, _ref, d) => {
    setHeight((h) => {
      const result = h + d.height;
      if (result > PgTerminal.MAX_HEIGHT) return PgTerminal.MAX_HEIGHT;
      return result;
    });
  }, []);

  // Buttons
  const toggleMaximize = useCallback(() => {
    setHeight((h) =>
      h === PgTerminal.MAX_HEIGHT
        ? PgTerminal.DEFAULT_HEIGHT
        : PgTerminal.MAX_HEIGHT
    );
  }, []);

  const toggleMinimize = useCallback(() => {
    setHeight((h) =>
      h === PgTerminal.MIN_HEIGHT
        ? PgTerminal.DEFAULT_HEIGHT
        : PgTerminal.MIN_HEIGHT
    );
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
            if (height === PgTerminal.MIN_HEIGHT) toggleMinimize(); // Minimized
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
          if (height === PgTerminal.MIN_HEIGHT) PgTerminal.focus();
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
      minHeight={PgTerminal.MIN_HEIGHT}
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
              {height === PgTerminal.MAX_HEIGHT &&
              PgTerminal.MAX_HEIGHT !== PgTerminal.DEFAULT_HEIGHT ? (
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
              {height === PgTerminal.MIN_HEIGHT ? <Tick /> : <Close />}
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
      height: ${PgTerminal.MIN_HEIGHT}px;
    }

    & > div:last-child {
      height: calc(100% - ${PgTerminal.MIN_HEIGHT}px);
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

export default Secondary;
