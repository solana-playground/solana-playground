import { useCallback, useState } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import Button from "../../../../Button";
import CopyButton from "../../../../CopyButton";
import Input from "../../../../Input";
import Link from "../../../../Link";
import ModalInside from "../../../../Modal/ModalInside";
import Text from "../../../../Text";
import useModal from "../../../../Modal/useModal";
import { explorerAtom } from "../../../../../state";
import { PgShare } from "../../../../../utils/pg";
import { TextProps } from "../../../../Text/Text";
import { CLIENT_URL } from "../../../../../constants";
import { Checkmark, Sad } from "../../../../Icons";

interface TextState extends TextProps {
  id?: string;
}

const Share = () => {
  const [explorer] = useAtom(explorerAtom);
  const { close } = useModal();

  const [textState, setTextState] = useState<TextState>({});
  const [disabled, setDisabled] = useState(false);

  const share = useCallback(async () => {
    if (!explorer) return;

    setDisabled(true);

    try {
      const id = await PgShare.new(explorer);
      setTextState({
        type: "Success",
        id,
      });
    } catch (e: any) {
      setTextState({
        type: "Error",
      });
      setDisabled(false);
    }
  }, [explorer, setTextState, setDisabled]);

  const shareLink = `${CLIENT_URL}/${textState.id}`;
  const httpsLink = "https://" + shareLink;

  return (
    <ModalInside title>
      <Content>
        {textState.type ? (
          textState.type === "Error" ? (
            <Text type={textState.type} IconEl={<Sad />}>
              You are sharing too often, please try again later.
            </Text>
          ) : (
            <Text type={textState.type} IconEl={<Checkmark />}>
              Successfully shared the project.
            </Text>
          )
        ) : (
          <DefaultText>Do you want to share this project?</DefaultText>
        )}
        {textState?.id && (
          <SuccessWrapper>
            <InputWrapper>
              <Input value={shareLink} fullWidth readOnly />
              <CopyButton copyText={httpsLink} />
            </InputWrapper>
            <LinkWrapper>
              <Link href={httpsLink}>Go to the link</Link>
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
            <Button onClick={close}>Cancel</Button>
            <Button
              onClick={share}
              disabled={disabled}
              kind="primary-transparent"
            >
              Share
            </Button>
          </>
        )}
      </ButtonWrapper>
    </ModalInside>
  );
};

const Content = styled.div`
  margin: 1rem 0 1rem 0.5rem;

  & svg.icon-checkmark {
    color: ${({ theme }) => theme.colors.state.success.color};
  }
`;

const DefaultText = styled.div`
  margin: 1.5rem 0;
`;

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

  & a {
    color: ${({ theme }) => theme.colors.state.info.color};
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 0.75rem;

  & button:nth-child(2) {
    margin-left: 1rem;
  }
`;

export default Share;
