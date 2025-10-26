import { FC, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

import { PgCommon } from "../../utils/pg";

interface ResponsiveItemsProps {
  minItemWidth: string;
  maxItems: number;
  gap: string;
}

const ResponsiveItems: FC<ResponsiveItemsProps> = (props) => {
  const [itemCount, setItemCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const gap = convertToPx(props.gap);
    const widthPoints = Array.from<number>({ length: props.maxItems })
      .fill(convertToPx(props.minItemWidth))
      .map((mw, i) => (i + 1) * mw + i * gap)
      .reverse();

    const handle = () => {
      const { width } = el.getBoundingClientRect();
      for (const [i, widthPoint] of Object.entries(widthPoints)) {
        if (widthPoint > width) continue;

        setItemCount(widthPoints.length - +i);
        break;
      }
    };
    handle();

    window.addEventListener("resize", handle);
    el.addEventListener("resize", handle);

    // Check on interval whether the width has changed because `resize` events
    // do not always trigger for some reason
    let { width: prevWidth } = el.getBoundingClientRect();
    const intervalId = PgCommon.setIntervalOnFocus(() => {
      const { width } = el.getBoundingClientRect();
      if (prevWidth === width) return;

      prevWidth = width;
      handle();
    }, 1000);

    return () => {
      window.removeEventListener("resize", handle);
      el.removeEventListener("resize", handle);
      clearInterval(intervalId);
    };
  }, [props.minItemWidth, props.gap, props.maxItems]);

  return <Wrapper ref={ref} itemCount={itemCount} {...props} />;
};

const convertToPx = (unit: string) => {
  const el = document.createElement("div");
  el.style.width = unit;
  el.style.zIndex = "-1";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";

  document.body.appendChild(el);
  const px = el.getBoundingClientRect().width;
  document.body.removeChild(el);

  return px;
};

const Wrapper = styled.div<ResponsiveItemsProps & { itemCount: number }>`
  ${({ itemCount, gap }) => css`
    width: 100%;
    height: fit-content;
    display: grid;
    grid-template-columns: repeat(${itemCount}, 1fr);
    gap: ${gap};
  `}
`;

export default ResponsiveItems;
