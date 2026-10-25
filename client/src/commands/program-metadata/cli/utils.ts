import {
  Account,
  Address,
  address,
  ClientWithRpc,
  ClientWithTransactionPlanning,
  ClientWithTransactionSending,
  Commitment,
  compileTransaction,
  createClient,
  createKeyPairSignerFromBytes,
  createNoopSigner,
  createSolanaRpcSubscriptions,
  extendClient,
  fetchEncodedAccount,
  flattenTransactionPlan,
  GetAccountInfoApi,
  GetLatestBlockhashApi,
  getTransactionEncoder,
  InstructionPlanInput,
  MessageSigner,
  pipe,
  Rpc,
  RpcSubscriptions,
  setTransactionMessageComputeUnitLimit,
  setTransactionMessageLifetimeUsingBlockhash,
  SolanaRpcApi,
  SolanaRpcSubscriptionsApi,
  TransactionPlan,
  TransactionSigner,
  unwrapOption,
} from "@solana/kit";
import {
  rpcGetMinimumBalance,
  rpcTransactionPlanner,
  rpcTransactionPlanSendingExecutor,
  TransactionPlannerConfig,
} from "@solana/kit-plugin-rpc";
import { identity, payer } from "@solana/kit-plugin-signer";
import {
  AccountDiscriminator,
  Buffer,
  DataSource,
  decodeMetadata,
  fetchBuffer,
  findMetadataPda,
  Format,
  SeedArgs,
  decodeData,
  packDirectData,
  PackedData,
  packExternalData,
  packUrlData,
  getProgramAuthority,
  programMetadataProgram,
} from "@solana-program/program-metadata";
import { Command } from "commander";
import picocolors from "picocolors";
import { parse as parseYaml } from "yaml";

import {
  log,
  logErrorAndExit,
  logExports,
  logInstructions,
  logSuccess,
  logWarning,
} from "./logs";
import {
  ExportEncodingOption,
  ExportOption,
  GlobalOptions,
  KeypairOption,
  NonCanonicalWriteOption,
  PayerOption,
  RpcOption,
  SingleExtendPerTxOption,
  WriteOptions,
} from "./options";
import { createRetryingSolanaRpc, RetryingRpcConfig } from "./rpc";

// Platform-agnostic imports
import { fs, path, os } from "./platform";

const LOCALHOST_URL = "http://127.0.0.1:8899";
const DATA_SOURCE_OPTIONS =
  "`[file]`, `--buffer <address>`, `--text <content>`, `--url <url>` or `--account <address>`";

export class CustomCommand extends Command {
  createCommand(name: string) {
    return new CustomCommand(name);
  }

  tap(fn: (command: CustomCommand) => void) {
    fn(this);
    return this;
  }
}

/**
 * The CLI client returned by {@link getClient}: a Solana RPC client extended
 * with the program metadata plugin (`client.programMetadata.*`), plus a few
 * CLI-only fields (`configs`, `runOrExport`).
 */
export type Client = Awaited<ReturnType<typeof getClient>>;

export async function getClient(options: GlobalOptions) {
  assertValidExportOptions(options);
  const configs = await getSolanaConfigs();
  const rpcUrl = getRpcUrl(options, configs);
  const rpcSubscriptionsUrl = getRpcSubscriptionsUrl(rpcUrl, configs);
  const [identitySigner, payerSigner] = await getKeyPairSigners(
    options,
    configs
  );

  // We build the RPC connection ourselves rather than using the all-in-one
  // `solanaRpc` plugin because that plugin does not expose a hook for a custom
  // transport, and we need a transport that retries on HTTP 429 responses to
  // survive rate-limited endpoints. We therefore attach our retrying RPC (and
  // its subscriptions) directly and apply the RPC plugin's constituents.
  const rpc = createRetryingSolanaRpc(rpcUrl, getRetryingRpcConfig());
  const rpcSubscriptions = createSolanaRpcSubscriptions(rpcSubscriptionsUrl);
  const transactionConfig = getTransactionConfig(options);

  return createClient()
    .use(payer(payerSigner))
    .use(identity(identitySigner))
    .use((client) => extendClient(client, { rpc, rpcSubscriptions }))
    .use(rpcGetMinimumBalance())
    .use(rpcTransactionPlanner(transactionConfig))
    .use(
      rpcTransactionPlanSendingExecutor({
        estimateResourceLimits: transactionConfig.estimateResourceLimits,
      })
    )
    .use(programMetadataProgram())
    .use(cliConfigs(configs))
    .use(cliRunOrExport(options));
}

