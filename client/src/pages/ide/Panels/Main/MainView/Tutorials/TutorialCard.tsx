import { FC } from "react";
import styled, { css } from "styled-components";

import { PgTutorial, TutorialData } from "../../../../../../utils/pg";

const TutorialCard: FC<TutorialData> = ({
  name,
  description,
  imageSrc,
  categories,
}) => (
  <GradientWrapper onClick={() => PgTutorial.open(name)}>
    <InsideWrapper>
      <ImgWrapper>
        <Img src={imageSrc} />
      </ImgWrapper>
      <InfoWrapper>
        <Name>{name}</Name>
        <Description>
          {description.length < 72
            ? description
            : `${description.substring(0, 72)}...`}
        </Description>
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
    transition: transform ${theme.transition?.duration.medium}
      ${theme.transition?.type};

    &::after {
      content: "";
      position: absolute;
      transform: translateZ(-1px);
      height: 100%;
      width: 100%;
      inset: 0;
      margin: auto;
      border-radius: ${theme.borderRadius};
      background: linear-gradient(
        45deg,
        ${theme.colors.default.primary},
        ${theme.colors.default.secondary}
      );
      opacity: 0;
      transition: opacity ${theme.transition?.duration.medium}
        ${theme.transition?.type};
    }

    &:hover {
      cursor: pointer;
      transform: translateY(-0.5rem);

      & > div {
        background-color: ${theme.colors.state.hover.bg};
      }

      &::after {
        opacity: 1;
      }
    }
  `}
`;

const InsideWrapper = styled.div`
  ${({ theme }) => css`
    width: 100%;
    height: 100%;
    background-color: ${theme.colors.tutorials?.card?.bg};
    color: ${theme.colors.tutorials?.card?.color};
    border: 1px solid
      ${theme.colors.default.borderColor + theme.transparency?.medium};
    border-radius: ${theme.borderRadius};
    box-shadow: ${theme.boxShadow};
    overflow: hidden;
    transition: background-color ${theme.transition?.duration.medium}
      ${theme.transition?.type};
  `}
`;

const ImgWrapper = styled.div`
  width: 100%;
  height: var(--img-height);
`;

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const InfoWrapper = styled.div`
  width: 100%;
  height: calc(100% - var(--img-height));
  padding: 1rem 0.75rem;
`;

const Name = styled.div`
  font-weight: bold;
`;

const Description = styled.div`
  margin-top: 0.5rem;
  color: ${({ theme }) => theme.colors.default.textSecondary};
`;

const CategoriesWrapper = styled.div`
  margin-top: 0.5rem;
  display: flex;
  gap: 1rem;
`;

const Category = styled.div`
  ${({ theme }) => css`
    padding: 0.5rem 0.75rem;
    width: fit-content;
    background-color: ${theme.colors.tutorials?.bg};
    color: ${theme.colors.default.textSecondary};
    font-weight: bold;
    font-size: ${theme.font?.other?.size.small};
    box-shadow: ${theme.boxShadow};
    border-radius: ${theme.borderRadius};
  `}
`;

export default TutorialCard;
