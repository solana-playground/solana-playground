import { FC, useState } from "react";
import styled, { css, keyframes } from "styled-components";

import Card from "../../../../components/Card";
import Img from "../../../../components/Img";
import Tag from "../../../../components/Tag";
import { useAsyncEffect } from "../../../../hooks";
import {
  PgTheme,
  PgTutorial,
  TutorialData,
  TutorialMetadata,
} from "../../../../utils/pg";

type TutorialCardProps = TutorialData;

const TutorialCard: FC<TutorialCardProps> = ({
  name,
  description,
  thumbnail,
  level,
  framework,
  pageCount,
}) => {
  const [metadata, setMetadata] = useState<TutorialMetadata>();
  useAsyncEffect(async () => {
    const tutorial = PgTutorial.all.find((t) => t.name === name);
    if (!tutorial) throw new Error(`Tutorial not found: ${name}`);
    const metadata = await PgTutorial.getMetadata(name);
    setMetadata(metadata);
  }, [name]);

  return (
    <Wrapper onClick={() => PgTutorial.open(name)}>
      <ImgWrapper
        progress={
          metadata
            ? metadata.completed
              ? 100
              : ((metadata.pageNumber - 1) / pageCount) * 100
            : 0
        }
      >
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
};

const Wrapper = styled(Card)`
  --img-height: 16.125rem;

  width: calc(var(--img-height) * 4 / 3);
  height: 26rem;
  padding: 0;
`;

const ImgWrapper = styled.div<{ progress: number }>`
  ${({ theme, progress }) => css`
    width: 100%;
    height: var(--img-height);
    position: relative;

    &::after {
      --progress-height: 0.25rem;

      content: "";
      position: absolute;
      left: 0;
      bottom: calc(-1 * var(--progress-height));
      height: var(--progress-height);
      background: ${progress === 100
        ? `linear-gradient(90deg, ${theme.colors.state.success.color} 0%, ${
            theme.colors.state.success.color + theme.default.transparency.high
          } 100%)`
        : `linear-gradient(90deg, ${theme.colors.default.primary} 0%, ${theme.colors.default.secondary} 100%)`};
      animation: ${keyframes`from { width: 0; } to { width: ${progress}%; }`}
        ${theme.default.transition.duration.long}
        ${theme.default.transition.type} forwards;
    }
  `}
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
