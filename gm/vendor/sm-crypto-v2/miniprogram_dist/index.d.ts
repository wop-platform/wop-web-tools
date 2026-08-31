import * as utils from '@noble/curves/abstract/utils';
import { ProjPointType } from '@noble/curves/abstract/weierstrass';

interface KeyPair {
    privateKey: string;
    publicKey: string;
}
/**
 * 生成密钥对：publicKey = privateKey * G
 */
declare function generateKeyPairHex(str?: string): KeyPair;
/**
 * 生成压缩公钥
 */
declare function compressPublicKeyHex(s: string): string;
/**
 * utf8串转16进制串
 */
declare function utf8ToHex(input: string): string;
/**
 * 补全16进制字符串
 */
declare function leftPad(input: string, num: number): string;
/**
 * 转成16进制串
 */
declare function arrayToHex(arr: number[]): string;
/**
 * 转成utf8串
 */
declare function arrayToUtf8(arr: Uint8Array): string;
/**
 * 转成字节数组
 */
declare function hexToArray(hexStr: string): Uint8Array<ArrayBuffer>;
/**
 * 验证公钥是否为椭圆曲线上的点
 */
declare function verifyPublicKey(publicKey: string): boolean;
/**
 * 验证公钥是否等价，等价返回true
 */
declare function comparePublicKeyHex(publicKey1: string, publicKey2: string): boolean;

declare function initRNGPool(): Promise<void>;

declare function calculateSharedKey(keypairA: KeyPair, ephemeralKeypairA: KeyPair, publicKeyB: string, ephemeralPublicKeyB: string, sharedKeyLength: number, isRecipient?: boolean, idA?: string, idB?: string): Uint8Array<ArrayBuffer>;

declare const getSharedSecret: (privateA: utils.PrivKey, publicB: utils.Hex, isCompressed?: boolean) => Uint8Array;

declare const EmptyArray: Uint8Array<ArrayBuffer>;
/**
 * 加密
 */
declare function doEncrypt(msg: string | Uint8Array, publicKey: string | ProjPointType<bigint>, cipherMode?: number, options?: {
    asn1?: boolean;
}): string;
/**
 * 解密
 */
declare function doDecrypt(encryptData: string, privateKey: string, cipherMode?: number, options?: {
    output: 'array';
    asn1?: boolean;
}): Uint8Array;
declare function doDecrypt(encryptData: string, privateKey: string, cipherMode?: number, options?: {
    output?: 'string';
    asn1?: boolean;
}): string;
interface SignaturePoint {
    k: bigint;
    x1: bigint;
}
/**
 * 签名
 */
declare function doSignature(msg: Uint8Array | string, privateKey: string, options?: {
    pointPool?: SignaturePoint[];
    der?: boolean;
    hash?: boolean;
    publicKey?: string;
    userId?: string;
}): string;
/**
 * 验签
 */
declare function doVerifySignature(msg: string | Uint8Array, signHex: string, publicKey: string | ProjPointType<bigint>, options?: {
    der?: boolean;
    hash?: boolean;
    userId?: string;
}): boolean;
declare function getZ(publicKey: string, userId?: string): Uint8Array<ArrayBufferLike>;
/**
 * sm3杂凑算法
 */
declare function getHash(hashHex: string | Uint8Array, publicKey: string, userId?: string): string;
/**
 * 预计算公钥点，可用于提升加密性能
 * @export
 * @param {string} publicKey 公钥
 * @param windowSize 计算窗口大小，默认为 8
 * @returns {ProjPointType<bigint>} 预计算的点
 */
declare function precomputePublicKey(publicKey: string, windowSize?: number): ProjPointType<bigint>;
/**
 * 计算公钥
 */
declare function getPublicKeyFromPrivateKey(privateKey: string): string;
/**
 * 获取椭圆曲线点
 */
declare function getPoint(): {
    k: bigint;
    x1: bigint;
    privateKey: string;
    publicKey: string;
};

