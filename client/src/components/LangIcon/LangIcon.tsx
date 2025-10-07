import { FC, useMemo } from "react";
import styled from "styled-components";

import { PgLanguage, PgView } from "../../utils/pg";
import { QuestionMark } from "../Icons";

interface LangIconProps {
  /** File path to decide the language from */
  path: string;
}

const LangIcon: FC<LangIconProps> = ({ path }) => {
  const Icon = useMemo(() => {
    const lang = PgLanguage.getFromPath(path);
    if (!lang) return <QuestionMark />;
    return PgView.normalizeElement(lang.icon, { path });
  }, [path]);

  return <Wrapper>{Icon}</Wrapper>;
};

const Wrapper = styled.div`
  width: 1rem;
  height: 1rem;

  & > svg,
  & > img {
    width: 100%;
    height: 100%;
  }
`;

export default LangIcon;
