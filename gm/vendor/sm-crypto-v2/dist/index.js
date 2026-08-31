"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));
var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/index.ts
var src_exports = {};
__export(src_exports, {
  hkdf: () => hkdf,
  kdf: () => kdf,
  sm2: () => sm2_exports,
  sm3: () => sm32,
  sm4: () => sm4_exports
});
module.exports = __toCommonJS(src_exports);

// src/sm2/index.ts
var sm2_exports = {};
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

// src/sm2/asn1.ts
var utils = __toESM(require("@noble/curves/abstract/utils"));

// src/sm2/bn.ts
var ZERO = BigInt(0);
var ONE = BigInt(1);
var TWO = BigInt(2);
var THREE = BigInt(3);

// src/sm2/asn1.ts
function bigintToValue(bigint) {
  let h = bigint.toString(16);
  if (h[0] !== "-") {
    if (h.length % 2 === 1)
      h = "0" + h;
    else if (!h.match(/^[0-7]/))
      h = "00" + h;
  } else {
    h = h.substring(1);
    let len = h.length;
    if (len % 2 === 1)
      len += 1;
    else if (!h.match(/^[0-7]/))
      len += 2;
    let maskString = "";
    for (let i = 0; i < len; i++)
      maskString += "f";
    let mask = utils.hexToNumber(maskString);
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
    if (nHex.length % 2 === 1)
      nHex = "0" + nHex;
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
    if (bigint)
      this.v = bigintToValue(bigint);
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
    if (s)
      this.v = s.toLowerCase();
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
    this.v = this.asn1Array.map((asn1Object) => asn1Object.getEncodedHex()).join("");
    return this.v;
  }
};
function getLenOfL(str, start) {
  if (+str[start + 2] < 8)
    return 1;
  const encoded = str.slice(start + 2, start + 6);
  const headHex = encoded.slice(0, 2);
  const head = parseInt(headHex, 16);
  const nHexLength = 1 + (head - 128);
  return nHexLength;
}
function getL(str, start) {
  const len = getLenOfL(str, start);
  const l = str.substring(start + 2, start + 2 + len * 2);
  if (!l)
    return -1;
  const bigint = +l[0] < 8 ? utils.hexToNumber(l) : utils.hexToNumber(l.substring(2));
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
  const r = utils.hexToNumber(vR);
  const s = utils.hexToNumber(vS);
  return { r, s };
}
function decodeEnc(input) {
  function extractSequence(input2, start2) {
    const vIndex = getStartOfV(input2, start2);
    const length = getL(input2, start2);
    const value = input2.substring(vIndex, vIndex + length * 2);
    const nextStart = vIndex + value.length;
    return { value, nextStart };
  }
  const start = getStartOfV(input, 0);
  const { value: vR, nextStart: startS } = extractSequence(input, start);
  const { value: vS, nextStart: startHash } = extractSequence(input, startS);
  const { value: hash, nextStart: startCipher } = extractSequence(input, startHash);
  const { value: cipher } = extractSequence(input, startCipher);
  const x2 = utils.hexToNumber(vR);
  const y = utils.hexToNumber(vS);
  return { x: x2, y, hash, cipher };
}

// src/sm2/utils.ts
var utils2 = __toESM(require("@noble/curves/abstract/utils"));

// src/sm2/ec.ts
var import_weierstrass = require("@noble/curves/abstract/weierstrass");
var import_modular = require("@noble/curves/abstract/modular");

