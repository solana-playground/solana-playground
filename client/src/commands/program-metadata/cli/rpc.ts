import {
    createDefaultRpcTransport,
    createSolanaRpcFromTransport,
    isSolanaError,
    Rpc,
    RpcTransport,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    SolanaRpcApi,
} from '@solana/kit';

/** The maximum number of retries attempted for a rate-limited request. */
const DEFAULT_MAX_RETRIES = 5;
/** The base delay, in milliseconds, used for exponential backoff. */
const BASE_BACKOFF_MS = 500;
/** The ceiling, in milliseconds, applied to computed exponential backoff delays. */
const MAX_BACKOFF_MS = 10_000;
/**
 * The ceiling, in milliseconds, applied to a server-provided `Retry-After`
 * value. When the server asks us to wait longer than this, we give up
 * immediately rather than spending a retry on a wait that is unlikely to be
 * worthwhile. This is deliberately more generous than {@link MAX_BACKOFF_MS}
 * because the server is telling us exactly when it will accept the request.
 */
const MAX_RETRY_AFTER_MS = 60_000;

/**
 * Information passed to the {@link RetryingRpcConfig.onRetry} callback before a
 * rate-limited request is retried.
 */
export type RetryInfo = {
    /** The zero-based index of the attempt that just failed. */
    attempt: number;
    /** The delay, in milliseconds, before the next attempt. */
    delayMs: number;
    /** The rate-limit error that triggered the retry. */
    error: unknown;
};

/**
 * Options controlling how {@link createRetryingSolanaRpc} retries rate-limited
 * requests.
 */
