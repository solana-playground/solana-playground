import { FC } from "react";
import styled from "styled-components";

import Button, { ButtonKind } from "../Button";

interface DownloadButtonProps {
  href: string;
  download: string;
  buttonKind?: ButtonKind;
  noButton?: boolean;
}

const DownloadButton: FC<DownloadButtonProps> = ({
  href,
  download,
  buttonKind = "outline",
  noButton = false,
  children,
}) => (
  <Wrapper href={href} download={download}>
    {noButton ? (
      <div>{children}</div>
    ) : (
      <Button kind={buttonKind}>{children}</Button>
    )}
  </Wrapper>
);

const Wrapper = styled.a`
  width: fit-content;
`;

export default DownloadButton;