/**
 * Rejects option combinations that only make sense when exporting
 * transactions. When instructions are executed directly by the CLI, they run
 * as top-level instructions in a transaction, so `--single-extend-per-tx`
 * would only add needless transactions.
 */
function assertValidExportOptions(
  options: ExportOption & SingleExtendPerTxOption
): void {
  if (options.singleExtendPerTx && !options.export) {
    logErrorAndExit(
      "The `--single-extend-per-tx` option can only be used together with `--export`."
    );
  }
}

/**
 * Shared configuration for the CLI's retrying RPC. Surfaces a warning whenever a
 * request is rate limited and retried, so a paused command does not appear to
 * hang. Used by both {@link getClient} and {@link getReadonlyClient}.
 */
function getRetryingRpcConfig(): RetryingRpcConfig {
  return {
    onRetry: ({ delayMs }) =>
      logWarning(
        `RPC rate limited (HTTP 429), retrying in ${(delayMs / 1000).toFixed(
          1
        )}s...`
      ),
  };
}

/**
 * Builds the transaction planner config for the requested transaction version.
 * The config shape is discriminated by `version`: legacy and version 0
 * transactions express priority fees per compute unit, while version 1 will
 * use a total fee in lamports.
 */
function getTransactionConfig(
  options: GlobalOptions
): TransactionPlannerConfig {
  switch (options.txVersion) {
    case "legacy":
    case 0:
      return {
        microLamportsPerComputeUnit: options.priorityFees,
        version: options.txVersion,
      };
  }
}

/**
 * Plugin that attaches the parsed `~/.config/solana/cli/config.yml` to the
 * client so commands that need to introspect Solana config defaults can read
 * them without re-parsing the file.
 */
function cliConfigs(configs: SolanaConfigs) {
  return <T extends object>(client: T) => extendClient(client, { configs });
}

/**
 * Plugin that attaches a `runOrExport` helper to the client. The helper plans
 * the given instruction(s) and then either executes them through the client's
 * transaction plan executor or exports them as encoded transactions, depending
 * on whether `--export` was passed.
 */
function cliRunOrExport(options: ExportOption & ExportEncodingOption) {
  return <
    T extends ClientWithRpc<GetLatestBlockhashApi> &
      ClientWithTransactionPlanning &
      ClientWithTransactionSending
  >(
    client: T
  ) =>
    extendClient(client, {
      runOrExport: async (
        input: InstructionPlanInput | Promise<InstructionPlanInput>
      ): Promise<void> => {
        const transactionPlan = await client.planTransactions(await input);
        if (options.export) {
          await exportTransactionPlan(transactionPlan, client, options);
        } else {
          // TODO: progress reporting.
          await client.sendTransactions(transactionPlan);
          logSuccess("Operation executed successfully");
        }
      },
    });
}

async function exportTransactionPlan(
  transactionPlan: TransactionPlan,
  client: ClientWithRpc<GetLatestBlockhashApi>,
  options: ExportOption & ExportEncodingOption
) {
  const singleTransactions = flattenTransactionPlan(transactionPlan);
  const transactionEncoder = getTransactionEncoder();

  logExports(singleTransactions.length, options);

  const { value: latestBlockhash } = await client.rpc
    .getLatestBlockhash()
    .send();

  for (let i = 0; i < singleTransactions.length; i++) {
    const message = pipe(
      singleTransactions[i].message,
      (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m) => setTransactionMessageComputeUnitLimit(undefined, m)
    );
    const prefix = picocolors.yellow(`[Transaction #${i + 1}]`);
    if (options.exportEncoding === "instruction-list") {
      log(`\n${prefix}`);
      logInstructions(message);
    } else {
      const transaction = compileTransaction(message);
      const encodedTransaction = decodeData(
        transactionEncoder.encode(transaction),
        options.exportEncoding
      );
      log(`${prefix}\n${encodedTransaction}\n`);
    }
  }
}

export type ReadonlyClient = {
  configs: SolanaConfigs;
  rpc: Rpc<SolanaRpcApi>;
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
};

export async function getReadonlyClient(
  options: RpcOption
): Promise<ReadonlyClient> {
  const configs = await getSolanaConfigs();
  const rpcUrl = getRpcUrl(options, configs);
  const rpcSubscriptionsUrl = getRpcSubscriptionsUrl(rpcUrl, configs);
  return {
    configs,
    rpc: createRetryingSolanaRpc(rpcUrl, getRetryingRpcConfig()),
    rpcSubscriptions: createSolanaRpcSubscriptions(rpcSubscriptionsUrl),
  };
}

