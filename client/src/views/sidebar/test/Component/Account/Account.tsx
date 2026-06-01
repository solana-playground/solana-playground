import { FC, useState } from "react";
import styled from "styled-components";

import CodeResult from "../CodeResult";
import InputLabel from "../InputLabel";
import Interaction from "../Interaction";
import Button from "../../../../../components/Button";
import Foldable from "../../../../../components/Foldable";
import SearchBar from "../../../../../components/SearchBar";
import Text from "../../../../../components/Text";
import { SpinnerWithBg } from "../../../../../components/Loading";
import { PgCommon, PgWeb3 } from "../../../../../utils";
import { PgProgramInteraction } from "../../../../../utils/program-interaction";
import { useWallet } from "../../../../../hooks";

interface AccountProps {
  accountName: string;
  index: number;
}

const Account: FC<AccountProps> = ({ accountName, index }) => {
  const [address, setAddress] = useState("");
  const [addressError, setAddressError] = useState(false);
  const [fetchedData, setFetchedData] = useState<object>();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchOneLoading, setFetchOneLoading] = useState(false);
  const [fetchAllLoading, setFetchAllLoading] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);

  const wallet = useWallet();

  const createFetch = (
    cb: () => Promise<NonNullable<typeof fetchedData>>,
    setLoading: typeof setFetchOneLoading
  ) => {
    return async () => {
      setLoading(true);
      try {
        const data = await PgCommon.transition(cb());
        setFetchedData(data);
        setFetchError(null);
      } catch (e: any) {
        if (e.message.startsWith("Account does not exist")) {
          setFetchError("Account does not exist");
        } else if (e.message === "Invalid account discriminator") {
          setFetchError(`Given account is not type ${accountName}`);
        } else {
          setFetchError(`Unknown error: ${e.message}`);
        }
      } finally {
        setLoading(false);
        setResultOpen(true);
      }
    };
  };

  const fetchOne = createFetch(() => {
    return PgProgramInteraction.fetchAccount(
      accountName,
      new PgWeb3.PublicKey(address)
    );
  }, setFetchOneLoading);

  const fetchAll = createFetch(
    () => PgProgramInteraction.fetchAllAccounts(accountName),
    setFetchAllLoading
  );

  return (
    <Interaction name={accountName} index={index}>
      <InputWrapper>
        <InputLabel name="address" type="publicKey" />
        <SearchBar
          value={address}
          onChange={(ev) => setAddress(ev.target.value)}
          error={addressError}
          setError={setAddressError}
          validator={PgCommon.isPk}
        />
      </InputWrapper>

      <ButtonsWrapper>
        <Button
          onClick={fetchOne}
          disabled={!wallet || fetchAllLoading || !address || addressError}
        >
          Fetch
        </Button>
        <Button onClick={fetchAll} disabled={!wallet || fetchOneLoading}>
          Fetch All
        </Button>
      </ButtonsWrapper>

      {(fetchedData || fetchError) && (
        <ResultWrapper>
          <Foldable
            element="Result"
            isOpen={resultOpen}
            setIsOpen={setResultOpen}
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
    </Interaction>
  );
};

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

export default Account;
