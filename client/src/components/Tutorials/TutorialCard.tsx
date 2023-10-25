import { FC, useMemo } from "react";
import styled, { css } from "styled-components";

import Img from "../Img";
import { PgFramework, PgTheme, PgTutorial, TutorialData } from "../../utils/pg";

const TutorialCard: FC<TutorialData> = ({
  name,
  description,
  thumbnail,
  level,
  framework,
}) => (
  <GradientWrapper onClick={() => PgTutorial.open(name)}>
    <InsideWrapper>
      <ImgWrapper>
        <TutorialImg src={thumbnail} />
      </ImgWrapper>

      <InfoWrapper>
        <InfoTopSection>
          <NameRow>
            <Name>{name}</Name>
            <Level>{level}</Level>
          </NameRow>
          <Description>{description}</Description>
        </InfoTopSection>

        <InfoBottomSection>
          {framework && <Framework name={framework} />}
        </InfoBottomSection>
      </InfoWrapper>
    </InsideWrapper>
  </GradientWrapper>
);

const GradientWrapper = styled.div`
  ${({ theme }) => css`
    --img-height: 13.5rem;

    position: relative;
    width: calc(var(--img-height) * 4 / 3);
    height: 23rem;
    padding: 0.25rem;
    transform-style: preserve-3d;
    transition: transform ${theme.default.transition.duration.medium}
      ${theme.default.transition.type};

    &::after {
      content: "";
      position: absolute;
      transform: translateZ(-1px);
      height: 100%;
      width: 100%;
      inset: 0;
      margin: auto;
      border-radius: ${theme.default.borderRadius};
      background: linear-gradient(
        45deg,
        ${theme.colors.default.primary},
        ${theme.colors.default.secondary}
      );
      opacity: 0;
      transition: opacity ${theme.default.transition.duration.medium}
        ${theme.default.transition.type};
    }

    &:hover {
      cursor: pointer;
      transform: translateY(-0.5rem);

      & > div {
        background: ${theme.colors.state.hover.bg};
      }

      &::after {
        opacity: 1;
      }
    }

    ${PgTheme.convertToCSS(
      theme.components.main.views.tutorials.main.tutorials.card.gradient
    )};
  `}
`;

const InsideWrapper = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.views.tutorials.main.tutorials.card.default
    )};
  `}
`;

const ImgWrapper = styled.div`
  width: 100%;
  height: var(--img-height);
`;

const TutorialImg = styled(Img)`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const InfoWrapper = styled.div`
  width: 100%;
  height: calc(100% - var(--img-height));
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const InfoTopSection = styled.div``;

const NameRow = styled.div``;

const Name = styled.span`
  font-weight: bold;
`;

const Level = styled.span<{ children: TutorialData["level"] }>`
  ${({ children, theme }) => {
    const state =
      children === "Beginner"
        ? "success"
        : children === "Intermediate"
        ? "warning"
        : "info";
    return css`
      margin-left: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: ${theme.colors.state[state].bg};
      color: ${theme.colors.state[state].color};
      border-radius: ${theme.default.borderRadius};
      font-size: ${theme.font.other.size.xsmall};
      font-weight: bold;
      text-transform: uppercase;
    `;
  }}
`;

const Description = styled.div`
  ${({ theme }) => css`
    margin-top: 0.75rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: ${theme.colors.default.textSecondary};
  `}
`;

const InfoBottomSection = styled.div``;

interface FrameworkProps {
  name: FrameworkName;
}

const Framework: FC<FrameworkProps> = ({ name }) => {
  const framework = useMemo(() => PgFramework.get(name), [name]);
  return (
    <FrameworkWrapper>
      <FrameworkImage src={framework.icon} $circle={framework.circleImage} />
      {name}
    </FrameworkWrapper>
  );
};

const FrameworkWrapper = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem 0.75rem;
    width: fit-content;
    display: flex;
    align-items: center;
    background: ${PgTheme.getDifferentBackground(
      theme.components.main.views.tutorials.main.tutorials.card.default.bg
    )};
    color: ${theme.colors.default.textSecondary};
    border-radius: ${theme.default.borderRadius};
    box-shadow: ${theme.default.boxShadow};
    font-size: ${theme.font.other.size.small};
    font-weight: bold;
  `}
`;

const FrameworkImage = styled(Img)<{ $circle?: boolean }>`
  ${({ $circle }) => css`
    margin-right: 0.5rem;
    width: 1rem;
    height: 1rem;
    border-radius: ${$circle && "50%"};
  `}
`;

export default TutorialCard;
