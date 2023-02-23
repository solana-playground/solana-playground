import { ChangeEvent, FC, useCallback, useMemo, useState } from "react";
import { IdlType } from "@project-serum/anchor/dist/cjs/idl";
import styled from "styled-components";

import Account from "./Account";
import InputLabel from "./InputLabel";
import Input from "../../../../../../components/Input";
import useUpdateTxVals, { Identifiers } from "./useUpdateTxVals";

interface ArgProps {
  name: string;
  type: IdlType;
  functionName: string;
}

const Arg: FC<ArgProps> = ({ name, type, functionName }) => {
  if (type === "publicKey")
    return (
      <Account
        account={{ name, isMut: false, isSigner: false }}
        isArg
        functionName={functionName}
      />
    );

  return <OtherArg name={name} type={type} functionName={functionName} />;
};

const OtherArg: FC<ArgProps> = ({ name, type, functionName }) => {
  const [val, setVal] = useState("");

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setVal(e.target.value);
  }, []);

  // For test submit
  useUpdateTxVals({ identifier: Identifiers.ARGS, k: name, v: val, type });

  const inputName = useMemo(() => {
    return functionName + Identifiers.ARGS + name;
  }, [functionName, name]);

  return (
    <Wrapper>
      <InputLabel label={name} type={type} />
      <Input value={val} name={inputName} onChange={handleChange} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  margin: 0.5rem 0;
`;

export default Arg;
