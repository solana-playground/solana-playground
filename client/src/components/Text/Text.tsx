import { FC } from "react";
import styled, { css, DefaultTheme } from "styled-components";

type TextType = "Info" | "Warning" | "Success" | "Error";
type TextSize = "Small" | "Medium" | "Large";

export interface TextProps {
  type?: TextType;
  size?: TextSize;
}

const Text: FC<TextProps> = ({ type, size, children }) => {
  return (
    <Wrapper type={type} size={size}>
      {children}
    </Wrapper>
  );
};

const Wrapper = styled.div<TextProps>`
  ${({ theme, type, size }) => getTextStyle(theme, type, size)}
`;

const getTextStyle = (
  theme: DefaultTheme,
  type: TextType = "Info",
  size: TextSize = "Small"
) => {
  let borderColor;
  let fontSize;

  if (type === "Info") borderColor = theme.colors.state.info.color;
  else if (type === "Warning") borderColor = theme.colors.state.warning.color;
  else if (type === "Success") borderColor = theme.colors.state.success.color;
  else if (type === "Error") borderColor = theme.colors.state.error.color;

  if (size === "Small") fontSize = theme.font?.size.small;
  else if (size === "Medium") fontSize = theme.font?.size.medium;
  else if (size === "Large") fontSize = theme.font?.size.large;

  return css`
    font-size: ${fontSize};
    padding: 1rem;
    background-color: ${theme.colors.right?.otherBg};
    border: 1px solid ${borderColor};
    border-radius: ${theme.borderRadius};
    display: flex;
    justify-content: center;
  `;
};

export default Text;
