import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import styled from "styled-components";

import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import Foldable from "../../../../components/Foldable";
import { uiBalanceAtom, txHashAtom } from "../../../../state";
import { PgCommon, PgTerminal, PgTx, PgValidator } from "../../../../utils/pg";
import { useCurrentWallet } from "./useCurrentWallet";
import { usePgConnection } from "../../../../hooks";

const Send = () => (
  <Wrapper>
    <Foldable ClickEl={<Title>Send</Title>}>
      <SendInside />
    </Foldable>
  </Wrapper>
);

const SendInside = () => {
  const [, setTxHash] = useAtom(txHashAtom);
  const [balance] = useAtom(uiBalanceAtom);

  const [address, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Send button disable
  useEffect(() => {
    if (
      PgValidator.isPubkey(address) &&
      PgValidator.isFloat(amount) &&
      balance &&
      balance > parseFloat(amount)
    ) {
      setDisabled(false);
    } else setDisabled(true);
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

  const { connection: conn } = usePgConnection();
  const { currentWallet } = useCurrentWallet();

  const send = () => {
    PgTerminal.process(async () => {
      if (!currentWallet) return;

      setLoading(true);
      PgTerminal.log(PgTerminal.info(`Sending ${amount} SOL to ${address}...`));

      let msg = "";

      try {
        const pk = new PublicKey(address);

        const ix = SystemProgram.transfer({
          fromPubkey: currentWallet.publicKey,
          toPubkey: pk,
          lamports: PgCommon.solToLamports(parseFloat(amount)),
        });

        const tx = new Transaction().add(ix);

        const txHash = await PgCommon.transition(
          PgTx.send(tx, conn, currentWallet)
        );
        setTxHash(txHash);
        msg = PgTerminal.success("Success.");
      } catch (e: any) {
        const convertedError = PgTerminal.convertErrorMessage(e.message);
        msg = `Transfer error: ${convertedError}`;
      } finally {
        setLoading(false);
        PgTerminal.log(msg + "\n");
      }
    });
  };

  return (
    <InsideWrapper>
      <InputWrapper>
        <Input
          ref={addressInputRef}
          onChange={handleChangeAddress}
          validator={PgValidator.isPubkey}
          placeholder="Recipient address"
        />
        <Input
          ref={amountInputRef}
          onChange={handleChangeAmount}
          validator={(input) => {
            if (
              !PgValidator.isFloat(input) ||
              (balance && parseFloat(input) > balance)
            ) {
              throw new Error("Invalid amount");
            }
          }}
          placeholder="SOL amount"
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