// src/sm2/rng.ts
var DEFAULT_PRNG_POOL_SIZE = 16384;
var prngPool = new Uint8Array(0);
var _syncCrypto;
async function initRNGPool() {
  if ("crypto" in globalThis) {
    _syncCrypto = globalThis.crypto;
    return;
  }
  if (prngPool.length > DEFAULT_PRNG_POOL_SIZE / 2)
    return;
  if ("wx" in globalThis && "getRandomValues" in globalThis.wx) {
    prngPool = await new Promise((r) => {
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
        const crypto = await import(
          /* webpackIgnore: true */
          "crypto"
        );
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
var u8a = (a) => a instanceof Uint8Array;
var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
var isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
if (!isLE)
  throw new Error("Non little-endian hardware is not supported");
var hexes = Array.from(
  { length: 256 },
  (v, i) => i.toString(16).padStart(2, "0")
);
function bytesToHex(bytes) {
  if (!u8a(bytes))
    throw new Error("Uint8Array expected");
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}
var te = typeof TextEncoder != "undefined" && /* @__PURE__ */ new TextEncoder();
var slc = (v, s, e) => {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new Uint8Array(v.subarray(s, e));
};
function strToU8(str) {
  if (te)
    return te.encode(str);
  const l = str.length;
  let ar = new Uint8Array(str.length + (str.length >> 1));
  let ai = 0;
  const w = (v) => {
    ar[ai++] = v;
  };
  for (let i = 0; i < l; ++i) {
    if (ai + 5 > ar.length) {
      const n = new Uint8Array(ai + 8 + (l - i << 1));
      n.set(ar);
      ar = n;
    }
    let c = str.charCodeAt(i);
    if (c < 128)
      w(c);
    else if (c < 2048)
      w(192 | c >> 6), w(128 | c & 63);
    else if (c > 55295 && c < 57344)
      c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
    else
      w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
  }
  return slc(ar, 0, ai);
}
function toBytes(data) {
  if (typeof data === "string")
    data = strToU8(data);
  if (!u8a(data))
    throw new Error(`expected Uint8Array, got ${typeof data}`);
  return data;
}
var Hash = class {
  // Safe version that clones internal state
  clone() {
    return this._cloneInto();
  }
};
function wrapConstructor(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
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
function setBigUint64(view, byteOffset, value, isLE2) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE2);
  const _32n = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE2 ? 4 : 0;
  const l = isLE2 ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE2);
  view.setUint32(byteOffset + l, wl, isLE2);
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
  constructor(blockLen, outputLen, padOffset, isLE2) {
    super();
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE2;
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
    const { view, buffer, blockLen } = this;
    data = toBytes(data);
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
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
    const { buffer, view, blockLen, isLE: isLE2 } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    this.buffer.subarray(pos).fill(0);
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE2);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE2);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to || (to = new this.constructor());
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.length = length;
    to.pos = pos;
    to.finished = finished;
    to.destroyed = destroyed;
    if (length % blockLen)
      to.buffer.set(buffer);
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
    const { A, B, C, D, E, F, G, H } = this;
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
    for (let i = 0; i < 16; i++, offset += 4)
      SM3_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 68; i++) {
      SM3_W[i] = P1(SM3_W[i - 16] ^ SM3_W[i - 9] ^ rotl(SM3_W[i - 3], 15)) ^ rotl(SM3_W[i - 13], 7) ^ SM3_W[i - 6];
    }
    for (let i = 0; i < 64; i++) {
      SM3_M[i] = SM3_W[i] ^ SM3_W[i + 4];
    }
    let { A, B, C, D, E, F, G, H } = this;
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
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash.create();
    for (let i = 0; i < pad.length; i++)
      pad[i] ^= 54 ^ 92;
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
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
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
var import_utils3 = require("@noble/curves/abstract/utils");
var sm2Fp = (0, import_modular.Field)(BigInt("115792089210356248756420345214020892766250353991924191454421193933289684991999"));
var sm2Curve = (0, import_weierstrass.weierstrass)({
  // sm2: short weierstrass.
  a: BigInt("115792089210356248756420345214020892766250353991924191454421193933289684991996"),
  b: BigInt("18505919022281880113072981827955639221458448578012075254857346196103069175443"),
  Fp: sm2Fp,
  h: ONE,
  n: BigInt("115792089210356248756420345214020892766061623724957744567843809356293439045923"),
  Gx: BigInt("22963146547237050559479531362550074578802567295341616970375194840604139615431"),
  Gy: BigInt("85132369209828568825618990617112496413088388631904505083283536607588877201568"),
  hash: sm3,
  hmac: (key, ...msgs) => hmac(sm3, key, (0, import_utils3.concatBytes)(...msgs)),
  randomBytes
});
var field = (0, import_modular.Field)(BigInt(sm2Curve.CURVE.n));

// src/sm2/utils.ts
var import_modular2 = require("@noble/curves/abstract/modular");
function generateKeyPairHex(str) {
  const privateKey = str ? utils2.numberToBytesBE((0, import_modular2.mod)(BigInt(str), ONE) + ONE, 32) : sm2Curve.utils.randomPrivateKey();
  const publicKey = sm2Curve.getPublicKey(privateKey, false);
  const privPad = leftPad(utils2.bytesToHex(privateKey), 64);
  const pubPad = leftPad(utils2.bytesToHex(publicKey), 64);
  return { privateKey: privPad, publicKey: pubPad };
}
function compressPublicKeyHex(s) {
  if (s.length !== 130)
    throw new Error("Invalid public key to compress");
  const len = (s.length - 2) / 2;
  const xHex = s.substring(2, 2 + len);
  const y = utils2.hexToNumber(s.substring(len + 2, len + len + 2));
  let prefix = "03";
  if ((0, import_modular2.mod)(y, TWO) === ZERO)
    prefix = "02";
  return prefix + xHex;
}
function utf8ToHex(input) {
  const bytes = strToU8(input);
  return utils2.bytesToHex(bytes);
}
function leftPad(input, num) {
  if (input.length >= num)
    return input;
  return new Array(num - input.length + 1).join("0") + input;
}
function arrayToHex(arr) {
  return arr.map((item) => {
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
  if (!point)
    return false;
  try {
    point.assertValidity();
    return true;
  } catch (error) {
    return false;
  }
}
function comparePublicKeyHex(publicKey1, publicKey2) {
  const point1 = sm2Curve.ProjectivePoint.fromHex(publicKey1);
  if (!point1)
    return false;
  const point2 = sm2Curve.ProjectivePoint.fromHex(publicKey2);
  if (!point2)
    return false;
  return point1.equals(point2);
}

// src/sm2/index.ts
var utils5 = __toESM(require("@noble/curves/abstract/utils"));

// src/sm2/kdf.ts
var utils3 = __toESM(require("@noble/curves/abstract/utils"));

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
    if (mode !== "hmac")
      throw new Error("invalid mode");
    let key = options.key;
    if (!key)
      throw new Error("invalid key");
    key = typeof key === "string" ? hexToArray(key) : key;
    return bytesToHex(hmac(sm3, key, input));
  }
  return bytesToHex(sm3(input));
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
    t = sm3(utils3.concatBytes(z, ctShift, IV2));
    ct++;
    offset = 0;
  };
  nextT();
  for (let i = 0, len = msg.length; i < len; i++) {
    if (offset === t.length)
      nextT();
    msg[i] = t[offset++] & 255;
  }
  return msg;
}

