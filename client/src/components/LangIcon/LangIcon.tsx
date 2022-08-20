import { FC } from "react";
import styled from "styled-components";

import { ImgSrc } from "../../constants";
import { Langs } from "./langs";

interface LangIconProps {
  fileName: string;
}

const LangIcon: FC<LangIconProps> = ({ fileName }) => (
  <Img src={getIconSrc(fileName)} alt={fileName} />
);

const Img = styled.img`
  filter: ${({ theme, src }) => {
    if (src?.includes("python")) return;
    return theme.isDark ? "invert(0.6)" : "invert(0.4)";
  }};
  width: 1rem;
  height: 1rem;
`;

const getIconSrc = (fileName: string) => {
  const parts = fileName.split(".");
  const ext = parts.at(parts.length - 1);
  if (!ext) return ImgSrc.UNKNOWN;

  return Langs[ext] ?? ImgSrc.UNKNOWN;
};

export default LangIcon;
