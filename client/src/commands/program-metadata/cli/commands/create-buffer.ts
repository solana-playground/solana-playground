import { generateKeyPairSigner } from '@solana/kit';

import { fileArgument } from '../arguments';
import { logCommand } from '../logs';
import { GlobalOptions, setWriteOptions, WriteOptions } from '../options';
import { CustomCommand, getClient, getWriteInput } from '../utils';

export function setCreateBufferCommand(program: CustomCommand): void {
    program
        .command('create-buffer')
        .description('Create a buffer account to use on metadata account later on.')
        .addArgument(fileArgument)
        .tap(setWriteOptions)
        .action(doCreateBuffer);
}

type Options = WriteOptions;
export async function doCreateBuffer(file: string | undefined, _: Options, cmd: CustomCommand) {
    const options = cmd.optsWithGlobals() as GlobalOptions & Options;
    const client = await getClient(options);
    const [buffer, writeInput] = await Promise.all([generateKeyPairSigner(), getWriteInput(client, file, options)]);

    logCommand(`Creating new buffer and setting authority...`, {
        buffer: buffer.address,
        authority: client.identity.address,
    });

    await client.runOrExport(
        client.programMetadata.instructions.createBuffer({
            newBuffer: buffer,
            authority: client.identity,
            sourceBuffer: writeInput.buffer,
            closeSourceBuffer: writeInput.closeBuffer,
            data: writeInput.buffer?.data.data ?? writeInput.data,
        }),
    );
}
