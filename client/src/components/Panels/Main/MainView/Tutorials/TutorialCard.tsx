import { FC } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

import { Route } from "../../../../../constants";
import { PgCommon } from "../../../../../utils/pg";
import { TutorialData } from "../../../../Tutorial";

const TutorialCard: FC<TutorialData> = ({ name, description, imageSrc }) => {
  const navigate = useNavigate();

  return (
    <Wrapper
      onClick={() =>
        navigate(`${Route.TUTORIALS}/${PgCommon.toKebabCase(name)}`)
      }
    >
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
