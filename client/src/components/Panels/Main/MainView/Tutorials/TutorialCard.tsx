import { FC } from "react";
import styled from "styled-components";

import { PgTutorial, TutorialData } from "../../../../../utils/pg";

const TutorialCard: FC<TutorialData> = ({ name, description, imageSrc }) => {
  return (
    <Wrapper onClick={() => PgTutorial.open(name)}>
      <ImgWrapper>
        <Img src={imageSrc} />
      </ImgWrapper>
      <Name>{name}</Name>
      <Description>{description}</Description>
    </Wrapper>
  );
};

const Wrapper = styled.div``;

const ImgWrapper = styled.div``;

const Img = styled.img``;

const Name = styled.div``;

const Description = styled.div``;

export default TutorialCard;
