import { CustomCommand } from '../utils';
import { setCloseCommand } from './close';
import { setCloseBufferCommand } from './close-buffer';
import { setCreateCommand } from './create';
import { setCreateBufferCommand } from './create-buffer';
import { setFetchCommand } from './fetch';
import { setFetchBufferCommand } from './fetch-buffer';
import { setListBuffersCommand } from './list-buffers';
import { setRemoveAuthorityCommand } from './remove-authority';
import { setSetAuthorityCommand } from './set-authority';
import { setSetBufferAuthorityCommand } from './set-buffer-authority';
import { setSetImmutableCommand } from './set-immutable';
import { setUpdateCommand } from './update';
import { setUpdateBufferCommand } from './update-buffer';
import { setWriteCommand } from './write';

export function setCommands(program: CustomCommand): void {
    program
        // Metadata commands.
        .tap(setWriteCommand)
        .tap(setCreateCommand)
        .tap(setUpdateCommand)
        .tap(setFetchCommand)
        .tap(setSetAuthorityCommand)
        .tap(setRemoveAuthorityCommand)
        .tap(setSetImmutableCommand)
        .tap(setCloseCommand)

        // Buffer commands.
        .tap(setCreateBufferCommand)
        .tap(setUpdateBufferCommand)
        .tap(setListBuffersCommand)
        .tap(setFetchBufferCommand)
        .tap(setSetBufferAuthorityCommand)
        .tap(setCloseBufferCommand);
}