// src/sm2/kx.ts
var utils4 = __toESM(require("@noble/curves/abstract/utils"));
var wPow2 = utils4.hexToNumber("80000000000000000000000000000000");
var wPow2Sub1 = utils4.hexToNumber("7fffffffffffffffffffffffffffffff");
function calculateSharedKey(keypairA, ephemeralKeypairA, publicKeyB, ephemeralPublicKeyB, sharedKeyLength, isRecipient = false, idA = "1234567812345678", idB = "1234567812345678") {
  const RA = sm2Curve.ProjectivePoint.fromHex(ephemeralKeypairA.publicKey);
  const RB = sm2Curve.ProjectivePoint.fromHex(ephemeralPublicKeyB);
  const PB = sm2Curve.ProjectivePoint.fromHex(publicKeyB);
  let ZA = getZ(keypairA.publicKey, idA);
  let ZB = getZ(publicKeyB, idB);
  if (isRecipient) {
    [ZA, ZB] = [ZB, ZA];
  }
  const rA = utils4.hexToNumber(ephemeralKeypairA.privateKey);
  const dA = utils4.hexToNumber(keypairA.privateKey);
  const x1 = RA.x;
  const x1_ = wPow2 + (x1 & wPow2Sub1);
  const tA = field.add(dA, field.mulN(x1_, rA));
  const x2 = RB.x;
  const x2_ = field.add(wPow2, x2 & wPow2Sub1);
  const U = RB.multiply(x2_).add(PB).multiply(tA);
  const xU = hexToArray(leftPad(utils4.numberToHexUnpadded(U.x), 64));
  const yU = hexToArray(leftPad(utils4.numberToHexUnpadded(U.y), 64));
  const KA = kdf(utils4.concatBytes(xU, yU, ZA, ZB), sharedKeyLength);
  return KA;
}

