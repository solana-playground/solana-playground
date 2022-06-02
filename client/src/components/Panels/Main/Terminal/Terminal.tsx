import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled, { css, useTheme } from "styled-components";
import { Resizable } from "re-resizable";
import { Terminal as XTerm } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";

import Button from "../../../Button";
import Progress from "../../../Progress";
import { Clear, Close, DoubleArrow, Tick } from "../../../Icons";
import { terminalAtom, terminalProgressAtom } from "../../../../state";
import { PgCommon, PgTerminal } from "../../../../utils/pg";

const Terminal = () => {
  const [terminal] = useAtom(terminalAtom);
  const [progress] = useAtom(terminalProgressAtom);

  const terminalRef = useRef<HTMLDivElement>(null);

  const theme = useTheme();

  // Load xterm
  const xterm = useMemo(() => {
    const state = theme.colors.state;

    return new XTerm({
      convertEol: true,
      rendererType: "dom",
      fontSize: 14,
      theme: {
        brightGreen: state.success.color,
        brightRed: state.error.color,
        brightYellow: state.warning.color,
        brightBlue: state.info.color,
      },
    });
  }, [theme]);

  // Load addons
  const fitAddon = useMemo(() => {
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    return fitAddon;
  }, [xterm]);

  useEffect(() => {
    if (xterm && terminalRef.current) {
      const hasChild = terminalRef.current.hasChildNodes();
      if (hasChild)
        terminalRef.current.removeChild(terminalRef.current.childNodes[0]);

      xterm.open(terminalRef.current);
      fitAddon.fit();

      // Welcome text
      xterm.writeln(PgTerminal.DEFAULT_TEXT);
      if (hasChild) xterm.writeln("");
    }
  }, [xterm, fitAddon]);

  // New output
  useEffect(() => {
    if (terminalRef.current) {
      xterm.writeln(PgTerminal.colorText(terminal));
      xterm.scrollToBottom();
    }
  }, [terminal, xterm]);

  // Resize
  const [height, setHeight] = useState(PgTerminal.DEFAULT_HEIGHT);

  useEffect(() => {
    fitAddon.fit();
  }, [fitAddon, height]);

  const handleResize = useCallback(() => {
    fitAddon.fit();
  }, [fitAddon]);

  // Resize the terminal on window resize event
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  // Resize the terminal on interval just in case of a resizing bug
  useEffect(() => {
    const intervalId = setInterval(() => {
      handleResize();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [handleResize]);

  const handleResizeStop = useCallback(
    (_e, _dir, _ref, d) => {
      setHeight((h) => h + d.height);
    },
    [setHeight]
  );

  // Buttons
  const clear = useCallback(() => {
    xterm.clear();
  }, [xterm]);

  const maxButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMaximize = useCallback(() => {
    setHeight((h) => {
      if (h === "100%") {
        maxButtonRef.current?.classList.remove("down");
        return PgTerminal.DEFAULT_HEIGHT;
      }

      maxButtonRef.current?.classList.add("down");
      return "100%";
    });
  }, [setHeight]);

  const [isClosed, setIsClosed] = useState(false);

  const toggleClose = useCallback(() => {
    setIsClosed((c) => !c);
    setHeight((h) => {
      if (h === "0%") return PgTerminal.DEFAULT_HEIGHT;
      return "0%";
    });
  }, [setHeight, setIsClosed]);

  // Keybinds
  useEffect(() => {
    const handleKeybinds = (e: globalThis.KeyboardEvent) => {
      // TODO: Focus terminal
      if (PgCommon.isKeyctrlOrCmd(e)) {
        if (e.key === "l") {
          e.preventDefault();
          clear();
        } else if (e.key === "`") {
          e.preventDefault();
          toggleClose();
        } else if (e.key === "j") {
          e.preventDefault();
          toggleClose();
        } else if (e.key === "m") {
          e.preventDefault();
          toggleMaximize();
        }
      }
    };

    document.addEventListener("keydown", handleKeybinds);
    return () => document.removeEventListener("keydown", handleKeybinds);
  }, [clear, toggleClose, toggleMaximize]);

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
      <Wrapper>
        <Topbar>
          <Progress value={progress} />
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
      background-color: ${theme.colors.scrollbar?.thumb.color};
    }

    & ::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.colors.scrollbar?.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.colors.scrollbar?.thumb.color};
    }
  `}
`;

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
    height: fit-content;
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
      color: ${theme.colors.terminal?.color ??
      theme.colors.default.textPrimary} !important;
    }

    /* TODO: */
    & .xterm.xterm-cursor-block,
    .xterm .xterm-cursor-block {
      display: none;
    }
  `}
`;

export default Terminal;
