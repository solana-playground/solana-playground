import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import styled, { css } from "styled-components";

import Button from "../Button";
import Input from "../Input";
import Foldable from "../Foldable";
import { PgCommon, PgTerminal, PgTx, PgWallet } from "../../utils/pg";
import { PgThemeManager } from "../../utils/pg/theme";
import { useBalance } from "../../hooks";

const Send = () => (
  <Wrapper>
    <Foldable ClickEl={<Title>Send</Title>}>
      <SendExpanded />
    </Foldable>
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.wallet.main.send.default)};
  `}
`;

const Title = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.wallet.main.send.title)};
  `}
`;

const SendExpanded = () => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const { balance } = useBalance();

  // Send button disable
  useEffect(() => {
    setDisabled(
      !(
        PgCommon.isPk(recipient) &&
        PgCommon.isFloat(amount) &&
        balance &&
        balance > parseFloat(amount)
      )
    );
  }, [recipient, amount, balance]);

  const handleChangeRecipient = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setRecipient(e.target.value);
    },
    []
  );

  const handleChangeAmount = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  }, []);

  const send = async () => {
    await PgTerminal.process(async () => {
      setLoading(true);
      PgTerminal.log(
        PgTerminal.info(`Sending ${amount} SOL to ${recipient}...`)
      );

      let msg;
      try {
        const pk = new PublicKey(recipient);

        const ix = SystemProgram.transfer({
          fromPubkey: PgWallet.current!.publicKey,
          toPubkey: pk,
          lamports: PgCommon.solToLamports(parseFloat(amount)),
        });

        const tx = new Transaction().add(ix);

        const txHash = await PgCommon.transition(PgTx.send(tx));
        PgTx.notify(txHash);

        msg = PgTerminal.success("Success.");

        // Reset inputs
        setRecipient("");
        setAmount("");
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
    <ExpandedWrapper>
      <ExpandedInput
        value={recipient}
        onChange={handleChangeRecipient}
        validator={PgCommon.isPk}
        placeholder="Recipient address"
      />
      <ExpandedInput
        value={amount}
        onChange={handleChangeAmount}
        validator={(input) => {
          if (
            !PgCommon.isFloat(input) ||
            (balance && parseFloat(input) > balance)
          ) {
            throw new Error("Invalid amount");
          }
        }}
        placeholder="SOL amount"
      />
      <ExpandedButton
        onClick={send}
        disabled={disabled || loading}
        btnLoading={loading}
        kind="primary-transparent"
        fullWidth
      >
        Send
      </ExpandedButton>
    </ExpandedWrapper>
  );
};

const ExpandedWrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.wallet.main.send.expanded.default
    )};
  `}
`;

const ExpandedInput = styled(Input)`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.wallet.main.send.expanded.input
    )};
  `}
`;

const ExpandedButton = styled(Button)`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.wallet.main.send.expanded.sendButton
    )};
  `}
`;

export default Send;
