import { ChangeEvent, FC, useEffect, useState } from "react";
import { BN, Idl } from "@project-serum/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import styled, { css } from "styled-components";

import Button from "../../../../Button";
import Foldable from "../../../../Foldable";
import InputLabel from "./InputLabel";
import Input, { defaultInputProps } from "../../../../Input";
import { ClassName } from "../../../../../constants";
import { PgAccount, PgCommon } from "../../../../../utils/pg";
import { SpinnerWithBg } from "../../../../Loading";
import { useCurrentWallet } from "../../../Wallet";

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
  const [fetchedData, setFetchedData] = useState<object>();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchOneLoading, setFetchOneLoading] = useState(false);
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

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleFetched = (data: object) => {
    setFetchedData(data);
    setFetchError(null);
    setResultOpen(true);
  };

  const handleError = (err: any) => {
    if (err.message.startsWith("Account does not exist")) {
      setFetchError("Account does not exist");
    } else if (err.message === "Invalid account discriminator") {
      setFetchError(`Given account is not type ${accountName}`);
    } else {
      console.error(err);
      setFetchError("Unknown error");
    }

    setResultOpen(true);
  };

  const fetchOne = async () => {
    if (!currentWallet) return;
    setFetchOneLoading(true);
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
      setFetchOneLoading(false);
    }
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

  return (
    <>
      <InputWrapper>
        <InputLabel label="address" type="publicKey" />
        <Input
          type="text"
          className={enteredAddressError ? ClassName.ERROR : ""}
          value={enteredAddress}
          onChange={handleAddressChange}
          {...defaultInputProps}
        />
      </InputWrapper>

      <ButtonsWrapper>
        <Button
          onClick={fetchOne}
          disabled={
            !currentWallet ||
            !enteredAddress ||
            enteredAddressError ||
            fetchOneLoading
          }
          kind="outline"
        >
          Fetch
        </Button>
        <Button
          onClick={fetchAll}
          disabled={!currentWallet || fetchAllLoading}
          kind="outline"
        >
          Fetch All
        </Button>
      </ButtonsWrapper>

      {(fetchedData || fetchError) && (
        <ResultWrapper>
          <Foldable
            ClickEl={<span>Result</span>}
            open={resultOpen}
            setOpen={setResultOpen}
          >
            <SpinnerWithBg loading={fetchOneLoading || fetchAllLoading}>
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
      )}
    </>
  );
};

interface IndexProp {
  index: number;
}

const FetchableAccountWrapper = styled.div<IndexProp>`
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
  gap: 0.75rem;
`;

const ResultWrapper = styled.div`
  margin-top: 1rem;
  width: 100%;
`;

const Result = styled.pre<IndexProp>`
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

const ErrorWrapper = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem 0.25rem;
    color: ${theme.colors.state.error.color};
    text-align: center;
  `}
`;

export default FetchableAccount;
