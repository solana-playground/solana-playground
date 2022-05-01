import { useCallback, useState } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import { explorerAtom } from "../../../../../state";
import { PgShare } from "../../../../../utils/pg/share";
import ModalInside from "../../../../Modal/ModalInside";
import useModal from "../../../../Modal/useModal";
import Text from "../../../../Text";
import { TextProps } from "../../../../Text/Text";
import { CLIENT_URL } from "../../../../../constants";
import useCopyClipboard from "react-use-clipboard";
import Input from "../../../../Input";
import { Copy } from "../../../../Icons";
import Button from "../../../../Button";

interface TextState extends TextProps {
  text: string;
  id?: string;
}

const Share = () => {
  const [explorer] = useAtom(explorerAtom);
  const { close } = useModal();

  const [textState, setTextState] = useState<TextState>({
    text: "Do you want to share this project?",
  });
  const [disabled, setDisabled] = useState(false);

  const share = useCallback(async () => {
    if (!explorer) return;

    setDisabled(true);

    try {
      const id = await PgShare.new(explorer);
      setTextState({
        text: "Successfully shared the project.",
        type: "Success",
        id,
      });
    } catch (e: any) {
      setTextState({ text: "Please try again later.", type: "Error" });
      setDisabled(false);
    }
  }, [explorer, setTextState, setDisabled]);

  const shareLink = `${CLIENT_URL}/${textState.id}`;

  // Copy to clipboard
  const [isCopied, setCopied] = useCopyClipboard(shareLink);

  return (
    <ModalInside
      title
      buttonProps={{ name: "Share", close, onSubmit: share, disabled }}
    >
      <Content>
        {textState.type ? (
          <Text type={textState.type}>{textState.text}</Text>
        ) : (
          <DefaultText>Do you want to share this project?</DefaultText>
        )}
        {textState?.id && (
          <InputWrapper isCopied={isCopied}>
            <Input value={shareLink} fullWidth />
            <Button
              onClick={setCopied}
              kind="icon"
              title={isCopied ? "Copied" : "Copy to clipboard"}
            >
              <Copy />
            </Button>
          </InputWrapper>
        )}
      </Content>
    </ModalInside>
  );
};

const Content = styled.div`
  margin: 1rem 0 1rem 0.5rem;
`;

const DefaultText = styled.div`
  margin: 1.5rem 0;
`;

const InputWrapper = styled.div<{ isCopied: boolean }>`
  ${({ theme, isCopied }) => css`
    display: flex;
    margin-top: 1rem;

    & > button > svg {
      color: ${isCopied && theme.colors.state.success.color};
    }
  `}
`;

export default Share;
