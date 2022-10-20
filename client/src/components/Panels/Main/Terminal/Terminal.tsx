import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled, { css, useTheme } from "styled-components";
import { Resizable } from "re-resizable";
import "xterm/css/xterm.css";

import Button from "../../../Button";
import Progress from "../../../Progress";
import { useTerminal } from "./useTerminal";
import { Clear, Close, DoubleArrow, Tick } from "../../../Icons";
import { terminalProgressAtom } from "../../../../state";
import { PgCommon, PgEditor, PgTerm, PgTerminal } from "../../../../utils/pg";
import { EventName, Id } from "../../../../constants";
import { useExposeStatic } from "../../../../hooks";

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useTerminal();

  const theme = useTheme();

  // Load xterm
  const term = useMemo(() => {
    return new PgTerm({
      convertEol: true,
      rendererType: "dom",
      fontSize: 14,
      theme: {
        brightGreen: theme.colors.state.success.color,
        brightRed: theme.colors.state.error.color,
        brightYellow: theme.colors.state.warning.color,
        brightBlue: theme.colors.state.info.color,
        brightMagenta: theme.colors.default.primary,
        black: theme.colors.default.textSecondary,
        brightBlack: theme.colors.default.textSecondary,
        brightCyan: theme.colors.default.secondary,
        background: theme.colors.terminal?.bg,
        foreground: theme.colors.terminal?.color,
        selection: theme.colors.terminal?.selectionBg,
        cursor: theme.colors.terminal?.cursorColor,
      },
    });
  }, [theme]);

  useExposeStatic(term, EventName.TERMINAL_STATIC);

  // Open and fit terminal
  useEffect(() => {
    if (term && terminalRef.current) {
      const hasChild = terminalRef.current.hasChildNodes();
      if (hasChild)
        terminalRef.current.removeChild(terminalRef.current.childNodes[0]);

      term.open(terminalRef.current);
      term.fit();
    }
  }, [term]);

  // Resize
  const [height, setHeight] = useState(PgTerminal.DEFAULT_HEIGHT);

  useEffect(() => {
    term.fit();
  }, [term, height]);

  const handleResize = useCallback(() => {
    term.fit();
  }, [term]);

  // Resize the terminal on window resize event
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Resize the terminal on interval just in case of a resizing bug
  useEffect(() => {
    const intervalId = setInterval(() => {
      handleResize();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [handleResize]);

  const handleResizeStop = useCallback(
    (_e, _dir, _ref, d) => {
      setHeight((h) => {
        const result = h + d.height;
        if (result > PgTerminal.MAX_HEIGHT) return PgTerminal.MAX_HEIGHT;
        return result;
      });
    },
    [setHeight]
  );

  // Buttons
  const clear = useCallback(() => {
    term.clear();
  }, [term]);

  const maxButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMaximize = useCallback(() => {
    setHeight((h) => {
      if (h === PgTerminal.MAX_HEIGHT) {
        maxButtonRef.current?.classList.remove("down");
        return PgTerminal.DEFAULT_HEIGHT;
      }
      maxButtonRef.current?.classList.add("down");
      return PgTerminal.MAX_HEIGHT;
    });
  }, [setHeight]);

  const [isClosed, setIsClosed] = useState(false);

  const toggleClose = useCallback(() => {
    setIsClosed((c) => !c);
    setHeight((h) => {
      if (h === 0) return PgTerminal.DEFAULT_HEIGHT;
      return 0;
    });
  }, [setHeight, setIsClosed]);

  // Keybinds
  useEffect(() => {
    const handleKeybinds = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (PgCommon.isKeyCtrlOrCmd(e)) {
        switch (key) {
          case "L":
            e.preventDefault();
            clear();
            break;

          case "`":
            e.preventDefault();
            if (PgTerminal.isFocused()) {
              toggleClose();
              PgEditor.focus();
            } else if (!height) {
              // Terminal is minimized
              toggleClose();
              term.focus();
            } else term.focus();

            break;

          case "M":
            e.preventDefault();
            toggleMaximize();
            break;

          case "J":
            e.preventDefault();
            toggleClose();
            if (!height) term.focus();
            else PgEditor.focus();

            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeybinds);
    return () => document.removeEventListener("keydown", handleKeybinds);
  }, [term, height, clear, toggleClose, toggleMaximize]);

  // Terminal custom events
  useEffect(() => {
    const handleEnable = () => {
      term.enable();
    };
    const handleDisable = () => {
      term.disable();
    };
    const handleScrollToBottom = () => {
      term.scrollToBottom();
    };
    const handleRunLastCmd = () => {
      term.runLastCmd();
    };
    const handleRunCmdFromStr = (e: UIEvent) => {
      const cmd = e.detail as unknown as string;
      term.runCmdFromStr(cmd);
    };

    document.addEventListener(EventName.TERMINAL_ENABLE, handleEnable);
    document.addEventListener(EventName.TERMINAL_DISABLE, handleDisable);
    document.addEventListener(
      EventName.TERMINAL_SCROLL_TO_BOTTOM,
      handleScrollToBottom
    );
    document.addEventListener(
      EventName.TERMINAL_RUN_LAST_CMD,
      handleRunLastCmd
    );
    document.addEventListener(
      EventName.TERMINAL_RUN_CMD_FROM_STR,
      handleRunCmdFromStr as EventListener
    );

    return () => {
      document.removeEventListener(EventName.TERMINAL_ENABLE, handleEnable);
      document.removeEventListener(EventName.TERMINAL_DISABLE, handleDisable);
      document.removeEventListener(
        EventName.TERMINAL_SCROLL_TO_BOTTOM,
        handleScrollToBottom
      );
      document.removeEventListener(
        EventName.TERMINAL_RUN_LAST_CMD,
        handleRunLastCmd
      );
      document.removeEventListener(
        EventName.TERMINAL_RUN_CMD_FROM_STR,
        handleRunCmdFromStr as EventListener
      );
    };
  }, [term]);

  return (
    <Resizable
      size={{ height, width: "100%" }}
      minWidth={"100%"}
      minHeight={PgTerminal.MIN_HEIGHT}
      onResizeStop={handleResizeStop}
      onResize={handleResize}
      enable={{
        top: true,
        right: false,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false,
      }}
    >
      <Wrapper id={Id.TERMINAL}>
        <Topbar>
          <TerminalProgress />
          <ButtonsWrapper>
            <Button
              kind="icon"
              title={PgCommon.getKeybindTextOS("Clear (Ctrl+L)")}
              onClick={clear}
            >
              <Clear />
            </Button>
            <Button
              kind="icon"
              title={PgCommon.getKeybindTextOS("Toggle Maximize (Ctrl+M)")}
              onClick={toggleMaximize}
              ref={maxButtonRef}
            >
              <DoubleArrow />
            </Button>
            <Button
              kind="icon"
              title={PgCommon.getKeybindTextOS("Toggle Close (Ctrl+`)")}
              onClick={toggleClose}
            >
              {isClosed ? <Tick /> : <Close />}
            </Button>
          </ButtonsWrapper>
        </Topbar>
        <TerminalWrapper ref={terminalRef} />
      </Wrapper>
    </Resizable>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    height: 100%;
    overflow: hidden;
    background-color: ${theme.colors.terminal?.bg ?? "inherit"};
    color: ${theme.colors.terminal?.color ?? "inherit"};
    border-top: 1px solid ${theme.colors.default.primary};

    /* Scrollbar */
    /* Chromium */
    & ::-webkit-scrollbar {
      width: 0.5rem;
    }

    & ::-webkit-scrollbar-track {
      background-color: transparent;
    }

    & ::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.borderRadius};
      background-color: ${theme.scrollbar?.thumb.color};
    }

    & ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.scrollbar?.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.scrollbar?.thumb.color};
    }
  `}
`;

const TerminalProgress = () => {
  const [progress] = useAtom(terminalProgressAtom);
  return <Progress value={progress} />;
};

const Topbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${PgTerminal.MIN_HEIGHT}px;
  padding: 0 1rem;
`;

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

// minHeight fixes text going below too much which made bottom text invisible
const TerminalWrapper = styled.div`
  ${({ theme }) => css`
    height: calc(100% - ${PgTerminal.MIN_HEIGHT}px);
    margin-left: 1rem;

    & .xterm-viewport {
      background-color: inherit !important;
      width: 100% !important;
    }

    & .xterm-rows {
      font-family: ${theme.font?.family} !important;
      font-size: ${theme.font?.size.medium} !important;
    }
  `}
`;

export default Terminal;
