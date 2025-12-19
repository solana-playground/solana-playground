import { FC, useMemo } from "react";
import styled, { css } from "styled-components";

import Img from "../Img";
import LangIcon from "../LangIcon";
import {
  OrString,
  PgFramework,
  PgLanguage,
  TutorialDetailKey,
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
      return <Level {...props}>{props.value}</Level>;
    case "framework":
      return <Framework {...props} />;
    case "languages":
      return <Language {...props} />;
    default:
      return <Default {...props} />;
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

interface FrameworkProps {
  value: FrameworkName;
}

const Framework: FC<FrameworkProps> = ({ value, ...props }) => {
  const framework = useMemo(() => PgFramework.get(value), [value]);
  const ref = useDelayedDifferentBackground();

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
  value: LanguageName;
}

const Language: FC<LanguageProps> = ({ value, ...props }) => {
  const ref = useDelayedDifferentBackground();
  const path =
    "file." +
    PgLanguage.all.find((lang) => lang.name === value)?.extensions.at(0);

  return (
    <Boxed ref={ref} {...props}>
      <LangIcon path={path} />
      {value}
    </Boxed>
  );
};

type DefaultProps = Omit<TagProps, "kind">;

const Default: FC<DefaultProps> = ({ value, ...props }) => {
  const ref = useDelayedDifferentBackground();
  return (
    <Boxed ref={ref} {...props}>
      {value}
    </Boxed>
  );
};

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

/**
 * Add a delay to decide the parent background because the parent background may
 * also be using `useDifferentBackground` hook.
 */
const useDelayedDifferentBackground = () => useDifferentBackground(10);

export default Tag;
