import { FC } from "react";
import styled from "styled-components";

import Button, { ButtonKind } from "../Button";
import { PgCommon } from "../../utils/pg";

interface DownloadButtonProps {
  href: string | object;
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
  <Wrapper
    href={typeof href === "string" ? href : PgCommon.getUtf8EncodedString(href)}
    download={download}
  >
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
