import { FC } from "react";
import styled, { css, DefaultTheme } from "styled-components";

type TextType = "Info" | "Warning" | "Success" | "Error";

export interface TextProps {
  type?: TextType;
}

const Text: FC<TextProps> = ({ type, children }) => {
  return <Wrapper type={type}>{children}</Wrapper>;
};

const Wrapper = styled.div<TextProps>`
  ${({ theme, type }) => getTextStyle(theme, type ?? "Info")}
`;

const getTextStyle = (theme: DefaultTheme, type: TextType) => {
  let borderColor;

  if (type === "Info") borderColor = theme.colors.state.info.color;
  else if (type === "Warning") borderColor = theme.colors.state.warning.color;
  else if (type === "Success") borderColor = theme.colors.state.success.color;
  else if (type === "Error") borderColor = theme.colors.state.error.color;

  return css`
    padding: 1rem;
    background-color: ${theme.colors.right?.otherBg};
    border: 1px solid ${borderColor};
    border-radius: ${theme.borderRadius};
    display: flex;
    justify-content: center;
  `;
};

export default Text;
