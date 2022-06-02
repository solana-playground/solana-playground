import * as buffer from "buffer";
import styled from "styled-components";

import Function from "./Function";
import Text from "../../../../Text";
import useInitialLoading from "../../useInitialLoading";
import useIsDeployed from "../BuildDeploy/useIsDeployed";
import { PgProgramInfo } from "../../../../../utils/pg";
import { Wormhole } from "../../../../Loading";
import { ConnectionErrorText } from "../../Common";

// Webpack 5 doesn't polyfill buffer
window.Buffer = buffer.Buffer;

const Test = () => {
  const { initialLoading } = useInitialLoading();

  const { deployed, connError } = useIsDeployed();

  const idl = PgProgramInfo.getProgramInfo()?.idl;

  if (idl === undefined)
    return (
      <InitialWrapper>
        <Text>{"Build the program or import an IDL from Extra > IDL."}</Text>
      </InitialWrapper>
    );

  if (initialLoading)
    return (
      <InitialWrapper>
        <Wormhole />
      </InitialWrapper>
    );

  if (connError)
    return (
      <InitialWrapper>
        <ConnectionErrorText />
      </InitialWrapper>
    );

  if (!deployed)
    return (
      <InitialWrapper>
        <Text>
          {
            "Deploy the program or if you already have a deployed program set the program id from Extra > Program credentials."
          }
        </Text>
      </InitialWrapper>
    );

  if (idl === null)
    return (
      <InitialWrapper>
        <Text type="Warning">Native program tests are not yet supported.</Text>
      </InitialWrapper>
    );

  if (deployed) {
    if (!idl.instructions)
      return (
        <InitialWrapper>
          <Text type="Error">
            You've imported a corrupted IDL. Please double check you are
            importing an IDL.json file.
          </Text>
        </InitialWrapper>
      );

    return (
      <Wrapper>
        <ProgramWrapper>
          <ProgramNameWrapper>
            Program:
            <ProgramName>{idl.name}</ProgramName>
          </ProgramNameWrapper>
          {idl.instructions.map((ixs, i) => (
            <Function key={i} idl={idl} index={i} ixs={ixs} />
          ))}
        </ProgramWrapper>
      </Wrapper>
    );
  }

  // Shouldn't come here
  return (
    <InitialWrapper>
      <Text type="Error">Something went wrong.</Text>
    </InitialWrapper>
  );
};

const Wrapper = styled.div``;

const InitialWrapper = styled.div`
  padding: 1.5rem;
`;

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
