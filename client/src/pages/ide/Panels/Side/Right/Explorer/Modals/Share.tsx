import { useCallback, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../../../../components/Button";
import CopyButton from "../../../../../../../components/CopyButton";
import Input from "../../../../../../../components/Input";
import Link from "../../../../../../../components/Link";
import Modal from "../../../../../../../components/Modal";
import Text from "../../../../../../../components/Text";
import useModal from "../../../../../../../components/Modal/useModal";
import { Checkmark, Sad } from "../../../../../../../components/Icons";
import { TextKind } from "../../../../../../../components/Text/Text";
import { explorerAtom } from "../../../../../../../state";
import { ClassName, CLIENT_URL } from "../../../../../../../constants";
import { PgCommon, PgShare } from "../../../../../../../utils/pg";

interface TextState {
  kind?: TextKind;
  id?: string;
}

export const Share = () => {
  const [explorer] = useAtom(explorerAtom);
  const { close } = useModal();

  const [textState, setTextState] = useState<TextState>({});
  const [disabled, setDisabled] = useState(false);

  const share = useCallback(async () => {
    if (!explorer) return;

    setDisabled(true);

    try {
      const id = await PgCommon.transition(PgShare.new());
      setTextState({
        kind: "success",
        id,
      });
    } catch (e: any) {
      setTextState({
        kind: "error",
      });
      setDisabled(false);
    }
  }, [explorer]);

  const shareLink = `${CLIENT_URL}/${textState.id}`;

  return (
    <Modal title>
      <Content>
        {textState.kind ? (
          textState.kind === "error" ? (
            <Text kind={textState.kind} IconEl={<Sad />}>
              You are sharing too often, please try again later.
            </Text>
          ) : (
            <Text kind={textState.kind} IconEl={<Checkmark />}>
              Successfully shared the project.
            </Text>
          )
        ) : (
          <Text>Do you want to share this project?</Text>
        )}
        {textState?.id && (
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
      </Content>
      <ButtonWrapper>
        {textState?.id ? (
          <Button onClick={close} kind="outline">
            Continue
          </Button>
        ) : (
          <>
            <Button onClick={close} kind="transparent">
              Cancel
            </Button>
            <Button
              onClick={share}
              disabled={disabled}
              btnLoading={disabled}
              kind="primary-transparent"
              size="medium"
            >
              {disabled ? "Sharing..." : "Share"}
            </Button>
          </>
        )}
      </ButtonWrapper>
    </Modal>
  );
};

const Content = styled.div`
  & svg.${ClassName.ICON_CHECKMARK} {
    color: ${({ theme }) => theme.colors.state.success.color};
  }
`;

const SuccessWrapper = styled.div``;

const InputWrapper = styled.div`
  display: flex;
  margin-top: 1rem;
  min-width: 20rem;
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

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;

  & button:nth-child(2) {
    margin-left: 1rem;
  }
`;
