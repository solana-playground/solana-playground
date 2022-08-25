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
      title
    >
      <Content>
        <Text>Github url</Text>
        {error && <ErrorText>Error: {error}</ErrorText>}
        <Input
          ref={inputRef}
          onChange={handleChange}
          value={url}
          className={error ? ClassName.ERROR : ""}
          placeholder="Full url to the program folder or file"
          {...defaultInputProps}
        />
      </Content>
      <DescriptionWrapper>
        <Desc>
          If the program in the url is written in <Emphasis>Rust</Emphasis>:
        </Desc>
        <Desc>
          - Given url must have `lib.rs` inside of its src folder.(if the url is
          a folder)
        </Desc>
        <Desc>
          e.g
          https://github.com/solana-labs/solana-program-library/tree/master/token/program
          (Native)
        </Desc>
        <Desc>
          https://github.com/coral-xyz/anchor/tree/master/examples/tutorial/basic-0/programs/basic-0
          (Anchor)
        </Desc>
        <Desc>
          If the program in the url is written in <Emphasis>Python</Emphasis>:
        </Desc>
        <Desc>- Given url must be a single Python file.</Desc>
        <Desc>
          e.g
          https://github.com/ameliatastic/seahorse-lang/blob/main/examples/fizzbuzz.py
          (Seahorse)
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
  font-weight: bold;
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
    font-size: ${theme.font?.size.small};
    color: ${theme.colors.default.textSecondary};
    margin-bottom: 0.5rem;
    word-break: break-all;
  `}
`;

const Emphasis = styled.span`
  font-weight: bold;
  color: ${({ theme }) => theme.colors.default.textPrimary};
`;
