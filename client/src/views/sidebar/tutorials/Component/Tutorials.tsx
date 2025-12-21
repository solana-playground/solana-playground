import { FC, useState } from "react";
import styled, { css, keyframes } from "styled-components";

import FilterGroups from "../../../../components/FilterGroups";
import Text from "../../../../components/Text";
import TutorialsSkeleton from "./TutorialsSkeleton";
import {
  PgCommon,
  PgTutorial,
  TutorialData,
  TutorialFullData,
  TutorialMetadata,
} from "../../../../utils/pg";
import { Filter, useAsyncEffect } from "../../../../hooks";

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

type TutorialDataWithMetadata = TutorialData & TutorialMetadata;

type ProgressProsp = Omit<TutorialsProps, "filters">;

const Progress: FC<ProgressProsp> = ({ tutorials }) => {
  const [tutorialsData, setTutorialsData] = useState<{
    completed: TutorialDataWithMetadata[];
    ongoing: TutorialDataWithMetadata[];
  }>();

  // Get tutorial data
  useAsyncEffect(async () => {
    // Sleep here because:
    // - Explorer might not have been initialized
    // - The current tutorial's `completed` state might not have been saved yet
    // after finishing the tutorial
    // - Better transition
    //
    // TODO: Remove this after making sure explorer is always initialized
    // before this runs.
    await PgCommon.sleep(300);

    const data: typeof tutorialsData = { completed: [], ongoing: [] };
    for (const tutorialName of PgTutorial.getUserTutorialNames()) {
      const tutorialData = tutorials.find((t) => t.name === tutorialName);
      if (!tutorialData) continue;

      const tutorialMetadata = await PgTutorial.getMetadata(tutorialName);
      const tutorialFullData = { ...tutorialData, ...tutorialMetadata };
      if (tutorialMetadata.completed) data.completed.push(tutorialFullData);
      else data.ongoing.push(tutorialFullData);
    }

    setTutorialsData(data);
  }, [tutorials]);

  if (!tutorialsData) return <TutorialsSkeleton />;

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
  tutorials: TutorialDataWithMetadata[];
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
            t.completed ? 100 : ((t.pageNumber - 1) / t.pageCount) * 100
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
