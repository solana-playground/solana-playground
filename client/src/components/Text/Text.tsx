import { FC, ReactNode } from "react";
import styled, { css, DefaultTheme } from "styled-components";

type TextType = "Normal" | "Info" | "Warning" | "Success" | "Error";
type TextSize = "Small" | "Medium" | "Large";

export interface TextProps {
  type?: TextType;
  size?: TextSize;
  IconEl?: ReactNode;
}

const Text: FC<TextProps> = ({ IconEl, children, ...rest }) => {
  return (
    <Wrapper IconEl={IconEl} {...rest}>
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
  type: TextType = "Normal",
  size: TextSize = "Small",
  iconElExists: boolean
) => {
  let color;
  let fontSize;

  if (type === "Normal") color = "inherit";
  else if (type === "Info") color = theme.colors.state.info.color;
  else if (type === "Warning") color = theme.colors.state.warning.color;
  else if (type === "Success") color = theme.colors.state.success.color;
  else if (type === "Error") color = theme.colors.state.error.color;

  if (size === "Small") fontSize = theme.font?.size.small;
  else if (size === "Medium") fontSize = theme.font?.size.medium;
  else if (size === "Large") fontSize = theme.font?.size.large;

  let returnedCss = css`
    font-size: ${fontSize};
    color: ${color};
    background-color: ${theme.colors.right?.otherBg};
    padding: 1rem;
    border-radius: ${theme.borderRadius};
    display: flex;
    justify-content: center;
    align-items: center;

    & > div {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `;

  if (iconElExists)
    returnedCss = returnedCss.concat(css`
      & div > svg {
        width: 1.5rem;
        height: 1.5rem;
        margin-right: 0.5rem;
      }
    `);

  return returnedCss;
};

export default Text;
