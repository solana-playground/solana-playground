import { FC, useEffect, useState } from "react";
import styled, { css } from "styled-components";

import Button from "../../../../../../../components/Button";
import { ResourceProps, RESOURCES } from "./resources";
import { TutorialProps, TUTORIALS } from "./tutorials";
import { DefaultLink } from "../../../../../../../components/Link";
import { External } from "../../../../../../../components/Icons";
import { Id, PROJECT_NAME } from "../../../../../../../constants";
import { PgThemeManager } from "../../../../../../../utils/pg/theme";

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
        </TutorialsWrapper>
      </ContentWrapper>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.main.views.home.default)};
  `}
`;

const ProjectTitle = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(theme.components.main.views.home.title)};
  `}
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  width: 100%;
`;

const ResourcesWrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.main.views.home.resources.default
    )};
  `}
`;

const ResourcesTitle = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.main.views.home.resources.title
    )};
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
      <ResourceImg src={src} circleImage={circleImage} />
      {title}
    </ResourceTitle>
    <ResourceDescription>{text}</ResourceDescription>
    <ResourceButtonWrapper>
      <DefaultLink href={url}>
        <ResourceButton rightIcon={<External />}>Learn more</ResourceButton>
      </DefaultLink>
    </ResourceButtonWrapper>
  </ResourceWrapper>
);

const ResourceWrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.main.views.home.resources.card.default
    )};
  `}
`;

const ResourceTitle = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.main.views.home.resources.card.title
    )};
  `}
`;

const ResourceImg = styled.img<{ circleImage?: boolean }>`
  ${({ theme, circleImage }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.main.views.home.resources.card.image
    )};

    ${circleImage && "border-radius: 50%"};
  `};
`;

const ResourceDescription = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.main.views.home.resources.card.description
    )};
  `}
`;

const ResourceButtonWrapper = styled.div`
  width: 100%;
  height: 20%;
`;

const ResourceButton = styled(Button)`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.main.views.home.resources.card.button
    )};
  `}
`;

const TutorialsWrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.main.views.home.tutorials.default
    )};
  `}
`;

const TutorialsTitle = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.main.views.home.tutorials.title
    )};
  `}
`;

const TutorialCardsWrapper = styled.div``;

const Tutorial: FC<TutorialProps> = ({ title, url }) => {
  const src = getSrc(url);

  return (
    <DefaultLink href={url}>
      <TutorialWrapper>
        {src && <TutorialIcon src={src} />}
        <TutorialTitle>{title}</TutorialTitle>
      </TutorialWrapper>
    </DefaultLink>
  );
};

const TutorialWrapper = styled.div`
  ${({ theme }) => css`
    ${PgThemeManager.convertToCSS(
      theme.components.main.views.home.tutorials.card
    )};
  `}
`;

const TutorialIcon = styled.img`
  height: 1rem;
  margin-right: 0.75rem;
`;

const TutorialTitle = styled.span``;

const getSrc = (url: string) => {
  let src: string = "";

  if (url.includes("youtube.com")) src = "youtube.png";
  else if (url.includes("dev.to")) src = "devto.png";

  if (src) return "/icons/platforms/" + src;
};

export default Home;
