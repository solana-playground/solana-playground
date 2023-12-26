import { ComponentPropsWithoutRef, forwardRef } from "react";

interface ImgProps extends ComponentPropsWithoutRef<"img"> {
  /** Whether to block cross origin source */
  noCrossOrigin?: boolean;
}

const Img = forwardRef<HTMLImageElement, ImgProps>(
  ({ noCrossOrigin, ...props }, ref) => (
    <img
      ref={ref}
      alt=""
      loading="lazy"
      crossOrigin={noCrossOrigin ? undefined : "anonymous"}
      {...props}
    />
  )
);

export default Img;
