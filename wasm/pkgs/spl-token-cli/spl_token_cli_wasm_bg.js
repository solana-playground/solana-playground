import { PgTerminal } from "/src/utils/pg/terminal/terminal.ts";
import * as wasm from "./spl_token_cli_wasm_bg.wasm";

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) {
  return heap[idx];
}

let heap_next = heap.length;

function dropObject(idx) {
  if (idx < 36) return;
  heap[idx] = heap_next;
  heap_next = idx;
}

function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}

const lTextDecoder =
  typeof TextDecoder === "undefined"
    ? (0, module.require)("util").TextDecoder
    : TextDecoder;

let cachedTextDecoder = new lTextDecoder("utf-8", {
  ignoreBOM: true,
  fatal: true,
});

cachedTextDecoder.decode();

let cachedUint8Memory0;
function getUint8Memory0() {
  if (cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];

  heap[idx] = obj;
  return idx;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder =
  typeof TextEncoder === "undefined"
    ? (0, module.require)("util").TextEncoder
    : TextEncoder;

let cachedTextEncoder = new lTextEncoder("utf-8");

const encodeString =
  typeof cachedTextEncoder.encodeInto === "function"
    ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
      }
    : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
          read: arg.length,
          written: buf.length,
        };
      };

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr = malloc(buf.length);
    getUint8Memory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len);

  const mem = getUint8Memory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7f) break;
    mem[ptr + offset] = code;
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3));
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);

    offset += ret.written;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

function isLikeNone(x) {
  return x === undefined || x === null;
}

let cachedInt32Memory0;
function getInt32Memory0() {
  if (cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}

let cachedFloat64Memory0;
function getFloat64Memory0() {
  if (cachedFloat64Memory0.byteLength === 0) {
    cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
  }
  return cachedFloat64Memory0;
}

function debugString(val) {
  // primitive types
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  // objects
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString(val[i]);
    }
    debug += "]";
    return debug;
  }
  // Test for built-in
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    // Failed to match the standard '[object ClassName]'
    return toString.call(val);
  }
  if (className == "Object") {
    // we're a user defined class or Object
    // JSON.stringify avoids problems with cycles, and is generally much
    // easier than looping through ownProperties of `val`.
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  // errors
  if (val instanceof Error) {
    return `${val.name}: ${val.message}\n${val.stack}`;
  }
  // TODO we could test for more things here, like `Set`s and `Map`s.
  return className;
}

function makeMutClosure(arg0, arg1, dtor, f) {
  const state = { a: arg0, b: arg1, cnt: 1, dtor };
  const real = (...args) => {
    // First up with a closure we increment the internal reference
    // count. This ensures that the Rust closure environment won't
    // be deallocated while we're invoking it.
    state.cnt++;
    const a = state.a;
    state.a = 0;
    try {
      return f(a, state.b, ...args);
    } finally {
      if (--state.cnt === 0) {
        wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);
      } else {
        state.a = a;
      }
    }
  };
  real.original = state;

  return real;
}
function __wbg_adapter_28(arg0, arg1, arg2) {
  wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__he5fe24f0ae29351b(
    arg0,
    arg1,
    addHeapObject(arg2)
  );
}

function __wbg_adapter_31(arg0, arg1) {
  wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hd3365ee063b34140(
    arg0,
    arg1
  );
}

function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1);
  getUint8Memory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
/**
 * @param {string} arg
 * @param {string} endpoint
 * @param {string} commitment
 * @param {Uint8Array} keypair_bytes
 */
export function runSplToken(arg, endpoint, commitment, keypair_bytes) {
  const ptr0 = passStringToWasm0(
    arg,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc
  );
  const len0 = WASM_VECTOR_LEN;
  const ptr1 = passStringToWasm0(
    endpoint,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc
  );
  const len1 = WASM_VECTOR_LEN;
  const ptr2 = passStringToWasm0(
    commitment,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc
  );
  const len2 = WASM_VECTOR_LEN;
  const ptr3 = passArray8ToWasm0(keypair_bytes, wasm.__wbindgen_malloc);
  const len3 = WASM_VECTOR_LEN;
  wasm.runSplToken(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
}

function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
  return instance.ptr;
}

function getArrayU8FromWasm0(ptr, len) {
  return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}

const u32CvtShim = new Uint32Array(2);

const uint64CvtShim = new BigUint64Array(u32CvtShim.buffer);

let cachedUint32Memory0;
function getUint32Memory0() {
  if (cachedUint32Memory0.byteLength === 0) {
    cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
  }
  return cachedUint32Memory0;
}

function passArrayJsValueToWasm0(array, malloc) {
  const ptr = malloc(array.length * 4);
  const mem = getUint32Memory0();
  for (let i = 0; i < array.length; i++) {
    mem[ptr / 4 + i] = addHeapObject(array[i]);
  }
  WASM_VECTOR_LEN = array.length;
  return ptr;
}
/**
 * Initialize Javascript logging and panic handler
 */
export function solana_program_init() {
  wasm.solana_program_init();
}