// src/sm2/index.ts
var { getSharedSecret } = sm2Curve;
function xorCipherStream(x2, y2, msg) {
  const stream = kdf(utils5.concatBytes(x2, y2), msg.length);
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
  const k = utils5.hexToNumber(keypair.privateKey);
  let c1 = keypair.publicKey;
  if (c1.length > 128)
    c1 = c1.substring(c1.length - 128);
  const p = publicKeyPoint.multiply(k);
  const x2 = hexToArray(leftPad(utils5.numberToHexUnpadded(p.x), 64));
  const y2 = hexToArray(leftPad(utils5.numberToHexUnpadded(p.y), 64));
  const c3 = bytesToHex(sm3(utils5.concatBytes(x2, msgArr, y2)));
  xorCipherStream(x2, y2, msgArr);
  const c2 = bytesToHex(msgArr);
  if (options?.asn1) {
    const point = sm2Curve.ProjectivePoint.fromHex(keypair.publicKey);
    const encode = cipherMode === C1C2C3 ? encodeEnc(point.x, point.y, c2, c3) : encodeEnc(point.x, point.y, c3, c2);
    return encode;
  }
  return cipherMode === C1C2C3 ? c1 + c2 + c3 : c1 + c3 + c2;
}
function doDecrypt(encryptData, privateKey, cipherMode = 1, options) {
  const { output = "string", asn1 = false } = options || {};
  const privateKeyInteger = utils5.hexToNumber(privateKey);
  let c1;
  let c2;
  let c3;
  if (asn1) {
    const { x: x3, y, cipher, hash } = decodeEnc(encryptData);
    c1 = sm2Curve.ProjectivePoint.fromAffine({ x: x3, y });
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
  const x2 = hexToArray(leftPad(utils5.numberToHexUnpadded(p.x), 64));
  const y2 = hexToArray(leftPad(utils5.numberToHexUnpadded(p.y), 64));
  xorCipherStream(x2, y2, msg);
  const checkC3 = arrayToHex(Array.from(sm3(utils5.concatBytes(x2, msg, y2))));
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
  const dA = utils5.hexToNumber(privateKey);
  const e = utils5.hexToNumber(hashHex);
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
  if (der)
    return encodeDer(r, s);
  return leftPad(utils5.numberToHexUnpadded(r), 64) + leftPad(utils5.numberToHexUnpadded(s), 64);
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
    r = utils5.hexToNumber(signHex.substring(0, 64));
    s = utils5.hexToNumber(signHex.substring(64));
  }
  const PA = typeof publicKey === "string" ? sm2Curve.ProjectivePoint.fromHex(publicKey) : publicKey;
  const e = utils5.hexToNumber(hashHex);
  const t = field.add(r, s);
  if (t === ZERO)
    return false;
  const x1y1 = sm2Curve.ProjectivePoint.BASE.multiply(s).add(PA.multiply(t));
  const R = field.add(e, x1y1.x);
  return r === R;
}
function getZ(publicKey, userId = "1234567812345678") {
  userId = utf8ToHex(userId);
  const a = leftPad(utils5.numberToHexUnpadded(sm2Curve.CURVE.a), 64);
  const b = leftPad(utils5.numberToHexUnpadded(sm2Curve.CURVE.b), 64);
  const gx = leftPad(utils5.numberToHexUnpadded(sm2Curve.ProjectivePoint.BASE.x), 64);
  const gy = leftPad(utils5.numberToHexUnpadded(sm2Curve.ProjectivePoint.BASE.y), 64);
  let px;
  let py;
  if (publicKey.length === 128) {
    px = publicKey.substring(0, 64);
    py = publicKey.substring(64, 128);
  } else {
    const point = sm2Curve.ProjectivePoint.fromHex(publicKey);
    px = leftPad(utils5.numberToHexUnpadded(point.x), 64);
    py = leftPad(utils5.numberToHexUnpadded(point.y), 64);
  }
  const data = hexToArray(userId + a + b + gx + gy + px + py);
  const entl = userId.length * 4;
  const z = sm3(utils5.concatBytes(new Uint8Array([entl >> 8 & 255, entl & 255]), data));
  return z;
}
function getHash(hashHex, publicKey, userId = "1234567812345678") {
  const z = getZ(publicKey, userId);
  return bytesToHex(sm3(utils5.concatBytes(z, typeof hashHex === "string" ? hexToArray(hashHex) : hashHex)));
}
function precomputePublicKey(publicKey, windowSize) {
  const point = sm2Curve.ProjectivePoint.fromHex(publicKey);
  return sm2Curve.utils.precompute(windowSize, point);
}
function getPublicKeyFromPrivateKey(privateKey) {
  const pubKey = sm2Curve.getPublicKey(privateKey, false);
  const pubPad = leftPad(utils5.bytesToHex(pubKey), 64);
  return pubPad;
}
function getPoint() {
  const keypair = generateKeyPairHex();
  const PA = sm2Curve.ProjectivePoint.fromHex(keypair.publicKey);
  const k = utils5.hexToNumber(keypair.privateKey);
  return {
    ...keypair,
    k,
    x1: PA.x
  };
}

