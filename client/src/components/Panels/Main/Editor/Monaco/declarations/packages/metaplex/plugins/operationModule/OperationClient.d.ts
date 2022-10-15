import type { Metaplex } from '../../Metaplex';
import { OperationConstructor, Operation, KeyOfOperation, InputOfOperation, OutputOfOperation, OperationHandler, OperationOptions, OperationScope } from '../../types';
import { DisposableScope } from '../../utils';
/**
 * @group Modules
 */
export declare class OperationClient {
    protected readonly metaplex: Metaplex;
    /**
     * Maps the name of an operation with its operation handler.
     * Whilst the types on the Map are relatively loose, we ensure
     * operations match with their handlers when registering them.
     */
    protected operationHandlers: Map<string, OperationHandler<any, any, any, any>>;
    constructor(metaplex: Metaplex);
    register<T extends Operation<K, I, O>, K extends string = KeyOfOperation<T>, I = InputOfOperation<T>, O = OutputOfOperation<T>>(operationConstructor: OperationConstructor<T, K, I, O>, operationHandler: OperationHandler<T, K, I, O>): this;
    get<T extends Operation<K, I, O>, K extends string = KeyOfOperation<T>, I = InputOfOperation<T>, O = OutputOfOperation<T>>(operation: T): OperationHandler<T, K, I, O>;
    execute<T extends Operation<K, I, O>, K extends string = KeyOfOperation<T>, I = InputOfOperation<T>, O = OutputOfOperation<T>>(operation: T, options?: OperationOptions): Promise<O>;
    protected getOperationScope(options: OperationOptions, scope: DisposableScope): OperationScope;
}
