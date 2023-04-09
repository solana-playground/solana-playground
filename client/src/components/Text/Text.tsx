import { FC, ReactNode } from "react";
import styled, { css, DefaultTheme } from "styled-components";

type TextType = "Normal" | "Info" | "Warning" | "Success" | "Error";
type TextSize = "Small" | "Medium" | "Large";
type TextBg = "Primary" | "Secondary" | "Transparent";

export interface TextProps {
  type?: TextType;
  size?: TextSize;
  bg?: TextBg;
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
  ${({ theme, type, size, bg, IconEl }) =>
    getTextStyle(theme, type, size, bg, !!IconEl)}
`;

const getTextStyle = (
  theme: DefaultTheme,
  type: TextType = "Normal",
  size: TextSize = "Small",
  bg: TextBg = "Secondary",
  iconElExists: boolean
) => {
  let color;
  let fontSize;
  let bgColor;

  if (type === "Normal") color = "inherit";
  else if (type === "Info") color = theme.colors.state.info.color;
  else if (type === "Warning") color = theme.colors.state.warning.color;
  else if (type === "Success") color = theme.colors.state.success.color;
  else if (type === "Error") color = theme.colors.state.error.color;

  if (size === "Small") fontSize = theme.font.code.size.small;
  else if (size === "Medium") fontSize = theme.font.code.size.medium;
  else if (size === "Large") fontSize = theme.font.code.size.large;

  if (bg === "Primary") bgColor = theme.components.sidebar.right.default.bg;
  else if (bg === "Secondary")
    bgColor = theme.components.sidebar.right.default.otherBg;
  else if (bg === "Transparent") bgColor = "transparent";

  let returnedCss = css`
    font-size: ${fontSize};
    color: ${color};
    background: ${bgColor};
    padding: ${bg === "Transparent" ? "0" : "1rem"};
    border-radius: ${theme.borderRadius};
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 1.5;

    & > div {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  `;

  if (iconElExists) {
    returnedCss = returnedCss.concat(css`
      & div > svg {
        width: 1.5rem;
        height: 1.5rem;
        margin-right: 0.75rem;
      }
    `);
  }

  return returnedCss;
};

export default Text;
