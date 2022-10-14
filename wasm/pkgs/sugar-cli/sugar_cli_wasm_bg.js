import { PgSugar } from '/src/utils/pg/extensions/sugar/sugar.ts';
import { PgTerminal } from '/src/utils/pg/terminal/terminal.ts';
import * as wasm from './sugar_cli_wasm_bg.wasm';

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

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

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
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
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

let WASM_VECTOR_LEN = 0;

let cachedUint8Memory0;
function getUint8Memory0() {
    if (cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedInt32Memory0;
function getInt32Memory0() {
    if (cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
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

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}
function __wbg_adapter_10(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h90fed9905d39ff2f(arg0, arg1, addHeapObject(arg2));
}

/**
* @param {string} cmd
* @returns {Promise<void>}
*/
export function runSugar(cmd) {
    const ptr0 = passStringToWasm0(cmd, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.runSugar(ptr0, len0);
    return takeObject(ret);
}

const u32CvtShim = new Uint32Array(2);

const uint64CvtShim = new BigUint64Array(u32CvtShim.buffer);

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_54(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h1b4f977bdd4a6a93(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_cb_drop(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbg_bundlr_60c9c738b15ac9b8(arg0, arg1, arg2) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.bundlr(v0, arg2);
    return addHeapObject(ret);
};

export function __wbg_collectionSet_e63ad951c632557e(arg0, arg1, arg2, arg3, arg4, arg5) {
    try {
        let v0;
        if (arg0 !== 0) {
            v0 = getStringFromWasm0(arg0, arg1).slice();
            wasm.__wbindgen_free(arg0, arg1 * 1);
        }
        let v1;
        if (arg2 !== 0) {
            v1 = getStringFromWasm0(arg2, arg3).slice();
            wasm.__wbindgen_free(arg2, arg3 * 1);
        }
        const ret = PgSugar.collectionSet(v0, v1, getStringFromWasm0(arg4, arg5));
        return addHeapObject(ret);
    } finally {
        wasm.__wbindgen_free(arg4, arg5);
    }
};

export function __wbg_createConfig_8b8d067206a41e76(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.createConfig(v0);
    return addHeapObject(ret);
};

export function __wbg_deploy_02e04cc4cb28c426(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.deploy(v0);
    return addHeapObject(ret);
};

export function __wbg_guardAdd_758ee826f0c1b5bf(arg0, arg1, arg2, arg3, arg4, arg5) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1);
    }
    let v2;
    if (arg4 !== 0) {
        v2 = getStringFromWasm0(arg4, arg5).slice();
        wasm.__wbindgen_free(arg4, arg5 * 1);
    }
    const ret = PgSugar.guardAdd(v0, v1, v2);
    return addHeapObject(ret);
};

export function __wbg_guardRemove_e5bdb238f6e91b65(arg0, arg1, arg2, arg3, arg4, arg5) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1);
    }
    let v2;
    if (arg4 !== 0) {
        v2 = getStringFromWasm0(arg4, arg5).slice();
        wasm.__wbindgen_free(arg4, arg5 * 1);
    }
    const ret = PgSugar.guardRemove(v0, v1, v2);
    return addHeapObject(ret);
};

export function __wbg_guardShow_8598cc7634ab4a66(arg0, arg1, arg2, arg3) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1);
    }
    const ret = PgSugar.guardShow(v0, v1);
    return addHeapObject(ret);
};

export function __wbg_guardUpdate_dbdd7facd1ec2a44(arg0, arg1, arg2, arg3) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1);
    }
    const ret = PgSugar.guardUpdate(v0, v1);
    return addHeapObject(ret);
};

export function __wbg_guardWithdraw_6d2fc48e05980bbc(arg0, arg1, arg2, arg3) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1);
    }
    const ret = PgSugar.guardWithdraw(v0, v1);
    return addHeapObject(ret);
};

export function __wbg_hash_3aa60e250cbd2c7a(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.hash(v0);
    return addHeapObject(ret);
};

export function __wbg_launch_422fba51200f13ab(arg0, arg1, arg2, arg3) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.launch(v0, arg2 !== 0, arg3 !== 0);
    return addHeapObject(ret);
};

export function __wbg_mint_a73d3c9c391e1414(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    u32CvtShim[0] = arg3;
    u32CvtShim[1] = arg4;
    const n1 = arg2 === 0 ? undefined : uint64CvtShim[0];
    let v2;
    if (arg5 !== 0) {
        v2 = getStringFromWasm0(arg5, arg6).slice();
        wasm.__wbindgen_free(arg5, arg6 * 1);
    }
    let v3;
    if (arg7 !== 0) {
        v3 = getStringFromWasm0(arg7, arg8).slice();
        wasm.__wbindgen_free(arg7, arg8 * 1);
    }
    const ret = PgSugar.mint(v0, n1, v2, v3);
    return addHeapObject(ret);
};

export function __wbg_reveal_8c56c68c61bf33ae(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.reveal(v0);
    return addHeapObject(ret);
};

export function __wbg_show_d67c349fd7dc542a(arg0, arg1, arg2, arg3, arg4) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1);
    }
    const ret = PgSugar.show(v0, v1, arg4 !== 0);
    return addHeapObject(ret);
};

export function __wbg_sign_fcb8014354d3aa0e(arg0, arg1, arg2, arg3, arg4, arg5) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1);
    }
    let v2;
    if (arg4 !== 0) {
        v2 = getStringFromWasm0(arg4, arg5).slice();
        wasm.__wbindgen_free(arg4, arg5 * 1);
    }
    const ret = PgSugar.sign(v0, v1, v2);
    return addHeapObject(ret);
};

export function __wbg_update_e3bdfab719414de6(arg0, arg1, arg2, arg3, arg4, arg5) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1);
    }
    let v2;
    if (arg4 !== 0) {
        v2 = getStringFromWasm0(arg4, arg5).slice();
        wasm.__wbindgen_free(arg4, arg5 * 1);
    }
    const ret = PgSugar.update(v0, v1, v2);
    return addHeapObject(ret);
};

export function __wbg_upload_f3d664cd9980fb8f(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.upload(v0);
    return addHeapObject(ret);
};

export function __wbg_validate_2ef96db434bb7344(arg0, arg1) {
    const ret = PgSugar.validate(arg0 !== 0, arg1 !== 0);
    return addHeapObject(ret);
};

export function __wbg_verify_9af2f77f95541d06(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.verify(v0);
    return addHeapObject(ret);
};

export function __wbg_withdraw_70a7b2b61de2c302(arg0, arg1, arg2, arg3, arg4) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    let v1;
    if (arg2 !== 0) {
        v1 = getStringFromWasm0(arg2, arg3).slice();
        wasm.__wbindgen_free(arg2, arg3 * 1);
    }
    const ret = PgSugar.withdraw(v0, v1, arg4 !== 0);
    return addHeapObject(ret);
};

export function __wbg_call_9855a4612eb496cb() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_78403b138428b684(arg0, arg1) {
    try {
        var state0 = {a: arg0, b: arg1};
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_54(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_resolve_f269ce174f88b294(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_then_1c698eedca15eed6(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_then_4debc41d4fc92ce5(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_logWasm_208b10e41a09513a(arg0, arg1) {
    PgTerminal.logWasm(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr0 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len0;
    getInt32Memory0()[arg0 / 4 + 0] = ptr0;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_closure_wrapper142(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 50, __wbg_adapter_10);
    return addHeapObject(ret);
};

cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);

