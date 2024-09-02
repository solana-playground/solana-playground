import { useEffect, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../Button";
import Input from "../Input";
import Foldable from "../Foldable";
import {
  PgCommon,
  PgTerminal,
  PgTheme,
  PgTx,
  PgWallet,
  PgWeb3,
} from "../../utils/pg";
import { useBalance, useKeybind } from "../../hooks";

const Send = () => (
  <Wrapper>
    <Foldable element={<Title>Send</Title>}>
      <SendExpanded />
    </Foldable>
  </Wrapper>
);

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.wallet.main.send.default)};
  `}
`;

const Title = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.wallet.main.send.title)};
  `}
`;

const SendExpanded = () => {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [disabled, setDisabled] = useState(true);

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

  const send = async () => {
    if (disabled) return;

    await PgTerminal.process(async () => {
      PgTerminal.log(
        PgTerminal.info(`Sending ${amount} SOL to ${recipient}...`)
      );

      let msg;
      try {
        const ix = PgWeb3.SystemProgram.transfer({
          fromPubkey: PgWallet.current!.publicKey,
          toPubkey: new PgWeb3.PublicKey(recipient),
          lamports: PgCommon.solToLamports(parseFloat(amount)),
        });
        const tx = new PgWeb3.Transaction().add(ix);
        const txHash = await PgTx.send(tx);
        PgTx.notify(txHash);

        const txResult = await PgCommon.transition(PgTx.confirm(txHash));
        if (txResult?.err) throw txResult.err;

        msg = PgTerminal.success("Success.");

        // Reset inputs
        setRecipient("");
        setAmount("");
      } catch (e: any) {
        const convertedError = PgTerminal.convertErrorMessage(e.message);
        msg = `Transfer error: ${convertedError}`;
      } finally {
        PgTerminal.log(msg + "\n");
      }
    });
  };

  useKeybind("Enter", send);

  return (
    <ExpandedWrapper>
      <ExpandedInput
        value={recipient}
        onChange={(ev) => setRecipient(ev.target.value)}
        validator={PgCommon.isPk}
        placeholder="Recipient address"
      />
      <ExpandedInput
        value={amount}
        onChange={(ev) => setAmount(ev.target.value)}
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
        btnLoading={{ text: "Sending..." }}
        disabled={disabled}
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
    ${PgTheme.convertToCSS(theme.components.wallet.main.send.expanded.default)};
  `}
`;

const ExpandedInput = styled(Input)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.wallet.main.send.expanded.input)};
  `}
`;

const ExpandedButton = styled(Button)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.wallet.main.send.expanded.sendButton
    )};
  `}
`;

export default Send;
