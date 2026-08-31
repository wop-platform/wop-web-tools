// GENERATED FILE. DO NOT EDIT.
(function (global, factory) {
  function preferDefault(exports) {
    return exports.default || exports;
  }
  if (typeof define === "function" && define.amd) {
    define(["@noble/hashes/hkdf"], function (_hkdf) {
      var exports = {};
      factory(exports, _hkdf);
      return preferDefault(exports);
    });
  } else if (typeof exports === "object") {
    factory(exports, require("@noble/hashes/hkdf"));
    if (typeof module === "object") module.exports = preferDefault(exports);
  } else {
    (function () {
      var exports = {};
      factory(exports, global.hkdf);
      global.SmCryptoV2 = preferDefault(exports);
    })();
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _hkdf) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.hkdf = hkdf;
  _exports.kdf = kdf;
  _exports.sm2 = void 0;
  _exports.sm3 = sm32;
  _exports.sm4 = void 0;
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, {
    enumerable: true,
    configurable: true,
    writable: true,
    value
  }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all) __defProp(target, name, {
      get: all[name],
      enumerable: true
    });
  };
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // src/sm2/index.ts
  var sm2_exports = _exports.sm2 = {};
  __export(sm2_exports, {
    EmptyArray: () => EmptyArray,
    arrayToHex: () => arrayToHex,
    arrayToUtf8: () => arrayToUtf8,
    calculateSharedKey: () => calculateSharedKey,
    comparePublicKeyHex: () => comparePublicKeyHex,
    compressPublicKeyHex: () => compressPublicKeyHex,
    doDecrypt: () => doDecrypt,
    doEncrypt: () => doEncrypt,
    doSignature: () => doSignature,
    doVerifySignature: () => doVerifySignature,
    ecdh: () => getSharedSecret,
    generateKeyPairHex: () => generateKeyPairHex,
    getHash: () => getHash,
    getPoint: () => getPoint,
    getPublicKeyFromPrivateKey: () => getPublicKeyFromPrivateKey,
    getZ: () => getZ,
    hexToArray: () => hexToArray,
    initRNGPool: () => initRNGPool,
    leftPad: () => leftPad,
    precomputePublicKey: () => precomputePublicKey,
    utf8ToHex: () => utf8ToHex,
    verifyPublicKey: () => verifyPublicKey
  });

  // node_modules/.pnpm/@noble+curves@1.1.0/node_modules/@noble/curves/esm/abstract/utils.js
  var utils_exports = {};
  __export(utils_exports, {
    bitGet: () => bitGet,
    bitLen: () => bitLen,
    bitMask: () => bitMask,
    bitSet: () => bitSet,
    bytesToHex: () => bytesToHex,
    bytesToNumberBE: () => bytesToNumberBE,
    bytesToNumberLE: () => bytesToNumberLE,
    concatBytes: () => concatBytes,
    createHmacDrbg: () => createHmacDrbg,
    ensureBytes: () => ensureBytes,
    equalBytes: () => equalBytes,
    hexToBytes: () => hexToBytes,
    hexToNumber: () => hexToNumber,
    numberToBytesBE: () => numberToBytesBE,
    numberToBytesLE: () => numberToBytesLE,
    numberToHexUnpadded: () => numberToHexUnpadded,
    numberToVarBytesBE: () => numberToVarBytesBE,
    utf8ToBytes: () => utf8ToBytes,
    validateObject: () => validateObject
  });
  var _0n = BigInt(0);
  var _1n = BigInt(1);
  var _2n = BigInt(2);
  var u8a = a => a instanceof Uint8Array;
  var hexes = Array.from({
    length: 256
  }, (v, i) => i.toString(16).padStart(2, "0"));
  function bytesToHex(bytes) {
    if (!u8a(bytes)) throw new Error("Uint8Array expected");
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += hexes[bytes[i]];
    }
    return hex;
  }
  function numberToHexUnpadded(num) {
    const hex = num.toString(16);
    return hex.length & 1 ? `0${hex}` : hex;
  }
  function hexToNumber(hex) {
    if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
    return BigInt(hex === "" ? "0" : `0x${hex}`);
  }
  function hexToBytes(hex) {
    if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
    const len = hex.length;
    if (len % 2) throw new Error("padded hex string expected, got unpadded hex of length " + len);
    const array = new Uint8Array(len / 2);
    for (let i = 0; i < array.length; i++) {
      const j = i * 2;
      const hexByte = hex.slice(j, j + 2);
      const byte = Number.parseInt(hexByte, 16);
      if (Number.isNaN(byte) || byte < 0) throw new Error("Invalid byte sequence");
      array[i] = byte;
    }
    return array;
  }
  function bytesToNumberBE(bytes) {
    return hexToNumber(bytesToHex(bytes));
  }
  function bytesToNumberLE(bytes) {
    if (!u8a(bytes)) throw new Error("Uint8Array expected");
    return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
  }
  function numberToBytesBE(n, len) {
    return hexToBytes(n.toString(16).padStart(len * 2, "0"));
  }
  function numberToBytesLE(n, len) {
    return numberToBytesBE(n, len).reverse();
  }
  function numberToVarBytesBE(n) {
    return hexToBytes(numberToHexUnpadded(n));
  }
  function ensureBytes(title, hex, expectedLength) {
    let res;
    if (typeof hex === "string") {
      try {
        res = hexToBytes(hex);
      } catch (e) {
        throw new Error(`${title} must be valid hex string, got "${hex}". Cause: ${e}`);
      }
    } else if (u8a(hex)) {
      res = Uint8Array.from(hex);
    } else {
      throw new Error(`${title} must be hex string or Uint8Array`);
    }
    const len = res.length;
    if (typeof expectedLength === "number" && len !== expectedLength) throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`);
    return res;
  }
  function concatBytes(...arrays) {
    const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
    let pad = 0;
    arrays.forEach(a => {
      if (!u8a(a)) throw new Error("Uint8Array expected");
      r.set(a, pad);
      pad += a.length;
    });
    return r;
  }
  function equalBytes(b1, b2) {
    if (b1.length !== b2.length) return false;
    for (let i = 0; i < b1.length; i++) if (b1[i] !== b2[i]) return false;
    return true;
  }
  function utf8ToBytes(str) {
    if (typeof str !== "string") throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
    return new Uint8Array(new TextEncoder().encode(str));
  }
  function bitLen(n) {
    let len;
    for (len = 0; n > _0n; n >>= _1n, len += 1);
    return len;
  }
  function bitGet(n, pos) {
    return n >> BigInt(pos) & _1n;
  }
  var bitSet = (n, pos, value) => {
    return n | (value ? _1n : _0n) << BigInt(pos);
  };
  var bitMask = n => (_2n << BigInt(n - 1)) - _1n;
  var u8n = data => new Uint8Array(data);
  var u8fr = arr => Uint8Array.from(arr);
  function createHmacDrbg(hashLen, qByteLen, hmacFn) {
    if (typeof hashLen !== "number" || hashLen < 2) throw new Error("hashLen must be a number");
    if (typeof qByteLen !== "number" || qByteLen < 2) throw new Error("qByteLen must be a number");
    if (typeof hmacFn !== "function") throw new Error("hmacFn must be a function");
    let v = u8n(hashLen);
    let k = u8n(hashLen);
    let i = 0;
    const reset = () => {
      v.fill(1);
      k.fill(0);
      i = 0;
    };
    const h = (...b) => hmacFn(k, v, ...b);
    const reseed = (seed = u8n()) => {
      k = h(u8fr([0]), seed);
      v = h();
      if (seed.length === 0) return;
      k = h(u8fr([1]), seed);
      v = h();
    };
    const gen = () => {
      if (i++ >= 1e3) throw new Error("drbg: tried 1000 values");
      let len = 0;
      const out = [];
      while (len < qByteLen) {
        v = h();
        const sl = v.slice();
        out.push(sl);
        len += v.length;
      }
      return concatBytes(...out);
    };
    const genUntil = (seed, pred) => {
      reset();
      reseed(seed);
      let res = void 0;
      while (!(res = pred(gen()))) reseed();
      reset();
      return res;
    };
    return genUntil;
  }
  var validatorFns = {
    bigint: val => typeof val === "bigint",
    function: val => typeof val === "function",
    boolean: val => typeof val === "boolean",
    string: val => typeof val === "string",
    isSafeInteger: val => Number.isSafeInteger(val),
    array: val => Array.isArray(val),
    field: (val, object) => object.Fp.isValid(val),
    hash: val => typeof val === "function" && Number.isSafeInteger(val.outputLen)
  };
  function validateObject(object, validators, optValidators = {}) {
    const checkField = (fieldName, type, isOptional) => {
      const checkVal = validatorFns[type];
      if (typeof checkVal !== "function") throw new Error(`Invalid validator "${type}", expected function`);
      const val = object[fieldName];
      if (isOptional && val === void 0) return;
      if (!checkVal(val, object)) {
        throw new Error(`Invalid param ${String(fieldName)}=${val} (${typeof val}), expected ${type}`);
      }
    };
    for (const [fieldName, type] of Object.entries(validators)) checkField(fieldName, type, false);
    for (const [fieldName, type] of Object.entries(optValidators)) checkField(fieldName, type, true);
    return object;
  }

  // src/sm2/bn.ts
  var ZERO = BigInt(0);
  var ONE = BigInt(1);
  var TWO = BigInt(2);
  var THREE = BigInt(3);

  // src/sm2/asn1.ts
  function bigintToValue(bigint) {
    let h = bigint.toString(16);
    if (h[0] !== "-") {
      if (h.length % 2 === 1) h = "0" + h;else if (!h.match(/^[0-7]/)) h = "00" + h;
    } else {
      h = h.substring(1);
      let len = h.length;
      if (len % 2 === 1) len += 1;else if (!h.match(/^[0-7]/)) len += 2;
      let maskString = "";
      for (let i = 0; i < len; i++) maskString += "f";
      let mask = hexToNumber(maskString);
      let output = (mask ^ bigint) + ONE;
      h = output.toString(16).replace(/^-/, "");
    }
    return h;
  }
  var ASN1Object = class {
    constructor(tlv = null, t = "00", l = "00", v = "") {
      this.tlv = tlv;
      this.t = t;
      this.l = l;
      this.v = v;
    }
    /**
     * 获取 der 编码比特流16进制串
     */
    getEncodedHex() {
      if (!this.tlv) {
        this.v = this.getValue();
        this.l = this.getLength();
        this.tlv = this.t + this.l + this.v;
      }
      return this.tlv;
    }
    getLength() {
      const n = this.v.length / 2;
      let nHex = n.toString(16);
      if (nHex.length % 2 === 1) nHex = "0" + nHex;
      if (n < 128) {
        return nHex;
      } else {
        const head = 128 + nHex.length / 2;
        return head.toString(16) + nHex;
      }
    }
    getValue() {
      return "";
    }
  };
  var DERInteger = class extends ASN1Object {
    constructor(bigint) {
      super();
      this.t = "02";
      if (bigint) this.v = bigintToValue(bigint);
    }
    getValue() {
      return this.v;
    }
  };
  var DEROctetString = class extends ASN1Object {
    constructor(s) {
      super();
      this.s = s;
      __publicField(this, "hV", "");
      this.t = "04";
      if (s) this.v = s.toLowerCase();
    }
    getValue() {
      return this.v;
    }
  };
  var DERSequence = class extends ASN1Object {
    constructor(asn1Array) {
      super();
      this.asn1Array = asn1Array;
      __publicField(this, "t", "30");
    }
    getValue() {
      this.v = this.asn1Array.map(asn1Object => asn1Object.getEncodedHex()).join("");
      return this.v;
    }
  };
  function getLenOfL(str, start) {
    if (+str[start + 2] < 8) return 1;
    const encoded = str.slice(start + 2, start + 6);
    const headHex = encoded.slice(0, 2);
    const head = parseInt(headHex, 16);
    const nHexLength = 1 + (head - 128);
    return nHexLength;
  }
  function getL(str, start) {
    const len = getLenOfL(str, start);
    const l = str.substring(start + 2, start + 2 + len * 2);
    if (!l) return -1;
    const bigint = +l[0] < 8 ? hexToNumber(l) : hexToNumber(l.substring(2));
    return +bigint.toString();
  }
  function getStartOfV(str, start) {
    const len = getLenOfL(str, start);
    return start + (len + 1) * 2;
  }
  function encodeDer(r, s) {
    const derR = new DERInteger(r);
    const derS = new DERInteger(s);
    const derSeq = new DERSequence([derR, derS]);
    return derSeq.getEncodedHex();
  }
  function encodeEnc(x2, y, hash, cipher) {
    const derX = new DERInteger(x2);
    const derY = new DERInteger(y);
    const derHash = new DEROctetString(hash);
    const derCipher = new DEROctetString(cipher);
    const derSeq = new DERSequence([derX, derY, derHash, derCipher]);
    return derSeq.getEncodedHex();
  }
  function decodeDer(input) {
    const start = getStartOfV(input, 0);
    const vIndexR = getStartOfV(input, start);
    const lR = getL(input, start);
    const vR = input.substring(vIndexR, vIndexR + lR * 2);
    const nextStart = vIndexR + vR.length;
    const vIndexS = getStartOfV(input, nextStart);
    const lS = getL(input, nextStart);
    const vS = input.substring(vIndexS, vIndexS + lS * 2);
    const r = hexToNumber(vR);
    const s = hexToNumber(vS);
    return {
      r,
      s
    };
  }
  function decodeEnc(input) {
    function extractSequence(input2, start2) {
      const vIndex = getStartOfV(input2, start2);
      const length = getL(input2, start2);
      const value = input2.substring(vIndex, vIndex + length * 2);
      const nextStart = vIndex + value.length;
      return {
        value,
        nextStart
      };
    }
    const start = getStartOfV(input, 0);
    const {
      value: vR,
      nextStart: startS
    } = extractSequence(input, start);
    const {
      value: vS,
      nextStart: startHash
    } = extractSequence(input, startS);
    const {
      value: hash,
      nextStart: startCipher
    } = extractSequence(input, startHash);
    const {
      value: cipher
    } = extractSequence(input, startCipher);
    const x2 = hexToNumber(vR);
    const y = hexToNumber(vS);
    return {
      x: x2,
      y,
      hash,
      cipher
    };
  }

  // node_modules/.pnpm/@noble+curves@1.1.0/node_modules/@noble/curves/esm/abstract/modular.js
  var _0n2 = BigInt(0);
  var _1n2 = BigInt(1);
  var _2n2 = BigInt(2);
  var _3n = BigInt(3);
  var _4n = BigInt(4);
  var _5n = BigInt(5);
  var _8n = BigInt(8);
  var _9n = BigInt(9);
  var _16n = BigInt(16);
  function mod(a, b) {
    const result = a % b;
    return result >= _0n2 ? result : b + result;
  }
  function pow(num, power, modulo) {
    if (modulo <= _0n2 || power < _0n2) throw new Error("Expected power/modulo > 0");
    if (modulo === _1n2) return _0n2;
    let res = _1n2;
    while (power > _0n2) {
      if (power & _1n2) res = res * num % modulo;
      num = num * num % modulo;
      power >>= _1n2;
    }
    return res;
  }
  function invert(number, modulo) {
    if (number === _0n2 || modulo <= _0n2) {
      throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
    }
    let a = mod(number, modulo);
    let b = modulo;
    let x2 = _0n2,
      y = _1n2,
      u = _1n2,
      v = _0n2;
    while (a !== _0n2) {
      const q = b / a;
      const r = b % a;
      const m = x2 - u * q;
      const n = y - v * q;
      b = a, a = r, x2 = u, y = v, u = m, v = n;
    }
    const gcd = b;
    if (gcd !== _1n2) throw new Error("invert: does not exist");
    return mod(x2, modulo);
  }
  function tonelliShanks(P) {
    const legendreC = (P - _1n2) / _2n2;
    let Q, S, Z;
    for (Q = P - _1n2, S = 0; Q % _2n2 === _0n2; Q /= _2n2, S++);
    for (Z = _2n2; Z < P && pow(Z, legendreC, P) !== P - _1n2; Z++);
    if (S === 1) {
      const p1div4 = (P + _1n2) / _4n;
      return function tonelliFast(Fp, n) {
        const root = Fp.pow(n, p1div4);
        if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
        return root;
      };
    }
    const Q1div2 = (Q + _1n2) / _2n2;
    return function tonelliSlow(Fp, n) {
      if (Fp.pow(n, legendreC) === Fp.neg(Fp.ONE)) throw new Error("Cannot find square root");
      let r = S;
      let g = Fp.pow(Fp.mul(Fp.ONE, Z), Q);
      let x2 = Fp.pow(n, Q1div2);
      let b = Fp.pow(n, Q);
      while (!Fp.eql(b, Fp.ONE)) {
        if (Fp.eql(b, Fp.ZERO)) return Fp.ZERO;
        let m = 1;
        for (let t2 = Fp.sqr(b); m < r; m++) {
          if (Fp.eql(t2, Fp.ONE)) break;
          t2 = Fp.sqr(t2);
        }
        const ge = Fp.pow(g, _1n2 << BigInt(r - m - 1));
        g = Fp.sqr(ge);
        x2 = Fp.mul(x2, ge);
        b = Fp.mul(b, g);
        r = m;
      }
      return x2;
    };
  }
  function FpSqrt(P) {
    if (P % _4n === _3n) {
      const p1div4 = (P + _1n2) / _4n;
      return function sqrt3mod4(Fp, n) {
        const root = Fp.pow(n, p1div4);
        if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
        return root;
      };
    }
    if (P % _8n === _5n) {
      const c1 = (P - _5n) / _8n;
      return function sqrt5mod8(Fp, n) {
        const n2 = Fp.mul(n, _2n2);
        const v = Fp.pow(n2, c1);
        const nv = Fp.mul(n, v);
        const i = Fp.mul(Fp.mul(nv, _2n2), v);
        const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
        if (!Fp.eql(Fp.sqr(root), n)) throw new Error("Cannot find square root");
        return root;
      };
    }
    if (P % _16n === _9n) {}
    return tonelliShanks(P);
  }
  var FIELD_FIELDS = ["create", "isValid", "is0", "neg", "inv", "sqrt", "sqr", "eql", "add", "sub", "mul", "pow", "div", "addN", "subN", "mulN", "sqrN"];
  function validateField(field2) {
    const initial = {
      ORDER: "bigint",
      MASK: "bigint",
      BYTES: "isSafeInteger",
      BITS: "isSafeInteger"
    };
    const opts = FIELD_FIELDS.reduce((map, val) => {
      map[val] = "function";
      return map;
    }, initial);
    return validateObject(field2, opts);
  }
  function FpPow(f, num, power) {
    if (power < _0n2) throw new Error("Expected power > 0");
    if (power === _0n2) return f.ONE;
    if (power === _1n2) return num;
    let p = f.ONE;
    let d = num;
    while (power > _0n2) {
      if (power & _1n2) p = f.mul(p, d);
      d = f.sqr(d);
      power >>= _1n2;
    }
    return p;
  }
  function FpInvertBatch(f, nums) {
    const tmp2 = new Array(nums.length);
    const lastMultiplied = nums.reduce((acc, num, i) => {
      if (f.is0(num)) return acc;
      tmp2[i] = acc;
      return f.mul(acc, num);
    }, f.ONE);
    const inverted = f.inv(lastMultiplied);
    nums.reduceRight((acc, num, i) => {
      if (f.is0(num)) return acc;
      tmp2[i] = f.mul(acc, tmp2[i]);
      return f.mul(acc, num);
    }, inverted);
    return tmp2;
  }
  function nLength(n, nBitLength) {
    const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
    const nByteLength = Math.ceil(_nBitLength / 8);
    return {
      nBitLength: _nBitLength,
      nByteLength
    };
  }
  function Field(ORDER, bitLen2, isLE3 = false, redef = {}) {
    if (ORDER <= _0n2) throw new Error(`Expected Fp ORDER > 0, got ${ORDER}`);
    const {
      nBitLength: BITS,
      nByteLength: BYTES
    } = nLength(ORDER, bitLen2);
    if (BYTES > 2048) throw new Error("Field lengths over 2048 bytes are not supported");
    const sqrtP = FpSqrt(ORDER);
    const f = Object.freeze({
      ORDER,
      BITS,
      BYTES,
      MASK: bitMask(BITS),
      ZERO: _0n2,
      ONE: _1n2,
      create: num => mod(num, ORDER),
      isValid: num => {
        if (typeof num !== "bigint") throw new Error(`Invalid field element: expected bigint, got ${typeof num}`);
        return _0n2 <= num && num < ORDER;
      },
      is0: num => num === _0n2,
      isOdd: num => (num & _1n2) === _1n2,
      neg: num => mod(-num, ORDER),
      eql: (lhs, rhs) => lhs === rhs,
      sqr: num => mod(num * num, ORDER),
      add: (lhs, rhs) => mod(lhs + rhs, ORDER),
      sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
      mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
      pow: (num, power) => FpPow(f, num, power),
      div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
      // Same as above, but doesn't normalize
      sqrN: num => num * num,
      addN: (lhs, rhs) => lhs + rhs,
      subN: (lhs, rhs) => lhs - rhs,
      mulN: (lhs, rhs) => lhs * rhs,
      inv: num => invert(num, ORDER),
      sqrt: redef.sqrt || (n => sqrtP(f, n)),
      invertBatch: lst => FpInvertBatch(f, lst),
      // TODO: do we really need constant cmov?
      // We don't have const-time bigints anyway, so probably will be not very useful
      cmov: (a, b, c) => c ? b : a,
      toBytes: num => isLE3 ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES),
      fromBytes: bytes => {
        if (bytes.length !== BYTES) throw new Error(`Fp.fromBytes: expected ${BYTES}, got ${bytes.length}`);
        return isLE3 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
      }
    });
    return Object.freeze(f);
  }
  function hashToPrivateScalar(hash, groupOrder, isLE3 = false) {
    hash = ensureBytes("privateHash", hash);
    const hashLen = hash.length;
    const minLen = nLength(groupOrder).nByteLength + 8;
    if (minLen < 24 || hashLen < minLen || hashLen > 1024) throw new Error(`hashToPrivateScalar: expected ${minLen}-1024 bytes of input, got ${hashLen}`);
    const num = isLE3 ? bytesToNumberLE(hash) : bytesToNumberBE(hash);
    return mod(num, groupOrder - _1n2) + _1n2;
  }

  // node_modules/.pnpm/@noble+curves@1.1.0/node_modules/@noble/curves/esm/abstract/curve.js
  var _0n3 = BigInt(0);
  var _1n3 = BigInt(1);
  function wNAF(c, bits) {
    const constTimeNegate = (condition, item) => {
      const neg = item.negate();
      return condition ? neg : item;
    };
    const opts = W => {
      const windows = Math.ceil(bits / W) + 1;
      const windowSize = 2 ** (W - 1);
      return {
        windows,
        windowSize
      };
    };
    return {
      constTimeNegate,
      // non-const time multiplication ladder
      unsafeLadder(elm, n) {
        let p = c.ZERO;
        let d = elm;
        while (n > _0n3) {
          if (n & _1n3) p = p.add(d);
          d = d.double();
          n >>= _1n3;
        }
        return p;
      },
      /**
       * Creates a wNAF precomputation window. Used for caching.
       * Default window size is set by `utils.precompute()` and is equal to 8.
       * Number of precomputed points depends on the curve size:
       * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
       * - 𝑊 is the window size
       * - 𝑛 is the bitlength of the curve order.
       * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
       * @returns precomputed point tables flattened to a single array
       */
      precomputeWindow(elm, W) {
        const {
          windows,
          windowSize
        } = opts(W);
        const points = [];
        let p = elm;
        let base = p;
        for (let window = 0; window < windows; window++) {
          base = p;
          points.push(base);
          for (let i = 1; i < windowSize; i++) {
            base = base.add(p);
            points.push(base);
          }
          p = base.double();
        }
        return points;
      },
      /**
       * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
       * @param W window size
       * @param precomputes precomputed tables
       * @param n scalar (we don't check here, but should be less than curve order)
       * @returns real and fake (for const-time) points
       */
      wNAF(W, precomputes, n) {
        const {
          windows,
          windowSize
        } = opts(W);
        let p = c.ZERO;
        let f = c.BASE;
        const mask = BigInt(2 ** W - 1);
        const maxNumber = 2 ** W;
        const shiftBy = BigInt(W);
        for (let window = 0; window < windows; window++) {
          const offset = window * windowSize;
          let wbits = Number(n & mask);
          n >>= shiftBy;
          if (wbits > windowSize) {
            wbits -= maxNumber;
            n += _1n3;
          }
          const offset1 = offset;
          const offset2 = offset + Math.abs(wbits) - 1;
          const cond1 = window % 2 !== 0;
          const cond2 = wbits < 0;
          if (wbits === 0) {
            f = f.add(constTimeNegate(cond1, precomputes[offset1]));
          } else {
            p = p.add(constTimeNegate(cond2, precomputes[offset2]));
          }
        }
        return {
          p,
          f
        };
      },
      wNAFCached(P, precomputesMap, n, transform) {
        const W = P._WINDOW_SIZE || 1;
        let comp = precomputesMap.get(P);
        if (!comp) {
          comp = this.precomputeWindow(P, W);
          if (W !== 1) {
            precomputesMap.set(P, transform(comp));
          }
        }
        return this.wNAF(W, comp, n);
      }
    };
  }
  function validateBasic(curve) {
    validateField(curve.Fp);
    validateObject(curve, {
      n: "bigint",
      h: "bigint",
      Gx: "field",
      Gy: "field"
    }, {
      nBitLength: "isSafeInteger",
      nByteLength: "isSafeInteger"
    });
    return Object.freeze({
      ...nLength(curve.n, curve.nBitLength),
      ...curve,
      ...{
        p: curve.Fp.ORDER
      }
    });
  }

  // node_modules/.pnpm/@noble+curves@1.1.0/node_modules/@noble/curves/esm/abstract/weierstrass.js
  function validatePointOpts(curve) {
    const opts = validateBasic(curve);
    validateObject(opts, {
      a: "field",
      b: "field"
    }, {
      allowedPrivateKeyLengths: "array",
      wrapPrivateKey: "boolean",
      isTorsionFree: "function",
      clearCofactor: "function",
      allowInfinityPoint: "boolean",
      fromBytes: "function",
      toBytes: "function"
    });
    const {
      endo,
      Fp,
      a
    } = opts;
    if (endo) {
      if (!Fp.eql(a, Fp.ZERO)) {
        throw new Error("Endomorphism can only be defined for Koblitz curves that have a=0");
      }
      if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") {
        throw new Error("Expected endomorphism with beta: bigint and splitScalar: function");
      }
    }
    return Object.freeze({
      ...opts
    });
  }
  var {
    bytesToNumberBE: b2n,
    hexToBytes: h2b
  } = utils_exports;
  var DER = {
    // asn.1 DER encoding utils
    Err: class DERErr extends Error {
      constructor(m = "") {
        super(m);
      }
    },
    _parseInt(data) {
      const {
        Err: E
      } = DER;
      if (data.length < 2 || data[0] !== 2) throw new E("Invalid signature integer tag");
      const len = data[1];
      const res = data.subarray(2, len + 2);
      if (!len || res.length !== len) throw new E("Invalid signature integer: wrong length");
      if (res[0] & 128) throw new E("Invalid signature integer: negative");
      if (res[0] === 0 && !(res[1] & 128)) throw new E("Invalid signature integer: unnecessary leading zero");
      return {
        d: b2n(res),
        l: data.subarray(len + 2)
      };
    },
    toSig(hex) {
      const {
        Err: E
      } = DER;
      const data = typeof hex === "string" ? h2b(hex) : hex;
      if (!(data instanceof Uint8Array)) throw new Error("ui8a expected");
      let l = data.length;
      if (l < 2 || data[0] != 48) throw new E("Invalid signature tag");
      if (data[1] !== l - 2) throw new E("Invalid signature: incorrect length");
      const {
        d: r,
        l: sBytes
      } = DER._parseInt(data.subarray(2));
      const {
        d: s,
        l: rBytesLeft
      } = DER._parseInt(sBytes);
      if (rBytesLeft.length) throw new E("Invalid signature: left bytes after parsing");
      return {
        r,
        s
      };
    },
    hexFromSig(sig) {
      const slice = s2 => Number.parseInt(s2[0], 16) & 8 ? "00" + s2 : s2;
      const h = num => {
        const hex = num.toString(16);
        return hex.length & 1 ? `0${hex}` : hex;
      };
      const s = slice(h(sig.s));
      const r = slice(h(sig.r));
      const shl = s.length / 2;
      const rhl = r.length / 2;
      const sl = h(shl);
      const rl = h(rhl);
      return `30${h(rhl + shl + 4)}02${rl}${r}02${sl}${s}`;
    }
  };
  var _0n4 = BigInt(0);
  var _1n4 = BigInt(1);
  var _2n3 = BigInt(2);
  var _3n2 = BigInt(3);
  var _4n2 = BigInt(4);
  function weierstrassPoints(opts) {
    const CURVE = validatePointOpts(opts);
    const {
      Fp
    } = CURVE;
    const toBytes3 = CURVE.toBytes || ((c, point, isCompressed) => {
      const a = point.toAffine();
      return concatBytes(Uint8Array.from([4]), Fp.toBytes(a.x), Fp.toBytes(a.y));
    });
    const fromBytes = CURVE.fromBytes || (bytes => {
      const tail = bytes.subarray(1);
      const x2 = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
      const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
      return {
        x: x2,
        y
      };
    });
    function weierstrassEquation(x2) {
      const {
        a,
        b
      } = CURVE;
      const x22 = Fp.sqr(x2);
      const x3 = Fp.mul(x22, x2);
      return Fp.add(Fp.add(x3, Fp.mul(x2, a)), b);
    }
    if (!Fp.eql(Fp.sqr(CURVE.Gy), weierstrassEquation(CURVE.Gx))) throw new Error("bad generator point: equation left != right");
    function isWithinCurveOrder(num) {
      return typeof num === "bigint" && _0n4 < num && num < CURVE.n;
    }
    function assertGE(num) {
      if (!isWithinCurveOrder(num)) throw new Error("Expected valid bigint: 0 < bigint < curve.n");
    }
    function normPrivateKeyToScalar(key) {
      const {
        allowedPrivateKeyLengths: lengths,
        nByteLength,
        wrapPrivateKey,
        n
      } = CURVE;
      if (lengths && typeof key !== "bigint") {
        if (key instanceof Uint8Array) key = bytesToHex(key);
        if (typeof key !== "string" || !lengths.includes(key.length)) throw new Error("Invalid key");
        key = key.padStart(nByteLength * 2, "0");
      }
      let num;
      try {
        num = typeof key === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
      } catch (error) {
        throw new Error(`private key must be ${nByteLength} bytes, hex or bigint, not ${typeof key}`);
      }
      if (wrapPrivateKey) num = mod(num, n);
      assertGE(num);
      return num;
    }
    const pointPrecomputes = /* @__PURE__ */new Map();
    function assertPrjPoint(other) {
      if (!(other instanceof Point)) throw new Error("ProjectivePoint expected");
    }
    class Point {
      constructor(px, py, pz) {
        this.px = px;
        this.py = py;
        this.pz = pz;
        if (px == null || !Fp.isValid(px)) throw new Error("x required");
        if (py == null || !Fp.isValid(py)) throw new Error("y required");
        if (pz == null || !Fp.isValid(pz)) throw new Error("z required");
      }
      // Does not validate if the point is on-curve.
      // Use fromHex instead, or call assertValidity() later.
      static fromAffine(p) {
        const {
          x: x2,
          y
        } = p || {};
        if (!p || !Fp.isValid(x2) || !Fp.isValid(y)) throw new Error("invalid affine point");
        if (p instanceof Point) throw new Error("projective point not allowed");
        const is0 = i => Fp.eql(i, Fp.ZERO);
        if (is0(x2) && is0(y)) return Point.ZERO;
        return new Point(x2, y, Fp.ONE);
      }
      get x() {
        return this.toAffine().x;
      }
      get y() {
        return this.toAffine().y;
      }
      /**
       * Takes a bunch of Projective Points but executes only one
       * inversion on all of them. Inversion is very slow operation,
       * so this improves performance massively.
       * Optimization: converts a list of projective points to a list of identical points with Z=1.
       */
      static normalizeZ(points) {
        const toInv = Fp.invertBatch(points.map(p => p.pz));
        return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
      }
      /**
       * Converts hash string or Uint8Array to Point.
       * @param hex short/long ECDSA hex
       */
      static fromHex(hex) {
        const P = Point.fromAffine(fromBytes(ensureBytes("pointHex", hex)));
        P.assertValidity();
        return P;
      }
      // Multiplies generator point by privateKey.
      static fromPrivateKey(privateKey) {
        return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
      }
      // "Private method", don't use it directly
      _setWindowSize(windowSize) {
        this._WINDOW_SIZE = windowSize;
        pointPrecomputes.delete(this);
      }
      // A point on curve is valid if it conforms to equation.
      assertValidity() {
        if (this.is0()) {
          if (CURVE.allowInfinityPoint) return;
          throw new Error("bad point: ZERO");
        }
        const {
          x: x2,
          y
        } = this.toAffine();
        if (!Fp.isValid(x2) || !Fp.isValid(y)) throw new Error("bad point: x or y not FE");
        const left = Fp.sqr(y);
        const right = weierstrassEquation(x2);
        if (!Fp.eql(left, right)) throw new Error("bad point: equation left != right");
        if (!this.isTorsionFree()) throw new Error("bad point: not in prime-order subgroup");
      }
      hasEvenY() {
        const {
          y
        } = this.toAffine();
        if (Fp.isOdd) return !Fp.isOdd(y);
        throw new Error("Field doesn't support isOdd");
      }
      /**
       * Compare one point to another.
       */
      equals(other) {
        assertPrjPoint(other);
        const {
          px: X1,
          py: Y1,
          pz: Z1
        } = this;
        const {
          px: X2,
          py: Y2,
          pz: Z2
        } = other;
        const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
        const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
        return U1 && U2;
      }
      /**
       * Flips point to one corresponding to (x, -y) in Affine coordinates.
       */
      negate() {
        return new Point(this.px, Fp.neg(this.py), this.pz);
      }
      // Renes-Costello-Batina exception-free doubling formula.
      // There is 30% faster Jacobian formula, but it is not complete.
      // https://eprint.iacr.org/2015/1060, algorithm 3
      // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
      double() {
        const {
          a,
          b
        } = CURVE;
        const b3 = Fp.mul(b, _3n2);
        const {
          px: X1,
          py: Y1,
          pz: Z1
        } = this;
        let X3 = Fp.ZERO,
          Y3 = Fp.ZERO,
          Z3 = Fp.ZERO;
        let t0 = Fp.mul(X1, X1);
        let t1 = Fp.mul(Y1, Y1);
        let t2 = Fp.mul(Z1, Z1);
        let t3 = Fp.mul(X1, Y1);
        t3 = Fp.add(t3, t3);
        Z3 = Fp.mul(X1, Z1);
        Z3 = Fp.add(Z3, Z3);
        X3 = Fp.mul(a, Z3);
        Y3 = Fp.mul(b3, t2);
        Y3 = Fp.add(X3, Y3);
        X3 = Fp.sub(t1, Y3);
        Y3 = Fp.add(t1, Y3);
        Y3 = Fp.mul(X3, Y3);
        X3 = Fp.mul(t3, X3);
        Z3 = Fp.mul(b3, Z3);
        t2 = Fp.mul(a, t2);
        t3 = Fp.sub(t0, t2);
        t3 = Fp.mul(a, t3);
        t3 = Fp.add(t3, Z3);
        Z3 = Fp.add(t0, t0);
        t0 = Fp.add(Z3, t0);
        t0 = Fp.add(t0, t2);
        t0 = Fp.mul(t0, t3);
        Y3 = Fp.add(Y3, t0);
        t2 = Fp.mul(Y1, Z1);
        t2 = Fp.add(t2, t2);
        t0 = Fp.mul(t2, t3);
        X3 = Fp.sub(X3, t0);
        Z3 = Fp.mul(t2, t1);
        Z3 = Fp.add(Z3, Z3);
        Z3 = Fp.add(Z3, Z3);
        return new Point(X3, Y3, Z3);
      }
      // Renes-Costello-Batina exception-free addition formula.
      // There is 30% faster Jacobian formula, but it is not complete.
      // https://eprint.iacr.org/2015/1060, algorithm 1
      // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
      add(other) {
        assertPrjPoint(other);
        const {
          px: X1,
          py: Y1,
          pz: Z1
        } = this;
        const {
          px: X2,
          py: Y2,
          pz: Z2
        } = other;
        let X3 = Fp.ZERO,
          Y3 = Fp.ZERO,
          Z3 = Fp.ZERO;
        const a = CURVE.a;
        const b3 = Fp.mul(CURVE.b, _3n2);
        let t0 = Fp.mul(X1, X2);
        let t1 = Fp.mul(Y1, Y2);
        let t2 = Fp.mul(Z1, Z2);
        let t3 = Fp.add(X1, Y1);
        let t4 = Fp.add(X2, Y2);
        t3 = Fp.mul(t3, t4);
        t4 = Fp.add(t0, t1);
        t3 = Fp.sub(t3, t4);
        t4 = Fp.add(X1, Z1);
        let t5 = Fp.add(X2, Z2);
        t4 = Fp.mul(t4, t5);
        t5 = Fp.add(t0, t2);
        t4 = Fp.sub(t4, t5);
        t5 = Fp.add(Y1, Z1);
        X3 = Fp.add(Y2, Z2);
        t5 = Fp.mul(t5, X3);
        X3 = Fp.add(t1, t2);
        t5 = Fp.sub(t5, X3);
        Z3 = Fp.mul(a, t4);
        X3 = Fp.mul(b3, t2);
        Z3 = Fp.add(X3, Z3);
        X3 = Fp.sub(t1, Z3);
        Z3 = Fp.add(t1, Z3);
        Y3 = Fp.mul(X3, Z3);
        t1 = Fp.add(t0, t0);
        t1 = Fp.add(t1, t0);
        t2 = Fp.mul(a, t2);
        t4 = Fp.mul(b3, t4);
        t1 = Fp.add(t1, t2);
        t2 = Fp.sub(t0, t2);
        t2 = Fp.mul(a, t2);
        t4 = Fp.add(t4, t2);
        t0 = Fp.mul(t1, t4);
        Y3 = Fp.add(Y3, t0);
        t0 = Fp.mul(t5, t4);
        X3 = Fp.mul(t3, X3);
        X3 = Fp.sub(X3, t0);
        t0 = Fp.mul(t3, t1);
        Z3 = Fp.mul(t5, Z3);
        Z3 = Fp.add(Z3, t0);
        return new Point(X3, Y3, Z3);
      }
      subtract(other) {
        return this.add(other.negate());
      }
      is0() {
        return this.equals(Point.ZERO);
      }
      wNAF(n) {
        return wnaf.wNAFCached(this, pointPrecomputes, n, comp => {
          const toInv = Fp.invertBatch(comp.map(p => p.pz));
          return comp.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
        });
      }
      /**
       * Non-constant-time multiplication. Uses double-and-add algorithm.
       * It's faster, but should only be used when you don't care about
       * an exposed private key e.g. sig verification, which works over *public* keys.
       */
      multiplyUnsafe(n) {
        const I = Point.ZERO;
        if (n === _0n4) return I;
        assertGE(n);
        if (n === _1n4) return this;
        const {
          endo
        } = CURVE;
        if (!endo) return wnaf.unsafeLadder(this, n);
        let {
          k1neg,
          k1,
          k2neg,
          k2
        } = endo.splitScalar(n);
        let k1p = I;
        let k2p = I;
        let d = this;
        while (k1 > _0n4 || k2 > _0n4) {
          if (k1 & _1n4) k1p = k1p.add(d);
          if (k2 & _1n4) k2p = k2p.add(d);
          d = d.double();
          k1 >>= _1n4;
          k2 >>= _1n4;
        }
        if (k1neg) k1p = k1p.negate();
        if (k2neg) k2p = k2p.negate();
        k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
        return k1p.add(k2p);
      }
      /**
       * Constant time multiplication.
       * Uses wNAF method. Windowed method may be 10% faster,
       * but takes 2x longer to generate and consumes 2x memory.
       * Uses precomputes when available.
       * Uses endomorphism for Koblitz curves.
       * @param scalar by which the point would be multiplied
       * @returns New point
       */
      multiply(scalar) {
        assertGE(scalar);
        let n = scalar;
        let point, fake;
        const {
          endo
        } = CURVE;
        if (endo) {
          const {
            k1neg,
            k1,
            k2neg,
            k2
          } = endo.splitScalar(n);
          let {
            p: k1p,
            f: f1p
          } = this.wNAF(k1);
          let {
            p: k2p,
            f: f2p
          } = this.wNAF(k2);
          k1p = wnaf.constTimeNegate(k1neg, k1p);
          k2p = wnaf.constTimeNegate(k2neg, k2p);
          k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
          point = k1p.add(k2p);
          fake = f1p.add(f2p);
        } else {
          const {
            p,
            f
          } = this.wNAF(n);
          point = p;
          fake = f;
        }
        return Point.normalizeZ([point, fake])[0];
      }
      /**
       * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
       * Not using Strauss-Shamir trick: precomputation tables are faster.
       * The trick could be useful if both P and Q are not G (not in our case).
       * @returns non-zero affine point
       */
      multiplyAndAddUnsafe(Q, a, b) {
        const G = Point.BASE;
        const mul = (P, a2) => a2 === _0n4 || a2 === _1n4 || !P.equals(G) ? P.multiplyUnsafe(a2) : P.multiply(a2);
        const sum = mul(this, a).add(mul(Q, b));
        return sum.is0() ? void 0 : sum;
      }
      // Converts Projective point to affine (x, y) coordinates.
      // Can accept precomputed Z^-1 - for example, from invertBatch.
      // (x, y, z) ∋ (x=x/z, y=y/z)
      toAffine(iz) {
        const {
          px: x2,
          py: y,
          pz: z
        } = this;
        const is0 = this.is0();
        if (iz == null) iz = is0 ? Fp.ONE : Fp.inv(z);
        const ax = Fp.mul(x2, iz);
        const ay = Fp.mul(y, iz);
        const zz = Fp.mul(z, iz);
        if (is0) return {
          x: Fp.ZERO,
          y: Fp.ZERO
        };
        if (!Fp.eql(zz, Fp.ONE)) throw new Error("invZ was invalid");
        return {
          x: ax,
          y: ay
        };
      }
      isTorsionFree() {
        const {
          h: cofactor,
          isTorsionFree
        } = CURVE;
        if (cofactor === _1n4) return true;
        if (isTorsionFree) return isTorsionFree(Point, this);
        throw new Error("isTorsionFree() has not been declared for the elliptic curve");
      }
      clearCofactor() {
        const {
          h: cofactor,
          clearCofactor
        } = CURVE;
        if (cofactor === _1n4) return this;
        if (clearCofactor) return clearCofactor(Point, this);
        return this.multiplyUnsafe(CURVE.h);
      }
      toRawBytes(isCompressed = true) {
        this.assertValidity();
        return toBytes3(Point, this, isCompressed);
      }
      toHex(isCompressed = true) {
        return bytesToHex(this.toRawBytes(isCompressed));
      }
    }
    Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
    Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
    const _bits = CURVE.nBitLength;
    const wnaf = wNAF(Point, CURVE.endo ? Math.ceil(_bits / 2) : _bits);
    return {
      CURVE,
      ProjectivePoint: Point,
      normPrivateKeyToScalar,
      weierstrassEquation,
      isWithinCurveOrder
    };
  }
  function validateOpts(curve) {
    const opts = validateBasic(curve);
    validateObject(opts, {
      hash: "hash",
      hmac: "function",
      randomBytes: "function"
    }, {
      bits2int: "function",
      bits2int_modN: "function",
      lowS: "boolean"
    });
    return Object.freeze({
      lowS: true,
      ...opts
    });
  }
  function weierstrass(curveDef) {
    const CURVE = validateOpts(curveDef);
    const {
      Fp,
      n: CURVE_ORDER
    } = CURVE;
    const compressedLen = Fp.BYTES + 1;
    const uncompressedLen = 2 * Fp.BYTES + 1;
    function isValidFieldElement(num) {
      return _0n4 < num && num < Fp.ORDER;
    }
    function modN(a) {
      return mod(a, CURVE_ORDER);
    }
    function invN(a) {
      return invert(a, CURVE_ORDER);
    }
    const {
      ProjectivePoint: Point,
      normPrivateKeyToScalar,
      weierstrassEquation,
      isWithinCurveOrder
    } = weierstrassPoints({
      ...CURVE,
      toBytes(c, point, isCompressed) {
        const a = point.toAffine();
        const x2 = Fp.toBytes(a.x);
        const cat = concatBytes;
        if (isCompressed) {
          return cat(Uint8Array.from([point.hasEvenY() ? 2 : 3]), x2);
        } else {
          return cat(Uint8Array.from([4]), x2, Fp.toBytes(a.y));
        }
      },
      fromBytes(bytes) {
        const len = bytes.length;
        const head = bytes[0];
        const tail = bytes.subarray(1);
        if (len === compressedLen && (head === 2 || head === 3)) {
          const x2 = bytesToNumberBE(tail);
          if (!isValidFieldElement(x2)) throw new Error("Point is not on curve");
          const y2 = weierstrassEquation(x2);
          let y = Fp.sqrt(y2);
          const isYOdd = (y & _1n4) === _1n4;
          const isHeadOdd = (head & 1) === 1;
          if (isHeadOdd !== isYOdd) y = Fp.neg(y);
          return {
            x: x2,
            y
          };
        } else if (len === uncompressedLen && head === 4) {
          const x2 = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
          const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
          return {
            x: x2,
            y
          };
        } else {
          throw new Error(`Point of length ${len} was invalid. Expected ${compressedLen} compressed bytes or ${uncompressedLen} uncompressed bytes`);
        }
      }
    });
    const numToNByteStr = num => bytesToHex(numberToBytesBE(num, CURVE.nByteLength));
    function isBiggerThanHalfOrder(number) {
      const HALF = CURVE_ORDER >> _1n4;
      return number > HALF;
    }
    function normalizeS(s) {
      return isBiggerThanHalfOrder(s) ? modN(-s) : s;
    }
    const slcNum = (b, from, to) => bytesToNumberBE(b.slice(from, to));
    class Signature {
      constructor(r, s, recovery) {
        this.r = r;
        this.s = s;
        this.recovery = recovery;
        this.assertValidity();
      }
      // pair (bytes of r, bytes of s)
      static fromCompact(hex) {
        const l = CURVE.nByteLength;
        hex = ensureBytes("compactSignature", hex, l * 2);
        return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
      }
      // DER encoded ECDSA signature
      // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
      static fromDER(hex) {
        const {
          r,
          s
        } = DER.toSig(ensureBytes("DER", hex));
        return new Signature(r, s);
      }
      assertValidity() {
        if (!isWithinCurveOrder(this.r)) throw new Error("r must be 0 < r < CURVE.n");
        if (!isWithinCurveOrder(this.s)) throw new Error("s must be 0 < s < CURVE.n");
      }
      addRecoveryBit(recovery) {
        return new Signature(this.r, this.s, recovery);
      }
      recoverPublicKey(msgHash) {
        const {
          r,
          s,
          recovery: rec
        } = this;
        const h = bits2int_modN(ensureBytes("msgHash", msgHash));
        if (rec == null || ![0, 1, 2, 3].includes(rec)) throw new Error("recovery id invalid");
        const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
        if (radj >= Fp.ORDER) throw new Error("recovery id 2 or 3 invalid");
        const prefix = (rec & 1) === 0 ? "02" : "03";
        const R = Point.fromHex(prefix + numToNByteStr(radj));
        const ir = invN(radj);
        const u1 = modN(-h * ir);
        const u2 = modN(s * ir);
        const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2);
        if (!Q) throw new Error("point at infinify");
        Q.assertValidity();
        return Q;
      }
      // Signatures should be low-s, to prevent malleability.
      hasHighS() {
        return isBiggerThanHalfOrder(this.s);
      }
      normalizeS() {
        return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
      }
      // DER-encoded
      toDERRawBytes() {
        return hexToBytes(this.toDERHex());
      }
      toDERHex() {
        return DER.hexFromSig({
          r: this.r,
          s: this.s
        });
      }
      // padded bytes of r, then padded bytes of s
      toCompactRawBytes() {
        return hexToBytes(this.toCompactHex());
      }
      toCompactHex() {
        return numToNByteStr(this.r) + numToNByteStr(this.s);
      }
    }
    const utils = {
      isValidPrivateKey(privateKey) {
        try {
          normPrivateKeyToScalar(privateKey);
          return true;
        } catch (error) {
          return false;
        }
      },
      normPrivateKeyToScalar,
      /**
       * Produces cryptographically secure private key from random of size (nBitLength+64)
       * as per FIPS 186 B.4.1 with modulo bias being neglible.
       */
      randomPrivateKey: () => {
        const rand = CURVE.randomBytes(Fp.BYTES + 8);
        const num = hashToPrivateScalar(rand, CURVE_ORDER);
        return numberToBytesBE(num, CURVE.nByteLength);
      },
      /**
       * Creates precompute table for an arbitrary EC point. Makes point "cached".
       * Allows to massively speed-up `point.multiply(scalar)`.
       * @returns cached point
       * @example
       * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
       * fast.multiply(privKey); // much faster ECDH now
       */
      precompute(windowSize = 8, point = Point.BASE) {
        point._setWindowSize(windowSize);
        point.multiply(BigInt(3));
        return point;
      }
    };
    function getPublicKey(privateKey, isCompressed = true) {
      return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
    }
    function isProbPub(item) {
      const arr = item instanceof Uint8Array;
      const str = typeof item === "string";
      const len = (arr || str) && item.length;
      if (arr) return len === compressedLen || len === uncompressedLen;
      if (str) return len === 2 * compressedLen || len === 2 * uncompressedLen;
      if (item instanceof Point) return true;
      return false;
    }
    function getSharedSecret2(privateA, publicB, isCompressed = true) {
      if (isProbPub(privateA)) throw new Error("first arg must be private key");
      if (!isProbPub(publicB)) throw new Error("second arg must be public key");
      const b = Point.fromHex(publicB);
      return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
    }
    const bits2int = CURVE.bits2int || function (bytes) {
      const num = bytesToNumberBE(bytes);
      const delta = bytes.length * 8 - CURVE.nBitLength;
      return delta > 0 ? num >> BigInt(delta) : num;
    };
    const bits2int_modN = CURVE.bits2int_modN || function (bytes) {
      return modN(bits2int(bytes));
    };
    const ORDER_MASK = bitMask(CURVE.nBitLength);
    function int2octets(num) {
      if (typeof num !== "bigint") throw new Error("bigint expected");
      if (!(_0n4 <= num && num < ORDER_MASK)) throw new Error(`bigint expected < 2^${CURVE.nBitLength}`);
      return numberToBytesBE(num, CURVE.nByteLength);
    }
    function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
      if (["recovered", "canonical"].some(k => k in opts)) throw new Error("sign() legacy options not supported");
      const {
        hash,
        randomBytes: randomBytes2
      } = CURVE;
      let {
        lowS,
        prehash,
        extraEntropy: ent
      } = opts;
      if (lowS == null) lowS = true;
      msgHash = ensureBytes("msgHash", msgHash);
      if (prehash) msgHash = ensureBytes("prehashed msgHash", hash(msgHash));
      const h1int = bits2int_modN(msgHash);
      const d = normPrivateKeyToScalar(privateKey);
      const seedArgs = [int2octets(d), int2octets(h1int)];
      if (ent != null) {
        const e = ent === true ? randomBytes2(Fp.BYTES) : ent;
        seedArgs.push(ensureBytes("extraEntropy", e, Fp.BYTES));
      }
      const seed = concatBytes(...seedArgs);
      const m = h1int;
      function k2sig(kBytes) {
        const k = bits2int(kBytes);
        if (!isWithinCurveOrder(k)) return;
        const ik = invN(k);
        const q = Point.BASE.multiply(k).toAffine();
        const r = modN(q.x);
        if (r === _0n4) return;
        const s = modN(ik * modN(m + r * d));
        if (s === _0n4) return;
        let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n4);
        let normS = s;
        if (lowS && isBiggerThanHalfOrder(s)) {
          normS = normalizeS(s);
          recovery ^= 1;
        }
        return new Signature(r, normS, recovery);
      }
      return {
        seed,
        k2sig
      };
    }
    const defaultSigOpts = {
      lowS: CURVE.lowS,
      prehash: false
    };
    const defaultVerOpts = {
      lowS: CURVE.lowS,
      prehash: false
    };
    function sign(msgHash, privKey, opts = defaultSigOpts) {
      const {
        seed,
        k2sig
      } = prepSig(msgHash, privKey, opts);
      const C = CURVE;
      const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
      return drbg(seed, k2sig);
    }
    Point.BASE._setWindowSize(8);
    function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
      const sg = signature;
      msgHash = ensureBytes("msgHash", msgHash);
      publicKey = ensureBytes("publicKey", publicKey);
      if ("strict" in opts) throw new Error("options.strict was renamed to lowS");
      const {
        lowS,
        prehash
      } = opts;
      let _sig = void 0;
      let P;
      try {
        if (typeof sg === "string" || sg instanceof Uint8Array) {
          try {
            _sig = Signature.fromDER(sg);
          } catch (derError) {
            if (!(derError instanceof DER.Err)) throw derError;
            _sig = Signature.fromCompact(sg);
          }
        } else if (typeof sg === "object" && typeof sg.r === "bigint" && typeof sg.s === "bigint") {
          const {
            r: r2,
            s: s2
          } = sg;
          _sig = new Signature(r2, s2);
        } else {
          throw new Error("PARSE");
        }
        P = Point.fromHex(publicKey);
      } catch (error) {
        if (error.message === "PARSE") throw new Error(`signature must be Signature instance, Uint8Array or hex string`);
        return false;
      }
      if (lowS && _sig.hasHighS()) return false;
      if (prehash) msgHash = CURVE.hash(msgHash);
      const {
        r,
        s
      } = _sig;
      const h = bits2int_modN(msgHash);
      const is = invN(s);
      const u1 = modN(h * is);
      const u2 = modN(r * is);
      const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine();
      if (!R) return false;
      const v = modN(R.x);
      return v === r;
    }
    return {
      CURVE,
      getPublicKey,
      getSharedSecret: getSharedSecret2,
      sign,
      verify,
      ProjectivePoint: Point,
      Signature,
      utils
    };
  }

  // src/sm2/rng.ts
  var DEFAULT_PRNG_POOL_SIZE = 16384;
  var prngPool = new Uint8Array(0);
  var _syncCrypto;
  async function initRNGPool() {
    if ("crypto" in globalThis) {
      _syncCrypto = globalThis.crypto;
      return;
    }
    if (prngPool.length > DEFAULT_PRNG_POOL_SIZE / 2) return;
    if ("wx" in globalThis && "getRandomValues" in globalThis.wx) {
      prngPool = await new Promise(r => {
        wx.getRandomValues({
          length: DEFAULT_PRNG_POOL_SIZE,
          success(res) {
            r(new Uint8Array(res.randomValues));
          }
        });
      });
    } else {
      try {
        if (globalThis.crypto) {
          _syncCrypto = globalThis.crypto;
        } else {
          const crypto = await import(/* webpackIgnore: true */
          "crypto");
          _syncCrypto = crypto.webcrypto;
        }
        const array = new Uint8Array(DEFAULT_PRNG_POOL_SIZE);
        _syncCrypto.getRandomValues(array);
        prngPool = array;
      } catch (error) {
        throw new Error("no available csprng, abort.");
      }
    }
  }
  initRNGPool();
  function consumePool(length) {
    if (prngPool.length > length) {
      const prng = prngPool.slice(0, length);
      prngPool = prngPool.slice(length);
      initRNGPool();
      return prng;
    } else {
      throw new Error("random number pool is not ready or insufficient, prevent getting too long random values or too often.");
    }
  }
  function randomBytes(length = 0) {
    const array = new Uint8Array(length);
    if (_syncCrypto) {
      return _syncCrypto.getRandomValues(array);
    } else {
      const result = consumePool(length);
      return result;
    }
  }

  // src/sm3/utils.ts
  var u8a2 = a => a instanceof Uint8Array;
  var createView = arr => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  var isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
  if (!isLE) throw new Error("Non little-endian hardware is not supported");
  var hexes2 = Array.from({
    length: 256
  }, (v, i) => i.toString(16).padStart(2, "0"));
  function bytesToHex2(bytes) {
    if (!u8a2(bytes)) throw new Error("Uint8Array expected");
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += hexes2[bytes[i]];
    }
    return hex;
  }
  var te = typeof TextEncoder != "undefined" && /* @__PURE__ */new TextEncoder();
  var slc = (v, s, e) => {
    if (s == null || s < 0) s = 0;
    if (e == null || e > v.length) e = v.length;
    return new Uint8Array(v.subarray(s, e));
  };
  function strToU8(str) {
    if (te) return te.encode(str);
    const l = str.length;
    let ar = new Uint8Array(str.length + (str.length >> 1));
    let ai = 0;
    const w = v => {
      ar[ai++] = v;
    };
    for (let i = 0; i < l; ++i) {
      if (ai + 5 > ar.length) {
        const n = new Uint8Array(ai + 8 + (l - i << 1));
        n.set(ar);
        ar = n;
      }
      let c = str.charCodeAt(i);
      if (c < 128) w(c);else if (c < 2048) w(192 | c >> 6), w(128 | c & 63);else if (c > 55295 && c < 57344) c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);else w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
    }
    return slc(ar, 0, ai);
  }
  function toBytes(data) {
    if (typeof data === "string") data = strToU8(data);
    if (!u8a2(data)) throw new Error(`expected Uint8Array, got ${typeof data}`);
    return data;
  }
  var Hash = class {
    // Safe version that clones internal state
    clone() {
      return this._cloneInto();
    }
  };
  function wrapConstructor(hashCons) {
    const hashC = msg => hashCons().update(toBytes(msg)).digest();
    const tmp2 = hashCons();
    hashC.outputLen = tmp2.outputLen;
    hashC.blockLen = tmp2.blockLen;
    hashC.create = () => hashCons();
    return hashC;
  }

  // src/sm2/sm3.ts
  var BoolA = (A, B, C) => A & B | A & C | B & C;
  var BoolB = (A, B, C) => A ^ B ^ C;
  var BoolC = (A, B, C) => A & B | ~A & C;
  function setBigUint64(view, byteOffset, value, isLE3) {
    if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE3);
    const _32n = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE3 ? 4 : 0;
    const l = isLE3 ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE3);
    view.setUint32(byteOffset + l, wl, isLE3);
  }
  function rotl(x2, n) {
    const s = n & 31;
    return x2 << s | x2 >>> 32 - s;
  }
  function P0(X) {
    return X ^ rotl(X, 9) ^ rotl(X, 17);
  }
  function P1(X) {
    return X ^ rotl(X, 15) ^ rotl(X, 23);
  }
  var SHA2 = class extends Hash {
    constructor(blockLen, outputLen, padOffset, isLE3) {
      super();
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE3;
      // For partial updates less than block size
      __publicField(this, "buffer");
      __publicField(this, "view");
      __publicField(this, "finished", false);
      __publicField(this, "length", 0);
      __publicField(this, "pos", 0);
      __publicField(this, "destroyed", false);
      this.buffer = new Uint8Array(blockLen);
      this.view = createView(this.buffer);
    }
    update(data) {
      const {
        view,
        buffer,
        blockLen
      } = this;
      data = toBytes(data);
      const len = data.length;
      for (let pos = 0; pos < len;) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView(data);
          for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view, 0);
          this.pos = 0;
        }
      }
      this.length += data.length;
      this.roundClean();
      return this;
    }
    digestInto(out) {
      this.finished = true;
      const {
        buffer,
        view,
        blockLen,
        isLE: isLE3
      } = this;
      let {
        pos
      } = this;
      buffer[pos++] = 128;
      this.buffer.subarray(pos).fill(0);
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++) buffer[i] = 0;
      setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE3);
      this.process(view, 0);
      const oview = createView(out);
      const len = this.outputLen;
      if (len % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
      const outLen = len / 4;
      const state = this.get();
      if (outLen > state.length) throw new Error("_sha2: outputLen bigger than state");
      for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE3);
    }
    digest() {
      const {
        buffer,
        outputLen
      } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneInto(to) {
      to || (to = new this.constructor());
      to.set(...this.get());
      const {
        blockLen,
        buffer,
        length,
        finished,
        destroyed,
        pos
      } = this;
      to.length = length;
      to.pos = pos;
      to.finished = finished;
      to.destroyed = destroyed;
      if (length % blockLen) to.buffer.set(buffer);
      return to;
    }
  };
  var IV = new Uint32Array([1937774191, 1226093241, 388252375, 3666478592, 2842636476, 372324522, 3817729613, 2969243214]);
  var SM3_W = new Uint32Array(68);
  var SM3_M = new Uint32Array(64);
  var T1 = 2043430169;
  var T2 = 2055708042;
  var SM3 = class extends SHA2 {
    constructor() {
      super(64, 32, 8, false);
      // We cannot use array here since array allows indexing by variable
      // which means optimizer/compiler cannot use registers.
      __publicField(this, "A", IV[0] | 0);
      __publicField(this, "B", IV[1] | 0);
      __publicField(this, "C", IV[2] | 0);
      __publicField(this, "D", IV[3] | 0);
      __publicField(this, "E", IV[4] | 0);
      __publicField(this, "F", IV[5] | 0);
      __publicField(this, "G", IV[6] | 0);
      __publicField(this, "H", IV[7] | 0);
    }
    get() {
      const {
        A,
        B,
        C,
        D,
        E,
        F,
        G,
        H
      } = this;
      return [A, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A, B, C, D, E, F, G, H) {
      this.A = A | 0;
      this.B = B | 0;
      this.C = C | 0;
      this.D = D | 0;
      this.E = E | 0;
      this.F = F | 0;
      this.G = G | 0;
      this.H = H | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4) SM3_W[i] = view.getUint32(offset, false);
      for (let i = 16; i < 68; i++) {
        SM3_W[i] = P1(SM3_W[i - 16] ^ SM3_W[i - 9] ^ rotl(SM3_W[i - 3], 15)) ^ rotl(SM3_W[i - 13], 7) ^ SM3_W[i - 6];
      }
      for (let i = 0; i < 64; i++) {
        SM3_M[i] = SM3_W[i] ^ SM3_W[i + 4];
      }
      let {
        A,
        B,
        C,
        D,
        E,
        F,
        G,
        H
      } = this;
      for (let j = 0; j < 64; j++) {
        let small = j >= 0 && j <= 15;
        let T = small ? T1 : T2;
        let SS1 = rotl(rotl(A, 12) + E + rotl(T, j), 7);
        let SS2 = SS1 ^ rotl(A, 12);
        let TT1 = (small ? BoolB(A, B, C) : BoolA(A, B, C)) + D + SS2 + SM3_M[j] | 0;
        let TT2 = (small ? BoolB(E, F, G) : BoolC(E, F, G)) + H + SS1 + SM3_W[j] | 0;
        D = C;
        C = rotl(B, 9);
        B = A;
        A = TT1;
        H = G;
        G = rotl(F, 19);
        F = E;
        E = P0(TT2);
      }
      A = A ^ this.A | 0;
      B = B ^ this.B | 0;
      C = C ^ this.C | 0;
      D = D ^ this.D | 0;
      E = E ^ this.E | 0;
      F = F ^ this.F | 0;
      G = G ^ this.G | 0;
      H = H ^ this.H | 0;
      this.set(A, B, C, D, E, F, G, H);
    }
    roundClean() {
      SM3_W.fill(0);
    }
    destroy() {
      this.set(0, 0, 0, 0, 0, 0, 0, 0);
      this.buffer.fill(0);
    }
  };
  var sm3 = wrapConstructor(() => new SM3());

  // src/sm2/hmac.ts
  var HMAC = class extends Hash {
    constructor(hash, _key) {
      super();
      __publicField(this, "oHash");
      __publicField(this, "iHash");
      __publicField(this, "blockLen");
      __publicField(this, "outputLen");
      __publicField(this, "finished", false);
      __publicField(this, "destroyed", false);
      const key = toBytes(_key);
      this.iHash = hash.create();
      if (typeof this.iHash.update !== "function") throw new Error("Expected instance of class which extends utils.Hash");
      this.blockLen = this.iHash.blockLen;
      this.outputLen = this.iHash.outputLen;
      const blockLen = this.blockLen;
      const pad = new Uint8Array(blockLen);
      pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
      for (let i = 0; i < pad.length; i++) pad[i] ^= 54;
      this.iHash.update(pad);
      this.oHash = hash.create();
      for (let i = 0; i < pad.length; i++) pad[i] ^= 54 ^ 92;
      this.oHash.update(pad);
      pad.fill(0);
    }
    update(buf) {
      this.iHash.update(buf);
      return this;
    }
    digestInto(out) {
      this.finished = true;
      this.iHash.digestInto(out);
      this.oHash.update(out);
      this.oHash.digestInto(out);
      this.destroy();
    }
    digest() {
      const out = new Uint8Array(this.oHash.outputLen);
      this.digestInto(out);
      return out;
    }
    _cloneInto(to) {
      to || (to = Object.create(Object.getPrototypeOf(this), {}));
      const {
        oHash,
        iHash,
        finished,
        destroyed,
        blockLen,
        outputLen
      } = this;
      to = to;
      to.finished = finished;
      to.destroyed = destroyed;
      to.blockLen = blockLen;
      to.outputLen = outputLen;
      to.oHash = oHash._cloneInto(to.oHash);
      to.iHash = iHash._cloneInto(to.iHash);
      return to;
    }
    destroy() {
      this.destroyed = true;
      this.oHash.destroy();
      this.iHash.destroy();
    }
  };
  var hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
  hmac.create = (hash, key) => new HMAC(hash, key);

  // src/sm2/ec.ts
  var sm2Fp = Field(BigInt("115792089210356248756420345214020892766250353991924191454421193933289684991999"));
  var sm2Curve = weierstrass({
    // sm2: short weierstrass.
    a: BigInt("115792089210356248756420345214020892766250353991924191454421193933289684991996"),
    b: BigInt("18505919022281880113072981827955639221458448578012075254857346196103069175443"),
    Fp: sm2Fp,
    h: ONE,
    n: BigInt("115792089210356248756420345214020892766061623724957744567843809356293439045923"),
    Gx: BigInt("22963146547237050559479531362550074578802567295341616970375194840604139615431"),
    Gy: BigInt("85132369209828568825618990617112496413088388631904505083283536607588877201568"),
    hash: sm3,
    hmac: (key, ...msgs) => hmac(sm3, key, concatBytes(...msgs)),
    randomBytes
  });
  var field = Field(BigInt(sm2Curve.CURVE.n));

  // src/sm2/utils.ts
  function generateKeyPairHex(str) {
    const privateKey = str ? numberToBytesBE(mod(BigInt(str), ONE) + ONE, 32) : sm2Curve.utils.randomPrivateKey();
    const publicKey = sm2Curve.getPublicKey(privateKey, false);
    const privPad = leftPad(bytesToHex(privateKey), 64);
    const pubPad = leftPad(bytesToHex(publicKey), 64);
    return {
      privateKey: privPad,
      publicKey: pubPad
    };
  }
  function compressPublicKeyHex(s) {
    if (s.length !== 130) throw new Error("Invalid public key to compress");
    const len = (s.length - 2) / 2;
    const xHex = s.substring(2, 2 + len);
    const y = hexToNumber(s.substring(len + 2, len + len + 2));
    let prefix = "03";
    if (mod(y, TWO) === ZERO) prefix = "02";
    return prefix + xHex;
  }
  function utf8ToHex(input) {
    const bytes = strToU8(input);
    return bytesToHex(bytes);
  }
  function leftPad(input, num) {
    if (input.length >= num) return input;
    return new Array(num - input.length + 1).join("0") + input;
  }
  function arrayToHex(arr) {
    return arr.map(item => {
      const hex = item.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }
  function arrayToUtf8(arr) {
    const str = [];
    for (let i = 0, len = arr.length; i < len; i++) {
      if (arr[i] >= 240 && arr[i] <= 247) {
        str.push(String.fromCodePoint(((arr[i] & 7) << 18) + ((arr[i + 1] & 63) << 12) + ((arr[i + 2] & 63) << 6) + (arr[i + 3] & 63)));
        i += 3;
      } else if (arr[i] >= 224 && arr[i] <= 239) {
        str.push(String.fromCodePoint(((arr[i] & 15) << 12) + ((arr[i + 1] & 63) << 6) + (arr[i + 2] & 63)));
        i += 2;
      } else if (arr[i] >= 192 && arr[i] <= 223) {
        str.push(String.fromCodePoint(((arr[i] & 31) << 6) + (arr[i + 1] & 63)));
        i++;
      } else {
        str.push(String.fromCodePoint(arr[i]));
      }
    }
    return str.join("");
  }
  function hexToArray(hexStr) {
    let hexStrLength = hexStr.length;
    if (hexStrLength % 2 !== 0) {
      hexStr = leftPad(hexStr, hexStrLength + 1);
    }
    hexStrLength = hexStr.length;
    const wordLength = hexStrLength / 2;
    const words = new Uint8Array(wordLength);
    for (let i = 0; i < wordLength; i++) {
      words[i] = parseInt(hexStr.substring(i * 2, i * 2 + 2), 16);
    }
    return words;
  }
  function verifyPublicKey(publicKey) {
    const point = sm2Curve.ProjectivePoint.fromHex(publicKey);
    if (!point) return false;
    try {
      point.assertValidity();
      return true;
    } catch (error) {
      return false;
    }
  }
  function comparePublicKeyHex(publicKey1, publicKey2) {
    const point1 = sm2Curve.ProjectivePoint.fromHex(publicKey1);
    if (!point1) return false;
    const point2 = sm2Curve.ProjectivePoint.fromHex(publicKey2);
    if (!point2) return false;
    return point1.equals(point2);
  }

  // src/sm3/index.ts
  function utf8ToArray(str) {
    const arr = [];
    for (let i = 0, len = str.length; i < len; i++) {
      const point = str.codePointAt(i);
      if (point <= 127) {
        arr.push(point);
      } else if (point <= 2047) {
        arr.push(192 | point >>> 6);
        arr.push(128 | point & 63);
      } else if (point <= 55295 || point >= 57344 && point <= 65535) {
        arr.push(224 | point >>> 12);
        arr.push(128 | point >>> 6 & 63);
        arr.push(128 | point & 63);
      } else if (point >= 65536 && point <= 1114111) {
        i++;
        arr.push(240 | point >>> 18 & 28);
        arr.push(128 | point >>> 12 & 63);
        arr.push(128 | point >>> 6 & 63);
        arr.push(128 | point & 63);
      } else {
        arr.push(point);
        throw new Error("input is not supported");
      }
    }
    return new Uint8Array(arr);
  }
  function sm32(input, options) {
    input = typeof input === "string" ? utf8ToArray(input) : input;
    if (options) {
      const mode = options.mode || "hmac";
      if (mode !== "hmac") throw new Error("invalid mode");
      let key = options.key;
      if (!key) throw new Error("invalid key");
      key = typeof key === "string" ? hexToArray(key) : key;
      return bytesToHex2(hmac(sm3, key, input));
    }
    return bytesToHex2(sm3(input));
  }

  // src/sm2/kdf.ts
  function kdf(z, keylen, iv) {
    z = typeof z === "string" ? utf8ToArray(z) : z;
    const IV2 = iv == null ? EmptyArray : typeof iv === "string" ? utf8ToArray(iv) : iv;
    let msg = new Uint8Array(keylen);
    let ct = 1;
    let offset = 0;
    let t = EmptyArray;
    const ctShift = new Uint8Array(4);
    const nextT = () => {
      ctShift[0] = ct >> 24 & 255;
      ctShift[1] = ct >> 16 & 255;
      ctShift[2] = ct >> 8 & 255;
      ctShift[3] = ct & 255;
      t = sm3(concatBytes(z, ctShift, IV2));
      ct++;
      offset = 0;
    };
    nextT();
    for (let i = 0, len = msg.length; i < len; i++) {
      if (offset === t.length) nextT();
      msg[i] = t[offset++] & 255;
    }
    return msg;
  }

  // src/sm2/kx.ts
  var wPow2 = hexToNumber("80000000000000000000000000000000");
  var wPow2Sub1 = hexToNumber("7fffffffffffffffffffffffffffffff");
  function calculateSharedKey(keypairA, ephemeralKeypairA, publicKeyB, ephemeralPublicKeyB, sharedKeyLength, isRecipient = false, idA = "1234567812345678", idB = "1234567812345678") {
    const RA = sm2Curve.ProjectivePoint.fromHex(ephemeralKeypairA.publicKey);
    const RB = sm2Curve.ProjectivePoint.fromHex(ephemeralPublicKeyB);
    const PB = sm2Curve.ProjectivePoint.fromHex(publicKeyB);
    let ZA = getZ(keypairA.publicKey, idA);
    let ZB = getZ(publicKeyB, idB);
    if (isRecipient) {
      [ZA, ZB] = [ZB, ZA];
    }
    const rA = hexToNumber(ephemeralKeypairA.privateKey);
    const dA = hexToNumber(keypairA.privateKey);
    const x1 = RA.x;
    const x1_ = wPow2 + (x1 & wPow2Sub1);
    const tA = field.add(dA, field.mulN(x1_, rA));
    const x2 = RB.x;
    const x2_ = field.add(wPow2, x2 & wPow2Sub1);
    const U = RB.multiply(x2_).add(PB).multiply(tA);
    const xU = hexToArray(leftPad(numberToHexUnpadded(U.x), 64));
    const yU = hexToArray(leftPad(numberToHexUnpadded(U.y), 64));
    const KA = kdf(concatBytes(xU, yU, ZA, ZB), sharedKeyLength);
    return KA;
  }

  // src/sm2/index.ts
  var {
    getSharedSecret
  } = sm2Curve;
  function xorCipherStream(x2, y2, msg) {
    const stream = kdf(concatBytes(x2, y2), msg.length);
    for (let i = 0, len = msg.length; i < len; i++) {
      msg[i] ^= stream[i] & 255;
    }
  }
  var C1C2C3 = 0;
  var EmptyArray = new Uint8Array();
  function doEncrypt(msg, publicKey, cipherMode = 1, options) {
    const msgArr = typeof msg === "string" ? hexToArray(utf8ToHex(msg)) : Uint8Array.from(msg);
    const publicKeyPoint = typeof publicKey === "string" ? sm2Curve.ProjectivePoint.fromHex(publicKey) : publicKey;
    const keypair = generateKeyPairHex();
    const k = hexToNumber(keypair.privateKey);
    let c1 = keypair.publicKey;
    if (c1.length > 128) c1 = c1.substring(c1.length - 128);
    const p = publicKeyPoint.multiply(k);
    const x2 = hexToArray(leftPad(numberToHexUnpadded(p.x), 64));
    const y2 = hexToArray(leftPad(numberToHexUnpadded(p.y), 64));
    const c3 = bytesToHex2(sm3(concatBytes(x2, msgArr, y2)));
    xorCipherStream(x2, y2, msgArr);
    const c2 = bytesToHex2(msgArr);
    if (options?.asn1) {
      const point = sm2Curve.ProjectivePoint.fromHex(keypair.publicKey);
      const encode = cipherMode === C1C2C3 ? encodeEnc(point.x, point.y, c2, c3) : encodeEnc(point.x, point.y, c3, c2);
      return encode;
    }
    return cipherMode === C1C2C3 ? c1 + c2 + c3 : c1 + c3 + c2;
  }
  function doDecrypt(encryptData, privateKey, cipherMode = 1, options) {
    const {
      output = "string",
      asn1 = false
    } = options || {};
    const privateKeyInteger = hexToNumber(privateKey);
    let c1;
    let c2;
    let c3;
    if (asn1) {
      const {
        x: x3,
        y,
        cipher,
        hash
      } = decodeEnc(encryptData);
      c1 = sm2Curve.ProjectivePoint.fromAffine({
        x: x3,
        y
      });
      c3 = hash;
      c2 = cipher;
      if (cipherMode === C1C2C3) {
        [c2, c3] = [c3, c2];
      }
    } else {
      c1 = sm2Curve.ProjectivePoint.fromHex("04" + encryptData.substring(0, 128));
      c3 = encryptData.substring(128, 128 + 64);
      c2 = encryptData.substring(128 + 64);
      if (cipherMode === C1C2C3) {
        c3 = encryptData.substring(encryptData.length - 64);
        c2 = encryptData.substring(128, encryptData.length - 64);
      }
    }
    const msg = hexToArray(c2);
    const p = c1.multiply(privateKeyInteger);
    const x2 = hexToArray(leftPad(numberToHexUnpadded(p.x), 64));
    const y2 = hexToArray(leftPad(numberToHexUnpadded(p.y), 64));
    xorCipherStream(x2, y2, msg);
    const checkC3 = arrayToHex(Array.from(sm3(concatBytes(x2, msg, y2))));
    if (checkC3 === c3.toLowerCase()) {
      return output === "array" ? msg : arrayToUtf8(msg);
    } else {
      return output === "array" ? [] : "";
    }
  }
  function doSignature(msg, privateKey, options = {}) {
    let {
      pointPool,
      der,
      hash,
      publicKey,
      userId
    } = options;
    let hashHex = typeof msg === "string" ? utf8ToHex(msg) : arrayToHex(Array.from(msg));
    if (hash) {
      publicKey = publicKey || getPublicKeyFromPrivateKey(privateKey);
      hashHex = getHash(hashHex, publicKey, userId);
    }
    const dA = hexToNumber(privateKey);
    const e = hexToNumber(hashHex);
    let k = null;
    let r = null;
    let s = null;
    do {
      do {
        let point;
        if (pointPool && pointPool.length) {
          point = pointPool.pop();
        } else {
          point = getPoint();
        }
        k = point.k;
        r = field.add(e, point.x1);
      } while (r === ZERO || r + k === sm2Curve.CURVE.n);
      s = field.mul(field.inv(field.addN(dA, ONE)), field.subN(k, field.mulN(r, dA)));
    } while (s === ZERO);
    if (der) return encodeDer(r, s);
    return leftPad(numberToHexUnpadded(r), 64) + leftPad(numberToHexUnpadded(s), 64);
  }
  function doVerifySignature(msg, signHex, publicKey, options = {}) {
    let hashHex;
    const {
      hash,
      der,
      userId
    } = options;
    const publicKeyHex = typeof publicKey === "string" ? publicKey : publicKey.toHex(false);
    if (hash) {
      hashHex = getHash(typeof msg === "string" ? utf8ToHex(msg) : msg, publicKeyHex, userId);
    } else {
      hashHex = typeof msg === "string" ? utf8ToHex(msg) : arrayToHex(Array.from(msg));
    }
    let r;
    let s;
    if (der) {
      const decodeDerObj = decodeDer(signHex);
      r = decodeDerObj.r;
      s = decodeDerObj.s;
    } else {
      r = hexToNumber(signHex.substring(0, 64));
      s = hexToNumber(signHex.substring(64));
    }
    const PA = typeof publicKey === "string" ? sm2Curve.ProjectivePoint.fromHex(publicKey) : publicKey;
    const e = hexToNumber(hashHex);
    const t = field.add(r, s);
    if (t === ZERO) return false;
    const x1y1 = sm2Curve.ProjectivePoint.BASE.multiply(s).add(PA.multiply(t));
    const R = field.add(e, x1y1.x);
    return r === R;
  }
  function getZ(publicKey, userId = "1234567812345678") {
    userId = utf8ToHex(userId);
    const a = leftPad(numberToHexUnpadded(sm2Curve.CURVE.a), 64);
    const b = leftPad(numberToHexUnpadded(sm2Curve.CURVE.b), 64);
    const gx = leftPad(numberToHexUnpadded(sm2Curve.ProjectivePoint.BASE.x), 64);
    const gy = leftPad(numberToHexUnpadded(sm2Curve.ProjectivePoint.BASE.y), 64);
    let px;
    let py;
    if (publicKey.length === 128) {
      px = publicKey.substring(0, 64);
      py = publicKey.substring(64, 128);
    } else {
      const point = sm2Curve.ProjectivePoint.fromHex(publicKey);
      px = leftPad(numberToHexUnpadded(point.x), 64);
      py = leftPad(numberToHexUnpadded(point.y), 64);
    }
    const data = hexToArray(userId + a + b + gx + gy + px + py);
    const entl = userId.length * 4;
    const z = sm3(concatBytes(new Uint8Array([entl >> 8 & 255, entl & 255]), data));
    return z;
  }
  function getHash(hashHex, publicKey, userId = "1234567812345678") {
    const z = getZ(publicKey, userId);
    return bytesToHex2(sm3(concatBytes(z, typeof hashHex === "string" ? hexToArray(hashHex) : hashHex)));
  }
  function precomputePublicKey(publicKey, windowSize) {
    const point = sm2Curve.ProjectivePoint.fromHex(publicKey);
    return sm2Curve.utils.precompute(windowSize, point);
  }
  function getPublicKeyFromPrivateKey(privateKey) {
    const pubKey = sm2Curve.getPublicKey(privateKey, false);
    const pubPad = leftPad(bytesToHex(pubKey), 64);
    return pubPad;
  }
  function getPoint() {
    const keypair = generateKeyPairHex();
    const PA = sm2Curve.ProjectivePoint.fromHex(keypair.publicKey);
    const k = hexToNumber(keypair.privateKey);
    return {
      ...keypair,
      k,
      x1: PA.x
    };
  }

  // src/sm3/hkdf.ts

  function hkdf(ikm, salt, info, length) {
    return (0, _hkdf.hkdf)(sm3, ikm, salt, info, length);
  }

  // src/sm4/index.ts
  var sm4_exports = _exports.sm4 = {};
  __export(sm4_exports, {
    decrypt: () => decrypt,
    encrypt: () => encrypt,
    sm4: () => sm4
  });

  // node_modules/.pnpm/@noble+ciphers@1.2.1/node_modules/@noble/ciphers/esm/_assert.js
  function isBytes(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
  }
  function abytes(b, ...lengths) {
    if (!isBytes(b)) throw new Error("Uint8Array expected");
    if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
  }
  function aexists(instance, checkFinished = true) {
    if (instance.destroyed) throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
  }
  function aoutput(out, instance) {
    abytes(out);
    const min = instance.outputLen;
    if (out.length < min) {
      throw new Error("digestInto() expects output buffer of length at least " + min);
    }
  }

  // node_modules/.pnpm/@noble+ciphers@1.2.1/node_modules/@noble/ciphers/esm/utils.js
  var u32 = arr => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
  var createView2 = arr => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  var isLE2 = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
  if (!isLE2) throw new Error("Non little-endian hardware is not supported");
  function utf8ToBytes2(str) {
    if (typeof str !== "string") throw new Error("string expected");
    return new Uint8Array(new TextEncoder().encode(str));
  }
  function toBytes2(data) {
    if (typeof data === "string") data = utf8ToBytes2(data);else if (isBytes(data)) data = copyBytes(data);else throw new Error("Uint8Array expected, got " + typeof data);
    return data;
  }
  function setBigUint642(view, byteOffset, value, isLE3) {
    if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE3);
    const _32n = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE3 ? 4 : 0;
    const l = isLE3 ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE3);
    view.setUint32(byteOffset + l, wl, isLE3);
  }
  function copyBytes(bytes) {
    return Uint8Array.from(bytes);
  }
  function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }

  // node_modules/.pnpm/@noble+ciphers@1.2.1/node_modules/@noble/ciphers/esm/_polyval.js
  var BLOCK_SIZE = 16;
  var ZEROS16 = /* @__PURE__ */new Uint8Array(16);
  var ZEROS32 = u32(ZEROS16);
  var POLY = 225;
  var mul2 = (s0, s1, s2, s3) => {
    const hiBit = s3 & 1;
    return {
      s3: s2 << 31 | s3 >>> 1,
      s2: s1 << 31 | s2 >>> 1,
      s1: s0 << 31 | s1 >>> 1,
      s0: s0 >>> 1 ^ POLY << 24 & -(hiBit & 1)
      // reduce % poly
    };
  };
  var swapLE = n => (n >>> 0 & 255) << 24 | (n >>> 8 & 255) << 16 | (n >>> 16 & 255) << 8 | n >>> 24 & 255 | 0;
  function _toGHASHKey(k) {
    k.reverse();
    const hiBit = k[15] & 1;
    let carry = 0;
    for (let i = 0; i < k.length; i++) {
      const t = k[i];
      k[i] = t >>> 1 | carry;
      carry = (t & 1) << 7;
    }
    k[0] ^= -hiBit & 225;
    return k;
  }
  var estimateWindow = bytes => {
    if (bytes > 64 * 1024) return 8;
    if (bytes > 1024) return 4;
    return 2;
  };
  var GHASH = class {
    // We select bits per window adaptively based on expectedLength
    constructor(key, expectedLength) {
      this.blockLen = BLOCK_SIZE;
      this.outputLen = BLOCK_SIZE;
      this.s0 = 0;
      this.s1 = 0;
      this.s2 = 0;
      this.s3 = 0;
      this.finished = false;
      key = toBytes2(key);
      abytes(key, 16);
      const kView = createView2(key);
      let k0 = kView.getUint32(0, false);
      let k1 = kView.getUint32(4, false);
      let k2 = kView.getUint32(8, false);
      let k3 = kView.getUint32(12, false);
      const doubles = [];
      for (let i = 0; i < 128; i++) {
        doubles.push({
          s0: swapLE(k0),
          s1: swapLE(k1),
          s2: swapLE(k2),
          s3: swapLE(k3)
        });
        ({
          s0: k0,
          s1: k1,
          s2: k2,
          s3: k3
        } = mul2(k0, k1, k2, k3));
      }
      const W = estimateWindow(expectedLength || 1024);
      if (![1, 2, 4, 8].includes(W)) throw new Error("ghash: invalid window size, expected 2, 4 or 8");
      this.W = W;
      const bits = 128;
      const windows = bits / W;
      const windowSize = this.windowSize = 2 ** W;
      const items = [];
      for (let w = 0; w < windows; w++) {
        for (let byte = 0; byte < windowSize; byte++) {
          let s0 = 0,
            s1 = 0,
            s2 = 0,
            s3 = 0;
          for (let j = 0; j < W; j++) {
            const bit = byte >>> W - j - 1 & 1;
            if (!bit) continue;
            const {
              s0: d0,
              s1: d1,
              s2: d2,
              s3: d3
            } = doubles[W * w + j];
            s0 ^= d0, s1 ^= d1, s2 ^= d2, s3 ^= d3;
          }
          items.push({
            s0,
            s1,
            s2,
            s3
          });
        }
      }
      this.t = items;
    }
    _updateBlock(s0, s1, s2, s3) {
      s0 ^= this.s0, s1 ^= this.s1, s2 ^= this.s2, s3 ^= this.s3;
      const {
        W,
        t,
        windowSize
      } = this;
      let o0 = 0,
        o1 = 0,
        o2 = 0,
        o3 = 0;
      const mask = (1 << W) - 1;
      let w = 0;
      for (const num of [s0, s1, s2, s3]) {
        for (let bytePos = 0; bytePos < 4; bytePos++) {
          const byte = num >>> 8 * bytePos & 255;
          for (let bitPos = 8 / W - 1; bitPos >= 0; bitPos--) {
            const bit = byte >>> W * bitPos & mask;
            const {
              s0: e0,
              s1: e1,
              s2: e2,
              s3: e3
            } = t[w * windowSize + bit];
            o0 ^= e0, o1 ^= e1, o2 ^= e2, o3 ^= e3;
            w += 1;
          }
        }
      }
      this.s0 = o0;
      this.s1 = o1;
      this.s2 = o2;
      this.s3 = o3;
    }
    update(data) {
      data = toBytes2(data);
      aexists(this);
      const b32 = u32(data);
      const blocks = Math.floor(data.length / BLOCK_SIZE);
      const left = data.length % BLOCK_SIZE;
      for (let i = 0; i < blocks; i++) {
        this._updateBlock(b32[i * 4 + 0], b32[i * 4 + 1], b32[i * 4 + 2], b32[i * 4 + 3]);
      }
      if (left) {
        ZEROS16.set(data.subarray(blocks * BLOCK_SIZE));
        this._updateBlock(ZEROS32[0], ZEROS32[1], ZEROS32[2], ZEROS32[3]);
        clean(ZEROS32);
      }
      return this;
    }
    destroy() {
      const {
        t
      } = this;
      for (const elm of t) {
        elm.s0 = 0, elm.s1 = 0, elm.s2 = 0, elm.s3 = 0;
      }
    }
    digestInto(out) {
      aexists(this);
      aoutput(out, this);
      this.finished = true;
      const {
        s0,
        s1,
        s2,
        s3
      } = this;
      const o32 = u32(out);
      o32[0] = s0;
      o32[1] = s1;
      o32[2] = s2;
      o32[3] = s3;
      return out;
    }
    digest() {
      const res = new Uint8Array(BLOCK_SIZE);
      this.digestInto(res);
      this.destroy();
      return res;
    }
  };
  var Polyval = class extends GHASH {
    constructor(key, expectedLength) {
      key = toBytes2(key);
      const ghKey = _toGHASHKey(copyBytes(key));
      super(ghKey, expectedLength);
      clean(ghKey);
    }
    update(data) {
      data = toBytes2(data);
      aexists(this);
      const b32 = u32(data);
      const left = data.length % BLOCK_SIZE;
      const blocks = Math.floor(data.length / BLOCK_SIZE);
      for (let i = 0; i < blocks; i++) {
        this._updateBlock(swapLE(b32[i * 4 + 3]), swapLE(b32[i * 4 + 2]), swapLE(b32[i * 4 + 1]), swapLE(b32[i * 4 + 0]));
      }
      if (left) {
        ZEROS16.set(data.subarray(blocks * BLOCK_SIZE));
        this._updateBlock(swapLE(ZEROS32[3]), swapLE(ZEROS32[2]), swapLE(ZEROS32[1]), swapLE(ZEROS32[0]));
        clean(ZEROS32);
      }
      return this;
    }
    digestInto(out) {
      aexists(this);
      aoutput(out, this);
      this.finished = true;
      const {
        s0,
        s1,
        s2,
        s3
      } = this;
      const o32 = u32(out);
      o32[0] = s0;
      o32[1] = s1;
      o32[2] = s2;
      o32[3] = s3;
      return out.reverse();
    }
  };
  function wrapConstructorWithKey(hashCons) {
    const hashC = (msg, key) => hashCons(key, msg.length).update(toBytes2(msg)).digest();
    const tmp2 = hashCons(new Uint8Array(16), 0);
    hashC.outputLen = tmp2.outputLen;
    hashC.blockLen = tmp2.blockLen;
    hashC.create = (key, expectedLength) => hashCons(key, expectedLength);
    return hashC;
  }
  var ghash = wrapConstructorWithKey((key, expectedLength) => new GHASH(key, expectedLength));
  var polyval = wrapConstructorWithKey((key, expectedLength) => new Polyval(key, expectedLength));

  // src/sm4/index.ts
  var DECRYPT = 0;
  var ROUND = 32;
  var BLOCK = 16;
  var Sbox = Uint8Array.from([214, 144, 233, 254, 204, 225, 61, 183, 22, 182, 20, 194, 40, 251, 44, 5, 43, 103, 154, 118, 42, 190, 4, 195, 170, 68, 19, 38, 73, 134, 6, 153, 156, 66, 80, 244, 145, 239, 152, 122, 51, 84, 11, 67, 237, 207, 172, 98, 228, 179, 28, 169, 201, 8, 232, 149, 128, 223, 148, 250, 117, 143, 63, 166, 71, 7, 167, 252, 243, 115, 23, 186, 131, 89, 60, 25, 230, 133, 79, 168, 104, 107, 129, 178, 113, 100, 218, 139, 248, 235, 15, 75, 112, 86, 157, 53, 30, 36, 14, 94, 99, 88, 209, 162, 37, 34, 124, 59, 1, 33, 120, 135, 212, 0, 70, 87, 159, 211, 39, 82, 76, 54, 2, 231, 160, 196, 200, 158, 234, 191, 138, 210, 64, 199, 56, 181, 163, 247, 242, 206, 249, 97, 21, 161, 224, 174, 93, 164, 155, 52, 26, 85, 173, 147, 50, 48, 245, 140, 177, 227, 29, 246, 226, 46, 130, 102, 202, 96, 192, 41, 35, 171, 13, 83, 78, 111, 213, 219, 55, 69, 222, 253, 142, 47, 3, 255, 106, 114, 109, 108, 91, 81, 141, 27, 175, 146, 187, 221, 188, 127, 17, 217, 92, 65, 31, 16, 90, 216, 10, 193, 49, 136, 165, 205, 123, 189, 45, 116, 208, 18, 184, 229, 180, 176, 137, 105, 151, 74, 12, 150, 119, 126, 101, 185, 241, 9, 197, 110, 198, 132, 24, 240, 125, 236, 58, 220, 77, 32, 121, 238, 95, 62, 215, 203, 57, 72]);
  var CK = new Uint32Array([462357, 472066609, 943670861, 1415275113, 1886879365, 2358483617, 2830087869, 3301692121, 3773296373, 4228057617, 404694573, 876298825, 1347903077, 1819507329, 2291111581, 2762715833, 3234320085, 3705924337, 4177462797, 337322537, 808926789, 1280531041, 1752135293, 2223739545, 2695343797, 3166948049, 3638552301, 4110090761, 269950501, 741554753, 1213159005, 1684763257]);
  function byteSub(a) {
    return (Sbox[a >>> 24 & 255] & 255) << 24 | (Sbox[a >>> 16 & 255] & 255) << 16 | (Sbox[a >>> 8 & 255] & 255) << 8 | Sbox[a & 255] & 255;
  }
  var x = new Uint32Array(4);
  var tmp = new Uint32Array(4);
  function sms4Crypt(input, output, roundKey) {
    let x0 = 0,
      x1 = 0,
      x2 = 0,
      x3 = 0,
      tmp0 = 0,
      tmp1 = 0,
      tmp2 = 0,
      tmp3 = 0;
    tmp0 = input[0] & 255;
    tmp1 = input[1] & 255;
    tmp2 = input[2] & 255;
    tmp3 = input[3] & 255;
    x0 = tmp0 << 24 | tmp1 << 16 | tmp2 << 8 | tmp3;
    tmp0 = input[4] & 255;
    tmp1 = input[5] & 255;
    tmp2 = input[6] & 255;
    tmp3 = input[7] & 255;
    x1 = tmp0 << 24 | tmp1 << 16 | tmp2 << 8 | tmp3;
    tmp0 = input[8] & 255;
    tmp1 = input[9] & 255;
    tmp2 = input[10] & 255;
    tmp3 = input[11] & 255;
    x2 = tmp0 << 24 | tmp1 << 16 | tmp2 << 8 | tmp3;
    tmp0 = input[12] & 255;
    tmp1 = input[13] & 255;
    tmp2 = input[14] & 255;
    tmp3 = input[15] & 255;
    x3 = tmp0 << 24 | tmp1 << 16 | tmp2 << 8 | tmp3;
    for (let r = 0; r < 32; r += 4) {
      tmp0 = x1 ^ x2 ^ x3 ^ roundKey[r];
      tmp0 = byteSub(tmp0);
      x0 ^= tmp0 ^ (tmp0 << 2 | tmp0 >>> 30) ^ (tmp0 << 10 | tmp0 >>> 22) ^ (tmp0 << 18 | tmp0 >>> 14) ^ (tmp0 << 24 | tmp0 >>> 8);
      tmp1 = x2 ^ x3 ^ x0 ^ roundKey[r + 1];
      tmp1 = byteSub(tmp1);
      x1 ^= tmp1 ^ (tmp1 << 2 | tmp1 >>> 30) ^ (tmp1 << 10 | tmp1 >>> 22) ^ (tmp1 << 18 | tmp1 >>> 14) ^ (tmp1 << 24 | tmp1 >>> 8);
      tmp2 = x3 ^ x0 ^ x1 ^ roundKey[r + 2];
      tmp2 = byteSub(tmp2);
      x2 ^= tmp2 ^ (tmp2 << 2 | tmp2 >>> 30) ^ (tmp2 << 10 | tmp2 >>> 22) ^ (tmp2 << 18 | tmp2 >>> 14) ^ (tmp2 << 24 | tmp2 >>> 8);
      tmp3 = x0 ^ x1 ^ x2 ^ roundKey[r + 3];
      tmp3 = byteSub(tmp3);
      x3 ^= tmp3 ^ (tmp3 << 2 | tmp3 >>> 30) ^ (tmp3 << 10 | tmp3 >>> 22) ^ (tmp3 << 18 | tmp3 >>> 14) ^ (tmp3 << 24 | tmp3 >>> 8);
    }
    output[0] = x3 >>> 24 & 255;
    output[1] = x3 >>> 16 & 255;
    output[2] = x3 >>> 8 & 255;
    output[3] = x3 & 255;
    output[4] = x2 >>> 24 & 255;
    output[5] = x2 >>> 16 & 255;
    output[6] = x2 >>> 8 & 255;
    output[7] = x2 & 255;
    output[8] = x1 >>> 24 & 255;
    output[9] = x1 >>> 16 & 255;
    output[10] = x1 >>> 8 & 255;
    output[11] = x1 & 255;
    output[12] = x0 >>> 24 & 255;
    output[13] = x0 >>> 16 & 255;
    output[14] = x0 >>> 8 & 255;
    output[15] = x0 & 255;
  }
  function sms4KeyExt(key, roundKey, cryptFlag) {
    let x0 = 0,
      x1 = 0,
      x2 = 0,
      x3 = 0,
      mid = 0;
    x0 = (key[0] & 255) << 24 | (key[1] & 255) << 16 | (key[2] & 255) << 8 | key[3] & 255;
    x1 = (key[4] & 255) << 24 | (key[5] & 255) << 16 | (key[6] & 255) << 8 | key[7] & 255;
    x2 = (key[8] & 255) << 24 | (key[9] & 255) << 16 | (key[10] & 255) << 8 | key[11] & 255;
    x3 = (key[12] & 255) << 24 | (key[13] & 255) << 16 | (key[14] & 255) << 8 | key[15] & 255;
    x0 ^= 2746333894;
    x1 ^= 1453994832;
    x2 ^= 1736282519;
    x3 ^= 2993693404;
    for (let r = 0; r < 32; r += 4) {
      mid = x1 ^ x2 ^ x3 ^ CK[r + 0];
      mid = byteSub(mid);
      x0 ^= mid ^ (mid << 13 | mid >>> 19) ^ (mid << 23 | mid >>> 9);
      roundKey[r + 0] = x0;
      mid = x2 ^ x3 ^ x0 ^ CK[r + 1];
      mid = byteSub(mid);
      x1 ^= mid ^ (mid << 13 | mid >>> 19) ^ (mid << 23 | mid >>> 9);
      roundKey[r + 1] = x1;
      mid = x3 ^ x0 ^ x1 ^ CK[r + 2];
      mid = byteSub(mid);
      x2 ^= mid ^ (mid << 13 | mid >>> 19) ^ (mid << 23 | mid >>> 9);
      roundKey[r + 2] = x2;
      mid = x0 ^ x1 ^ x2 ^ CK[r + 3];
      mid = byteSub(mid);
      x3 ^= mid ^ (mid << 13 | mid >>> 19) ^ (mid << 23 | mid >>> 9);
      roundKey[r + 3] = x3;
    }
    if (cryptFlag === DECRYPT) {
      for (let r = 0; r < 16; r++) {
        [roundKey[r], roundKey[31 - r]] = [roundKey[31 - r], roundKey[r]];
      }
    }
  }
  function incrementCounter(counter) {
    for (let i = counter.length - 1; i >= 0; i--) {
      counter[i]++;
      if (counter[i] !== 0) break;
    }
  }
  function sm4Gcm(inArray, key, ivArray, aadArray, cryptFlag, tagArray) {
    const tagLength = 16;
    function deriveKeys() {
      const roundKey2 = new Uint32Array(ROUND);
      sms4KeyExt(key, roundKey2, 1);
      const authKey = new Uint8Array(16).fill(0);
      const h2 = new Uint8Array(16);
      sms4Crypt(authKey, h2, roundKey2);
      let j02;
      if (ivArray.length === 12) {
        j02 = new Uint8Array(16);
        j02.set(ivArray, 0);
        j02[15] = 1;
      } else {
        const g = ghash.create(h2);
        g.update(ivArray);
        const lenIv = new Uint8Array(16);
        const view = createView2(lenIv);
        setBigUint642(view, 8, BigInt(ivArray.length * 8), false);
        g.update(lenIv);
        j02 = g.digest();
      }
      const counter2 = new Uint8Array(j02);
      incrementCounter(counter2);
      const tagMask2 = new Uint8Array(16);
      sms4Crypt(j02, tagMask2, roundKey2);
      return {
        roundKey: roundKey2,
        h: h2,
        j0: j02,
        counter: counter2,
        tagMask: tagMask2
      };
    }
    function computeTag(h2, data) {
      const aadLength = aadArray.length;
      const dataLength = data.length;
      const g = ghash.create(h2);
      if (aadLength > 0) {
        g.update(aadArray);
      }
      g.update(data);
      const lenBlock = new Uint8Array(16);
      const view = createView2(lenBlock);
      setBigUint642(view, 0, BigInt(aadLength * 8), false);
      setBigUint642(view, 8, BigInt(dataLength * 8), false);
      g.update(lenBlock);
      return g.digest();
    }
    const {
      roundKey,
      h,
      j0,
      counter,
      tagMask
    } = deriveKeys();
    if (cryptFlag === DECRYPT && tagArray) {
      const calculatedTag = computeTag(h, inArray);
      for (let i = 0; i < 16; i++) {
        calculatedTag[i] ^= tagMask[i];
      }
      let tagMatch = 0;
      for (let i = 0; i < 16; i++) {
        tagMatch |= calculatedTag[i] ^ tagArray[i];
      }
      if (tagMatch !== 0) {
        throw new Error("authentication tag mismatch");
      }
    }
    const outArray = new Uint8Array(inArray.length);
    let point = 0;
    let restLen = inArray.length;
    while (restLen >= BLOCK) {
      const blockOut = new Uint8Array(BLOCK);
      sms4Crypt(counter, blockOut, roundKey);
      for (let i = 0; i < BLOCK && i < restLen; i++) {
        outArray[point + i] = inArray[point + i] ^ blockOut[i];
      }
      incrementCounter(counter);
      point += BLOCK;
      restLen -= BLOCK;
    }
    if (restLen > 0) {
      const blockOut = new Uint8Array(BLOCK);
      sms4Crypt(counter, blockOut, roundKey);
      for (let i = 0; i < restLen; i++) {
        outArray[point + i] = inArray[point + i] ^ blockOut[i];
      }
    }
    if (cryptFlag !== DECRYPT) {
      const calculatedTag = computeTag(h, outArray);
      for (let i = 0; i < 16; i++) {
        calculatedTag[i] ^= tagMask[i];
      }
      return {
        output: outArray,
        tag: calculatedTag
      };
    }
    return {
      output: outArray
    };
  }
  var blockOutput = new Uint8Array(16);
  function sm4(inArray, key, cryptFlag, options = {}) {
    let {
      padding = "pkcs#7",
      mode,
      iv = new Uint8Array(16),
      output,
      associatedData,
      outputTag,
      tag
    } = options;
    if (mode === "gcm") {
      const keyArray = typeof key === "string" ? hexToArray(key) : Uint8Array.from(key);
      const ivArray = typeof iv === "string" ? hexToArray(iv) : Uint8Array.from(iv);
      const aadArray = associatedData ? typeof associatedData === "string" ? hexToArray(associatedData) : Uint8Array.from(associatedData) : new Uint8Array(0);
      let inputArray;
      if (typeof inArray === "string") {
        if (cryptFlag !== DECRYPT) {
          inputArray = utf8ToArray(inArray);
        } else {
          inputArray = hexToArray(inArray);
        }
      } else {
        inputArray = Uint8Array.from(inArray);
      }
      const tagArray = tag ? typeof tag === "string" ? hexToArray(tag) : Uint8Array.from(tag) : void 0;
      const result = sm4Gcm(inputArray, keyArray, ivArray, aadArray, cryptFlag, tagArray);
      if (output === "array") {
        if (outputTag && cryptFlag !== DECRYPT) {
          return result;
        }
        return result.output;
      } else {
        if (outputTag && cryptFlag !== DECRYPT) {
          return {
            output: bytesToHex2(result.output),
            tag: result.tag ? bytesToHex2(result.tag) : void 0
          };
        }
        if (cryptFlag !== DECRYPT) {
          return {
            output: bytesToHex2(result.output),
            tag: result.tag ? bytesToHex2(result.tag) : void 0
          };
        } else {
          return arrayToUtf8(result.output);
        }
      }
    }
    if (mode === "cbc") {
      if (typeof iv === "string") iv = hexToArray(iv);
      if (iv.length !== 128 / 8) {
        throw new Error("iv is invalid");
      }
    }
    if (typeof key === "string") key = hexToArray(key);
    if (key.length !== 128 / 8) {
      throw new Error("key is invalid");
    }
    if (typeof inArray === "string") {
      if (cryptFlag !== DECRYPT) {
        inArray = utf8ToArray(inArray);
      } else {
        inArray = hexToArray(inArray);
      }
    } else {
      inArray = Uint8Array.from(inArray);
    }
    if ((padding === "pkcs#5" || padding === "pkcs#7") && cryptFlag !== DECRYPT) {
      const paddingCount = BLOCK - inArray.length % BLOCK;
      const newArray = new Uint8Array(inArray.length + paddingCount);
      newArray.set(inArray, 0);
      for (let i = 0; i < paddingCount; i++) newArray[inArray.length + i] = paddingCount;
      inArray = newArray;
    }
    const roundKey = new Uint32Array(ROUND);
    sms4KeyExt(key, roundKey, cryptFlag);
    let outArray = new Uint8Array(inArray.length);
    let lastVector = iv;
    let restLen = inArray.length;
    let point = 0;
    while (restLen >= BLOCK) {
      const input = inArray.subarray(point, point + 16);
      if (mode === "cbc") {
        for (let i = 0; i < BLOCK; i++) {
          if (cryptFlag !== DECRYPT) {
            input[i] ^= lastVector[i];
          }
        }
      }
      sms4Crypt(input, blockOutput, roundKey);
      for (let i = 0; i < BLOCK; i++) {
        if (mode === "cbc") {
          if (cryptFlag === DECRYPT) {
            blockOutput[i] ^= lastVector[i];
          }
        }
        outArray[point + i] = blockOutput[i];
      }
      if (mode === "cbc") {
        if (cryptFlag !== DECRYPT) {
          lastVector = blockOutput;
        } else {
          lastVector = input;
        }
      }
      restLen -= BLOCK;
      point += BLOCK;
    }
    if ((padding === "pkcs#5" || padding === "pkcs#7") && cryptFlag === DECRYPT) {
      const len = outArray.length;
      const paddingCount = outArray[len - 1];
      for (let i = 1; i <= paddingCount; i++) {
        if (outArray[len - i] !== paddingCount) throw new Error("padding is invalid");
      }
      outArray = outArray.slice(0, len - paddingCount);
    }
    if (output !== "array") {
      if (cryptFlag !== DECRYPT) {
        return bytesToHex2(outArray);
      } else {
        return arrayToUtf8(outArray);
      }
    } else {
      return outArray;
    }
  }
  function encrypt(inArray, key, options = {}) {
    return sm4(inArray, key, 1, options);
  }
  function decrypt(inArray, key, options = {}) {
    return sm4(inArray, key, 0, options);
  }

  /*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
  /*! Bundled license information:
  
  @noble/curves/esm/abstract/utils.js:
    (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
  
  @noble/curves/esm/abstract/modular.js:
    (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
  
  @noble/curves/esm/abstract/curve.js:
    (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
  
  @noble/curves/esm/abstract/weierstrass.js:
    (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
  
  @noble/ciphers/esm/utils.js:
    (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)
  */
});