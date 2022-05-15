import {
  ChangeEvent,
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  associatedAddress,
  ASSOCIATED_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@project-serum/anchor/dist/cjs/utils/token";
import { IdlAccount } from "@project-serum/anchor/dist/cjs/idl";
import styled, { css } from "styled-components";

import { PgProgramInfo } from "../../../../../utils/pg/program-info";
import Input, { defaultInputProps } from "../../../../Input";
import Button from "../../../../Button";
import InputLabel from "./InputLabel";
import useUpdateTxVals, { Identifiers } from "./useUpdateTxVals";
import useCurrentWallet from "../../../Wallet/useCurrentWallet";

interface AccountProps {
  account: IdlAccount;
  isArg?: boolean;
  functionName: string;
}

const Account: FC<AccountProps> = ({ account, isArg, functionName }) => {
  const { walletPkStr } = useCurrentWallet();

  const accountStr = useMemo(
    () => getKnownAccount(account.name),
    [account.name]
  );
  const accountExists = useMemo(() => accountStr !== "", [accountStr]);
  const [val, setVal] = useState(accountStr); // Pk

  // Signer kp should only be set when user selected random keypair
  const [signerKp, setSignerKp] = useState<Keypair | null>(null);

  // Dropdowns
  const [showSearch, setShowSearch] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [showAta, setShowAta] = useState(false);

  const removeSignerKp = useCallback(() => {
    setSignerKp(null);
  }, []);

  // Input value change
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setVal(e.target.value);
      removeSignerKp();
    },
    [removeSignerKp]
  );

  const handleClick = useCallback(() => {
    setShowSearch(true);
  }, []);

  const inputWrapperRef = useRef<HTMLDivElement>(null);

  // Outside click on dropdown
  useEffect(() => {
    const handleClickOut = (e: globalThis.MouseEvent) => {
      if (!inputWrapperRef.current?.contains(e.target as Node)) {
        setShowSearch(false);
        setShowSeed(false);
        setShowAta(false);
      }
    };

    if (showSearch) document.addEventListener("mousedown", handleClickOut);
    else {
      if (showAta) setShowAta(false);
      else if (showSeed) setShowSeed(false);
    }

    return () => document.removeEventListener("mousedown", handleClickOut);
  }, [showSearch, showAta, showSeed, setShowSearch, setShowSeed, setShowAta]);

  const handleMyAddress = useCallback(() => {
    setVal(walletPkStr);
    removeSignerKp();
    setShowSearch(false);
  }, [walletPkStr, removeSignerKp]);

  const handleRandom = useCallback(() => {
    const kp = Keypair.generate();
    setVal(kp.publicKey.toBase58());
    if (account.isSigner) setSignerKp(kp);

    setShowSearch(false);
  }, [account.isSigner]);

  const handleSeed = useCallback(() => {
    setShowSeed(true);
  }, []);

  const handleAta = useCallback(() => {
    setShowAta(true);
  }, []);

  // Update values for test
  useUpdateTxVals({
    identifier: isArg ? Identifiers.ARGS : Identifiers.ACCS,
    k: account.name,
    v: val,
    type: "publicKey",
    // Only set kp when last selection was random
    kp: signerKp ? signerKp : null,
  });

  const inputName = useMemo(() => {
    if (isArg) return functionName + Identifiers.ARGS + account.name;

    return functionName + Identifiers.ACCS + account.name;
  }, [functionName, account.name, isArg]);

  return (
    <Wrapper>
      <InputLabel label={account.name} account={account} type={"publicKey"} />
      <InputWrapper ref={inputWrapperRef}>
        <Input
          value={val}
          name={inputName}
          onChange={handleChange}
          onClick={handleClick}
          disabled={accountExists}
          {...defaultInputProps}
        />
        {showSearch && (
          <SearchWrapper>
            {showSeed ? (
              <ShowSeed
                setVal={setVal}
                setShowSearch={setShowSearch}
                removeSignerKp={removeSignerKp}
              />
            ) : showAta ? (
              <ShowAta
                setVal={setVal}
                setShowSearch={setShowSearch}
                removeSignerKp={removeSignerKp}
                walletPkStr={walletPkStr}
              />
            ) : (
              <>
                {walletPkStr && (
                  <Element onClick={handleMyAddress}>My address</Element>
                )}
                <Element onClick={handleRandom}>Random</Element>
                <Element onClick={handleSeed}>From seed</Element>
                <Element onClick={handleAta}>Associated token address</Element>
              </>
            )}
          </SearchWrapper>
        )}
      </InputWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  margin: 0.5rem 0;
`;

const InputWrapper = styled.div``;

const SearchWrapper = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.default.bg};
    padding: 0.75rem 1rem;
    outline: 1px solid
      ${theme.colors.default.primary + theme.transparency?.medium};
    border-radius: ${theme.borderRadius};
  `}
`;
const Element = styled.div`
  padding: 0.5rem;

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.colors.state.hover.bg};
  }
