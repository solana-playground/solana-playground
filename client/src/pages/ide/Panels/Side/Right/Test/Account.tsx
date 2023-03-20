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

import Button from "../../../../../../components/Button";
import CopyButton from "../../../../../../components/CopyButton";
import InputLabel from "./InputLabel";
import Tooltip from "../../../../../../components/Tooltip";
import Input from "../../../../../../components/Input";
import useUpdateTxVals, { Identifiers } from "./useUpdateTxVals";
import {
  PgAccount,
  PgProgramInfo,
  PgTest,
  Seed,
} from "../../../../../../utils/pg";
import {
  Close,
  MinusFilled,
  PlusFilled,
} from "../../../../../../components/Icons";
import { useCurrentWallet } from "../../../Wallet";
import { useOnKey } from "../../../../../../hooks";

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
      }
    };

    if (showSearch) document.addEventListener("mousedown", handleClickOut);
    return () => document.removeEventListener("mousedown", handleClickOut);
  }, [showSearch, showAta, showSeed]);

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

  const openSeed = useCallback(() => {
    setShowSeed(true);
  }, []);

  const openAta = useCallback(() => {
    setShowAta(true);
  }, []);

  const closeSeed = useCallback(() => {
    setShowSeed(false);
  }, []);

  const closeAta = useCallback(() => {
    setShowAta(false);
  }, []);

  useEffect(() => {
    if (!showSeed || !showAta) setShowSearch(false);
  }, [showSeed, showAta]);

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
          />
          {(showSearch || showSeed || showAta) && (
            <SearchWrapper>
              {showSeed ? (
                <ShowSeed
                  setVal={setVal}
                  closeSeed={closeSeed}
                  removeSignerKp={removeSignerKp}
                />
              ) : showAta ? (
                <ShowAta
                  setVal={setVal}
                  closeAta={closeAta}
                  removeSignerKp={removeSignerKp}
                  walletPkStr={walletPkStr}
                />
              ) : (
                <>
                  {walletPkStr && (
                    <Element onClick={handleMyAddress}>My address</Element>
                  )}
                  <Element onClick={handleRandom}>Random</Element>
                  <Element onClick={openSeed}>From seed</Element>
                  <Element onClick={openAta}>Associated token address</Element>
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
      ${theme.colors.default.primary + theme.transparency.medium};
    border-radius: ${theme.borderRadius};
    position: relative;
  `}
`;

const Element = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem;
    transition: all ${theme.transition.duration.short} ${theme.transition.type};

    &:hover {
      cursor: pointer;
      background-color: ${theme.colors.state.hover.bg};
    }
  `}
`;

interface ShowSeedProps {
  setVal: Dispatch<SetStateAction<string>>;
  closeSeed: () => void;
  removeSignerKp: () => void;
}

const ShowSeed: FC<ShowSeedProps> = ({ setVal, closeSeed, removeSignerKp }) => {
  const programStr = useMemo(() => {
    const result = PgProgramInfo.getPk();
    if (result.err) return "";
    return result.programPk!.toBase58();
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
      closeSeed();
    } catch (e: any) {
      console.log(e.message);
    }
  }, [seeds, programId, setVal, removeSignerKp, closeSeed]);

  // Submit on Enter
  useOnKey("Enter", handleGen);

  return (
    <ShowGenWrapper>
      <ShowGenClose close={closeSeed} />
      <ShowGenTitle>Generate from seed</ShowGenTitle>
      {seeds.map((seed, i) => (
        <SeedInput key={i} index={i} seed={seed} setSeeds={setSeeds} />
      ))}
      <ShowGenInputWrapper>
        <InputLabel label="Program Id" type="publicKey" />
        <Input value={programId} onChange={handleProgramId} />
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
  const [error, setError] = useState(false);

  const handleSeed = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSeeds((seeds) => {
        seeds[index] = { value: val, type: seed.type };

        return [...seeds];
      });

      try {
        if (!val && seed.type === "string") return;
        PgTest.parse(val, seed.type);
        setError(false);
      } catch {
        setError(true);
      }
    },
    [index, seed.type, setSeeds]
  );

  const toggleAddSeed = useCallback(() => {
    setShowAddSeed((s) => !s);
  }, []);

  const closeAddSeed = useCallback(() => {
    setShowAddSeed(false);
  }, []);

  const addSeed = useCallback(
    (type: IdlType) => {
      setSeeds((seeds) => [...seeds, { value: "", type }]);
      closeAddSeed();
    },
    [setSeeds, closeAddSeed]
  );

  const addSeedString = useCallback(() => {
    addSeed("string");
  }, [addSeed]);

  const addSeedPk = useCallback(() => {
    addSeed("publicKey");
  }, [addSeed]);

  const addSeedBytes = useCallback(() => {
    addSeed("bytes");
  }, [addSeed]);

  const addSeedU8 = useCallback(() => {
    addSeed("u8");
  }, [addSeed]);

  const addSeedU16 = useCallback(() => {
    addSeed("u16");
  }, [addSeed]);

  const addSeedU32 = useCallback(() => {
    addSeed("u32");
  }, [addSeed]);

  const addSeedU64 = useCallback(() => {
    addSeed("u64");
  }, [addSeed]);

  const addSeedU128 = useCallback(() => {
    addSeed("u128");
  }, [addSeed]);

  const removeSeed = useCallback(() => {
    setSeeds((seeds) => [...seeds.filter((_s, i) => i !== index)]);
  }, [index, setSeeds]);

  const seedInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus on mount
  useEffect(() => {
    seedInputRef.current?.focus();
  }, []);

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
          error={error}
        />
        {isFirst ? (
          <AddSeedWrapper>
            <Tooltip text="Add seed">
              <Button onClick={toggleAddSeed} kind="icon">
                <PlusFilled />
              </Button>
            </Tooltip>
            {showAddSeed && (
              <AddSeedMenu ref={menuRef}>
                <AddSeedItem onClick={addSeedString}>String</AddSeedItem>
                <AddSeedItem onClick={addSeedPk}>Pubkey</AddSeedItem>
                <AddSeedItem onClick={addSeedBytes}>Bytes</AddSeedItem>
                <AddSeedItem onClick={addSeedU8}>u8</AddSeedItem>
                <AddSeedItem onClick={addSeedU16}>u16</AddSeedItem>
                <AddSeedItem onClick={addSeedU32}>u32</AddSeedItem>
                <AddSeedItem onClick={addSeedU64}>u64</AddSeedItem>
                <AddSeedItem onClick={addSeedU128}>u128</AddSeedItem>
              </AddSeedMenu>
            )}
          </AddSeedWrapper>
        ) : (
          <Tooltip text="Remove seed">
            <Button onClick={removeSeed} kind="icon">
              <MinusFilled />
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
    font-size: ${theme.font.code.size.small};
  `}
`;

const AddSeedItem = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem;
    color: ${theme.colors.default.textSecondary};
    transition: all ${theme.transition.duration.short} ${theme.transition.type};

    &:hover {
      cursor: pointer;
      background-color: ${theme.colors.state.hover.bg};
      color: ${theme.colors.default.textPrimary};
    }
  `}
`;

interface ShowAtaProps {
  setVal: Dispatch<SetStateAction<string>>;
  closeAta: () => void;
  removeSignerKp: () => void;
  walletPkStr: string;
}

const ShowAta: FC<ShowAtaProps> = ({
  setVal,
  closeAta,
  removeSignerKp,
  walletPkStr,
}) => {
  const [mint, setMint] = useState("");
  const [owner, setOwner] = useState(walletPkStr ?? "");
  const [mintError, setMintError] = useState(false);
  const [ownerError, setOwnerError] = useState(false);

  const seedInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    seedInputRef.current?.focus();
  }, []);

  const handleMint = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setMint(val);
      try {
        if (!val) return;
        PgTest.parse(val, "publicKey");
        setMintError(false);
      } catch {
        setMintError(true);
      }
    },
    [setMint]
  );

  const handleOwner = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setOwner(val);
      try {
        if (!val) return;
        PgTest.parse(val, "publicKey");
        setOwnerError(false);
      } catch {
        setOwnerError(true);
      }
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
      closeAta();
    } catch (e: any) {
      console.log(e.message);
    }
  }, [mint, owner, setVal, removeSignerKp, closeAta]);

  // Submit on Enter
  useOnKey("Enter", handleGen);

  return (
    <ShowGenWrapper>
      <ShowGenClose close={closeAta} />
      <ShowGenTitle>Generate ATA</ShowGenTitle>
      <ShowGenInputWrapper>
        <InputLabel label="Mint" type="publicKey" />
        <Input
          ref={seedInputRef}
          value={mint}
          onChange={handleMint}
          error={mintError}
        />
      </ShowGenInputWrapper>
      <ShowGenInputWrapper>
        <InputLabel label="Owner" type="publicKey" />
        <Input value={owner} onChange={handleOwner} error={ownerError} />
      </ShowGenInputWrapper>
      <ShowGenButtonWrapper>
        <Button onClick={handleGen} kind="primary-outline">
          Generate
        </Button>
      </ShowGenButtonWrapper>
    </ShowGenWrapper>
  );
};

interface ShowGenCloseProps {
  close: () => void;
}

const ShowGenClose: FC<ShowGenCloseProps> = ({ close }) => (
  <GenCloseWrapper>
    <Button onClick={close} kind="icon">
      <Close />
    </Button>
  </GenCloseWrapper>
);

const ShowGenWrapper = styled.div``;

const GenCloseWrapper = styled.div`
  position: absolute;
  top: 0.25rem;
  right: 0.5rem;
`;

const ShowGenTitle = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.default.primary};
    font-size: ${theme.font.code.size.small};
    text-align: center;
  `}
`;

const ShowGenInputWrapper = styled.div`
  margin-top: 0.5rem;

  & span {
    font-size: ${({ theme }) => theme.font.code.size.small};
  }
`;

const ShowGenButtonWrapper = styled.div`
  margin-top: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default Account;
