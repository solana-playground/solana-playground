import { useAtom } from "jotai";
import styled from "styled-components";

import Instruction from "./Instruction";
import FetchableAccount from "./FetchableAccount";
import Event from "./Event";
import TestSkeleton from "./TestSkeleton";
import Text from "../../../../../../components/Text";
import { ConnectionErrorText } from "../Common";
import { PgProgramInfo } from "../../../../../../utils/pg";
import { buildCountAtom } from "../../../../../../state";
import { useInitialLoading } from "..";
import { useBigNumberJson } from "./useBigNumberJson";

const Test = () => {
  // Refresh the component on a new build
  useAtom(buildCountAtom);

  const { initialLoading, deployed, connError } = useInitialLoading();

  const idl = PgProgramInfo.getProgramInfo()?.idl;

  // Used for both accounts and events data
  useBigNumberJson();

  if (initialLoading) return <TestSkeleton />;

  if (idl === undefined)
    return (
      <InitialWrapper>
        <Text>Program is not built.</Text>
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
        <Text>Program is not deployed.</Text>
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
            importing an Anchor IDL.
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

          <ProgramInteractionWrapper>
            <Subheading>Instructions</Subheading>
            {idl.instructions.map((ix, i) => (
              <Instruction key={i} idl={idl} index={i} ix={ix} />
            ))}
          </ProgramInteractionWrapper>

          {idl.accounts && (
            <ProgramInteractionWrapper>
              <Subheading>Accounts</Subheading>
              {idl.accounts.map((acc, i) => (
                <FetchableAccount
                  key={i}
                  index={i}
                  accountName={acc.name}
                  idl={idl}
                />
              ))}
            </ProgramInteractionWrapper>
          )}

          {idl.events && (
            <ProgramInteractionWrapper>
              <Subheading>Events</Subheading>
              {idl.events.map((event, i) => (
                <Event key={i} index={i} eventName={event.name} idl={idl} />
              ))}
            </ProgramInteractionWrapper>
          )}
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1rem;
`;

const ProgramNameWrapper = styled.div`
  padding-left: 1rem;
`;

const ProgramName = styled.span`
  font-weight: bold;
  margin-left: 0.25rem;
`;

const Subheading = styled.h4`
  ${({ theme }) => `
    margin: 0.5rem 1rem;
    color: ${theme.colors.default.primary};
    font-size: ${theme.font?.code?.size.large};
  `};
`;

const ProgramInteractionWrapper = styled.div``;

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