// src/sm3/hkdf.ts
var import_hkdf = require("@noble/hashes/hkdf");
function hkdf(ikm, salt, info, length) {
  return (0, import_hkdf.hkdf)(sm3, ikm, salt, info, length);
}

// src/sm4/index.ts
var sm4_exports = {};
__export(sm4_exports, {
  decrypt: () => decrypt,
  encrypt: () => encrypt,
  sm4: () => sm4
});
var import_polyval = require("@noble/ciphers/_polyval");
var import_utils12 = require("@noble/ciphers/utils");
var DECRYPT = 0;
var ROUND = 32;
var BLOCK = 16;
var Sbox = Uint8Array.from([
  214,
  144,
  233,
  254,
  204,
  225,
  61,
  183,
  22,
  182,
  20,
  194,
  40,
  251,
  44,
  5,
  43,
  103,
  154,
  118,
  42,
  190,
  4,
  195,
  170,
  68,
  19,
  38,
  73,
  134,
  6,
  153,
  156,
  66,
  80,
  244,
  145,
  239,
  152,
  122,
  51,
  84,
  11,
  67,
  237,
  207,
  172,
  98,
  228,
  179,
  28,
  169,
  201,
  8,
  232,
  149,
  128,
  223,
  148,
  250,
  117,
  143,
  63,
  166,
  71,
  7,
  167,
  252,
  243,
  115,
  23,
  186,
  131,
  89,
  60,
  25,
  230,
  133,
  79,
  168,
  104,
  107,
  129,
  178,
  113,
  100,
  218,
  139,
  248,
  235,
  15,
  75,
  112,
  86,
  157,
  53,
  30,
  36,
  14,
  94,
  99,
  88,
  209,
  162,
  37,
  34,
  124,
  59,
  1,
  33,
  120,
  135,
  212,
  0,
  70,
  87,
  159,
  211,
  39,
  82,
  76,
  54,
  2,
  231,
  160,
  196,
  200,
  158,
  234,
  191,
  138,
  210,
  64,
  199,
  56,
  181,
  163,
  247,
  242,
  206,
  249,
  97,
  21,
  161,
  224,
  174,
  93,
  164,
  155,
  52,
  26,
  85,
  173,
  147,
  50,
  48,
  245,
  140,
  177,
  227,
  29,
  246,
  226,
  46,
  130,
  102,
  202,
  96,
  192,
  41,
  35,
  171,
  13,
  83,
  78,
  111,
  213,
  219,
  55,
  69,
  222,
  253,
  142,
  47,
  3,
  255,
  106,
  114,
  109,
  108,
  91,
  81,
  141,
  27,
  175,
  146,
  187,
  221,
  188,
  127,
  17,
  217,
  92,
  65,
  31,
  16,
  90,
  216,
  10,
  193,
  49,
  136,
  165,
  205,
  123,
  189,
  45,
  116,
  208,
  18,
  184,
  229,
  180,
  176,
  137,
  105,
  151,
  74,
  12,
  150,
  119,
  126,
  101,
  185,
  241,
  9,
  197,
  110,
  198,
  132,
  24,
  240,
  125,
  236,
  58,
  220,
  77,
  32,
  121,
  238,
  95,
  62,
  215,
  203,
  57,
  72
]);
var CK = new Uint32Array([
  462357,
  472066609,
  943670861,
  1415275113,
  1886879365,
  2358483617,
  2830087869,
  3301692121,
  3773296373,
  4228057617,
  404694573,
  876298825,
  1347903077,
  1819507329,
  2291111581,
  2762715833,
  3234320085,
  3705924337,
  4177462797,
  337322537,
  808926789,
  1280531041,
  1752135293,
  2223739545,
  2695343797,
  3166948049,
  3638552301,
  4110090761,
  269950501,
  741554753,
  1213159005,
  1684763257
]);
function byteSub(a) {
  return (Sbox[a >>> 24 & 255] & 255) << 24 | (Sbox[a >>> 16 & 255] & 255) << 16 | (Sbox[a >>> 8 & 255] & 255) << 8 | Sbox[a & 255] & 255;
}
var x = new Uint32Array(4);
var tmp = new Uint32Array(4);
function sms4Crypt(input, output, roundKey) {
  let x0 = 0, x1 = 0, x2 = 0, x3 = 0, tmp0 = 0, tmp1 = 0, tmp2 = 0, tmp3 = 0;
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
  let x0 = 0, x1 = 0, x2 = 0, x3 = 0, mid = 0;
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
    if (counter[i] !== 0)
      break;
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
      const g = import_polyval.ghash.create(h2);
      g.update(ivArray);
      const lenIv = new Uint8Array(16);
      const view = (0, import_utils12.createView)(lenIv);
      (0, import_utils12.setBigUint64)(view, 8, BigInt(ivArray.length * 8), false);
      g.update(lenIv);
      j02 = g.digest();
    }
    const counter2 = new Uint8Array(j02);
    incrementCounter(counter2);
    const tagMask2 = new Uint8Array(16);
    sms4Crypt(j02, tagMask2, roundKey2);
    return { roundKey: roundKey2, h: h2, j0: j02, counter: counter2, tagMask: tagMask2 };
  }
  function computeTag(h2, data) {
    const aadLength = aadArray.length;
    const dataLength = data.length;
    const g = import_polyval.ghash.create(h2);
    if (aadLength > 0) {
      g.update(aadArray);
    }
    g.update(data);
    const lenBlock = new Uint8Array(16);
    const view = (0, import_utils12.createView)(lenBlock);
    (0, import_utils12.setBigUint64)(view, 0, BigInt(aadLength * 8), false);
    (0, import_utils12.setBigUint64)(view, 8, BigInt(dataLength * 8), false);
    g.update(lenBlock);
    return g.digest();
  }
  const { roundKey, h, j0, counter, tagMask } = deriveKeys();
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
    return { output: outArray, tag: calculatedTag };
  }
  return { output: outArray };
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
          output: bytesToHex(result.output),
          tag: result.tag ? bytesToHex(result.tag) : void 0
        };
      }
      if (cryptFlag !== DECRYPT) {
        return {
          output: bytesToHex(result.output),
          tag: result.tag ? bytesToHex(result.tag) : void 0
        };
      } else {
        return arrayToUtf8(result.output);
      }
    }
  }
  if (mode === "cbc") {
    if (typeof iv === "string")
      iv = hexToArray(iv);
    if (iv.length !== 128 / 8) {
      throw new Error("iv is invalid");
    }
  }
  if (typeof key === "string")
    key = hexToArray(key);
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
    for (let i = 0; i < paddingCount; i++)
      newArray[inArray.length + i] = paddingCount;
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
      if (outArray[len - i] !== paddingCount)
        throw new Error("padding is invalid");
    }
    outArray = outArray.slice(0, len - paddingCount);
  }
  if (output !== "array") {
    if (cryptFlag !== DECRYPT) {
      return bytesToHex(outArray);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  hkdf,
  kdf,
  sm2,
  sm3,
  sm4
});
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
