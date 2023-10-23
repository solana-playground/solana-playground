import { FC } from "react";
import styled, { css } from "styled-components";

import Img from "../Img";
import { PgTheme, PgTutorial, TutorialData } from "../../utils/pg";

const TutorialCard: FC<TutorialData> = ({
  name,
  description,
  thumbnail,
  categories,
}) => (
  <GradientWrapper onClick={() => PgTutorial.open(name)}>
    <InsideWrapper>
      <ImgWrapper>
        <TutorialImg src={thumbnail} />
      </ImgWrapper>
      <InfoWrapper>
        <Name>{name}</Name>
        <Description>{description}</Description>
        <CategoriesWrapper>
          {categories.slice(0, 3).map((c, i) => (
            <Category key={i}>{c}</Category>
          ))}
        </CategoriesWrapper>
      </InfoWrapper>
    </InsideWrapper>
  </GradientWrapper>
);

const GradientWrapper = styled.div`
  ${({ theme }) => css`
    --img-height: 15rem;

    padding: 0.25rem;
    width: 20rem;
    height: 24rem;
    position: relative;
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
      theme.components.main.views.tutorials.main.card.gradient
    )};
  `}
`;

const InsideWrapper = styled.div`
  ${({ theme }) => css`
    width: 100%;
    height: 100%;
    overflow: hidden;

    ${PgTheme.convertToCSS(
      theme.components.main.views.tutorials.main.card.default
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
  ${({ theme }) => css`
    width: 100%;
    height: calc(100% - var(--img-height));

    ${PgTheme.convertToCSS(
      theme.components.main.views.tutorials.main.card.info.default
    )};
  `}
`;

const Name = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.views.tutorials.main.card.info.name
    )};
  `}
`;

const Description = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.views.tutorials.main.card.info.description
    )};
  `}
`;

const CategoriesWrapper = styled.div`
  margin-top: 0.5rem;
  display: flex;
  gap: 1rem;
`;

const Category = styled.div`
  ${({ theme }) => css`
    ${PgTheme.convertToCSS(
      theme.components.main.views.tutorials.main.card.info.category
    )};
  `}
`;

export default TutorialCard;
