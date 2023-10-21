import { FC, Fragment } from "react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import Link from "../../Link";
import Markdown from "../../Markdown";
import { PointedArrow } from "../../Icons";
import { PgTheme, PgTutorial } from "../../../utils/pg";
import type { TutorialAboutComponentProps } from "../types";

export const About: FC<TutorialAboutComponentProps> = ({
  files,
  defaultOpenFile,
  about,
  pages,
}) => {
  const tutorial = PgTutorial.data;
  const isStarted = !!PgTutorial.pageNumber;
  const isFinished = PgTutorial.completed!;

  const startTutorial = async () => {
    await PgTutorial.start({
      files,
      defaultOpenFile,
      pageCount: pages.length,
    });
  };

  if (!tutorial) return null;

  return (
    <Wrapper>
      <GoBackButtonWrapper>
        <Link href="/tutorials">
          <Button kind="no-border" leftIcon={<PointedArrow rotate="180deg" />}>
            Go back to tutorials
          </Button>
        </Link>
      </GoBackButtonWrapper>

      <TutorialAboutPage>
        <TutorialTopSectionWrapper>
          <TutorialName>{tutorial.name}</TutorialName>
          <TutorialAuthorsWrapper>
            <TutorialAuthorsByText>by </TutorialAuthorsByText>
            {tutorial.authors.length !== 0 &&
              tutorial.authors.map((author, i) => (
                <Fragment key={i}>
                  {i !== 0 && (
                    <TutorialAuthorSeperator>, </TutorialAuthorSeperator>
                  )}
                  {author.link ? (
                    <TutorialAuthorLink href={author.link}>
                      {author.name}
                    </TutorialAuthorLink>
                  ) : (
                    <TutorialWithoutLink>{author.name}</TutorialWithoutLink>
                  )}
                </Fragment>
              ))}
          </TutorialAuthorsWrapper>

          <TutorialDescriptionWrapper>
            <TutorialDescription>{tutorial.description}</TutorialDescription>
            <StartTutorialButtonWrapper>
              <Button
                onClick={startTutorial}
                kind={isFinished ? "no-border" : "secondary"}
                color={isFinished ? "success" : undefined}
                fontWeight="bold"
                leftIcon={isFinished ? <span>✔</span> : undefined}
              >
                {isFinished ? "COMPLETED" : isStarted ? "CONTINUE" : "START"}
              </Button>
            </StartTutorialButtonWrapper>
          </TutorialDescriptionWrapper>
        </TutorialTopSectionWrapper>

        <TutorialAboutSectionWrapper>
          {typeof about === "string" ? <Markdown>{about}</Markdown> : about}
        </TutorialAboutSectionWrapper>
      </TutorialAboutPage>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  height: 100%;
  width: 100%;
  overflow: auto;
`;

const GoBackButtonWrapper = styled.div`
  display: flex;
  align-items: center;
  height: ${({ theme }) => theme.components.tabs.tab.default.height};
  padding-left: 1rem;

  & svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const TutorialAboutPage = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.views.tutorial.aboutPage)};
  `}
`;

const TutorialTopSectionWrapper = styled.div`
  padding: 1.5rem 0;
`;

const TutorialName = styled.h1``;

const TutorialAuthorsWrapper = styled.div`
  ${({ theme }) => css`
    margin-top: 0.5rem;
    font-size: ${theme.font.other.size.small};
    color: ${theme.colors.default.textSecondary};
  `}
`;

const TutorialAuthorsByText = styled.span``;

const TutorialAuthorSeperator = styled.span``;

const TutorialAuthorLink = styled(Link)``;

const TutorialWithoutLink = styled.span``;

const TutorialDescriptionWrapper = styled.div`
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
`;

const TutorialDescription = styled.p`
  color: ${({ theme }) => theme.colors.default.textSecondary};
  max-width: 85%;
  line-height: 1.5;
`;

const StartTutorialButtonWrapper = styled.div`
  margin-left: 2rem;
`;

const TutorialAboutSectionWrapper = styled.div``;
