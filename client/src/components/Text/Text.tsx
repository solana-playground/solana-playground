import { FC, ReactNode } from "react";
import styled, { css, DefaultTheme } from "styled-components";

type TextType = "Info" | "Warning" | "Success" | "Error";
type TextSize = "Small" | "Medium" | "Large";

export interface TextProps {
  type?: TextType;
  size?: TextSize;
  IconEl?: ReactNode;
}

const Text: FC<TextProps> = ({ type, size, IconEl, children }) => {
  return (
    <Wrapper type={type} size={size} IconEl={IconEl}>
      <div>{IconEl}</div>
      <div>{children}</div>
    </Wrapper>
  );
};

const Wrapper = styled.div<TextProps>`
  ${({ theme, type, size, IconEl }) =>
    getTextStyle(theme, type, size, IconEl ? true : false)}
`;

const getTextStyle = (
  theme: DefaultTheme,
  type: TextType = "Info",
  size: TextSize = "Small",
  iconElExists: boolean
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

  let returnedCss = css`
    font-size: ${fontSize};
    padding: 1rem;
    background-color: ${theme.colors.right?.otherBg};
    border: 1px solid ${borderColor};
    border-radius: ${theme.borderRadius};
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  if (iconElExists)
    returnedCss = returnedCss.concat(css`
      & > svg {
        width: 1.5rem;
        height: 1.5rem;
        margin-right: 0.5rem;
      }
    `);

  return returnedCss;
};

export default Text;
