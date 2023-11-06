import { FC, useState } from "react";
import styled, { css } from "styled-components";
import { PublicKey } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";

import Button from "../../../../components/Button";
import Foldable from "../../../../components/Foldable";
import InputLabel from "./InputLabel";
import Input from "../../../../components/Input";
import Text from "../../../../components/Text";
import { CodeResult } from "./CodeResult";
import { SpinnerWithBg } from "../../../../components/Loading";
import { PgAccount, PgCommon } from "../../../../utils/pg";
import { useConnection, useWallet } from "../../../../hooks";

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
    <Foldable element={<AccountName>{accountName}</AccountName>}>
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
  const { connection } = useConnection();
  const { wallet } = useWallet();

  const [enteredAddress, setEnteredAddress] = useState("");
  const [enteredAddressError, setEnteredAddressError] = useState(false);
  const [fetchedData, setFetchedData] = useState<object>();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchOneLoading, setFetchOneLoading] = useState(false);
  const [fetchAllLoading, setFetchAllLoading] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);

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
    if (!wallet) return;

    setFetchOneLoading(true);
    try {
      const accountData = await PgCommon.transition(
        PgAccount.fetchOne(
          accountName,
          new PublicKey(enteredAddress),
          idl,
          connection,
          wallet
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
    if (!wallet) return;

    setFetchAllLoading(true);
    try {
      const accountData = await PgCommon.transition(
        PgAccount.fetchAll(accountName, idl, connection, wallet)
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
          value={enteredAddress}
          onChange={(ev) => setEnteredAddress(ev.target.value)}
          error={enteredAddressError}
          setError={setEnteredAddressError}
          validator={PgCommon.isPk}
        />
      </InputWrapper>

      <ButtonsWrapper>
        <Button
          onClick={fetchOne}
          disabled={!wallet || !enteredAddress || enteredAddressError}
          kind="outline"
        >
          Fetch
        </Button>
        <Button onClick={fetchAll} disabled={!wallet} kind="outline">
          Fetch All
        </Button>
      </ButtonsWrapper>

      {(fetchedData || fetchError) && (
        <ResultWrapper>
          <Foldable
            element={<span>Result</span>}
            open={resultOpen}
            setOpen={setResultOpen}
          >
            <SpinnerWithBg loading={fetchOneLoading || fetchAllLoading}>
              {fetchError ? (
                <FetchError kind="error">{fetchError}</FetchError>
              ) : (
                <CodeResult index={index}>
                  {PgCommon.prettyJSON(fetchedData!)}
                </CodeResult>
              )}
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

const FetchError = styled(Text)`
  width: 100%;
`;

export default FetchableAccount;
