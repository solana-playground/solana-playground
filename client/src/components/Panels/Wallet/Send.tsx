import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import styled from "styled-components";

import Button from "../../Button";
import Input from "../../Input";
import Foldable from "../../Foldable";
import { ClassName } from "../../../constants";
import { balanceAtom, terminalOutputAtom, txHashAtom } from "../../../state";
import { PgCommon, PgTerminal, PgTx } from "../../../utils/pg";
import { useCurrentWallet } from "./useCurrentWallet";

const Send = () => (
  <Wrapper>
    <Foldable ClickEl={<Title>Send</Title>}>
      <SendInside />
    </Foldable>
  </Wrapper>
);

const SendInside = () => {
  const [, setTerminal] = useAtom(terminalOutputAtom);
  const [, setTxHash] = useAtom(txHashAtom);
  const [balance] = useAtom(balanceAtom);

  const [address, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Address Input error
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

  // Amount Input error
  useEffect(() => {
    if (!amount || !balance) {
      amountInputRef.current?.classList.remove(ClassName.ERROR);
      setDisabled(true);
      return;
    }

    try {
      const isFloat = PgCommon.isFloat(amount);
      if (!isFloat) throw new Error("Invalid amount");

      if (parseFloat(amount) > balance) throw new Error("Not enough balance");

      amountInputRef.current?.classList.remove(ClassName.ERROR);
    } catch {
      amountInputRef.current?.classList.add(ClassName.ERROR);
    }
  }, [amount, balance]);

  // Send button disable
  useEffect(() => {
    if (
      address &&
      PgCommon.isFloat(amount) &&
      balance &&
      balance > parseFloat(amount)
    )
      setDisabled(false);
    else setDisabled(true);
  }, [address, amount, balance, setDisabled]);

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

  const send = () => {
    PgTerminal.run(async () => {
      if (!currentWallet) return;

      setLoading(true);
      setTerminal(PgTerminal.info(`Sending ${amount} SOL to ${address}...`));

      let msg = "";

      try {
        await PgCommon.sleep();
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
    });
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
          btnLoading={loading}
          kind="primary-transparent"
          fullWidth
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
  padding-top: 0.75rem;
`;

const InputWrapper = styled.div`
  & > input {
    margin-bottom: 0.75rem;
  }
`;

const ButtonWrapper = styled.div`
  margin-top: 0.25rem;
`;

export default Send;
