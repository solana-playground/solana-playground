import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import styled, { css } from "styled-components";

import Modal from "../../../../../../../components/Modal";
import useModal from "../../../../../../../components/Modal/useModal";
import Input from "../../../../../../../components/Input";
import { explorerAtom } from "../../../../../../../state";
import { PgCommon } from "../../../../../../../utils/pg";
import { ClassName } from "../../../../../../../constants";

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
    try {
      await PgCommon.transition(explorer.importFromGithub(url));
      close();
    } catch (e: any) {
      setLoading(false);
      setError(e.message);
    }
  };

  return (
    <Modal
      buttonProps={{
        name: "Import",
        onSubmit: importFromGithub,
        disabled: !url,
        loading: {
          state: loading,
          text: "Importing...",
        },
      }}
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
          placeholder="https://github.com/..."
        />
      </Content>
      <DescriptionWrapper>
        <Desc>
          If the program in the url is written in <Emphasis>Rust</Emphasis>:
        </Desc>
        <Desc>- Can import single file or full program folder.</Desc>
        <Desc>
          e.g
          https://github.com/solana-labs/example-helloworld/blob/master/src/program-rust/src/lib.rs
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
    </Modal>
  );
};

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 1rem 0;

  & > input {
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
    font-size: ${theme.font.code.size.small};
    margin-bottom: 0.5rem;
  `}
`;

const DescriptionWrapper = styled.div`
  margin-bottom: 1rem;
`;

const Desc = styled.p`
  ${({ theme }) => css`
    font-size: ${theme.font.code.size.small};
    color: ${theme.colors.default.textSecondary};
    margin-bottom: 0.5rem;
    word-break: break-all;
  `}
`;

const Emphasis = styled.span`
  font-weight: bold;
  color: ${({ theme }) => theme.colors.default.textPrimary};
`;
