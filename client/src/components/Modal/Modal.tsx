import {
  Dispatch,
  FC,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";
import styled, { css } from "styled-components";

import Button, { ButtonProps } from "../Button";
import FadeIn from "../FadeIn";
import Text from "../Text";
import { Close, Sad } from "../Icons";
import { PROJECT_NAME } from "../../constants";
import { OrString, PgTheme, PgView, SyncOrAsync } from "../../utils/pg";
import { useKeybind, useOnClickOutside } from "../../hooks";

interface ModalProps {
  /** Modal title to show. If true, default is "Solana Playground" */
  title?: boolean | string;
  /** Modal's submit button props */
  buttonProps?: ButtonProps & {
    /** Button text to show */
    text: OrString<"Continue">;
    /** Callback function to run on submit */
    onSubmit?: () => SyncOrAsync;
    /** Whether to skip closing the modal when user submits */
    noCloseOnSubmit?: boolean;
    /** Set loading state of the button based on `onSubmit` */
    setLoading?: Dispatch<SetStateAction<boolean>>;
  };
  /** Error to display */
  error?: any;
  /** Set the error when `onSubmit` throws */
  setError?: Dispatch<SetStateAction<any>>;
  /**
   * Whether to show a close button on top-right.
   *
   * Defaults to `!buttonProps?.onSubmit`.
   */
  closeButton?: boolean;
}

const Modal: FC<ModalProps> = ({
  title,
  buttonProps,
  closeButton = !buttonProps?.onSubmit,
  children,
  ...props
}) => {
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!buttonProps || buttonProps.disabled) return;

    try {
      // Get result
      const data = await buttonProps.onSubmit?.();

      // Close unless explicitly forbidden
      if (!buttonProps.noCloseOnSubmit) PgView.closeModal(data);
    } catch (e: any) {
      if (props.setError) props.setError(e.message);
      else {
        setError(e.message);
        throw e;
      }
    }
  }, [buttonProps, props]);

  // Submit on Enter
  // Intentionally clicking the button in order to trigger the button's loading
  // state on Enter as opposed to using `handleSubmit` which wouldn't change
  // submit button's state.
  const buttonRef = useRef<HTMLButtonElement>(null);
  useKeybind("Enter", () => buttonRef.current?.click());

  const wrapperRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(wrapperRef, PgView.closeModal);

  return (
    <Wrapper ref={wrapperRef}>
      {/* Take away the focus of other buttons when the modal is mounted */}
      <FocusButton autoFocus />

      <TopWrapper>
        {title && <Title>{title === true ? PROJECT_NAME : title}</Title>}
        {closeButton && (
          <CloseButtonWrapper hasTitle={!!title}>
            <Button kind="icon" onClick={PgView.closeModal}>
              <Close />
            </Button>
          </CloseButtonWrapper>
        )}
      </TopWrapper>

      <ScrollableWrapper>
        <ContentWrapper>
          {error && (
            <ErrorText kind="error" icon={<Sad />}>
              {error}
            </ErrorText>
          )}

          {children}
        </ContentWrapper>

        {buttonProps && (
          <ButtonsWrapper>
            {!closeButton && buttonProps.onSubmit && (
              <Button onClick={PgView.closeModal} kind="transparent">
                Cancel
              </Button>
            )}

            <Button
              {...buttonProps}
              ref={buttonRef}
              onClick={handleSubmit}
              disabled={buttonProps.disabled || !!props.error}
              size={buttonProps.size}
              kind={
                buttonProps.onSubmit
                  ? buttonProps.kind ?? "primary-transparent"
                  : "outline"
              }
            >
              {buttonProps.text}
            </Button>
          </ButtonsWrapper>
        )}
      </ScrollableWrapper>
    </Wrapper>
  );
};

const Wrapper = styled(FadeIn)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.modal.default)};
  `}
`;

const TopWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.modal.top)};
  `}
`;

const Title = styled.div`
  ${({ theme }) => css`
    width: 100%;
    text-align: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid ${theme.colors.default.border};
  `}
`;

const CloseButtonWrapper = styled.div<{ hasTitle: boolean }>`
  ${({ hasTitle }) =>
    hasTitle
      ? css`
          position: absolute;
          top: 0;
          right: 1.5rem;
          bottom: 0;
          margin: auto;
          display: flex;
          align-items: center;
        `
      : css`
          width: 100%;
          display: flex;
          justify-content: flex-end;
          margin-top: 0.5rem;
        `}
`;

const ScrollableWrapper = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  ${PgTheme.getScrollbarCSS()};
`;

const ContentWrapper = styled.div`
  ${({ theme }) => css`
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
