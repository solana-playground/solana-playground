import type EventEmitter from 'eventemitter3';
export declare type DisposableScope = {
    signal: AbortSignal | undefined;
    isCanceled: () => boolean;
    getCancelationError: () => unknown;
    throwIfCanceled: () => void;
};
export declare class Disposable {
    protected eventEmitter: EventEmitter;
    protected signal: AbortSignal;
    protected cancelationError: unknown;
    protected abortListener: (error: unknown) => void;
    constructor(signal: AbortSignal);
    run<T>(callback: (scope: DisposableScope) => T, thenCloseDisposable?: boolean): Promise<T>;
    getScope(): DisposableScope;
    isCanceled(): boolean;
    getCancelationError(): unknown;
    onCancel(callback: (reason: unknown) => unknown): Disposable;
    close(): void;
}
