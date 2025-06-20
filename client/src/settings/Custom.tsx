import { FC, useState } from "react";
import styled from "styled-components";

import Input from "../components/Input";
import Markdown from "../components/Markdown";
import Modal from "../components/Modal";
import Text from "../components/Text";
import { Info } from "../components/Icons";
import { PgSettings, Setting } from "../utils/pg";

interface CustomProps {
  setting: Setting;
}

export const Custom: FC<CustomProps> = ({ setting }) => {
  // TODO: Show old custom value if it exists
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  return (
    <Modal
      title
      closeButton
      buttonProps={{
        text: "Set",
        onSubmit: () => {
          // TODO: Remove `!` after making `id` required
          PgSettings.set(setting.id!, setting.parseCustomValue!(value));
        },
        disabled: !value,
        fullWidth: true,
        style: { height: "2.5rem", marginTop: "-0.25rem" },
      }}
      error={error}
      setError={setError}
    >
      <Content>
        <InputLabel>
          {setting.name}
          {setting.customProps?.type ? ` (${setting.customProps.type})` : ""}
        </InputLabel>
        <Input
          autoFocus
          placeholder={setting.customProps?.placeholder}
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          error={error}
          setError={setError}
          validator={setting.parseCustomValue}
        />

        {setting.customProps?.tip && (
          <Tip icon={<Info color="info" />}>
            <Markdown codeFontOnly>{setting.customProps.tip}</Markdown>
          </Tip>
        )}
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  max-width: 25rem;
`;

const InputLabel = styled.div`
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const Tip = styled(Text)`
  margin-top: 1rem;
`;
