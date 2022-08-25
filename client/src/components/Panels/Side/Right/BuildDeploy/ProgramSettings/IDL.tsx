import { ChangeEvent } from "react";
import { useAtom } from "jotai";
import styled from "styled-components";

import DownloadButton from "../../../../../DownloadButton";
import UploadButton from "../../../../../UploadButton";
import { buildCountAtom } from "../../../../../../state";
import { PgCommon, PgProgramInfo } from "../../../../../../utils/pg";

const IDL = () => (
  <Wrapper>
    <Import />
    <Export />
  </Wrapper>
);

const Import = () => {
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const decodedString = PgCommon.decodeArrayBuffer(arrayBuffer);

      PgProgramInfo.update({
        idl: JSON.parse(decodedString),
      });
    } catch (err: any) {
      console.log(err.message);
    }
  };

  return (
    <UploadButton accept=".json" onUpload={handleUpload} showUploadText>
      Import
    </UploadButton>
  );
};

const Export = () => {
  // Fixes IDL not being updated correctly after a new build
  useAtom(buildCountAtom);

  const idl = PgProgramInfo.getProgramInfo().idl;

  if (!idl) return null;

  return (
    <DownloadButton
      href={PgCommon.getUtf8EncodedString(idl)}
      download="idl.json"
    >
      Export
    </DownloadButton>
  );
};

const Wrapper = styled.div`
  display: flex;

  & > a {
    margin-left: 1rem;
  }
`;

export default IDL;
