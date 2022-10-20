import { SendTransactionError, TransactionError } from '@solana/web3.js';
import { MetaplexError, MetaplexErrorInputWithoutSource, MetaplexErrorOptions } from './MetaplexError';
import type { ConfirmTransactionResponse } from '../plugins/rpcModule';
/** @group Errors */
export declare class RpcError extends MetaplexError {
    constructor(input: MetaplexErrorInputWithoutSource);
}
/** @group Errors */
export declare class FailedToSendTransactionError extends RpcError {
    constructor(cause: Error, options?: Omit<MetaplexErrorOptions, 'cause' | 'logs'>);
    asSendTransactionError(): SendTransactionError;
    get error(): string;
    get errorLogs(): string[];
}
/** @group Errors */
export declare class FailedToConfirmTransactionError extends RpcError {
    constructor(cause: Error, options?: Omit<MetaplexErrorOptions, 'cause'>);
}
/** @group Errors */
export declare class FailedToConfirmTransactionWithResponseError extends FailedToConfirmTransactionError {
    readonly response: ConfirmTransactionResponse;
    constructor(response: ConfirmTransactionResponse);
    get error(): TransactionError;
}
