import { Argument } from 'commander';

import { addressParser } from './parsers';

export const seedArgument = new Argument('<seed>', 'Seed of the metadata account (e.g. "idl" for program IDLs).');

export const programArgument = new Argument('<program>', 'Program associated with the metadata account.').argParser(
    addressParser('program'),
);

export const fileArgument = new Argument(
    '[file]',
    'Filepath of the data to upload (creates a "direct" data source). See options for other sources such as --text, --url and --account.',
);

export const bufferArgument = new Argument('<buffer>', 'The address of the buffer account.').argParser(
    addressParser('buffer'),
);
