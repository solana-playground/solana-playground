import { BN, Idl } from "@project-serum/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { FC, useEffect, useState } from "react";
import styled, { css } from "styled-components";
import { PgAccount } from "../../../../../utils/pg/account";
import Button from "../../../../Button";
import Foldable from "../../../../Foldable";
import Input, { defaultInputProps } from "../../../../Input";
import { useCurrentWallet } from "../../../Wallet";
import InputLabel from "./InputLabel";

interface FetchableAccountProps extends FetchableAccountInsideProps {
  index: number;
}

const FetchableAccount: FC<FetchableAccountProps> = ({ accountName, idl, index }) => (
  <FetchableAccountWrapper index={index}>
    <Foldable ClickEl={<AccountName>{accountName}</AccountName>}>
      <FetchableAccountInside idl={idl} accountName={accountName} />
    </Foldable>
  </FetchableAccountWrapper>
)

interface FetchableAccountInsideProps {
  accountName: string;
  idl: Idl;
}

const FetchableAccountInside = ({ accountName, idl }: FetchableAccountInsideProps) => {
  const { connection: conn } = useConnection();
  const { currentWallet } = useCurrentWallet();

  const [enteredAddress, setEnteredAddress] = useState("");
  const [fetchedData, setFetchedData] = useState<any>();

  useEffect(() => {
    // The default BN.toJSON is a hex string, but we want a readable string
    // Temporarily change it to use a plain toString while this component is mounted
    const oldBNPrototypeToJSON = BN.prototype.toJSON;
    BN.prototype.toJSON = function (this: BN) {
      return this.toString();
    }

    // Change the toJSON prototype back on unmount
    return () => { BN.prototype.toJSON = oldBNPrototypeToJSON }
  }, [])

  const fetchAll = async () => {
    if (!currentWallet) return;
    setFetchedData(null);
    const accountData = await PgAccount.fetchAll(accountName, idl, conn, currentWallet);
    console.log({ accountData });
    setFetchedData(accountData);
  }

  const fetchEntered = async () => {
    if (!currentWallet) return;
    setFetchedData(null);
    const accountData = await PgAccount.fetchOne(accountName, new PublicKey(enteredAddress), idl, conn, currentWallet);
    console.log({ accountData: accountData.data.toString() });
    setFetchedData(accountData);
  }

  return (
    <>
      <InputWrapper>
        <InputLabel label="address" type="publicKey" />
        <Input type="text" value={enteredAddress} onChange={e => setEnteredAddress(e.target.value)} {...defaultInputProps} />
      </InputWrapper>

      <ButtonsWrapper>
        <Button onClick={fetchEntered} disabled={!enteredAddress} kind="outline" fullWidth={false} size="small">Fetch Entered</Button>
        <Button onClick={fetchAll} kind="outline" fullWidth={false} size="small">Fetch All</Button>
      </ButtonsWrapper>

      {fetchedData && (
        <ResultWrapper>
          <Foldable ClickEl={<span>Result</span>} open>
            <Result>
              {JSON.stringify(fetchedData, null, 2)}
            </Result>
          </Foldable>
        </ResultWrapper>
      )}
    </>
  )
}

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
    margin: 0.5rem 0;
`;

const Result = styled.pre`
    user-select: text;
    font-family: monospace;
`

export default FetchableAccount;
