import { FC, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import Input from "../../../../components/Input";
import Markdown from "../../../../components/Markdown";
import Modal from "../../../../components/Modal";
import Text from "../../../../components/Text";
import { Info } from "../../../../components/Icons";
import { Setting } from "../../../../utils/pg";

interface CustomSettingProps {
  setting: Setting;
}

export const CustomSetting: FC<CustomSettingProps> = ({ setting }) => {
  // TODO: Make the `setting` variable's type have `custom` property
  const { custom } = setting;
  if (!custom) throw new Error(setting.id);

  const [value, setValue] = useState(() => {
    try {
      const value = `${setting.getValue()}`;
      custom.parse(value);
      return value;
    } catch {
      return "";
    }
  });
  const [error, setError] = useState("");

  // Select the full input value on mount
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.setSelectionRange(0, inputRef.current.value.length);
  }, []);

  return (
    <Modal
      title
      closeButton
      buttonProps={{
        text: "Set",
        onSubmit: () => setting.setValue(custom.parse(value)),
        disabled: !!error,
        fullWidth: true,
        style: { height: "2.5rem", marginTop: "-0.25rem" },
      }}
    >
      <Content>
        <InputLabel>
          {setting.name}
          {custom.type ? ` (${custom.type})` : ""}
        </InputLabel>
        <Input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          validator={custom.parse}
          error={error}
          setError={setError}
          placeholder={custom.placeholder}
        />

        {custom.tip && (
          <Tip icon={<Info color="info" />}>
            <Markdown codeFontOnly>{custom.tip}</Markdown>
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
