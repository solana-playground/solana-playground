import { ChangeEvent, FC, useState } from "react";
import { Idl } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import styled, { css } from "styled-components";

import Button from "../../../../../../components/Button";
import Foldable from "../../../../../../components/Foldable";
import InputLabel from "./InputLabel";
import Input from "../../../../../../components/Input";
import { PgAccount, PgCommon } from "../../../../../../utils/pg";
import { SpinnerWithBg } from "../../../../../../components/Loading";
import { useCurrentWallet } from "../../../Wallet";
import { CodeResult } from "./CodeResult";
import { usePgConnection } from "../../../../../../hooks";

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
  const { connection: conn } = usePgConnection();
  const { currentWallet } = useCurrentWallet();

  const [enteredAddress, setEnteredAddress] = useState("");
  const [enteredAddressError, setEnteredAddressError] = useState(false);
  const [fetchedData, setFetchedData] = useState<object>();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchOneLoading, setFetchOneLoading] = useState(false);
  const [fetchAllLoading, setFetchAllLoading] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);

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
    try {
      const accountData = await PgCommon.transition(
        PgAccount.fetchOne(
          accountName,
          new PublicKey(enteredAddress),
          idl,
          conn,
          currentWallet
        )
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
    try {
      const accountData = await PgCommon.transition(
        PgAccount.fetchAll(accountName, idl, conn, currentWallet)
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
          error={enteredAddressError}
          value={enteredAddress}
          onChange={handleAddressChange}
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
              <CodeResult index={index}>
                {fetchError ? (
                  <ErrorWrapper>{fetchError}</ErrorWrapper>
                ) : (
                  PgCommon.prettyJSON(fetchedData!)
                )}
              </CodeResult>
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
    border-top: 1px solid ${theme.colors.default.border};
    background: ${index % 2 === 0 &&
    theme.components.sidebar.right.default.otherBg};

    &:last-child {
      border-bottom: 1px solid ${theme.colors.default.border};
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

const ErrorWrapper = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem 0.25rem;
    color: ${theme.colors.state.error.color};
    text-align: center;
  `}
`;

export default FetchableAccount;