`;

interface ShowGenProps {
  setVal: Dispatch<SetStateAction<string>>;
  setShowSearch: Dispatch<SetStateAction<boolean>>;
  removeSignerKp: () => void;
  walletPkStr?: string;
}

const ShowSeed: FC<ShowGenProps> = ({
  setVal,
  setShowSearch,
  removeSignerKp,
}) => {
  const programStr = useMemo(() => {
    const result = PgProgramInfo.getKp();
    if (result?.err) return "";

    return result.programKp!.publicKey.toBase58();
  }, []);

  const [seed, setSeed] = useState("");
  const [programId, setProgramId] = useState(programStr);

  const handleSeed = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSeed(e.target.value);
    },
    [setSeed]
  );

  const handleProgramId = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setProgramId(e.target.value);
    },
    [setProgramId]
  );

  const handleGen = useCallback(async () => {
    try {
      const pkStr = (
        await PublicKey.findProgramAddress(
          [Buffer.from(seed)],
          new PublicKey(programId)
        )
      )[0].toBase58();
      setVal(pkStr);
      removeSignerKp();
      setShowSearch(false);
    } catch (e: any) {
      // TODO: Show error in terminal
      console.log(e.message);
    }
  }, [seed, programId, setVal, removeSignerKp, setShowSearch]);

  const seedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    seedInputRef.current?.focus();
  }, []);

  return (
    <ShowGenWrapper>
      <ShowGenTitle>Generate from seed</ShowGenTitle>
      <ShowGenInputWrapper>
        <InputLabel label="Seed(s)" type="string" />
        <Input
          ref={seedInputRef}
          value={seed}
          onChange={handleSeed}
          {...defaultInputProps}
        />
      </ShowGenInputWrapper>
      <ShowGenInputWrapper>
        <InputLabel label="Program Id" type="publicKey" />
        <Input
          value={programId}
          onChange={handleProgramId}
          {...defaultInputProps}
        />
      </ShowGenInputWrapper>
      <ShowGenButtonWrapper>
        <Button onClick={handleGen} kind="primary-outline">
          Generate
        </Button>
      </ShowGenButtonWrapper>
    </ShowGenWrapper>
  );
};

const ShowAta: FC<ShowGenProps> = ({
  setVal,
  setShowSearch,
  removeSignerKp,
  walletPkStr,
}) => {
  const [mint, setMint] = useState("");
  const [owner, setOwner] = useState(walletPkStr ?? "");

  const handleMint = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setMint(e.target.value);
    },
    [setMint]
  );

  const handleOwner = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setOwner(e.target.value);
    },
    [setOwner]
  );

  const handleGen = useCallback(async () => {
    try {
      const ata = (
        await associatedAddress({
          mint: new PublicKey(mint),
          owner: new PublicKey(owner),
        })
      ).toBase58();
      setVal(ata);
      removeSignerKp();
      setShowSearch(false);
    } catch (e: any) {
      // TODO: Show error in terminal
      console.log(e.message);
    }
  }, [mint, owner, setVal, removeSignerKp, setShowSearch]);

  const seedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    seedInputRef.current?.focus();
  }, []);

  return (
    <ShowGenWrapper>
      <ShowGenTitle>Generate associated token address</ShowGenTitle>
      <ShowGenInputWrapper>
        <InputLabel label="Mint" type="publicKey" />
        <Input
          ref={seedInputRef}
          value={mint}
          onChange={handleMint}
          {...defaultInputProps}
        />
      </ShowGenInputWrapper>
      <ShowGenInputWrapper>
        <InputLabel label="Owner" type="publicKey" />
        <Input value={owner} onChange={handleOwner} {...defaultInputProps} />
      </ShowGenInputWrapper>
      <ShowGenButtonWrapper>
        <Button onClick={handleGen} kind="primary-outline">
          Generate
        </Button>
      </ShowGenButtonWrapper>
    </ShowGenWrapper>
  );
};

const ShowGenWrapper = styled.div``;

const ShowGenTitle = styled.div`
  color: ${({ theme }) => theme.colors.default.primary};
  font-size: ${({ theme }) => theme.font?.size.small};
`;

const ShowGenInputWrapper = styled.div`
  margin-top: 0.5rem;
`;

const ShowGenButtonWrapper = styled.div`
  margin-top: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const getKnownAccount = (name: string) => {
  const pk = getKnownAccountPk(name);
  return pk?.toBase58() ?? "";
};

const getKnownAccountPk = (name: string) => {
  switch (name) {
    case "systemProgram":
      return SystemProgram.programId;
    case "tokenProgram":
      return TOKEN_PROGRAM_ID;
    case "associatedTokenProgram":
      return ASSOCIATED_PROGRAM_ID;
    case "clock":
      return SYSVAR_CLOCK_PUBKEY;
    case "rent":
      return SYSVAR_RENT_PUBKEY;
    default:
      return null;
  }
};

export default Account;
