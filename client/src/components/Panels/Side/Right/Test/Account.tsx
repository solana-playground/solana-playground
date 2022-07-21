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
import { Keypair, PublicKey } from "@solana/web3.js";
import { associatedAddress } from "@project-serum/anchor/dist/cjs/utils/token";
import { IdlAccount, IdlType } from "@project-serum/anchor/dist/cjs/idl";
import styled, { css } from "styled-components";

import Button from "../../../../Button";
import CopyButton from "../../../../CopyButton";
import InputLabel from "./InputLabel";
import Tooltip from "../../../../Tooltip";
import Input, { defaultInputProps } from "../../../../Input";
import useUpdateTxVals, { Identifiers } from "./useUpdateTxVals";
import {
  PgAccount,
  PgProgramInfo,
  PgTest,
  Seed,
} from "../../../../../utils/pg";
import { Minus, Plus } from "../../../../Icons";
import { useCurrentWallet } from "../../../Wallet";

interface AccountProps {
  account: IdlAccount;
  functionName: string;
  isArg?: boolean;
}

const Account: FC<AccountProps> = ({ account, functionName, isArg }) => {
  const { walletPkStr } = useCurrentWallet();

  const accountStr = useMemo(
    () => PgAccount.getKnownAccount(account.name),
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
    kp: signerKp,
  });

  const inputName = useMemo(() => {
    if (isArg) return functionName + Identifiers.ARGS + account.name;

    return functionName + Identifiers.ACCS + account.name;
  }, [functionName, account.name, isArg]);

  return (
    <Wrapper>
      <InputLabel label={account.name} account={account} type="publicKey" />
      <InputRowWrapper>
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
                  <Element onClick={handleAta}>
                    Associated token address
                  </Element>
                </>
              )}
            </SearchWrapper>
          )}
        </InputWrapper>
        <CopyButton copyText={val} />
      </InputRowWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  margin: 0.5rem 0;
`;

const InputRowWrapper = styled.div`
  display: flex;
`;

const InputWrapper = styled.div`
  flex: 1;
`;

const SearchWrapper = styled.div`
  ${({ theme }) => css`
    background-color: ${theme.colors.default.bgPrimary};
    padding: 0.75rem 1rem;
    outline: 1px solid
      ${theme.colors.default.primary + theme.transparency?.medium};
    border-radius: ${theme.borderRadius};
  `}
