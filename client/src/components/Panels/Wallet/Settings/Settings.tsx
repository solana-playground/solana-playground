import { useCallback, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../../../Button";
import { ClassName, Id } from "../../../../constants";
import { ThreeDots } from "../../../Icons";
import { Airdrop } from "./Airdrop";
import { ConnectSol } from "./ConnectSol";
import { ExportKeypair } from "./ExportKeypair";
import { ImportKeypair } from "./ImportKeypair";
import { NewWallet } from "./NewWallet";

export const WalletSettings = () => {
  const [show, setShow] = useState(false);

  const toggle = useCallback(() => {
    setShow((s) => !s);
    document.getElementById(Id.WALLET_MAIN)?.classList.toggle(ClassName.DARKEN);
  }, []);

  const close = useCallback(() => {
    setShow(false);
    document.getElementById(Id.WALLET_MAIN)?.classList.remove(ClassName.DARKEN);
  }, []);

  const settingsRef = useRef<HTMLDivElement>(null);

  // Click events
  useEffect(() => {
    if (!show || !settingsRef.current) return;

    const handleClick = (e: globalThis.MouseEvent) => {
      if (!settingsRef.current?.contains(e.target as Node)) close();
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [show, close]);

  return (
    <SettingsWrapper>
      <Button onClick={toggle} kind="icon" title="More">
        <ThreeDots />
      </Button>
      {show && (
        <SettingsList ref={settingsRef}>
          <Airdrop close={close} />
          <ImportKeypair close={close} />
          <ExportKeypair />
          <NewWallet close={close} />
          <ConnectSol close={close} />
        </SettingsList>
      )}
    </SettingsWrapper>
  );
};

const SettingsWrapper = styled.div`
  position: absolute;
  left: 1rem;
  z-index: 2;
`;

const SettingsList = styled.div`
  ${({ theme }) => css`
    position: absolute;
    left: 0;
    top: 1.75rem;
    background-color: ${theme.colors?.right?.bg};
    font-size: ${theme.font?.code?.size.small};
    box-shadow: ${theme.boxShadow};
    border-radius: ${theme.borderRadius};
    width: max-content;
    padding: 0.25rem 0;
    overflow-y: auto;

    /* Scrollbar */
    /* Chromium */
    &::-webkit-scrollbar {
      width: 0.25rem;
      height: 0.25rem;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border: 0.25rem solid transparent;
      border-radius: ${theme.borderRadius};
      background-color: ${theme.scrollbar?.thumb.color};
    }

    &::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.scrollbar?.thumb.hoverColor};
    }

    /* Firefox */
    & * {
      scrollbar-color: ${theme.scrollbar?.thumb.color};
    }
  `}
`;