function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e));
  }
}
/**
 * A hash; the 32-byte output of a hashing algorithm.
 *
 * This struct is used most often in `solana-sdk` and related crates to contain
 * a [SHA-256] hash, but may instead contain a [blake3] hash, as created by the
 * [`blake3`] module (and used in [`Message::hash`]).
 *
 * [SHA-256]: https://en.wikipedia.org/wiki/SHA-2
 * [blake3]: https://github.com/BLAKE3-team/BLAKE3
 * [`blake3`]: crate::blake3
 * [`Message::hash`]: crate::message::Message::hash
 */
export class Hash {
  static __wrap(ptr) {
    const obj = Object.create(Hash.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_hash_free(ptr);
  }
  /**
   * Create a new Hash object
   *
   * * `value` - optional hash as a base58 encoded string, `Uint8Array`, `[number]`
   * @param {any} value
   */
  constructor(value) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.hash_constructor(retptr, addHeapObject(value));
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return Hash.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Return the base58 string representation of the hash
   * @returns {string}
   */
  toString() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.hash_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
   * Checks if two `Hash`s are equal
   * @param {Hash} other
   * @returns {boolean}
   */
  equals(other) {
    _assertClass(other, Hash);
    const ret = wasm.hash_equals(this.ptr, other.ptr);
    return ret !== 0;
  }
  /**
   * Return the `Uint8Array` representation of the hash
   * @returns {Uint8Array}
   */
  toBytes() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.hash_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}
/**
 * A directive for a single invocation of a Solana program.
 *
 * An instruction specifies which program it is calling, which accounts it may
 * read or modify, and additional data that serves as input to the program. One
 * or more instructions are included in transactions submitted by Solana
 * clients. Instructions are also used to describe [cross-program
 * invocations][cpi].
 *
 * [cpi]: https://docs.solana.com/developing/programming-model/calling-between-programs
 *
 * During execution, a program will receive a list of account data as one of
 * its arguments, in the same order as specified during `Instruction`
 * construction.
 *
 * While Solana is agnostic to the format of the instruction data, it has
 * built-in support for serialization via [`borsh`] and [`bincode`].
 *
 * [`borsh`]: https://docs.rs/borsh/latest/borsh/
 * [`bincode`]: https://docs.rs/bincode/latest/bincode/
 *
 * # Specifying account metadata
 *
 * When constructing an [`Instruction`], a list of all accounts that may be
 * read or written during the execution of that instruction must be supplied as
 * [`AccountMeta`] values.
 *
 * Any account whose data may be mutated by the program during execution must
 * be specified as writable. During execution, writing to an account that was
 * not specified as writable will cause the transaction to fail. Writing to an
 * account that is not owned by the program will cause the transaction to fail.
 *
 * Any account whose lamport balance may be mutated by the program during
 * execution must be specified as writable. During execution, mutating the
 * lamports of an account that was not specified as writable will cause the
 * transaction to fail. While _subtracting_ lamports from an account not owned
 * by the program will cause the transaction to fail, _adding_ lamports to any
 * account is allowed, as long is it is mutable.
 *
 * Accounts that are not read or written by the program may still be specified
 * in an `Instruction`'s account list. These will affect scheduling of program
 * execution by the runtime, but will otherwise be ignored.
 *
 * When building a transaction, the Solana runtime coalesces all accounts used
 * by all instructions in that transaction, along with accounts and permissions
 * required by the runtime, into a single account list. Some accounts and
 * account permissions required by the runtime to process a transaction are
 * _not_ required to be included in an `Instruction`s account list. These
 * include:
 *
 * - The program ID &mdash; it is a separate field of `Instruction`
 * - The transaction's fee-paying account &mdash; it is added during [`Message`]
 *   construction. A program may still require the fee payer as part of the
 *   account list if it directly references it.
 *
 * [`Message`]: crate::message::Message
 *
 * Programs may require signatures from some accounts, in which case they
 * should be specified as signers during `Instruction` construction. The
 * program must still validate during execution that the account is a signer.
 */
export class Instruction {
  static __wrap(ptr) {
    const obj = Object.create(Instruction.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_instruction_free(ptr);
  }
}
/**
 */
export class Instructions {
  static __wrap(ptr) {
    const obj = Object.create(Instructions.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_instructions_free(ptr);
  }
  /**
   */
  constructor() {
    const ret = wasm.instructions_constructor();
    return Instructions.__wrap(ret);
  }
  /**
   * @param {Instruction} instruction
   */
  push(instruction) {
    _assertClass(instruction, Instruction);
    var ptr0 = instruction.ptr;
    instruction.ptr = 0;
    wasm.instructions_push(this.ptr, ptr0);
  }
}
/**
 * A vanilla Ed25519 key pair
 */
export class Keypair {
  static __wrap(ptr) {
    const obj = Object.create(Keypair.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_keypair_free(ptr);
  }
  /**
   * Create a new `Keypair `
   */
  constructor() {
    const ret = wasm.keypair_constructor();
    return Keypair.__wrap(ret);
  }
  /**
   * Convert a `Keypair` to a `Uint8Array`
   * @returns {Uint8Array}
   */
  toBytes() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.keypair_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Recover a `Keypair` from a `Uint8Array`
   * @param {Uint8Array} bytes
   * @returns {Keypair}
   */
  static fromBytes(bytes) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
      const len0 = WASM_VECTOR_LEN;
      wasm.keypair_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return Keypair.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Return the `Pubkey` for this `Keypair`
   * @returns {Pubkey}
   */
  pubkey() {
    const ret = wasm.keypair_pubkey(this.ptr);
    return Pubkey.__wrap(ret);
  }
}
/**
 * A Solana transaction message (legacy).
 *
 * See the [`message`] module documentation for further description.
 *
 * [`message`]: crate::message
 *
 * Some constructors accept an optional `payer`, the account responsible for
 * paying the cost of executing a transaction. In most cases, callers should
 * specify the payer explicitly in these constructors. In some cases though,
 * the caller is not _required_ to specify the payer, but is still allowed to:
 * in the `Message` structure, the first account is always the fee-payer, so if
 * the caller has knowledge that the first account of the constructed
 * transaction's `Message` is both a signer and the expected fee-payer, then
 * redundantly specifying the fee-payer is not strictly required.
 */
export class Message {
  static __wrap(ptr) {
    const obj = Object.create(Message.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_message_free(ptr);
  }
  /**
   * The id of a recent ledger entry.
   */
  get recent_blockhash() {
    const ret = wasm.__wbg_get_message_recent_blockhash(this.ptr);
    return Hash.__wrap(ret);
  }
  /**
   * The id of a recent ledger entry.
   */
  set recent_blockhash(arg0) {
    _assertClass(arg0, Hash);
    var ptr0 = arg0.ptr;
    arg0.ptr = 0;
    wasm.__wbg_set_message_recent_blockhash(this.ptr, ptr0);
  }
}
/**
 * The address of a [Solana account][acc].
 *
 * Some account addresses are [ed25519] public keys, with corresponding secret
 * keys that are managed off-chain. Often, though, account addresses do not
 * have corresponding secret keys &mdash; as with [_program derived
 * addresses_][pdas] &mdash; or the secret key is not relevant to the operation
 * of a program, and may have even been disposed of. As running Solana programs
 * can not safely create or manage secret keys, the full [`Keypair`] is not
 * defined in `solana-program` but in `solana-sdk`.
 *
 * [acc]: https://docs.solana.com/developing/programming-model/accounts
 * [ed25519]: https://ed25519.cr.yp.to/
 * [pdas]: https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses
 * [`Keypair`]: https://docs.rs/solana-sdk/latest/solana_sdk/signer/keypair/struct.Keypair.html
 */
export class Pubkey {
  static __wrap(ptr) {
    const obj = Object.create(Pubkey.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_pubkey_free(ptr);
  }
  /**
   * Create a new Pubkey object
   *
   * * `value` - optional public key as a base58 encoded string, `Uint8Array`, `[number]`
   * @param {any} value
   */
  constructor(value) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.pubkey_constructor(retptr, addHeapObject(value));
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return Pubkey.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Return the base58 string representation of the public key
   * @returns {string}
   */
  toString() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.pubkey_toString(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      return getStringFromWasm0(r0, r1);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
      wasm.__wbindgen_free(r0, r1);
    }
  }
  /**
   * Check if a `Pubkey` is on the ed25519 curve.
   * @returns {boolean}
   */
  isOnCurve() {
    const ret = wasm.pubkey_isOnCurve(this.ptr);
    return ret !== 0;
  }
  /**
   * Checks if two `Pubkey`s are equal
   * @param {Pubkey} other
   * @returns {boolean}
   */
  equals(other) {
    _assertClass(other, Pubkey);
    const ret = wasm.pubkey_equals(this.ptr, other.ptr);
    return ret !== 0;
  }
  /**
   * Return the `Uint8Array` representation of the public key
   * @returns {Uint8Array}
   */
  toBytes() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.pubkey_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Derive a Pubkey from another Pubkey, string seed, and a program id
   * @param {Pubkey} base
   * @param {string} seed
   * @param {Pubkey} owner
   * @returns {Pubkey}
   */
  static createWithSeed(base, seed, owner) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      _assertClass(base, Pubkey);
      const ptr0 = passStringToWasm0(
        seed,
        wasm.__wbindgen_malloc,
        wasm.__wbindgen_realloc
      );
      const len0 = WASM_VECTOR_LEN;
      _assertClass(owner, Pubkey);
      wasm.pubkey_createWithSeed(retptr, base.ptr, ptr0, len0, owner.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return Pubkey.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Derive a program address from seeds and a program id
   * @param {any[]} seeds
   * @param {Pubkey} program_id
   * @returns {Pubkey}
   */
  static createProgramAddress(seeds, program_id) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passArrayJsValueToWasm0(seeds, wasm.__wbindgen_malloc);
      const len0 = WASM_VECTOR_LEN;
      _assertClass(program_id, Pubkey);
      wasm.pubkey_createProgramAddress(retptr, ptr0, len0, program_id.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return Pubkey.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Find a valid program address
   *
   * Returns:
   * * `[PubKey, number]` - the program address and bump seed
   * @param {any[]} seeds
   * @param {Pubkey} program_id
   * @returns {any}
   */
  static findProgramAddress(seeds, program_id) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passArrayJsValueToWasm0(seeds, wasm.__wbindgen_malloc);
      const len0 = WASM_VECTOR_LEN;
      _assertClass(program_id, Pubkey);
      wasm.pubkey_findProgramAddress(retptr, ptr0, len0, program_id.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return takeObject(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}

export class SystemInstruction {
  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    // NOTE: This is causing compiler problems
    // wasm.__wbg_systeminstruction_free(ptr);
  }
  /**
   * @param {Pubkey} from_pubkey
   * @param {Pubkey} to_pubkey
   * @param {bigint} lamports
   * @param {bigint} space
   * @param {Pubkey} owner
   * @returns {Instruction}
   */
  static createAccount(from_pubkey, to_pubkey, lamports, space, owner) {
    _assertClass(from_pubkey, Pubkey);
    _assertClass(to_pubkey, Pubkey);
    uint64CvtShim[0] = lamports;
    const low0 = u32CvtShim[0];
    const high0 = u32CvtShim[1];
    uint64CvtShim[0] = space;
    const low1 = u32CvtShim[0];
    const high1 = u32CvtShim[1];
    _assertClass(owner, Pubkey);
    const ret = wasm.systeminstruction_createAccount(
      from_pubkey.ptr,
      to_pubkey.ptr,
      low0,
      high0,
      low1,
      high1,
      owner.ptr
    );
    return Instruction.__wrap(ret);
  }
  /**
   * @param {Pubkey} from_pubkey
   * @param {Pubkey} to_pubkey
   * @param {Pubkey} base
   * @param {string} seed
   * @param {bigint} lamports
   * @param {bigint} space
   * @param {Pubkey} owner
   * @returns {Instruction}
   */
  static createAccountWithSeed(
    from_pubkey,
    to_pubkey,
    base,
    seed,
    lamports,
    space,
    owner
  ) {
    _assertClass(from_pubkey, Pubkey);
    _assertClass(to_pubkey, Pubkey);
    _assertClass(base, Pubkey);
    const ptr0 = passStringToWasm0(
      seed,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    );
    const len0 = WASM_VECTOR_LEN;
    uint64CvtShim[0] = lamports;
    const low1 = u32CvtShim[0];
    const high1 = u32CvtShim[1];
    uint64CvtShim[0] = space;
    const low2 = u32CvtShim[0];
    const high2 = u32CvtShim[1];
    _assertClass(owner, Pubkey);
    const ret = wasm.systeminstruction_createAccountWithSeed(
      from_pubkey.ptr,
      to_pubkey.ptr,
      base.ptr,
      ptr0,
      len0,
      low1,
      high1,
      low2,
      high2,
      owner.ptr
    );
    return Instruction.__wrap(ret);
  }
  /**
   * @param {Pubkey} pubkey
   * @param {Pubkey} owner
   * @returns {Instruction}
   */
  static assign(pubkey, owner) {
    _assertClass(pubkey, Pubkey);
    _assertClass(owner, Pubkey);
    const ret = wasm.systeminstruction_assign(pubkey.ptr, owner.ptr);
    return Instruction.__wrap(ret);
  }
  /**
   * @param {Pubkey} pubkey
   * @param {Pubkey} base
   * @param {string} seed
   * @param {Pubkey} owner
   * @returns {Instruction}
   */
  static assignWithSeed(pubkey, base, seed, owner) {
    _assertClass(pubkey, Pubkey);
    _assertClass(base, Pubkey);
    const ptr0 = passStringToWasm0(
      seed,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    );
    const len0 = WASM_VECTOR_LEN;
    _assertClass(owner, Pubkey);
    const ret = wasm.systeminstruction_assignWithSeed(
      pubkey.ptr,
      base.ptr,
      ptr0,
      len0,
      owner.ptr
    );
    return Instruction.__wrap(ret);
  }
  /**
   * @param {Pubkey} from_pubkey
   * @param {Pubkey} to_pubkey
   * @param {bigint} lamports
   * @returns {Instruction}
   */
  static transfer(from_pubkey, to_pubkey, lamports) {
    _assertClass(from_pubkey, Pubkey);
    _assertClass(to_pubkey, Pubkey);
    uint64CvtShim[0] = lamports;
    const low0 = u32CvtShim[0];
    const high0 = u32CvtShim[1];
    const ret = wasm.systeminstruction_transfer(
      from_pubkey.ptr,
      to_pubkey.ptr,
      low0,
      high0
    );
    return Instruction.__wrap(ret);
  }
  /**
   * @param {Pubkey} from_pubkey
   * @param {Pubkey} from_base
   * @param {string} from_seed
   * @param {Pubkey} from_owner
   * @param {Pubkey} to_pubkey
   * @param {bigint} lamports
   * @returns {Instruction}
   */
  static transferWithSeed(
    from_pubkey,
    from_base,
    from_seed,
    from_owner,
    to_pubkey,
    lamports
  ) {
    _assertClass(from_pubkey, Pubkey);
    _assertClass(from_base, Pubkey);
    const ptr0 = passStringToWasm0(
      from_seed,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    );
    const len0 = WASM_VECTOR_LEN;
    _assertClass(from_owner, Pubkey);
    _assertClass(to_pubkey, Pubkey);
    uint64CvtShim[0] = lamports;
    const low1 = u32CvtShim[0];
    const high1 = u32CvtShim[1];
    const ret = wasm.systeminstruction_transferWithSeed(
      from_pubkey.ptr,
      from_base.ptr,
      ptr0,
      len0,
      from_owner.ptr,
      to_pubkey.ptr,
      low1,
      high1
    );
    return Instruction.__wrap(ret);
  }
  /**
   * @param {Pubkey} pubkey
   * @param {bigint} space
   * @returns {Instruction}
   */
  static allocate(pubkey, space) {
    _assertClass(pubkey, Pubkey);
    uint64CvtShim[0] = space;
    const low0 = u32CvtShim[0];
    const high0 = u32CvtShim[1];
    const ret = wasm.systeminstruction_allocate(pubkey.ptr, low0, high0);
    return Instruction.__wrap(ret);
  }
  /**
   * @param {Pubkey} address
   * @param {Pubkey} base
   * @param {string} seed
   * @param {bigint} space
   * @param {Pubkey} owner
   * @returns {Instruction}
   */
  static allocateWithSeed(address, base, seed, space, owner) {
    _assertClass(address, Pubkey);
    _assertClass(base, Pubkey);
    const ptr0 = passStringToWasm0(
      seed,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc
    );
    const len0 = WASM_VECTOR_LEN;
    uint64CvtShim[0] = space;
    const low1 = u32CvtShim[0];
    const high1 = u32CvtShim[1];
    _assertClass(owner, Pubkey);
    const ret = wasm.systeminstruction_allocateWithSeed(
      address.ptr,
      base.ptr,
      ptr0,
      len0,
      low1,
      high1,
      owner.ptr
    );
    return Instruction.__wrap(ret);
  }
  /**
   * @param {Pubkey} from_pubkey
   * @param {Pubkey} nonce_pubkey
   * @param {Pubkey} authority
   * @param {bigint} lamports
   * @returns {Array<any>}
   */
  static createNonceAccount(from_pubkey, nonce_pubkey, authority, lamports) {
    _assertClass(from_pubkey, Pubkey);
    _assertClass(nonce_pubkey, Pubkey);
    _assertClass(authority, Pubkey);
    uint64CvtShim[0] = lamports;
    const low0 = u32CvtShim[0];
    const high0 = u32CvtShim[1];
    const ret = wasm.systeminstruction_createNonceAccount(
      from_pubkey.ptr,
      nonce_pubkey.ptr,
      authority.ptr,
      low0,
      high0
    );
    return takeObject(ret);
  }
  /**
   * @param {Pubkey} nonce_pubkey
   * @param {Pubkey} authorized_pubkey
   * @returns {Instruction}
   */
  static advanceNonceAccount(nonce_pubkey, authorized_pubkey) {
    _assertClass(nonce_pubkey, Pubkey);
    _assertClass(authorized_pubkey, Pubkey);
    const ret = wasm.systeminstruction_advanceNonceAccount(
      nonce_pubkey.ptr,
      authorized_pubkey.ptr
    );
    return Instruction.__wrap(ret);
  }
  /**
   * @param {Pubkey} nonce_pubkey
   * @param {Pubkey} authorized_pubkey
   * @param {Pubkey} to_pubkey
   * @param {bigint} lamports
   * @returns {Instruction}
   */
  static withdrawNonceAccount(
    nonce_pubkey,
    authorized_pubkey,
    to_pubkey,
    lamports
  ) {
    _assertClass(nonce_pubkey, Pubkey);
    _assertClass(authorized_pubkey, Pubkey);
    _assertClass(to_pubkey, Pubkey);
    uint64CvtShim[0] = lamports;
    const low0 = u32CvtShim[0];
    const high0 = u32CvtShim[1];
    const ret = wasm.systeminstruction_withdrawNonceAccount(
      nonce_pubkey.ptr,
      authorized_pubkey.ptr,
      to_pubkey.ptr,
      low0,
      high0
    );
    return Instruction.__wrap(ret);
  }
  /**
   * @param {Pubkey} nonce_pubkey
   * @param {Pubkey} authorized_pubkey
   * @param {Pubkey} new_authority
   * @returns {Instruction}
   */
  static authorizeNonceAccount(nonce_pubkey, authorized_pubkey, new_authority) {
    _assertClass(nonce_pubkey, Pubkey);
    _assertClass(authorized_pubkey, Pubkey);
    _assertClass(new_authority, Pubkey);
    const ret = wasm.systeminstruction_authorizeNonceAccount(
      nonce_pubkey.ptr,
      authorized_pubkey.ptr,
      new_authority.ptr
    );
    return Instruction.__wrap(ret);
  }
}
/**
 * An atomically-commited sequence of instructions.
 *
 * While [`Instruction`]s are the basic unit of computation in Solana,
 * they are submitted by clients in [`Transaction`]s containing one or
 * more instructions, and signed by one or more [`Signer`]s.
 *
 * [`Signer`]: crate::signer::Signer
 *
 * See the [module documentation] for more details about transactions.
 *
 * [module documentation]: self
 *
 * Some constructors accept an optional `payer`, the account responsible for
 * paying the cost of executing a transaction. In most cases, callers should
 * specify the payer explicitly in these constructors. In some cases though,
 * the caller is not _required_ to specify the payer, but is still allowed to:
 * in the [`Message`] structure, the first account is always the fee-payer, so
 * if the caller has knowledge that the first account of the constructed
 * transaction's `Message` is both a signer and the expected fee-payer, then
 * redundantly specifying the fee-payer is not strictly required.
 */
export class Transaction {
  static __wrap(ptr) {
    const obj = Object.create(Transaction.prototype);
    obj.ptr = ptr;

    return obj;
  }

  __destroy_into_raw() {
    const ptr = this.ptr;
    this.ptr = 0;

    return ptr;
  }

  free() {
    const ptr = this.__destroy_into_raw();
    wasm.__wbg_transaction_free(ptr);
  }
  /**
   * Create a new `Transaction`
   * @param {Instructions} instructions
   * @param {Pubkey | undefined} payer
   */
  constructor(instructions, payer) {
    _assertClass(instructions, Instructions);
    var ptr0 = instructions.ptr;
    instructions.ptr = 0;
    let ptr1 = 0;
    if (!isLikeNone(payer)) {
      _assertClass(payer, Pubkey);
      ptr1 = payer.ptr;
      payer.ptr = 0;
    }
    const ret = wasm.transaction_constructor(ptr0, ptr1);
    return Transaction.__wrap(ret);
  }
  /**
   * Return a message containing all data that should be signed.
   * @returns {Message}
   */
  message() {
    const ret = wasm.transaction_message(this.ptr);
    return Message.__wrap(ret);
  }
  /**
   * Return the serialized message data to sign.
   * @returns {Uint8Array}
   */
  messageData() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.transaction_messageData(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * Verify the transaction
   */
  verify() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.transaction_verify(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      if (r1) {
        throw takeObject(r0);
      }
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * @param {Keypair} keypair
   * @param {Hash} recent_blockhash
   */
  partialSign(keypair, recent_blockhash) {
    _assertClass(keypair, Keypair);
    _assertClass(recent_blockhash, Hash);
    wasm.transaction_partialSign(this.ptr, keypair.ptr, recent_blockhash.ptr);
  }
  /**
   * @returns {boolean}
   */
  isSigned() {
    const ret = wasm.transaction_isSigned(this.ptr);
    return ret !== 0;
  }
  /**
   * @returns {Uint8Array}
   */
  toBytes() {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      wasm.transaction_toBytes(retptr, this.ptr);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var v0 = getArrayU8FromWasm0(r0, r1).slice();
      wasm.__wbindgen_free(r0, r1 * 1);
      return v0;
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
  /**
   * @param {Uint8Array} bytes
   * @returns {Transaction}
   */
  static fromBytes(bytes) {
    try {
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
      const ptr0 = passArray8ToWasm0(bytes, wasm.__wbindgen_malloc);
      const len0 = WASM_VECTOR_LEN;
      wasm.transaction_fromBytes(retptr, ptr0, len0);
      var r0 = getInt32Memory0()[retptr / 4 + 0];
      var r1 = getInt32Memory0()[retptr / 4 + 1];
      var r2 = getInt32Memory0()[retptr / 4 + 2];
      if (r2) {
        throw takeObject(r1);
      }
      return Transaction.__wrap(r0);
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16);
    }
  }
}

export function __wbindgen_object_drop_ref(arg0) {
  takeObject(arg0);
}

export function __wbindgen_cb_drop(arg0) {
  const obj = takeObject(arg0).original;
  if (obj.cnt-- == 1) {
    obj.a = 0;
    return true;
  }
  const ret = false;
  return ret;
}

export function __wbg_logWasm_208b10e41a09513a(arg0, arg1) {
  PgTerminal.logWasm(getStringFromWasm0(arg0, arg1));
}

export function __wbg_enable_c9d669d6f28c1311() {
  PgTerminal.enable();
}

export function __wbindgen_string_new(arg0, arg1) {
  const ret = getStringFromWasm0(arg0, arg1);
  return addHeapObject(ret);
}

export function __wbg_fetch_b1379d93c1e2b015(arg0) {
  const ret = fetch(getObject(arg0));
  return addHeapObject(ret);
}

export function __wbindgen_object_clone_ref(arg0) {
  const ret = getObject(arg0);
  return addHeapObject(ret);
}

export function __wbg_instruction_new(arg0) {
  const ret = Instruction.__wrap(arg0);
  return addHeapObject(ret);
}

export function __wbg_pubkey_new(arg0) {
  const ret = Pubkey.__wrap(arg0);
  return addHeapObject(ret);
}

export function __wbindgen_number_new(arg0) {
  const ret = arg0;
  return addHeapObject(ret);
}

export function __wbindgen_string_get(arg0, arg1) {
  const obj = getObject(arg1);
  const ret = typeof obj === "string" ? obj : undefined;
  var ptr0 = isLikeNone(ret)
    ? 0
    : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}

export function __wbindgen_is_undefined(arg0) {
  const ret = getObject(arg0) === undefined;
  return ret;
}

export function __wbindgen_number_get(arg0, arg1) {
  const obj = getObject(arg1);
  const ret = typeof obj === "number" ? obj : undefined;
  getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
  getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
}

export function __wbg_new_693216e109162396() {
  const ret = new Error();
  return addHeapObject(ret);
}

export function __wbg_stack_0ddaca5d1abfb52f(arg0, arg1) {
  const ret = getObject(arg1).stack;
  const ptr0 = passStringToWasm0(
    ret,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc
  );
  const len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}

export function __wbg_error_09919627ac0992f5(arg0, arg1) {
  try {
    console.error(getStringFromWasm0(arg0, arg1));
  } finally {
    wasm.__wbindgen_free(arg0, arg1);
  }
}

export function __wbg_randomFillSync_d2ba53160aec6aba(arg0, arg1, arg2) {
  getObject(arg0).randomFillSync(getArrayU8FromWasm0(arg1, arg2));
}

export function __wbg_getRandomValues_e57c9b75ddead065(arg0, arg1) {
  getObject(arg0).getRandomValues(getObject(arg1));
}

export function __wbg_self_86b4b13392c7af56() {
  return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_crypto_b8c92eaac23d0d80(arg0) {
  const ret = getObject(arg0).crypto;
  return addHeapObject(ret);
}

export function __wbg_msCrypto_9ad6677321a08dd8(arg0) {
  const ret = getObject(arg0).msCrypto;
  return addHeapObject(ret);
}

export function __wbg_static_accessor_MODULE_452b4680e8614c81() {
  const ret = module;
  return addHeapObject(ret);
}

export function __wbg_require_f5521a5b85ad2542(arg0, arg1, arg2) {
  const ret = getObject(arg0).require(getStringFromWasm0(arg1, arg2));
  return addHeapObject(ret);
}

export function __wbg_getRandomValues_dd27e6b0652b3236(arg0) {
  const ret = getObject(arg0).getRandomValues;
  return addHeapObject(ret);
}

export function __wbg_instanceof_Window_a2a08d3918d7d4d0(arg0) {
  const ret = getObject(arg0) instanceof Window;
  return ret;
}

export function __wbg_performance_37cd292e310dcf1d(arg0) {
  const ret = getObject(arg0).performance;
  return isLikeNone(ret) ? 0 : addHeapObject(ret);
}

export function __wbg_setTimeout_7d328aba48109be9() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).setTimeout(getObject(arg1), arg2);
    return ret;
  }, arguments);
}

export function __wbg_debug_68178c61250ae699(arg0) {
  console.debug(getObject(arg0));
}

export function __wbg_error_e2677af4c7f31a14(arg0) {
  console.error(getObject(arg0));
}

export function __wbg_info_2fe3b57d78190c6d(arg0) {
  console.info(getObject(arg0));
}

export function __wbg_log_7761a8b8a8c1864e(arg0) {
  console.log(getObject(arg0));
}

export function __wbg_warn_8b29c6b80217b0e4(arg0) {
  console.warn(getObject(arg0));
}

export function __wbg_new_483f23f84dfd2751() {
  return handleError(function () {
    const ret = new Headers();
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_append_fcf64231455390c4() {
  return handleError(function (arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).append(
      getStringFromWasm0(arg1, arg2),
      getStringFromWasm0(arg3, arg4)
    );
  }, arguments);
}

export function __wbg_fetch_8c28485eb2d6317d(arg0, arg1) {
  const ret = getObject(arg0).fetch(getObject(arg1));
  return addHeapObject(ret);
}

export function __wbg_instanceof_Response_e928c54c1025470c(arg0) {
  const ret = getObject(arg0) instanceof Response;
  return ret;
}

export function __wbg_url_0f82030e7245954c(arg0, arg1) {
  const ret = getObject(arg1).url;
  const ptr0 = passStringToWasm0(
    ret,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc
  );
  const len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}

export function __wbg_status_5b4a574de7c5bbfe(arg0) {
  const ret = getObject(arg0).status;
  return ret;
}

export function __wbg_headers_1dc1ef92ba3d32b1(arg0) {
  const ret = getObject(arg0).headers;
  return addHeapObject(ret);
}

export function __wbg_arrayBuffer_9c26a73988618f92() {
  return handleError(function (arg0) {
    const ret = getObject(arg0).arrayBuffer();
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_now_9c64828adecad05e(arg0) {
  const ret = getObject(arg0).now();
  return ret;
}

export function __wbg_newwithstrandinit_41c86e821f771b24() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_new_2ab697f1555e0dbc() {
  const ret = new Array();
  return addHeapObject(ret);
}

export function __wbindgen_is_function(arg0) {
  const ret = typeof getObject(arg0) === "function";
  return ret;
}

export function __wbg_newnoargs_fc5356289219b93b(arg0, arg1) {
  const ret = new Function(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
}

export function __wbindgen_is_object(arg0) {
  const val = getObject(arg0);
  const ret = typeof val === "object" && val !== null;
  return ret;
}

export function __wbg_next_0e1ee6203bc0f8ed(arg0) {
  const ret = getObject(arg0).next;
  return addHeapObject(ret);
}

export function __wbg_next_9ef803116340cdc1() {
  return handleError(function (arg0) {
    const ret = getObject(arg0).next();
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_done_2a1e30464aae6a4d(arg0) {
  const ret = getObject(arg0).done;
  return ret;
}

export function __wbg_value_a495c29471c31da6(arg0) {
  const ret = getObject(arg0).value;
  return addHeapObject(ret);
}

export function __wbg_iterator_6ac6eb1e020f18e3() {
  const ret = Symbol.iterator;
  return addHeapObject(ret);
}

export function __wbg_get_89247d3aeaa38cc5() {
  return handleError(function (arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_call_4573f605ca4b5f10() {
  return handleError(function (arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_new_306ce8d57919e6ae() {
  const ret = new Object();
  return addHeapObject(ret);
}

export function __wbg_self_ba1ddafe9ea7a3a2() {
  return handleError(function () {
    const ret = self.self;
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_window_be3cc430364fd32c() {
  return handleError(function () {
    const ret = window.window;
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_globalThis_56d9c9f814daeeee() {
  return handleError(function () {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_global_8c35aeee4ac77f2b() {
  return handleError(function () {
    const ret = global.global;
    return addHeapObject(ret);
  }, arguments);
}

export function __wbg_newwithlength_51bd08aed34ec6a3(arg0) {
  const ret = new Array(arg0 >>> 0);
  return addHeapObject(ret);
}

export function __wbg_set_c1d04f8b45a036e7(arg0, arg1, arg2) {
  getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
}

export function __wbg_isArray_628aca8c24017cde(arg0) {
  const ret = Array.isArray(getObject(arg0));
  return ret;
}

export function __wbg_push_811c8b08bf4ff9d5(arg0, arg1) {
  const ret = getObject(arg0).push(getObject(arg1));
  return ret;
}

export function __wbg_values_644ed6c9e45c1e38(arg0) {
  const ret = getObject(arg0).values();
  return addHeapObject(ret);
}

export function __wbg_resolve_f269ce174f88b294(arg0) {
  const ret = Promise.resolve(getObject(arg0));
  return addHeapObject(ret);
}

export function __wbg_then_1c698eedca15eed6(arg0, arg1) {
  const ret = getObject(arg0).then(getObject(arg1));
  return addHeapObject(ret);
}

export function __wbg_then_4debc41d4fc92ce5(arg0, arg1, arg2) {
  const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
  return addHeapObject(ret);
}

export function __wbg_buffer_de1150f91b23aa89(arg0) {
  const ret = getObject(arg0).buffer;
  return addHeapObject(ret);
}

export function __wbg_newwithbyteoffsetandlength_9ca61320599a2c84(
  arg0,
  arg1,
  arg2
) {
  const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
}

export function __wbg_new_97cf52648830a70d(arg0) {
  const ret = new Uint8Array(getObject(arg0));
  return addHeapObject(ret);
}

export function __wbg_set_a0172b213e2469e9(arg0, arg1, arg2) {
  getObject(arg0).set(getObject(arg1), arg2 >>> 0);
}

export function __wbg_length_e09c0b925ab8de5d(arg0) {
  const ret = getObject(arg0).length;
  return ret;
}

export function __wbg_instanceof_Uint8Array_fd17ec67c77de602(arg0) {
  const ret = getObject(arg0) instanceof Uint8Array;
  return ret;
}

export function __wbg_newwithlength_e833b89f9db02732(arg0) {
  const ret = new Uint8Array(arg0 >>> 0);
  return addHeapObject(ret);
}

export function __wbg_subarray_9482ae5cd5cd99d3(arg0, arg1, arg2) {
  const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
}

export function __wbg_has_ded5f0e31f1ff6ad() {
  return handleError(function (arg0, arg1) {
    const ret = Reflect.has(getObject(arg0), getObject(arg1));
    return ret;
  }, arguments);
}

export function __wbg_set_b12cd0ab82903c2f() {
  return handleError(function (arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
  }, arguments);
}

export function __wbg_stringify_cf20dc96bee34a66() {
  return handleError(function (arg0) {
    const ret = JSON.stringify(getObject(arg0));
    return addHeapObject(ret);
  }, arguments);
}

export function __wbindgen_debug_string(arg0, arg1) {
  const ret = debugString(getObject(arg1));
  const ptr0 = passStringToWasm0(
    ret,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc
  );
  const len0 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len0;
  getInt32Memory0()[arg0 / 4 + 0] = ptr0;
}

export function __wbindgen_throw(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
}

export function __wbindgen_memory() {
  const ret = wasm.memory;
  return addHeapObject(ret);
}

export function __wbindgen_closure_wrapper1267(arg0, arg1, arg2) {
  const ret = makeMutClosure(arg0, arg1, 377, __wbg_adapter_28);
  return addHeapObject(ret);
}

export function __wbindgen_closure_wrapper1461(arg0, arg1, arg2) {
  const ret = makeMutClosure(arg0, arg1, 456, __wbg_adapter_31);
  return addHeapObject(ret);
}

cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
