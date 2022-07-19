import { BN, Idl } from "@project-serum/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import React, { FC, useEffect, useState } from "react";
import styled, { css } from "styled-components";
import { ClassName } from "../../../../../constants";
import { PgCommon } from "../../../../../utils/pg";
import { PgAccount } from "../../../../../utils/pg/account";
import Button from "../../../../Button";
import Foldable from "../../../../Foldable";
import Input, { defaultInputProps } from "../../../../Input";
import { SpinnerWithBg } from "../../../../Loading";
import { useCurrentWallet } from "../../../Wallet";
import InputLabel from "./InputLabel";

interface FetchableAccountProps {
  accountName: string;
  idl: Idl;
  index: number;
}

const FetchableAccount: FC<FetchableAccountProps> = ({
  accountName,
  idl,
  index,
}) => (
  <FetchableAccountWrapper index={index}>
    <Foldable ClickEl={<AccountName>{accountName}</AccountName>}>
      <FetchableAccountInside
        idl={idl}
        accountName={accountName}
        index={index}
      />
    </Foldable>
  </FetchableAccountWrapper>
);

const FetchableAccountInside: FC<FetchableAccountProps> = ({
  accountName,
  idl,
  index,
}) => {
  const { connection: conn } = useConnection();
  const { currentWallet } = useCurrentWallet();

  const [enteredAddress, setEnteredAddress] = useState("");
  const [enteredAddressError, setEnteredAddressError] = useState(false);
  const [fetchedData, setFetchedData] = useState<any>();
  const [fetchError, setFetchError] = useState<string | undefined>(undefined);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchAllLoading, setFetchAllLoading] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);

  useEffect(() => {
    // The default BN.toJSON is a hex string, but we want a readable string
    // Temporarily change it to use a plain toString while this component is mounted
    const oldBNPrototypeToJSON = BN.prototype.toJSON;
    BN.prototype.toJSON = function (this: BN) {
      return this.toString();
    };

    // Change the toJSON prototype back on unmount
    return () => {
      BN.prototype.toJSON = oldBNPrototypeToJSON;
    };
  }, []);

  const handleError = (err: any) => {
    if (
      err instanceof Error &&
      err.message.startsWith("Account does not exist")
    ) {
      setFetchError("Account does not exist");
    } else {
      console.error(err);
      setFetchError("Unknown error");
    }

    setResultOpen(true);
  };

  const handleFetched = (data: any) => {
    setFetchedData(data);
    setFetchError(undefined);
    setResultOpen(true);
  };

  const fetchAll = async () => {
    if (!currentWallet) return;
    setFetchAllLoading(true);
    await PgCommon.sleep(PgCommon.TRANSITION_SLEEP);
    try {
      const accountData = await PgAccount.fetchAll(
        accountName,
        idl,
        conn,
        currentWallet
      );
      handleFetched(accountData);
    } catch (err: any) {
      handleError(err);
    } finally {
      setFetchAllLoading(false);
    }
  };

  const fetchEntered = async () => {
    if (!currentWallet) return;
    setFetchLoading(true);
    await PgCommon.sleep(PgCommon.TRANSITION_SLEEP);
    try {
      const accountData = await PgAccount.fetchOne(
        accountName,
        new PublicKey(enteredAddress),
        idl,
        conn,
        currentWallet
      );
      handleFetched(accountData);
    } catch (err: any) {
      handleError(err);
    } finally {
      setFetchLoading(false);
    }
  };

  const enteredAddressChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    if (address) {
      try {
        new PublicKey(address);
        setEnteredAddressError(false);
      } catch {
        setEnteredAddressError(true);
      }
    }

    setEnteredAddress(address);
  };

  const anyLoading = fetchLoading || fetchAllLoading;

  const renderResult = () => {
    if (fetchedData) {
      return (
        <ResultWrapper>
          <Foldable
            ClickEl={<span>Result</span>}
            open={resultOpen}
            setOpen={setResultOpen}
          >
            <SpinnerWithBg loading={anyLoading}>
              <Result index={index}>
                {fetchError ? (
                  <ErrorWrapper>{fetchError}</ErrorWrapper>
                ) : (
                  JSON.stringify(fetchedData, null, 2)
                )}
              </Result>
            </SpinnerWithBg>
          </Foldable>
        </ResultWrapper>
      );
    }

    return null;
  };

  return (
    <>
      <InputWrapper>
        <InputLabel label="address" type="publicKey" />
        <Input
          type="text"
          className={enteredAddressError ? ClassName.ERROR : ""}
          value={enteredAddress}
          onChange={enteredAddressChanged}
          {...defaultInputProps}
        />
      </InputWrapper>

      <ButtonsWrapper>
        <Button
          onClick={fetchEntered}
          disabled={
            !enteredAddress ||
            enteredAddressError ||
            !currentWallet ||
            fetchLoading
          }
          btnLoading={fetchLoading}
          kind="outline"
          fullWidth={false}
          size="small"
        >
          Fetch Entered
        </Button>
        <Button
          onClick={fetchAll}
          disabled={!currentWallet || fetchAllLoading}
          btnLoading={fetchAllLoading}
          kind="outline"
          fullWidth={false}
          size="small"
        >
          Fetch All
        </Button>
      </ButtonsWrapper>

      {renderResult()}
    </>
  );
};

interface FetchableAccountWrapperProps {
  index: number;
}

const FetchableAccountWrapper = styled.div<FetchableAccountWrapperProps>`
  ${({ theme, index }) => css`
    padding: 1rem;
    border-top: 1px solid ${theme.colors.default.borderColor};
    background-color: ${index % 2 === 0 && theme.colors.right?.otherBg};

    &:last-child {
      border-bottom: 1px solid ${theme.colors.default.borderColor};
    }
  `}
`;

const AccountName = styled.span`
  font-weight: bold;
`;

const InputWrapper = styled.div`
  margin: 0.5rem 0;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
`;

const ResultWrapper = styled.div`
  margin-top: 1rem;
  width: 100%;
`;

const ErrorWrapper = styled.div`
  ${({ theme }) => css`
    margin: 0.5rem 0;
    color: ${theme.colors.state.error.color};
    text-align: center;
  `}
`;

const Result = styled.pre<{ index: number }>`
  ${({ theme, index }) => css`
    margin-top: 0.25rem;
    user-select: text;
    width: 100%;
    overflow-x: auto;
    padding: 0.75rem 0.5rem;
    background-color: ${index % 2 === 1
      ? theme.colors.right?.otherBg
      : theme.colors.right?.bg};
    border-radius: ${theme.borderRadius};

    /* Scrollbar */
    /* Chromium */
    &::-webkit-scrollbar {
      height: 0.5rem;
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

export default FetchableAccount;
