const defaultProps = {
  xmlns: "http://www.w3.org/2000/svg",
  stroke: "currentColor",
  fill: "currentColor",
  strokeWidth: "0",
  width: "1em",
  height: "1em",
};

const getStyle = (fullSize?: boolean) => {
  let style = {};
  if (fullSize) style = { width: "100%", height: "100%" };

  return style;
};

interface IconProps {
  fullSize?: boolean;
}

export const Arrow = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 24 24" style={getStyle(fullSize)}>
      <path fill="none" d="M0 0h24v24H0V0z"></path>
      <path d="M6.23 20.23L8 22l10-10L8 2 6.23 3.77 14.46 12z"></path>
    </svg>
  );
};

export const Warning = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 1024 1024" style={getStyle(fullSize)}>
      <path d="M955.7 856l-416-720c-6.2-10.7-16.9-16-27.7-16s-21.6 5.3-27.7 16l-416 720C56 877.4 71.4 904 96 904h832c24.6 0 40-26.6 27.7-48zM480 416c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v184c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V416zm32 352a48.01 48.01 0 0 1 0-96 48.01 48.01 0 0 1 0 96z"></path>
    </svg>
  );
};

export const Close = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 512 512" style={getStyle(fullSize)}>
      <path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path>
    </svg>
  );
};

export const External = ({ fullSize }: IconProps) => {
  return (
    <svg
      {...defaultProps}
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={getStyle(fullSize)}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
      <polyline points="15 3 21 3 21 9"></polyline>
      <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );
};

export const Github = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 512 512" style={getStyle(fullSize)}>
      <path d="M256 32C132.3 32 32 134.9 32 261.7c0 101.5 64.2 187.5 153.2 217.9a17.56 17.56 0 003.8.4c8.3 0 11.5-6.1 11.5-11.4 0-5.5-.2-19.9-.3-39.1a102.4 102.4 0 01-22.6 2.7c-43.1 0-52.9-33.5-52.9-33.5-10.2-26.5-24.9-33.6-24.9-33.6-19.5-13.7-.1-14.1 1.4-14.1h.1c22.5 2 34.3 23.8 34.3 23.8 11.2 19.6 26.2 25.1 39.6 25.1a63 63 0 0025.6-6c2-14.8 7.8-24.9 14.2-30.7-49.7-5.8-102-25.5-102-113.5 0-25.1 8.7-45.6 23-61.6-2.3-5.8-10-29.2 2.2-60.8a18.64 18.64 0 015-.5c8.1 0 26.4 3.1 56.6 24.1a208.21 208.21 0 01112.2 0c30.2-21 48.5-24.1 56.6-24.1a18.64 18.64 0 015 .5c12.2 31.6 4.5 55 2.2 60.8 14.3 16.1 23 36.6 23 61.6 0 88.2-52.4 107.6-102.3 113.3 8 7.1 15.2 21.1 15.2 42.5 0 30.7-.3 55.5-.3 63 0 5.4 3.1 11.5 11.4 11.5a19.35 19.35 0 004-.4C415.9 449.2 480 363.1 480 261.7 480 134.9 379.7 32 256 32z"></path>
    </svg>
  );
};