`;

const Element = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem;
    transition: all ${theme.transition?.duration.short}
      ${theme.transition?.type};

    &:hover {
      cursor: pointer;
      background-color: ${theme.colors.state.hover.bg};
    }
  `}
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

  const [seeds, setSeeds] = useState<Seed[]>([{ value: "", type: "string" }]);
  const [programId, setProgramId] = useState(programStr);

  const handleProgramId = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setProgramId(e.target.value);
    },
    [setProgramId]
  );

  const handleGen = useCallback(async () => {
    try {
      const pkStr = (
        await PgTest.generateProgramAddressFromSeeds(seeds, programId)
      )[0].toBase58();
      setVal(pkStr);
      removeSignerKp();
      setShowSearch(false);
    } catch (e: any) {
      console.log(e.message);
    }
  }, [seeds, programId, setVal, removeSignerKp, setShowSearch]);

  // Submit on Enter
  useEffect(() => {
    const handleEnter = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") handleGen();
    };

    document.addEventListener("keydown", handleEnter);
    return () => document.removeEventListener("keydown", handleEnter);
  }, [handleGen]);

  return (
    <ShowGenWrapper>
      <ShowGenTitle>Generate from seed</ShowGenTitle>
      {seeds.map((seed, i) => (
        <SeedInput key={i} index={i} seed={seed} setSeeds={setSeeds} />
      ))}
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

interface SeedInputProps {
  index: number;
  seed: Seed;
  setSeeds: Dispatch<SetStateAction<Seed[]>>;
}

const SeedInput: FC<SeedInputProps> = ({ index, seed, setSeeds }) => {
  const [showAddSeed, setShowAddSeed] = useState(false);

  const handleSeed = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSeeds((seeds) => {
        seeds[index] = { value: e.target.value, type: seed.type };

        return [...seeds];
      });
    },
    [index, seed.type, setSeeds]
  );

  const toggleAddSeed = useCallback(() => {
    setShowAddSeed((s) => !s);
  }, [setShowAddSeed]);

  const closeAddSeed = useCallback(() => {
    setShowAddSeed(false);
  }, [setShowAddSeed]);

  const addSeed = useCallback(
    (type: IdlType) => {
      setSeeds((seeds) => [...seeds, { value: "", type }]);
      closeAddSeed();
    },
    [setSeeds, closeAddSeed]
  );

  const addSeedString = useCallback(() => {
    addSeed("string");
    closeAddSeed();
  }, [addSeed, closeAddSeed]);

  const addSeedPk = useCallback(() => {
    addSeed("publicKey");
  }, [addSeed]);

  const removeSeed = useCallback(() => {
    setSeeds((seeds) => [...seeds.filter((_s, i) => i !== index)]);
  }, [index, setSeeds]);

  const seedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    seedInputRef.current?.focus();
  }, []);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close showAddSeed on outside click
  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) closeAddSeed();
    };

    if (showAddSeed) document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddSeed, closeAddSeed]);

  const isFirst = index === 0;

  return (
    <ShowGenInputWrapper>
      <InputLabel label={`Seed(${index + 1})`} type={seed.type} />
      <SeedInputWrapper>
        <Input
          ref={seedInputRef}
          value={seed.value}
          onChange={handleSeed}
          {...defaultInputProps}
        />
        {isFirst ? (
          <AddSeedWrapper>
            <Tooltip text="Add seed">
              <Button onClick={toggleAddSeed} kind="icon">
                <Plus />
              </Button>
            </Tooltip>
            {showAddSeed && (
              <AddSeedMenu ref={menuRef}>
                <AddSeedItem onClick={addSeedString}>String</AddSeedItem>
                <AddSeedItem onClick={addSeedPk}>Pubkey</AddSeedItem>
              </AddSeedMenu>
            )}
          </AddSeedWrapper>
        ) : (
          <Tooltip text="Remove seed">
            <Button onClick={removeSeed} kind="icon">
              <Minus />
            </Button>
          </Tooltip>
        )}
      </SeedInputWrapper>
    </ShowGenInputWrapper>
  );
};

const SeedInputWrapper = styled.div`
  display: flex;

  & button {
    margin-left: 0.25rem;
  }
`;

const AddSeedWrapper = styled.div`
  position: relative;
`;

const AddSeedMenu = styled.div`
  ${({ theme }) => css`
    position: absolute;
    z-index: 2;
    background-color: ${theme.colors.tooltip?.bg ??
    theme.colors.default.bgPrimary};
    border-radius: ${theme.borderRadius};
    font-size: ${theme.font?.size.small};
  `}
`;

const AddSeedItem = styled.div`
  ${({ theme }) => css`
    width: max-content;
    padding: 0.5rem;
    color: ${theme.colors.default.textSecondary};
    transition: all ${theme.transition?.duration.short}
      ${theme.transition?.type};

    &:hover {
      cursor: pointer;
      background-color: ${theme.colors.state.hover.bg};
      color: ${theme.colors.default.textPrimary};
    }
  `}
`;

const ShowAta: FC<ShowGenProps> = ({
  setVal,
  setShowSearch,
  removeSignerKp,
  walletPkStr,
}) => {
  const [mint, setMint] = useState("");
  const [owner, setOwner] = useState(walletPkStr ?? "");

  const seedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    seedInputRef.current?.focus();
  }, []);

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
      console.log(e.message);
    }
  }, [mint, owner, setVal, removeSignerKp, setShowSearch]);

  // Submit on Enter
  useEffect(() => {
    const handleEnter = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Enter") handleGen();
    };

    document.addEventListener("keydown", handleEnter);
    return () => document.removeEventListener("keydown", handleEnter);
  }, [handleGen]);

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
  ${({ theme }) => css`
    color: ${theme.colors.default.primary};
    font-size: ${theme.font?.size.small};
    text-align: center;
  `}
`;

const ShowGenInputWrapper = styled.div`
  margin-top: 0.5rem;

  & span {
    font-size: ${({ theme }) => theme.font?.size.small};
  }
`;

const ShowGenButtonWrapper = styled.div`
  margin-top: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default Account;
