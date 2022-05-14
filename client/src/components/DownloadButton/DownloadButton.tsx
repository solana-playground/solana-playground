import { FC } from "react";
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
  <a href={href} download={download}>
    {noButton ? (
      <div>{children}</div>
    ) : (
      <Button kind={buttonKind}>{children}</Button>
    )}
  </a>
);

export default DownloadButton;
