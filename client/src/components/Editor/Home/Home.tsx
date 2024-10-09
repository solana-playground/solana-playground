import { FC, useEffect, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../../Button";
import Img from "../../Img";
import Link from "../../Link";
import { ResourceProps, RESOURCES } from "./resources";
import { TutorialProps, TUTORIALS } from "./tutorials";
import { External, ShortArrow } from "../../Icons";
import { Id, PROJECT_NAME } from "../../../constants";
import { PgTheme } from "../../../utils/pg";

const Home = () => {
  // This prevents unnecessarily fetching the home content for a frame when the
  // app is first mounted
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <Wrapper id={Id.HOME}>
      <ProjectTitle>{PROJECT_NAME}</ProjectTitle>

      <ContentWrapper>
        <ResourcesWrapper>
          <ResourcesTitle>Resources</ResourcesTitle>
          <ResourceCardsWrapper>
            {RESOURCES.map((r, i) => (
              <Resource key={i} {...r} />
            ))}
          </ResourceCardsWrapper>
        </ResourcesWrapper>

        <TutorialsWrapper>
          <TutorialsTitle>Tutorials</TutorialsTitle>
          <TutorialCardsWrapper>
            {TUTORIALS.map((t, i) => (
              <Tutorial key={i} {...t} />
            ))}
          </TutorialCardsWrapper>

          <Link href="/tutorials">
            <PlaygroundTutorialsButton kind="icon">
              Playground tutorials
              <ShortArrow />
            </PlaygroundTutorialsButton>
          </Link>
        </TutorialsWrapper>
      </ContentWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.primary.home.default)};
  `}
`;

const ProjectTitle = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.primary.home.title)};
  `}
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
`;

const ResourcesWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.primary.home.resources.default
    )};
  `}
`;

const ResourcesTitle = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.primary.home.resources.title)};
  `}
`;

const ResourceCardsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const Resource: FC<ResourceProps> = ({
  title,
  text,
  url,
  src,
  circleImage,
}) => (
  <ResourceWrapper>
    <ResourceTitle>
      <ResourceImg src={src} $circleImage={circleImage} />
      {title}
    </ResourceTitle>
    <ResourceDescription>{text}</ResourceDescription>
    <ResourceButtonWrapper>
      <Link href={url}>
        <ResourceButton rightIcon={<External />}>Learn more</ResourceButton>
      </Link>
    </ResourceButtonWrapper>
  </ResourceWrapper>
);

const ResourceWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.primary.home.resources.card.default
    )};
  `}
`;

const ResourceTitle = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.primary.home.resources.card.title
    )};
  `}
`;

const ResourceImg = styled(Img)<{ $circleImage?: boolean }>`
  ${({ theme, $circleImage }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.primary.home.resources.card.image
    )};

    ${$circleImage && "border-radius: 50%"};
  `};
`;

const ResourceDescription = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.primary.home.resources.card.description
    )};
  `}
`;

const ResourceButtonWrapper = styled.div`
  width: 100%;
  height: 20%;
`;

const ResourceButton = styled(Button)`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.primary.home.resources.card.button
    )};
  `}
`;

const TutorialsWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.primary.home.tutorials.default
    )};
  `}
`;

const TutorialsTitle = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.primary.home.tutorials.title)};
  `}
`;

const TutorialCardsWrapper = styled.div``;

const Tutorial: FC<TutorialProps> = ({ title, url }) => {
  const src = getSrc(url);

  return (
    <Link href={url}>
      <TutorialWrapper>
        {src && <TutorialIcon src={src} />}
        <TutorialTitle>{title}</TutorialTitle>
      </TutorialWrapper>
    </Link>
  );
};

const getSrc = (url: string) => {
  let src = "";

  if (url.includes("youtube.com")) src = "youtube.png";
  else if (url.includes("dev.to")) src = "devto.png";

  if (src) return "/icons/platforms/" + src;
};

const TutorialWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(theme.components.main.primary.home.tutorials.card)};
  `}
`;

const TutorialIcon = styled(Img)`
  height: 1rem;
  margin-right: 0.75rem;
`;

const TutorialTitle = styled.span``;

const PlaygroundTutorialsButton = styled(Button)`
  ${({ theme }) => css`
    color: ${theme.colors.default.primary};
    padding: 0.25rem 0.5rem;

    svg {
      margin-left: 0.25rem;
    }

    &::hover {
      text-decoration: underline;
    }
  `}
`;

export default Home;
