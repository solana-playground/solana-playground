import { FC, useMemo } from "react";
import styled, { css } from "styled-components";

import Img from "../Img";
import LangIcon from "../LangIcon";
import {
  OrString,
  PgFramework,
  TutorialCategory,
  TutorialDetailKey,
  TutorialLanguage,
  TutorialLevel,
} from "../../utils/pg";
import { useDifferentBackground } from "../../hooks";

interface TagProps {
  kind: OrString<TutorialDetailKey>;
  value: any;
}

const Tag: FC<TagProps> = ({ kind, ...props }) => {
  switch (kind) {
    case "level":
      return <Level {...props} children={props.value} />;
    case "framework":
      return <Framework {...props} />;
    case "languages":
      return <Language {...props} />;
    case "categories":
      return <Category {...props} />;
    default:
      return <span {...props}></span>;
  }
};

const Level = styled.span<{ children: TutorialLevel }>`
  ${({ children, theme }) => {
    const state =
      children === "Beginner"
        ? "success"
        : children === "Intermediate"
        ? "warning"
        : children === "Advanced"
        ? "info"
        : "error";
    return css`
      padding: 0.25rem 0.5rem;
      background: ${theme.colors.state[state].bg};
      color: ${theme.colors.state[state].color} !important;
      border-radius: ${theme.default.borderRadius};
      font-size: ${theme.font.other.size.xsmall};
      font-weight: bold;
      text-transform: uppercase;
    `;
  }}
`;

const Boxed = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem 0.75rem;
    width: fit-content;
    display: flex;
    align-items: center;
    color: ${theme.colors.default.textSecondary};
    border-radius: ${theme.default.borderRadius};
    box-shadow: ${theme.default.boxShadow};
    font-size: ${theme.font.other.size.small};
    font-weight: bold;

    & *:first-child {
      margin-right: 0.5rem;
    }
  `}
`;

interface FrameworkProps {
  value: FrameworkName;
}

const Framework: FC<FrameworkProps> = ({ value, ...props }) => {
  const framework = useMemo(() => PgFramework.get(value), [value]);
  const { ref } = useDelayedDifferentBackground();

  return (
    <Boxed ref={ref} {...props}>
      <FrameworkImage src={framework.icon} $circle={framework.circleImage} />
      {value}
    </Boxed>
  );
};

const FrameworkImage = styled(Img)<{ $circle?: boolean }>`
  ${({ $circle }) => css`
    width: 1rem;
    height: 1rem;
    ${$circle && "border-radius: 50%"};
  `}
`;

interface LanguageProps {
  value: TutorialLanguage;
}

const Language: FC<LanguageProps> = ({ value, ...props }) => {
  const { ref } = useDelayedDifferentBackground();

  return (
    <Boxed ref={ref} {...props}>
      <LangIcon fileName={getLanguageExtension(value)} />
      {value}
    </Boxed>
  );
};

const getLanguageExtension = (lang: TutorialLanguage) => {
  switch (lang) {
    case "Python":
      return ".py";
    case "Rust":
      return ".rs";
    case "TypeScript":
      return ".ts";
  }
};

interface CategoryProps {
  value: TutorialCategory;
}

const Category: FC<CategoryProps> = ({ value, ...props }) => {
  const { ref } = useDelayedDifferentBackground();
  return (
    <Boxed ref={ref} {...props}>
      {value}
    </Boxed>
  );
};

/**
 * Add a delay to decide the parent background because the parent background may
 * also be using `useDifferentBackground` hook.
 */
const useDelayedDifferentBackground = () => useDifferentBackground(10);

export default Tag;