function getRpcUrl(options: RpcOption, configs: SolanaConfigs): string {
  if (options.rpc) return options.rpc;
  if (configs.json_rpc_url) return configs.json_rpc_url;
  return LOCALHOST_URL;
}

function getRpcSubscriptionsUrl(
  rpcUrl: string,
  configs: SolanaConfigs
): string {
  if (configs.websocket_url) return configs.websocket_url;
  return rpcUrl.replace(/^http/, "ws").replace(/:8899$/, ":8900");
}

type SolanaConfigs = {
  json_rpc_url?: string;
  websocket_url?: string;
  keypair_path?: string;
  commitment?: Commitment;
};

async function getSolanaConfigs(): Promise<SolanaConfigs> {
  const configPath = getSolanaConfigPath();
  if (!(await fs.exists(configPath))) {
    logWarning("Solana config file not found");
    return {};
  }
  return parseYaml(await fs.readFile(configPath, "utf-8")) as SolanaConfigs;
}

function getSolanaConfigPath(): string {
  return path.join(os.homedir(), ".config", "solana", "cli", "config.yml");
}

export async function getKeyPairSigners(
  options: KeypairOption & PayerOption & ExportOption,
  configs: SolanaConfigs
): Promise<
  [TransactionSigner & MessageSigner, TransactionSigner & MessageSigner]
> {
  if (typeof options.export === "string") {
    const exportSigner = createNoopSigner(options.export);
    return [exportSigner, exportSigner];
  }
  const keypairPath = getKeyPairPath(options, configs);
  const keypairPromise = getKeyPairSignerFromPath(keypairPath);
  const payerPromise = options.payer
    ? getKeyPairSignerFromPath(options.payer)
    : keypairPromise;
  return await Promise.all([keypairPromise, payerPromise]);
}

function getKeyPairPath(
  options: KeypairOption,
  configs: SolanaConfigs
): string {
  if (options.keypair) return options.keypair;
  if (configs.keypair_path) return configs.keypair_path;
  return path.join(os.homedir(), ".config", "solana", "id.json");
}

async function getKeyPairSignerFromPath(keypairPath: string) {
  if (!(await fs.exists(keypairPath))) {
    logErrorAndExit(`Keypair file not found at: ${keypairPath}`);
  }
  const keypairString = await fs.readFile(keypairPath, "utf-8");
  const keypairData = new Uint8Array(JSON.parse(keypairString));
  return await createKeyPairSignerFromBytes(keypairData);
}

export function getFormatFromFile(file: string | undefined): Format {
  if (!file) return Format.None;
  const extension = path.extname(file);
  switch (extension) {
    case ".json":
      return Format.Json;
    case ".yaml":
    case ".yml":
      return Format.Yaml;
    case ".toml":
      return Format.Toml;
    default:
      return Format.None;
  }
}

export type PdaDetails = {
  metadata: Address;
  isCanonical: boolean;
  programData?: Address;
};

/** The subset of the CLI {@link Client} needed to resolve metadata PDAs. */
export type PdaDetailsClient = {
  identity: TransactionSigner;
  rpc: Rpc<GetAccountInfoApi>;
};

const CANONICAL_AUTHORITY_ERROR =
  "You must be the program upgrade authority, or the authority set on an existing canonical metadata " +
  "account, to manage canonical metadata accounts.";

/**
 * Resolves the canonical metadata account of `program` for the given `seed`
 * and ensures the active identity is allowed to manage it.
 *
 * Mirroring the on-chain program, the identity is allowed if it is either the
 * program upgrade authority, or the additional authority stored on an existing
 * canonical metadata account (see the `set-authority` command). Note that only
 * the program upgrade authority can create canonical metadata accounts.
 *
 * This is a client-side pre-flight check only; the on-chain program remains
 * the source of truth for authorization.
 *
 * @throws If the identity is not allowed to manage the canonical metadata account.
 */
export async function getCanonicalPdaDetails(
  client: PdaDetailsClient,
  program: Address,
  seed: SeedArgs
): Promise<PdaDetails> {
  const details = await getCanonicalPdaDetailsUnchecked(client, program, seed);
  if (!details.isAuthorized) {
    throw new Error(CANONICAL_AUTHORITY_ERROR);
  }
  return {
    metadata: details.metadata,
    isCanonical: true,
    programData: details.programData,
  };
}

/**
 * Resolves the metadata account to write to based on the `--non-canonical`
 * option.
 *
 * - By default, the canonical metadata account is resolved and the active
 *   identity must be allowed to manage it (see {@link getCanonicalPdaDetails}).
 * - With `--non-canonical`, the metadata account derived from the active
 *   identity is resolved and no program data account is provided.
 *
 * @throws If the canonical metadata account is requested and the identity is
 * not allowed to manage it.
 */
