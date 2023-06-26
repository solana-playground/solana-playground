import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";

import Button, { ButtonProps } from "../Button";
import Text from "../Text";
import { Close, Sad } from "../Icons";
import { PROJECT_NAME } from "../../constants";
import { PgTheme, SyncOrAsync } from "../../utils/pg";
import { useModal } from "./useModal";
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
    /** Whether to skip closing the modal when user submits */
    skipCloseOnSubmit?: boolean;
    /** Set the error when `obSubmit` throws */
    setError?: Dispatch<SetStateAction<any>>;
    /** Set loading state of the button based on `onSubmit` */
    setLoading?: Dispatch<SetStateAction<boolean>>;
  };
}

const Modal: FC<ModalProps> = ({
  title,
  buttonProps,
  closeButton,
  children,
}) => {
  const [error, setError] = useState("");

  const { close } = useModal();

  const handleSubmit = useCallback(async () => {
    if (!buttonProps || buttonProps.disabled) return;

    // Start loading
    if (buttonProps.setLoading) buttonProps.setLoading(true);

    try {
      // Await result
      const data = await buttonProps.onSubmit();

      // Close unless explicitly forbidden
      if (!buttonProps.skipCloseOnSubmit) close(data);
    } catch (e: any) {
      if (buttonProps.setError) buttonProps.setError(e.message);
      else {
        setError(e.message);
        throw e;
      }
    }

    // End loading
    if (buttonProps.setLoading) buttonProps.setLoading(false);
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

      <ContentWrapper>
        {error && (
          <ErrorText kind="error" IconEl={<Sad />}>
            {error}
          </ErrorText>
        )}

        {children}
      </ContentWrapper>

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

const ErrorText = styled(Text)`
  margin-bottom: 1rem;
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