declare const index$1_EmptyArray: typeof EmptyArray;
type index$1_KeyPair = KeyPair;
type index$1_SignaturePoint = SignaturePoint;
declare const index$1_arrayToHex: typeof arrayToHex;
declare const index$1_arrayToUtf8: typeof arrayToUtf8;
declare const index$1_calculateSharedKey: typeof calculateSharedKey;
declare const index$1_comparePublicKeyHex: typeof comparePublicKeyHex;
declare const index$1_compressPublicKeyHex: typeof compressPublicKeyHex;
declare const index$1_doDecrypt: typeof doDecrypt;
declare const index$1_doEncrypt: typeof doEncrypt;
declare const index$1_doSignature: typeof doSignature;
declare const index$1_doVerifySignature: typeof doVerifySignature;
declare const index$1_generateKeyPairHex: typeof generateKeyPairHex;
declare const index$1_getHash: typeof getHash;
declare const index$1_getPoint: typeof getPoint;
declare const index$1_getPublicKeyFromPrivateKey: typeof getPublicKeyFromPrivateKey;
declare const index$1_getZ: typeof getZ;
declare const index$1_hexToArray: typeof hexToArray;
declare const index$1_initRNGPool: typeof initRNGPool;
declare const index$1_leftPad: typeof leftPad;
declare const index$1_precomputePublicKey: typeof precomputePublicKey;
declare const index$1_utf8ToHex: typeof utf8ToHex;
declare const index$1_verifyPublicKey: typeof verifyPublicKey;
declare namespace index$1 {
  export { index$1_EmptyArray as EmptyArray, type index$1_KeyPair as KeyPair, type index$1_SignaturePoint as SignaturePoint, index$1_arrayToHex as arrayToHex, index$1_arrayToUtf8 as arrayToUtf8, index$1_calculateSharedKey as calculateSharedKey, index$1_comparePublicKeyHex as comparePublicKeyHex, index$1_compressPublicKeyHex as compressPublicKeyHex, index$1_doDecrypt as doDecrypt, index$1_doEncrypt as doEncrypt, index$1_doSignature as doSignature, index$1_doVerifySignature as doVerifySignature, getSharedSecret as ecdh, index$1_generateKeyPairHex as generateKeyPairHex, index$1_getHash as getHash, index$1_getPoint as getPoint, index$1_getPublicKeyFromPrivateKey as getPublicKeyFromPrivateKey, index$1_getZ as getZ, index$1_hexToArray as hexToArray, index$1_initRNGPool as initRNGPool, index$1_leftPad as leftPad, index$1_precomputePublicKey as precomputePublicKey, index$1_utf8ToHex as utf8ToHex, index$1_verifyPublicKey as verifyPublicKey };
}

/**
 * SM3 Key derivation function used in SM2 encryption and key exchange, specified in GM/T 0003-2012
 * @param z Input data (string or Uint8Array)
 * @param keylen Desired key length in bytes
 * @returns Derived key as Uint8Array
 */
declare function kdf(z: string | Uint8Array, keylen: number, iv?: string | Uint8Array): Uint8Array<ArrayBuffer>;

type Input = Uint8Array | string;

declare function hkdf(ikm: Input, salt: Input | undefined, info: Input | undefined, length: number): Uint8Array<ArrayBufferLike>;

declare function sm3(input: string | Uint8Array, options?: {
    key: Uint8Array | string;
    mode?: 'hmac' | 'mac';
}): string;

interface SM4Options {
    padding?: 'pkcs#7' | 'pkcs#5' | 'none' | null;
    mode?: 'cbc' | 'ecb' | 'gcm';
    iv?: Uint8Array | string;
    output?: 'string' | 'array';
    associatedData?: Uint8Array | string;
    outputTag?: boolean;
    tag?: Uint8Array | string;
}
declare function sm4(inArray: Uint8Array | string, key: Uint8Array | string, cryptFlag: 0 | 1, options?: SM4Options): string | Uint8Array<ArrayBufferLike> | {
    output: Uint8Array;
    tag?: Uint8Array;
} | {
    output: string;
    tag: string | undefined;
};
interface GCMResult<T = Uint8Array | string> {
    output: T;
    tag?: T;
}
declare function encrypt(inArray: Uint8Array | string, key: Uint8Array | string, options: {
    mode: 'gcm';
    output: 'array';
} & SM4Options): GCMResult<Uint8Array>;
declare function encrypt(inArray: Uint8Array | string, key: Uint8Array | string, options: {
    mode: 'gcm';
    output?: 'string';
} & SM4Options): GCMResult<string>;
declare function encrypt(inArray: Uint8Array | string, key: Uint8Array | string, options?: {
    output: 'array';
} & SM4Options): Uint8Array;
declare function encrypt(inArray: Uint8Array | string, key: Uint8Array | string, options?: {
    output?: 'string';
} & SM4Options): string;
declare function decrypt(inArray: Uint8Array | string, key: Uint8Array | string, options?: {
    output: 'array';
} & SM4Options): Uint8Array;
declare function decrypt(inArray: Uint8Array | string, key: Uint8Array | string, options?: {
    output?: 'string';
} & SM4Options): string;

type index_GCMResult<T = Uint8Array | string> = GCMResult<T>;
type index_SM4Options = SM4Options;
declare const index_decrypt: typeof decrypt;
declare const index_encrypt: typeof encrypt;
declare const index_sm4: typeof sm4;
declare namespace index {
  export { type index_GCMResult as GCMResult, type index_SM4Options as SM4Options, index_decrypt as decrypt, index_encrypt as encrypt, index_sm4 as sm4 };
}

export { hkdf, kdf, index$1 as sm2, sm3, index as sm4 };
