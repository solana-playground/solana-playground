import { useState } from "react";
import styled from "styled-components";

import CopyButton from "../../../../../components/CopyButton";
import Input from "../../../../../components/Input";
import Link from "../../../../../components/Link";
import Modal from "../../../../../components/Modal";
import Text from "../../../../../components/Text";
import { Checkmark, Sad } from "../../../../../components/Icons";
import { CLIENT_URL } from "../../../../../constants";
import { PgCommon, PgShare } from "../../../../../utils/pg";

interface TextState {
  kind?: "success" | "error";
  id?: string;
}

export const Share = () => {
  const [textState, setTextState] = useState<TextState>({});

  const share = async () => {
    try {
      const id = await PgCommon.transition(PgShare.new());
      setTextState({ kind: "success", id });
    } catch (e: any) {
      console.log("SHARE ERROR:", e.message);
      setTextState({ kind: "error" });
    }
  };

  const shareLink = `${CLIENT_URL}/${textState.id}`;

  return (
    <Modal
      title
      buttonProps={
        textState.id
          ? { text: "Continue" }
          : { text: "Share", onSubmit: share, noCloseOnSubmit: true }
      }
    >
      {textState.kind ? (
        textState.kind === "error" ? (
          <Text kind={textState.kind} IconEl={<Sad />}>
            You are sharing too often, please try again later.
          </Text>
        ) : (
          <Text kind={textState.kind} IconEl={<Checkmark color="success" />}>
            Successfully shared the project.
          </Text>
        )
      ) : (
        <Text>Do you want to share this project?</Text>
      )}

      {textState.id && (
        <SuccessWrapper>
          <InputWrapper>
            <Input value={shareLink} readOnly />
            <CopyButton copyText={shareLink} />
          </InputWrapper>
          <LinkWrapper>
            <Link href={shareLink}>Go to the link</Link>
          </LinkWrapper>
        </SuccessWrapper>
      )}
    </Modal>
  );
};

const SuccessWrapper = styled.div``;

const InputWrapper = styled.div`
  display: flex;
  margin-top: 1rem;
`;

const LinkWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 0.75rem;
  margin-left: 0.25rem;

  & a,
  & svg {
    color: ${({ theme }) => theme.colors.state.info.color};
  }
`;
