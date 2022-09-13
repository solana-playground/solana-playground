/* tslint:disable */
import * as wasm from './rustfmt_wasm_bg';

let cachedTextDecoder = new TextDecoder('utf-8');

let cachegetUint8Memory = null;
function getUint8Memory() {
    if (cachegetUint8Memory === null || cachegetUint8Memory.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory;
}

function getStringFromWasm(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory().subarray(ptr, ptr + len));
}

export function __wbg_error_cc95a3d302735ca3(arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1);

    varg0 = varg0.slice();
    wasm.__wbindgen_free(arg0, arg1 * 1);

    console.error(varg0);
}

let cachedTextEncoder = new TextEncoder('utf-8');

let WASM_VECTOR_LEN = 0;

function passStringToWasm(arg) {

    const buf = cachedTextEncoder.encode(arg);
    const ptr = wasm.__wbindgen_malloc(buf.length);
    getUint8Memory().set(buf, ptr);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
}
/**
* @param {string} arg0
* @returns {RustfmtResult}
*/
export function rustfmt(arg0) {
    const ptr0 = passStringToWasm(arg0);
    const len0 = WASM_VECTOR_LEN;
    try {
        return RustfmtResult.__wrap(wasm.rustfmt(ptr0, len0));

    } finally {
        wasm.__wbindgen_free(ptr0, len0 * 1);

    }

}

let cachedGlobalArgumentPtr = null;
function globalArgumentPtr() {
    if (cachedGlobalArgumentPtr === null) {
        cachedGlobalArgumentPtr = wasm.__wbindgen_global_argument_ptr();
    }
    return cachedGlobalArgumentPtr;
}

let cachegetUint32Memory = null;
function getUint32Memory() {
    if (cachegetUint32Memory === null || cachegetUint32Memory.buffer !== wasm.memory.buffer) {
        cachegetUint32Memory = new Uint32Array(wasm.memory.buffer);
    }
    return cachegetUint32Memory;
}

function freeRustfmtResult(ptr) {

    wasm.__wbg_rustfmtresult_free(ptr);
}
/**
*/
export class RustfmtResult {

    static __wrap(ptr) {
        const obj = Object.create(RustfmtResult.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;
        freeRustfmtResult(ptr);
    }

    /**
    * @returns {string}
    */
    code() {
        const ptr = this.ptr;
        this.ptr = 0;
        const retptr = globalArgumentPtr();
        wasm.rustfmtresult_code(retptr, ptr);
        const mem = getUint32Memory();
        const rustptr = mem[retptr / 4];
        const rustlen = mem[retptr / 4 + 1];

        const realRet = getStringFromWasm(rustptr, rustlen).slice();
        wasm.__wbindgen_free(rustptr, rustlen * 1);
        return realRet;

    }
    /**
    * @returns {string}
    */
    error() {
        const retptr = globalArgumentPtr();
        wasm.rustfmtresult_error(retptr, this.ptr);
        const mem = getUint32Memory();
        const rustptr = mem[retptr / 4];
        const rustlen = mem[retptr / 4 + 1];
        if (rustptr === 0) return;
        const realRet = getStringFromWasm(rustptr, rustlen).slice();
        wasm.__wbindgen_free(rustptr, rustlen * 1);
        return realRet;

    }
}

export function __wbindgen_throw(ptr, len) {
    throw new Error(getStringFromWasm(ptr, len));
}

