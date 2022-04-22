import styled from "styled-components";

import { PgProgramInfo } from "../../../../../utils/pg/program-info";
import Text from "../../../../Text";
import useIsDeployed from "../BuildDeploy/useIsDeployed";
import Function from "./Function";

// Webpack 5 doesn't polyfill buffer
window.Buffer = require("buffer").Buffer;

const Test = () => {
  const { deployed } = useIsDeployed();
  const idl = PgProgramInfo.getProgramInfo()?.idl;

  return (
    <Wrapper>
      {idl ? (
        deployed ? (
          <ProgramWrapper>
            <ProgramNameWrapper>
              Program:
              <ProgramName>{idl.name}</ProgramName>
            </ProgramNameWrapper>
            {idl.instructions.map((ixs, i) => (
              <Function key={i} idl={idl} index={i} ixs={ixs} />
            ))}
          </ProgramWrapper>
        ) : (
          <NotReadyWrapper>
            <Text>Deploy the program first.</Text>
          </NotReadyWrapper>
        )
      ) : (
        <NotReadyWrapper>
          <Text>Build the program first.</Text>
        </NotReadyWrapper>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div``;

const ProgramWrapper = styled.div`
  user-select: none;
`;

const ProgramNameWrapper = styled.div`
  padding: 1rem;
`;

const ProgramName = styled.span`
  font-weight: bold;
  margin-left: 0.25rem;
`;

const NotReadyWrapper = styled.div`
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
`;

export default Test;

// Initial thought process when implementing tests.

// If we have the IDL:
// 1. We can show all the callable methods.
// 2. For each function we can only populate the known
// accounts like system_program or clock.

// This is a big problem for more complex methods if we don't
// allow users to write their own ts implementation to calculate
// the needed accounts.

// One solution would be to implement ts support for tests so that
// the users can write their own scripts to do the testing directly
// on the browser. But this is also problematic since our goal is
// to make this app as easy as possible to use. It would be better
// for us to implement testing features with ui only so that users
// can just easily do their testing without needing to write a script.
// More advanced users can choose to go with the scripting route.

// The ui can have a custom ix builder to build txs that require
// let's say a token account creation as a preInstruction. The users
// would be able to choose how to create each account or put the
// publicKey manually.
