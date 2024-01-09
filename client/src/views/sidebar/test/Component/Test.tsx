import { useEffect } from "react";
import styled from "styled-components";
import BN from "bn.js";

import Account from "./Account";
import Event from "./Event";
import Instruction from "./Instruction";
import IdlProvider from "./IdlProvider";
import Text from "../../../../components/Text";
import { PgCommand, PgProgramInfo } from "../../../../utils/pg";
import { PgProgramInteraction } from "../../../../utils/pg/program-interaction";
import { useProgramInfo, useRenderOnChange } from "../../../../hooks";

const Test = () => {
  useRenderOnChange(PgCommand.build.onDidRunFinish);

  const { error, deployed } = useProgramInfo();

  // Used for both accounts and events data
  useBigNumberJson();

  // Handle instruction storage
  useSyncInstructionStorage();

  if (!PgProgramInfo.importedProgram && !PgProgramInfo.uuid) {
    return (
      <InitialWrapper>
        <Text>Program is not built.</Text>
      </InitialWrapper>
    );
  }

  if (!PgProgramInfo.pk) {
    return (
      <InitialWrapper>
        <Text>The program has no public key.</Text>
      </InitialWrapper>
    );
  }

  const idl = PgProgramInfo.idl;

  if (!idl) {
    return (
      <InitialWrapper>
        <Text>Anchor IDL not found.</Text>
      </InitialWrapper>
    );
  }

  if (!idl.instructions) {
    return (
      <InitialWrapper>
        <Text kind="error">
          You've imported a corrupted IDL. Please double check you've imported
          an Anchor IDL.
        </Text>
      </InitialWrapper>
    );
  }

  if (error) {
    return (
      <InitialWrapper>
        <Text kind="error">
          Connection error. Please try changing the RPC endpoint from the
          settings.
        </Text>
      </InitialWrapper>
    );
  }

  if (!deployed) {
    return (
      <InitialWrapper>
        <Text>Program is not deployed.</Text>
      </InitialWrapper>
    );
  }

  return (
    <IdlProvider idl={idl}>
      <Wrapper>
        <ProgramNameWrapper>
          Program:
          <ProgramName>{idl.name}</ProgramName>
        </ProgramNameWrapper>

        <ProgramInteractionWrapper>
          <ProgramInteractionHeader>Instructions</ProgramInteractionHeader>
          {idl.instructions.map((ix, i) => (
            <Instruction
              key={JSON.stringify(ix)}
              index={i}
              idlInstruction={ix}
            />
          ))}
        </ProgramInteractionWrapper>

        {idl.accounts && (
          <ProgramInteractionWrapper>
            <ProgramInteractionHeader>Accounts</ProgramInteractionHeader>
            {idl.accounts.map((acc, i) => (
              <Account key={acc.name} index={i} accountName={acc.name} />
            ))}
          </ProgramInteractionWrapper>
        )}

        {idl.events && (
          <ProgramInteractionWrapper>
            <ProgramInteractionHeader>Events</ProgramInteractionHeader>
            {idl.events.map((event, i) => (
              <Event key={event.name} index={i} eventName={event.name} />
            ))}
          </ProgramInteractionWrapper>
        )}
      </Wrapper>
    </IdlProvider>
  );
};

const InitialWrapper = styled.div`
  padding: 1.5rem;
`;

const Wrapper = styled.div`
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

const ProgramInteractionWrapper = styled.div``;

const ProgramInteractionHeader = styled.div`
  ${({ theme }) => `
    margin: 0.5rem 1rem;
    color: ${theme.colors.default.primary};
    font-size: ${theme.font.code.size.large};
    font-weight: bold;
  `};
`;

/**
 * Temporarily change `BN.toJSON` method to `BN.toString` in order to have
 * human-readable output rather than hex values.
 */
const useBigNumberJson = () => {
  useEffect(() => {
    const oldBNPrototypeToJSON = BN.prototype.toJSON;
    BN.prototype.toJSON = function (this: BN) {
      return this.toString();
    };

    // Change the toJSON prototype back on unmount
    return () => {
      BN.prototype.toJSON = oldBNPrototypeToJSON;
    };
  }, []);
};

/** Sync the instruction storage. */
const useSyncInstructionStorage = () => {
  useEffect(() => {
    const { dispose } = PgProgramInfo.onDidChangeIdl((idl) => {
      if (idl) PgProgramInteraction.syncAllInstructions(idl.instructions);
    });
    return () => dispose();
  }, []);
};

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
