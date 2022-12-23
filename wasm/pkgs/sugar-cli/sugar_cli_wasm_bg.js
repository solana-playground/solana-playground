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

let cachedUint8Memory0 = new Uint8Array();

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

let cachedInt32Memory0 = new Int32Array();

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
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hdf2e71bc9ad4bcad(arg0, arg1, addHeapObject(arg2));
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

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}
function __wbg_adapter_54(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h60c5f9a99ff7dd07(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
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

export function __wbg_verify_9089475857b1d13c(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.verify(v0);
    return addHeapObject(ret);
};

export function __wbg_upload_44d98b84403442f1(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.upload(v0);
    return addHeapObject(ret);
};

export function __wbg_update_4b1ab31e3d21e7d6(arg0, arg1, arg2, arg3, arg4, arg5) {
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

export function __wbg_sign_e4b73b426e404a3a(arg0, arg1, arg2, arg3, arg4, arg5) {
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

export function __wbg_reveal_f3199522141592c1(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.reveal(v0);
    return addHeapObject(ret);
};

export function __wbg_hash_79a2e0f685c0bd48(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.hash(v0);
    return addHeapObject(ret);
};

export function __wbg_deploy_c0955afb678cb4b0(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.deploy(v0);
    return addHeapObject(ret);
};

export function __wbg_createConfig_793f3e9bdacb9789(arg0, arg1) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.createConfig(v0);
    return addHeapObject(ret);
};

export function __wbg_collectionSet_7279a12e5327293d(arg0, arg1, arg2, arg3, arg4, arg5) {
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

export function __wbg_bundlr_2d4e9a8005a6ba88(arg0, arg1, arg2) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.bundlr(v0, arg2);
    return addHeapObject(ret);
};

export function __wbg_guardAdd_7f9def5691ffacdc(arg0, arg1, arg2, arg3, arg4, arg5) {
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

export function __wbg_guardRemove_5b089e23b0bdddb9(arg0, arg1, arg2, arg3, arg4, arg5) {
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

export function __wbg_guardShow_36b8a185b9bb8589(arg0, arg1, arg2, arg3) {
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

export function __wbg_guardUpdate_227f098341f7b0c2(arg0, arg1, arg2, arg3) {
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

export function __wbg_guardWithdraw_c52b313e0b823f88(arg0, arg1, arg2, arg3) {
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

export function __wbg_launch_6aca47fbab7bca26(arg0, arg1, arg2, arg3) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    const ret = PgSugar.launch(v0, arg2 !== 0, arg3 !== 0);
    return addHeapObject(ret);
};

export function __wbg_mint_cd02ab2a2be62d39(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
    let v0;
    if (arg0 !== 0) {
        v0 = getStringFromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1);
    }
    let v1;
    if (arg4 !== 0) {
        v1 = getStringFromWasm0(arg4, arg5).slice();
        wasm.__wbindgen_free(arg4, arg5 * 1);
    }
    let v2;
    if (arg6 !== 0) {
        v2 = getStringFromWasm0(arg6, arg7).slice();
        wasm.__wbindgen_free(arg6, arg7 * 1);
    }
    const ret = PgSugar.mint(v0, arg2 === 0 ? undefined : BigInt.asUintN(64, arg3), v1, v2);
    return addHeapObject(ret);
};

export function __wbg_show_07323b6bd4d69f27(arg0, arg1, arg2, arg3, arg4) {
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

export function __wbg_validate_dad9bcb3abd69673(arg0, arg1) {
    const ret = PgSugar.validate(arg0 !== 0, arg1 !== 0);
    return addHeapObject(ret);
};

export function __wbg_withdraw_a24e387e3067d021(arg0, arg1, arg2, arg3, arg4) {
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

export function __wbg_call_168da88779e35f61() { return handleError(function (arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
}, arguments) };

export function __wbg_new_9962f939219f1820(arg0, arg1) {
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

export function __wbg_resolve_99fe17964f31ffc0(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_then_11f7a54d67b4bfad(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_then_cedad20fbbd9418a(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_logWasm_fd8b6abd7c1de98a(arg0, arg1) {
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

export function __wbindgen_closure_wrapper150(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 56, __wbg_adapter_10);
    return addHeapObject(ret);
};

