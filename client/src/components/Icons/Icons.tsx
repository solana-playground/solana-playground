import { ClassName } from "../../constants";

interface IconProps {
  fullSize?: boolean;
}

interface RotateProps {
  rotate?: "90deg" | "180deg" | "270deg";
}

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

export const Arrow = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 24 24" style={getStyle(fullSize)}>
      <path fill="none" d="M0 0h24v24H0V0z"></path>
      <path d="M6.23 20.23L8 22l10-10L8 2 6.23 3.77 14.46 12z"></path>
    </svg>
  );
};

export const DoubleArrow = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 320 512" style={getStyle(fullSize)}>
      <path d="M177 255.7l136 136c9.4 9.4 9.4 24.6 0 33.9l-22.6 22.6c-9.4 9.4-24.6 9.4-33.9 0L160 351.9l-96.4 96.4c-9.4 9.4-24.6 9.4-33.9 0L7 425.7c-9.4-9.4-9.4-24.6 0-33.9l136-136c9.4-9.5 24.6-9.5 34-.1zm-34-192L7 199.7c-9.4 9.4-9.4 24.6 0 33.9l22.6 22.6c9.4 9.4 24.6 9.4 33.9 0l96.4-96.4 96.4 96.4c9.4 9.4 24.6 9.4 33.9 0l22.6-22.6c9.4-9.4 9.4-24.6 0-33.9l-136-136c-9.2-9.4-24.4-9.4-33.8 0z"></path>
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

export const Clear = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 1024 1024" style={getStyle(fullSize)}>
      <defs></defs>
      <path d="M899.1 869.6l-53-305.6H864c14.4 0 26-11.6 26-26V346c0-14.4-11.6-26-26-26H618V138c0-14.4-11.6-26-26-26H432c-14.4 0-26 11.6-26 26v182H160c-14.4 0-26 11.6-26 26v192c0 14.4 11.6 26 26 26h17.9l-53 305.6c-0.3 1.5-0.4 3-0.4 4.4 0 14.4 11.6 26 26 26h723c1.5 0 3-0.1 4.4-0.4 14.2-2.4 23.7-15.9 21.2-30zM204 390h272V182h72v208h272v104H204V390z m468 440V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H416V674c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v156H202.8l45.1-260H776l45.1 260H672z"></path>
    </svg>
  );
};

export const Tick = ({ fullSize }: IconProps) => {
  return (
    <svg
      {...defaultProps}
      baseProfile="tiny"
      viewBox="0 0 24 24"
      style={getStyle(fullSize)}
    >
      <path d="M16.972 6.251c-.967-.538-2.185-.188-2.72.777l-3.713 6.682-2.125-2.125c-.781-.781-2.047-.781-2.828 0-.781.781-.781 2.047 0 2.828l4 4c.378.379.888.587 1.414.587l.277-.02c.621-.087 1.166-.46 1.471-1.009l5-9c.537-.966.189-2.183-.776-2.72z"></path>
    </svg>
  );
};

export const Github = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 496 512" style={getStyle(fullSize)}>
      <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
    </svg>
  );
};

export const Copy = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 24 24" style={getStyle(fullSize)}>
      <path d="M20 2H10c-1.103 0-2 .897-2 2v4H4c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2v-4h4c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM4 20V10h10l.002 10H4zm16-6h-4v-4c0-1.103-.897-2-2-2h-4V4h10v10z"></path>
    </svg>
  );
};

export const Sad = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 24 24" style={getStyle(fullSize)}>
      <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path>
      <circle cx="8.5" cy="10.5" r="1.5"></circle>
      <circle cx="15.493" cy="10.493" r="1.493"></circle>
      <path d="M12 14c-3 0-4 3-4 3h8s-1-3-4-3z"></path>
    </svg>
  );
};

export const Refresh = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 24 24" style={getStyle(fullSize)}>
      <path fill="none" d="M0 0h24v24H0z"></path>
      <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path>
    </svg>
  );
};

export const Error = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 24 24" style={getStyle(fullSize)}>
      <path fill="none" d="M0 0h24v24H0z"></path>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path>
    </svg>
  );
};

