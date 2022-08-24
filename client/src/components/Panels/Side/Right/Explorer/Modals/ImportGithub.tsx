import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import ModalInside from "../../../../../Modal/ModalInside";
import useModal from "../../../../../Modal/useModal";
import Input, { defaultInputProps } from "../../../../../Input";
import { explorerAtom } from "../../../../../../state";
import { PgCommon } from "../../../../../../utils/pg";
import { ClassName } from "../../../../../../constants";

export const ImportGithub = () => {
  const [explorer] = useAtom(explorerAtom);

  const { close } = useModal();

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle user input
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };

  const importFromGithub = async () => {
    if (!url || !explorer) return;

    setLoading(true);
    await PgCommon.sleep();

    try {
      await explorer.importFromGithub(url);
      //   await PgCommon.sleep(2000);
      close();
    } catch (e: any) {
      console.log(e.message);
      setLoading(false);
      setError(e.message);
    }
  };

  return (
    <ModalInside
      buttonProps={{
        name: "Import",
        onSubmit: importFromGithub,
        disabled: !url,
        loading: {
          state: loading,
          text: "Importing...",
        },
      }}
      closeOnSubmit={false}
    >
      <Content>
        <Text>Github url:</Text>
        {error && <ErrorText>Error: {error}</ErrorText>}
        <Input
          ref={inputRef}
          onChange={handleChange}
          value={url}
          className={error ? ClassName.ERROR : ""}
          {...defaultInputProps}
        />
      </Content>
      <DescriptionWrapper>
        <Desc>
          Given url must have either `lib.rs` or `lib.py` inside its src folder.
        </Desc>
        <Desc>
          e.g
          https://github.com/solana-labs/solana-program-library/tree/master/token/program
        </Desc>
        <Desc>
          https://github.com/coral-xyz/anchor/tree/master/examples/tutorial/basic-0/programs/basic-0
        </Desc>
      </DescriptionWrapper>
    </ModalInside>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 1rem 0;

  & > input {
    font-size: ${({ theme }) => theme.font?.size.medium};
    padding: 0.375rem 0.5rem;
  }
`;

const Text = styled.div`
  margin-bottom: 0.5rem;
`;

const ErrorText = styled.div`
  ${({ theme }) => css`
    color: ${theme.colors.state.error.color};
    font-size: ${theme.font?.size.small};
    margin-bottom: 0.5rem;
  `}
`;

const DescriptionWrapper = styled.div`
  margin-bottom: 1rem;
`;

const Desc = styled.p`
  ${({ theme }) => css`
    color: ${theme.colors.default.textSecondary};
    font-size: ${theme.font?.size.small};
    margin-bottom: 0.5rem;
  `}
`;
