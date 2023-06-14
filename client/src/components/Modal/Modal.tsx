import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
} from "react";
import styled, { css } from "styled-components";

import Button, { ButtonProps } from "../Button";
import useModal from "./useModal";
import { Close } from "../Icons";
import { PROJECT_NAME } from "../../constants";
import { PgTheme, SyncOrAsync } from "../../utils/pg";
import { useOnKey } from "../../hooks";

interface ModalProps {
  /** Modal title to show. If true, default is "Solana Playground" */
  title?: boolean | string;
  /** Whether to show a close button on top-right */
  closeButton?: boolean;
  /** Modal's submit button props */
  buttonProps?: ButtonProps & {
    /** Button text to show */
    text: string;
    /** Callback function to run on submit */
    onSubmit: () => SyncOrAsync<unknown>;
    /** Set the error when `obSubmit` throws */
    setError?: Dispatch<SetStateAction<any>>;
    /** Whether the close the modal when user submits */
    closeOnSubmit?: boolean;
  };
}

const Modal: FC<ModalProps> = ({
  title,
  buttonProps,
  closeButton,
  children,
}) => {
  const { close } = useModal();

  const handleSubmit = useCallback(async () => {
    if (!buttonProps) return;

    const handle = async () => {
      const data = await buttonProps.onSubmit();
      if (buttonProps.closeOnSubmit) close(data);
    };

    if (buttonProps.setError) {
      try {
        await handle();
      } catch (e: any) {
        buttonProps.setError(e.message);
      }
    } else {
      await handle();
    }
  }, [buttonProps, close]);

  // Submit on Enter
  useOnKey("Enter", handleSubmit);

  // Take away the focus of other buttons when modal is mounted
  const focusButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    focusButtonRef.current?.focus();
  }, []);

  return (
    <Wrapper>
      <TopWrapper>
        {title && <Title>{title === true ? PROJECT_NAME : title}</Title>}
        {closeButton && (
          <CloseButtonWrapper hasTitle={!!title}>
            <Button kind="icon" onClick={close}>
              <Close />
            </Button>
          </CloseButtonWrapper>
        )}
      </TopWrapper>

      <ContentWrapper>{children}</ContentWrapper>

      {buttonProps && (
        <ButtonsWrapper>
          {!closeButton && (
            <Button onClick={close} kind="transparent">
              Cancel
            </Button>
          )}

          <Button
            {...buttonProps}
            onClick={handleSubmit}
            size={buttonProps.size}
            kind={buttonProps.kind ?? "primary-transparent"}
          >
            {buttonProps.text}
          </Button>
        </ButtonsWrapper>
      )}

      <FocusButton ref={focusButtonRef} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.modal.default)};
  `}
`;

const TopWrapper = styled.div`
  position: relative;
`;

const Title = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.modal.title)};
  `}
`;

const CloseButtonWrapper = styled.div<{ hasTitle: boolean }>`
  ${({ hasTitle }) =>
    hasTitle
      ? css`
          position: absolute;
          top: 0;
          right: 0;
        `
      : css`
          width: 100%;
          display: flex;
          justify-content: flex-end;
          margin-top: 0.5rem;
        `}
`;

const ContentWrapper = styled.div`
  ${({ theme }) => css`
    & input {
      padding: 0.375rem 0.5rem;
      height: 2rem;
    }

    ${PgTheme.convertToCSS(theme.components.modal.content)};
  `}
`;

const ButtonsWrapper = styled.div`
  ${({ theme }) => css`
    & button:nth-child(2) {
      margin-left: 1rem;
    }

    ${PgTheme.convertToCSS(theme.components.modal.bottom)};
  `}
`;

const FocusButton = styled.button`
  opacity: 0;
  position: absolute;
`;

export default Modal;
