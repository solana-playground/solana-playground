import { ChangeEvent, useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

import Modal from "../../../../../../../components/Modal";
import Input from "../../../../../../../components/Input";
import { PgCommon, PgGithub } from "../../../../../../../utils/pg";

export const ImportGithub = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle user input
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const input = ev.target.value;
    setUrl(input);

    if (!input.includes("github.com")) {
      setError("The URL must be a GitHub URL");
    } else {
      setError("");
    }
  };

  const importFromGithub = async () => {
    await PgCommon.transition(PgGithub.import(url));
  };

  return (
    <Modal
      buttonProps={{
        text: "Import",
        onSubmit: importFromGithub,
        disabled: !url || !!error || loading,
        btnLoading: {
          state: loading,
          text: "Importing...",
        },
        setError,
        setLoading,
      }}
      title
    >
      <Text>GitHub URL</Text>
      <Input
        ref={inputRef}
        onChange={handleChange}
        value={url}
        error={error}
        placeholder="https://github.com/..."
      />
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

const Text = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const DescriptionWrapper = styled.div`
  margin-top: 1rem;
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
