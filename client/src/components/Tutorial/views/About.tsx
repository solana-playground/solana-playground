import { FC, Fragment } from "react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import Link from "../../Link";
import Markdown from "../../Markdown";
import TutorialDetail from "../TutorialDetail";
import { PointedArrow, Triangle } from "../../Icons";
import {
  Arrayable,
  PgTheme,
  PgTutorial,
  TutorialDetailKey,
} from "../../../utils/pg";
import type { TutorialAboutComponentProps } from "../types";

export const About: FC<TutorialAboutComponentProps> = ({
  files,
  defaultOpenFile,
  about,
  pages,
}) => {
  const tutorial = PgTutorial.data;
  const isStarted = !!PgTutorial.pageNumber;
  const isFinished = PgTutorial.completed;

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
        <GeneratedWrapper>
          <GeneratedTopWrapper>
            <GeneratedTopLeftWrapper>
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
                        <TutorialAuthorWithoutLink>
                          {author.name}
                        </TutorialAuthorWithoutLink>
                      )}
                    </Fragment>
                  ))}
              </TutorialAuthorsWrapper>
            </GeneratedTopLeftWrapper>

            <GeneratedTopRightWrapper>
              <Button
                onClick={startTutorial}
                kind={isFinished ? "no-border" : "secondary"}
                color={isFinished ? "success" : undefined}
                fontWeight="bold"
                leftIcon={
                  isFinished ? <span>✔</span> : <Triangle rotate="90deg" />
                }
              >
                {isFinished ? "COMPLETED" : isStarted ? "CONTINUE" : "START"}
              </Button>
            </GeneratedTopRightWrapper>
          </GeneratedTopWrapper>

          <GeneratedBottomWrapper>
            <TutorialDescription>{tutorial.description}</TutorialDescription>

            <TutorialDetails
              details={[
                { kind: "level", data: tutorial.level },
                { kind: "framework", data: tutorial.framework },
                { kind: "languages", data: tutorial.languages },
                // TODO: Enable once there are more tutorials with various categories
                // { kind: "categories", data: tutorial.categories },
              ]}
            />
          </GeneratedBottomWrapper>
        </GeneratedWrapper>

        <CustomWrapper>
          {typeof about === "string" ? <Markdown>{about}</Markdown> : about}
        </CustomWrapper>
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

const GeneratedWrapper = styled.div`
  padding: 1.5rem 0;
`;

const GeneratedTopWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const GeneratedTopLeftWrapper = styled.div``;

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

const TutorialAuthorWithoutLink = styled.span``;

const GeneratedTopRightWrapper = styled.div``;

const GeneratedBottomWrapper = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TutorialDescription = styled.p`
  color: ${({ theme }) => theme.colors.default.textSecondary};
  line-height: 1.5;
`;

interface TutorialDetailsProps {
  details: ClickableTutorialDetailProps[];
}

const TutorialDetails: FC<TutorialDetailsProps> = ({ details }) => (
  <TutorialDetailsWrapper>
    {details.map(({ kind, data }) => {
      return (
        data && (
          <TutorialDetailSection key={kind}>
            <TutorialDetailName>{kind}</TutorialDetailName>

            <TutorialDetailWrapper>
              {Array.isArray(data) ? (
                data.map((data) => (
                  <ClickableTutorialDetail key={data} kind={kind} data={data} />
                ))
              ) : (
                <ClickableTutorialDetail kind={kind} data={data} />
              )}
            </TutorialDetailWrapper>
          </TutorialDetailSection>
        )
      );
    })}
  </TutorialDetailsWrapper>
);

const TutorialDetailsWrapper = styled.div`
  ${({ theme }) => css`
    padding: 1rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 2rem;
    background: ${PgTheme.getDifferentBackground(
      theme.components.main.views.tutorial.aboutPage.bg
    )};
    border-radius: ${theme.default.borderRadius};
  `}
`;

const TutorialDetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TutorialDetailName = styled.span`
  ${({ theme }) => css`
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    font-size: ${theme.font.other.size.small};
  `}
`;

const TutorialDetailWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

interface ClickableTutorialDetailProps {
  kind: TutorialDetailKey;
  data: Arrayable<string> | undefined;
}

const ClickableTutorialDetail: FC<ClickableTutorialDetailProps> = ({
  data,
  ...props
}) => (
  <ClickableTutorialDetailWrapper href={`/tutorials?${props.kind}=${data}`}>
    <TutorialDetail {...props}>{data}</TutorialDetail>
  </ClickableTutorialDetailWrapper>
);

const ClickableTutorialDetailWrapper = styled(Link)`
  ${({ theme }) => css`
    &:hover * {
      color: ${theme.colors.default.textPrimary};
    }
  `}
`;

const CustomWrapper = styled.div``;
