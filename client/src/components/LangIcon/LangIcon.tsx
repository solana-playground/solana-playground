import { FC, useMemo } from "react";
import styled from "styled-components";

import { PgLanguage } from "../../utils/pg";
import {
  JavaScript,
  Json,
  Python,
  QuestionMark,
  Rust,
  TypeScript,
} from "../Icons";

interface LangIconProps {
  /** File path to decide the language from */
  path: string;
}

const LangIcon: FC<LangIconProps> = ({ path }) => {
  const Icon = useMemo(() => {
    const lang = PgLanguage.getFromPath(path);
    switch (lang?.name) {
      case "Rust":
        return <Rust color="textSecondary" />;
      case "Python":
        return <Python />;
      case "JavaScript":
        return <JavaScript isTest={path.endsWith(".test.js")} />;
      case "TypeScript":
        return <TypeScript isTest={path.endsWith(".test.ts")} />;
      case "JSON":
        return <Json />;
      default:
        return <QuestionMark />;
    }
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
