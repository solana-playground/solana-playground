import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import styled from "styled-components";

import { terminalAtom, txHashAtom } from "../../../state";
import { ClassName } from "../../../constants";
import { PgTx } from "../../../utils/pg/tx";
import Button from "../../Button";
import Input from "../../Input";
import useCurrentWallet from "./useCurrentWallet";
import { PgTerminal } from "../../../utils/pg/terminal";
import Foldable from "../../Foldable";
import { PgCommon } from "../../../utils/pg/common";

const Send = () => {
  return (
    <Wrapper>
      <Foldable ClickEl={<Title>Send</Title>}>
        <SendInside />
      </Foldable>
    </Wrapper>
  );
};

const SendInside = () => {
  const [, setTerminal] = useAtom(terminalAtom);
  const [, setTxHash] = useAtom(txHashAtom);

  const [address, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!address) {
      addressInputRef.current?.classList.remove(ClassName.ERROR);
      setDisabled(true);
      return;
    }

    try {
      new PublicKey(address);
      addressInputRef.current?.classList.remove(ClassName.ERROR);
    } catch {
      addressInputRef.current?.classList.add(ClassName.ERROR);
      setDisabled(true);
    }
  }, [address, setDisabled]);

  useEffect(() => {
    if (!amount) {
      amountInputRef.current?.classList.remove(ClassName.ERROR);
      setDisabled(true);
      return;
    }

    try {
      const isFloat = PgCommon.isFloat(amount);
      if (!isFloat) throw new Error("Invalid amount");

      amountInputRef.current?.classList.remove(ClassName.ERROR);
    } catch {
      amountInputRef.current?.classList.add(ClassName.ERROR);
      setDisabled(true);
    }
  }, [amount, setDisabled]);

  useEffect(() => {
    if (address && amount) setDisabled(false);
    else setDisabled(true);
  }, [address, amount, setDisabled]);

  const handleChangeAddress = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setRecipient(e.target.value);
    },
    [setRecipient]
  );

  const handleChangeAmount = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAmount(e.target.value);
    },
    [setAmount]
  );

  const { connection: conn } = useConnection();
  const { currentWallet } = useCurrentWallet();

  const send = async () => {
    if (!currentWallet) return;

    setLoading(true);
    setTerminal(PgTerminal.info(`Sending ${amount} SOL to ${address}...`));

    let msg = "";

    try {
      const pk = new PublicKey(address);

      const ix = SystemProgram.transfer({
        fromPubkey: currentWallet.publicKey,
        toPubkey: pk,
        lamports: PgCommon.solToLamports(parseFloat(amount)),
      });

      const tx = new Transaction().add(ix);

      const txHash = await PgTx.send(tx, conn, currentWallet);
      setTxHash(txHash);
      msg = PgTerminal.success("Success.");
    } catch (e: any) {
      const convertedError = PgTerminal.convertErrorMessage(e.message);
      msg = `${PgTerminal.error("Transfer error:")} ${convertedError}`;
    } finally {
      setLoading(false);
      setTerminal(msg + "\n");
    }
  };

  return (
    <InsideWrapper>
      <InputWrapper>
        <Input
          ref={addressInputRef}
          onChange={handleChangeAddress}
          placeholder="Recipient address"
          fullWidth
        />
        <Input
          ref={amountInputRef}
          onChange={handleChangeAmount}
          placeholder="SOL amount"
          fullWidth
        />
      </InputWrapper>
      <ButtonWrapper>
        <Button
          onClick={send}
          disabled={disabled || loading}
          kind="primary-transparent"
          fullWidth
          bold
        >
          Send
        </Button>
      </ButtonWrapper>
    </InsideWrapper>
  );
};

const Wrapper = styled.div`
  margin-bottom: 1rem;
`;

const Title = styled.div`
  font-weight: bold;
`;

const InsideWrapper = styled.div`
  padding-top: 0.5rem;
`;

const InputWrapper = styled.div`
  & > input {
    margin-bottom: 0.5rem;
  }
`;

const ButtonWrapper = styled.div``;

export default Send;