export const Clock = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 1024 1024" style={getStyle(fullSize)}>
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm176.5 585.7l-28.6 39a7.99 7.99 0 0 1-11.2 1.7L483.3 569.8a7.92 7.92 0 0 1-3.3-6.5V288c0-4.4 3.6-8 8-8h48.1c4.4 0 8 3.6 8 8v247.5l142.6 103.1c3.6 2.5 4.4 7.5 1.8 11.1z"></path>
    </svg>
  );
};

export const ThreeDots = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 16 16" style={getStyle(fullSize)}>
      <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"></path>
    </svg>
  );
};

export const Checkmark = ({ fullSize }: IconProps) => {
  return (
    <svg
      {...defaultProps}
      viewBox="0 0 512 512"
      className={ClassName.ICON_CHECKMARK}
      style={getStyle(fullSize)}
    >
      <path d="M256 48C141.6 48 48 141.6 48 256s93.6 208 208 208 208-93.6 208-208S370.4 48 256 48zm-42.7 318.9L106.7 260.3l29.9-29.9 76.8 76.8 162.1-162.1 29.9 29.9-192.1 191.9z"></path>
    </svg>
  );
};

export const Plus = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 12 16" style={getStyle(fullSize)}>
      <path fillRule="evenodd" d="M12 9H7v5H5V9H0V7h5V2h2v5h5v2z"></path>
    </svg>
  );
};

export const PlusFilled = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 1024 1024" style={getStyle(fullSize)}>
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H544v152c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V544H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h152V328c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v152h152c4.4 0 8 3.6 8 8v48z"></path>
    </svg>
  );
};

export const MinusFilled = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 1024 1024" style={getStyle(fullSize)}>
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h368c4.4 0 8 3.6 8 8v48z"></path>
    </svg>
  );
};

export const Upload = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 512 512" style={getStyle(fullSize)}>
      <path d="M403.002 217.001C388.998 148.002 328.998 96 256 96c-57.998 0-107.998 32.998-132.998 81.001C63.002 183.002 16 233.998 16 296c0 65.996 53.999 120 120 120h260c55 0 100-45 100-100 0-52.998-40.996-96.001-92.998-98.999zM288 276v76h-64v-76h-68l100-100 100 100h-68z"></path>
    </svg>
  );
};

export const Rename = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 24 24" style={getStyle(fullSize)}>
      <path fill="none" d="M0 0h24v24H0z"></path>
      <path d="M18.41 5.8L17.2 4.59c-.78-.78-2.05-.78-2.83 0l-2.68 2.68L3 15.96V20h4.04l8.74-8.74 2.63-2.63c.79-.78.79-2.05 0-2.83zM6.21 18H5v-1.21l8.66-8.66 1.21 1.21L6.21 18zM11 20l4-4h6v4H11z"></path>
    </svg>
  );
};

export const Trash = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 448 512" style={getStyle(fullSize)}>
      <path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"></path>
    </svg>
  );
};

export const ImportFile = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 512 512" style={getStyle(fullSize)}>
      <path d="M16 288c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h112v-64zm489-183L407.1 7c-4.5-4.5-10.6-7-17-7H384v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-153 31V0H152c-13.3 0-24 10.7-24 24v264h128v-65.2c0-14.3 17.3-21.4 27.4-11.3L379 308c6.6 6.7 6.6 17.4 0 24l-95.7 96.4c-10.1 10.1-27.4 3-27.4-11.3V352H128v136c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H376c-13.2 0-24-10.8-24-24z"></path>
    </svg>
  );
};

export const ExportFile = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 24 24" style={getStyle(fullSize)}>
      <path d="M11 16h2V7h3l-4-5-4 5h3z"></path>
      <path d="M5 22h14c1.103 0 2-.897 2-2v-9c0-1.103-.897-2-2-2h-4v2h4v9H5v-9h4V9H5c-1.103 0-2 .897-2 2v9c0 1.103.897 2 2 2z"></path>
    </svg>
  );
};

export const Wrench = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 24 24" style={getStyle(fullSize)}>
      <path fill="none" d="M0 0h24v24H0z" clipRule="evenodd"></path>
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"></path>
    </svg>
  );
};