export type RetryingRpcConfig = {
    /**
     * Optional configuration forwarded to the underlying default RPC transport,
     * such as custom headers.
     */
    transportConfig?: Omit<Parameters<typeof createDefaultRpcTransport>[0], 'url'>;
    /**
     * The maximum number of retries attempted after an initial rate-limited
     * (HTTP 429) response before giving up. Defaults to {@link DEFAULT_MAX_RETRIES}.
     */
    maxRetries?: number;
    /**
     * Called before each retry, after the delay has been computed but before it
     * elapses. Useful for surfacing progress (e.g. logging a "rate limited,
     * retrying in Xs" warning) so a paused request does not appear to hang.
     */
    onRetry?: (info: RetryInfo) => void;
    /**
     * Sleep function used between retries. Injectable for testing; defaults to a
     * `setTimeout`-based delay that resolves early if the request is aborted.
     */
    sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

/**
 * Creates a Solana RPC client whose transport automatically retries requests
 * that fail with an HTTP 429 (Too Many Requests) response.
 *
 * Public RPC endpoints — devnet in particular — aggressively rate-limit bursts
 * of requests. Since uploading metadata fans a large payload out into many
 * write transactions (each performing several RPC calls), those bursts commonly
 * trip the rate limiter and abort the whole upload. Retrying at the transport
 * layer covers every RPC call (blockhash lookups, simulations, sends and status
 * polls), not just the sends.
 *
 * The retry honours the server's `Retry-After` header when present (giving up if
 * it asks for an unreasonably long wait); otherwise it falls back to exponential
 * backoff with jitter. Only HTTP 429 responses are retried — every other error
 * propagates immediately so genuine failures are surfaced without delay.
 *
 * @param url - The Solana RPC endpoint URL.
 * @param config - Optional retry and transport configuration.
 * @returns An {@link Rpc} backed by the retrying transport.
 */
export function createRetryingSolanaRpc(url: string, config: RetryingRpcConfig = {}): Rpc<SolanaRpcApi> {
    const baseTransport = createDefaultRpcTransport({ url, ...config.transportConfig });
    return createSolanaRpcFromTransport(withRateLimitRetries(baseTransport, config));
}

/**
 * Wraps a transport so that requests failing with an HTTP 429 (Too Many
 * Requests) response are retried. Exposed separately from
 * {@link createRetryingSolanaRpc} so the retry behaviour can be tested against a
 * mock transport without performing real network I/O.
 *
 * @param transport - The underlying transport to wrap.
 * @param config - Optional retry configuration.
 * @returns A transport that retries rate-limited requests.
 */
export function withRateLimitRetries(transport: RpcTransport, config: RetryingRpcConfig = {}): RpcTransport {
    const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    const sleep = config.sleep ?? defaultSleep;

    return async <TResponse>(request: Parameters<RpcTransport>[0]): Promise<TResponse> => {
        for (let attempt = 0; ; attempt++) {
            try {
                return await transport<TResponse>(request);
            } catch (error) {
                // Don't retry non-429 errors, once the budget is exhausted, or
                // once the request has been aborted (e.g. the executor
                // cancelled sibling requests after another transaction failed).
                const decision = getRetryDecision(error, attempt, maxRetries);
                if (decision.kind === 'give-up' || request.signal?.aborted) {
                    throw error;
                }
                config.onRetry?.({ attempt, delayMs: decision.delayMs, error });
                await sleep(decision.delayMs, request.signal);
                // The sleep resolves early on abort; surface the original 429
                // rather than looping back into a transport call that would
                // reject with an `AbortError` instead.
                if (request.signal?.aborted) {
                    throw error;
                }
            }
        }
    };
}

/** The outcome of deciding whether and how long to wait before a retry. */
type RetryDecision = { kind: 'retry'; delayMs: number } | { kind: 'give-up' };

/**
 * Decides whether a failed request should be retried and, if so, after how long.
 *
 * Retries only HTTP 429 (rate limit) errors, and only while retries remain. When
 * the server provides a `Retry-After` value we honour it up to
 * {@link MAX_RETRY_AFTER_MS}; a longer requested wait is treated as not worth
 * retrying and yields `give-up`. Without a usable header, we fall back to
 * exponential backoff with full jitter, capped at {@link MAX_BACKOFF_MS}.
 */
export function getRetryDecision(error: unknown, attempt: number, maxRetries: number): RetryDecision {
    if (attempt >= maxRetries || !isRateLimitError(error)) {
        return { kind: 'give-up' };
    }
    const retryAfter = getRetryAfterMs(error);
    if (retryAfter !== null) {
        // The server told us exactly when to retry. Honour it within reason;
        // beyond the ceiling the wait is not worth a retry slot.
        return retryAfter > MAX_RETRY_AFTER_MS ? { kind: 'give-up' } : { kind: 'retry', delayMs: retryAfter };
    }
    return { kind: 'retry', delayMs: getBackoffDelayMs(attempt) };
}

/** Returns whether the given error is an HTTP 429 (rate limit) transport error. */
function isRateLimitError(error: unknown): boolean {
    return isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR) && error.context.statusCode === 429;
}

/**
 * Computes a jittered exponential backoff delay for the given attempt, capped at
 * {@link MAX_BACKOFF_MS}.
 */
export function getBackoffDelayMs(attempt: number): number {
    const exponential = Math.min(BASE_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS);
    // Full jitter: a random delay in [0, exponential] to spread out retries and
    // avoid a thundering herd against the rate limiter.
    return Math.round(Math.random() * exponential);
}

/**
 * Parses the `Retry-After` header from a rate-limit error into milliseconds, or
 * returns `null` when the header is absent or unparseable.
 */
function getRetryAfterMs(error: unknown): number | null {
    if (!isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR)) {
        return null;
    }
    const headerValue = error.context.headers?.get('retry-after');
    if (!headerValue) {
        return null;
    }

    // `Retry-After` may be a number of seconds or an HTTP-date.
    const seconds = Number(headerValue);
    if (Number.isFinite(seconds)) {
        return Math.max(0, seconds * 1000);
    }
    const dateMs = Date.parse(headerValue);
    if (Number.isFinite(dateMs)) {
        return Math.max(0, dateMs - Date.now());
    }
    return null;
}

/**
 * Sleeps for the given duration, resolving early (without rejecting) if the
 * optional abort signal fires. Resolving rather than throwing lets the retry
 * loop re-check `signal.aborted` and surface the original error.
 */
function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (signal?.aborted) {
        return Promise.resolve();
    }
    return new Promise(resolve => {
        const onAbort = () => {
            clearTimeout(timeout);
            resolve();
        };
        const timeout = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}
