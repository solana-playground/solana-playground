import { FC, useMemo } from "react";
import styled, { css, keyframes } from "styled-components";

import FilterGroups from "../../../../components/FilterGroups";
import Text from "../../../../components/Text";
import { PgTutorial, TutorialFullData } from "../../../../utils";
import type { Filter } from "../../../../hooks";

interface TutorialsProps {
  tutorials: TutorialFullData[];
  filters?: Filter[];
}

const Tutorials: FC<TutorialsProps> = ({ filters, ...props }) => {
  return filters ? (
    <FilterGroups items={props.tutorials} filters={filters} />
  ) : (
    <Progress {...props} />
  );
};

type ProgressProsp = Omit<TutorialsProps, "filters">;

const Progress: FC<ProgressProsp> = ({ tutorials }) => {
  const tutorialsData = useMemo(() => {
    return tutorials.reduce(
      (acc, cur) => {
        if (cur.progress === "Ongoing") acc.ongoing.push(cur);
        if (cur.progress === "Completed") acc.completed.push(cur);
        return acc;
      },
      { completed: [], ongoing: [] } as {
        completed: TutorialFullData[];
        ongoing: TutorialFullData[];
      }
    );
  }, [tutorials]);

  return (
    <ProgressWrapper>
      {!tutorialsData.ongoing.length && !tutorialsData.completed.length && (
        <Text>Choose and start a new tutorial to track your progress.</Text>
      )}
      <TutorialGroup name="Ongoing" tutorials={tutorialsData.ongoing} />
      <TutorialGroup name="Completed" tutorials={tutorialsData.completed} />
    </ProgressWrapper>
  );
};

const ProgressWrapper = styled.div`
  ${({ theme }) => css`
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1.5rem 1rem;
    color: ${theme.colors.default.textSecondary};
  `}
`;

interface TutorialGroupProps {
  name: string;
  tutorials: TutorialFullData[];
}

const TutorialGroup: FC<TutorialGroupProps> = ({ name, tutorials }) => {
  if (!tutorials.length) return null;

  return (
    <TutorialGroupWrapper>
      <TutorialGroupHeader>
        {name} -&gt; <Count>{tutorials.length}</Count>
      </TutorialGroupHeader>

      {tutorials.map((t) => (
        <TutorialWrapper
          key={t.name}
          onClick={() => PgTutorial.open(t.name)}
          progress={
            t.metadata
              ? t.metadata.completed
                ? 100
                : ((t.metadata.pageNumber - 1) / t.pageCount) * 100
              : 0
          }
        >
          <TutorialName>{t.name}</TutorialName>
        </TutorialWrapper>
      ))}
    </TutorialGroupWrapper>
  );
};

const TutorialGroupWrapper = styled.div``;

const TutorialGroupHeader = styled.div`
  ${({ theme }) => css`
    font-size: ${theme.font.code.size.large};
  `}
`;

const Count = styled.strong``;

const TutorialWrapper = styled.div<{ progress: number }>`
  ${({ theme, progress }) => css`
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background: ${theme.views.sidebar.right.default.otherBg};
    border-radius: ${theme.default.borderRadius};
    box-shadow: ${theme.default.boxShadow};
    transition: all ${theme.default.transition.duration.medium}
      ${theme.default.transition.type};
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      height: 0.125rem;
      background: ${progress === 100
        ? `linear-gradient(90deg, ${theme.colors.state.success.color} 0%, ${
            theme.colors.state.success.color + theme.default.transparency.high
          } 100%)`
        : `linear-gradient(90deg, ${theme.colors.default.primary} 0%, ${theme.colors.default.secondary} 100%)`};
      animation: ${keyframes`from { width: 0; } to { width: ${progress}%; }`}
        ${theme.default.transition.duration.long}
        ${theme.default.transition.type} forwards;
    }

    &:hover {
      background: ${theme.colors.state.hover.bg};
      color: ${theme.colors.default.textPrimary};
      cursor: pointer;
    }
  `}
`;

const TutorialName = styled.strong``;

export default Tutorials;