export const RunAll = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 16 16" style={getStyle(fullSize)}>
      <path d="M2.78 2L2 2.41v12l.78.42 9-6V8l-9-6zM3 13.48V3.35l7.6 5.07L3 13.48z"></path>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 14.683l8.78-5.853V8L6 2.147V3.35l7.6 5.07L6 13.48v1.203z"
      ></path>
    </svg>
  );
};

export const Triangle = ({ fullSize, rotate }: IconProps & RotateProps) => {
  return (
    <svg
      {...defaultProps}
      viewBox="0 0 512 512"
      style={{ ...getStyle(fullSize), rotate }}
    >
      <path d="M256 32L20 464h472L256 32z"></path>
    </svg>
  );
};

export const TestTube = ({ fullSize }: IconProps) => {
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
      <desc></desc>
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path d="M20 8.04l-12.122 12.124a2.857 2.857 0 1 1 -4.041 -4.04l12.122 -12.124"></path>
      <path d="M7 13h8"></path>
      <path d="M19 15l1.5 1.6a2 2 0 1 1 -3 0l1.5 -1.6z"></path>
      <path d="M15 3l6 6"></path>
    </svg>
  );
};

export const TestPaper = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 297 297" style={getStyle(fullSize)}>
      <g>
        <g>
          <path d="m206.51,32c-0.269-17.718-14.706-32-32.487-32h-49.379c-17.781,0-32.219,14.282-32.487,32h-42.657v265h198v-265h-40.99zm-81.866-16h49.189 0.19c9.099,0 16.5,7.402 16.5,16.5s-7.401,16.5-16.5,16.5h-49.379c-9.099,0-16.5-7.402-16.5-16.5s7.401-16.5 16.5-16.5zm23.856,239h-66v-16h66v16zm0-50h-66v-16h66v16zm0-49h-66v-16h66v16zm0-50h-66v-16h66v16zm43.768,160.029l-19.541-16.204 10.213-12.316 7.793,6.462 12.19-13.362 11.82,10.783-22.475,24.637zm0-50l-19.541-16.204 10.213-12.316 7.793,6.462 12.19-13.362 11.82,10.783-22.475,24.637zm0-49l-19.541-16.204 10.213-12.316 7.793,6.462 12.19-13.362 11.82,10.783-22.475,24.637zm0-50l-19.541-16.204 10.213-12.316 7.793,6.462 12.19-13.362 11.82,10.783-22.475,24.637z" />
        </g>
      </g>
    </svg>
  );
};

export const NewFile = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 1024 1024" style={getStyle(fullSize)}>
      <path d="M480 580H372a8 8 0 0 0-8 8v48a8 8 0 0 0 8 8h108v108a8 8 0 0 0 8 8h48a8 8 0 0 0 8-8V644h108a8 8 0 0 0 8-8v-48a8 8 0 0 0-8-8H544V472a8 8 0 0 0-8-8h-48a8 8 0 0 0-8 8v108zm374.6-291.3c6 6 9.4 14.1 9.4 22.6V928c0 17.7-14.3 32-32 32H192c-17.7 0-32-14.3-32-32V96c0-17.7 14.3-32 32-32h424.7c8.5 0 16.7 3.4 22.7 9.4l215.2 215.3zM790.2 326L602 137.8V326h188.2z"></path>
    </svg>
  );
};

export const NewFolder = ({ fullSize }: IconProps) => {
  return (
    <svg {...defaultProps} viewBox="0 0 1024 1024" style={getStyle(fullSize)}>
      <path d="M880 298.4H521L403.7 186.2a8.15 8.15 0 0 0-5.5-2.2H144c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V330.4c0-17.7-14.3-32-32-32zM632 577c0 3.8-3.4 7-7.5 7H540v84.9c0 3.9-3.2 7.1-7 7.1h-42c-3.8 0-7-3.2-7-7.1V584h-84.5c-4.1 0-7.5-3.2-7.5-7v-42c0-3.8 3.4-7 7.5-7H484v-84.9c0-3.9 3.2-7.1 7-7.1h42c3.8 0 7 3.2 7 7.1V528h84.5c4.1 0 7.5 3.2 7.5 7v42z"></path>
    </svg>
  );
};