export async function getPdaDetailsForWriting(
  client: PdaDetailsClient,
  options: NonCanonicalWriteOption,
  program: Address,
  seed: SeedArgs
): Promise<PdaDetails> {
  if (options.nonCanonical) {
    const [metadata] = await findMetadataPda({
      program,
      authority: client.identity.address,
      seed,
    });
    return { metadata, isCanonical: false, programData: undefined };
  }

  const details = await getCanonicalPdaDetailsUnchecked(client, program, seed);
  if (!details.isAuthorized) {
    throw new Error(
      `${CANONICAL_AUTHORITY_ERROR} Use the \`--non-canonical\` option to manage metadata accounts as a third party.`
    );
  }
  return {
    metadata: details.metadata,
    isCanonical: true,
    programData: details.programData,
  };
}

async function getCanonicalPdaDetailsUnchecked(
  client: PdaDetailsClient,
  program: Address,
  seed: SeedArgs
): Promise<{
  isAuthorized: boolean;
  metadata: Address;
  programData?: Address;
}> {
  const identity = client.identity.address;
  const [[metadata], { authority: upgradeAuthority, programData }] =
    await Promise.all([
      findMetadataPda({ program, authority: null, seed }),
      getProgramAuthority(client.rpc, program),
    ]);

  // Fast path: the identity is the program upgrade authority.
  if (upgradeAuthority === identity) {
    return { isAuthorized: true, metadata, programData };
  }

  // Otherwise, the identity must be the additional authority stored on an
  // existing canonical metadata account. Pre-allocated buffers also live at
  // the canonical PDA but cannot be initialized by anyone other than the
  // upgrade authority, hence the discriminator check.
  const account = await fetchEncodedAccount(client.rpc, metadata);
  if (!account.exists || account.data[0] !== AccountDiscriminator.Metadata) {
    return { isAuthorized: false, metadata, programData };
  }
  const storedAuthority = unwrapOption(decodeMetadata(account).data.authority);
  return { isAuthorized: storedAuthority === identity, metadata, programData };
}

export async function getWriteInput(
  client: Client,
  file: string | undefined,
  options: WriteOptions
): Promise<
  PackedData & {
    buffer?: Account<Buffer>;
    format: Format;
    closeBuffer?: Address | boolean;
  }
> {
  const buffer = options.buffer
    ? await fetchBuffer(client.rpc, options.buffer)
    : undefined;
  return {
    ...(await getPackedData(file, options)),
    format: options.format ?? getFormatFromFile(file),
    closeBuffer: options.buffer ? options.closeBuffer : true,
    buffer,
  };
}

export async function getPackedData(
  file: string | undefined,
  options: WriteOptions
): Promise<PackedData> {
  const { compression, encoding } = options;
  let packData: PackedData | null = null;
  const assertSingleUse = () => {
    if (packData) {
      logErrorAndExit(
        `Multiple data sources provided. Use only one of: ${DATA_SOURCE_OPTIONS} to provide data.`
      );
    }
  };

  if (file) {
    if (!(await fs.exists(file))) {
      logErrorAndExit(`File not found: ${file}`);
    }
    const fileContent = await fs.readFile(file, "utf-8");
    packData = packDirectData({ content: fileContent, compression, encoding });
  }
  if (options.buffer) {
    assertSingleUse();
    packData = {
      data: new Uint8Array(0),
      compression,
      encoding,
      dataSource: DataSource.Direct,
    };
  }
  if (options.text) {
    assertSingleUse();
    packData = packDirectData({ content: options.text, compression, encoding });
  }
  if (options.url) {
    assertSingleUse();
    packData = packUrlData({ url: options.url, compression, encoding });
  }
  if (options.account) {
    assertSingleUse();
    packData = packExternalData({
      address: address(options.account),
      offset: options.accountOffset
        ? parseInt(options.accountOffset)
        : undefined,
      length: options.accountLength
        ? parseInt(options.accountLength)
        : undefined,
      compression,
      encoding,
    });
  }

  if (!packData) {
    logErrorAndExit(
      `No data provided. Use ${DATA_SOURCE_OPTIONS} to provide data.`
    );
  }

  return packData;
}

export async function writeFile(
  filepath: string,
  content: string
): Promise<void> {
  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, content);
}

/**
 * Format bytes as human-readable text.
 * @see https://stackoverflow.com/a/14919494/11440277
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export function humanFileSize(bytes: number, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
}
