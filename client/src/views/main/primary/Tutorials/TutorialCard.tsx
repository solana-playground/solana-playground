import { FC } from "react";
import styled, { css } from "styled-components";

import Card from "../../../../components/Card";
import Img from "../../../../components/Img";
import Tag from "../../../../components/Tag";
import { PgTheme, PgTutorial, TutorialData } from "../../../../utils/pg";

const TutorialCard: FC<TutorialData> = ({
  name,
  description,
  thumbnail,
  level,
  framework,
}) => (
  <Wrapper onClick={() => PgTutorial.open(name)}>
    <ImgWrapper>
      <TutorialImg src={thumbnail} />
    </ImgWrapper>

    <InfoWrapper>
      <InfoTopSection>
        <NameRow>
          <Name>{name}</Name>
          <Tag kind="level" value={level} />
        </NameRow>
        <Description>{description}</Description>
      </InfoTopSection>

      <InfoBottomSection>
        {framework && <Tag kind="framework" value={framework} />}
      </InfoBottomSection>
    </InfoWrapper>
  </Wrapper>
);

const Wrapper = styled(Card)`
  ${({ theme }) => css`
    --img-height: 13.1rem;

    width: calc(var(--img-height) * 4 / 3);
    height: 23rem;
    padding: 0;

    ${PgTheme.convertToCSS(
      theme.views.main.primary.tutorials.main.content.card.default
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
  ${PgTheme.getClampLinesCSS(1)};
`;

const Description = styled.div`
  ${({ theme }) => css`
    margin-top: 0.75rem;
    color: ${theme.colors.default.textSecondary};
    ${PgTheme.getClampLinesCSS(2)};
  `}
`;

const InfoBottomSection = styled.div``;

export default TutorialCard;
