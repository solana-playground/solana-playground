import { FC } from "react";
import styled, { css } from "styled-components";

import Img from "../Img";
import { PgTheme, PgTutorial, TutorialData } from "../../utils/pg";
import TutorialDetail from "../Tutorial/TutorialDetail";

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
            <TutorialDetail kind="level">{level}</TutorialDetail>
          </NameRow>
          <Description>{description}</Description>
        </InfoTopSection>

        <InfoBottomSection>
          {framework && (
            <TutorialDetail kind="framework">{framework}</TutorialDetail>
          )}
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

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Name = styled.span`
  font-weight: bold;
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

export default TutorialCard;
