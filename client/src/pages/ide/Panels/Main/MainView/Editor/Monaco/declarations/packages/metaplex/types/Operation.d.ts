import { Commitment, ConfirmOptions } from '@solana/web3.js';
import { Signer } from './Signer';
import { Program } from './Program';
import { Metaplex } from '../Metaplex';
import { DisposableScope, RequiredKeys } from '../utils';
export declare type KeyOfOperation<T> = T extends Operation<infer N, unknown, unknown> ? N : never;
export declare type InputOfOperation<T> = T extends Operation<string, infer I, unknown> ? I : never;
export declare type OutputOfOperation<T> = T extends Operation<string, unknown, infer O> ? O : never;
export declare type Operation<K extends string, I, O> = {
    key: K;
    input: I;
    __output?: O;
};
export declare type OperationConstructor<T extends Operation<K, I, O>, K extends string = KeyOfOperation<T>, I = InputOfOperation<T>, O = OutputOfOperation<T>> = {
    key: string;
    (input: I): T;
};
export declare type OperationOptions = {
    /**
     * The wallet that should pay for transaction fees and,
     * potentially, rent-exempt fees to create accounts.
     *
     * Defaults to the default fee payer of the RPC module which,
     * itself, defaults to the current identity.
     *
     * You may set this option globally by calling
     * `metaplex.rpc.setDefaultFeePayer(payer)`.
     *
     * @defaultValue `metaplex.rpc().getDefaultFeePayer()`
     */
    payer?: Signer;
    /**
     * The level of commitment desired when querying
     * the state of the blockchain.
     *
     * @defaultValue Defaults to `undefined` which will use
     * the commitment level set on the `Connection` object.
     */
    commitment?: Commitment;
    /**
     * Options for confirming transactions as defined by
     * the Solana web3.js library.
     *
     * @defaultValue { commitment: options.commitment }`
     * if the `commitment` option is set, otherwise `{}`.
     */
    confirmOptions?: ConfirmOptions;
    /**
     * An optional set of programs that override the registered ones.
     *
     * You may set this option globally by calling
     * `metaplex.programs().register(programs)`.
     *
     * @defaultValue `[]`
     */
    programs?: Program[];
    /**
     * An abort signal that can be used to cancel the operation
     * should that operation support it.
     *
     * @example
     * ```ts
     * // Creates an AbortController that aborts in one second.
     * const abortController = new AbortController();
     * setTimeout(() => abortController.abort(), 1000);
     *
     * // Use the AbortController's signal to cancel the operation after one second.
     * await metaplex.nfts().findByMint(input, { signal: abortController.signal });
     * ```
     *
     * @defaultValue Defaults to not using an abort signal.
     */
    signal?: AbortSignal;
};
export declare type OperationScope = DisposableScope & RequiredKeys<OperationOptions, 'payer'>;
export declare type OperationHandler<T extends Operation<K, I, O>, K extends string = KeyOfOperation<T>, I = InputOfOperation<T>, O = OutputOfOperation<T>> = {
    handle: (operation: T, metaplex: Metaplex, scope: OperationScope) => O | Promise<O>;
};
/**
 * @group Operations
 * @category Constructors
 */
export declare const useOperation: <T extends Operation<K, I, O>, K extends string = KeyOfOperation<T>, I = InputOfOperation<T>, O = OutputOfOperation<T>>(key: K) => OperationConstructor<T, K, I, O>;
export declare const makeConfirmOptionsFinalizedOnMainnet: (metaplex: Metaplex, options?: ConfirmOptions | undefined) => ConfirmOptions | undefined;
