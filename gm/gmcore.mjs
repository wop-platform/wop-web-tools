// ============================================================================
// gm/gmcore.mjs — WOP-SM2-SM3 国密套件纯函数核心（无 DOM，node 可测）
//
// 依赖：sm-crypto-v2 1.15.1（gm/vendor/sm-crypto-v2，MIT）+ @noble/*。
// 本文件经 esbuild 打包为 gm/gmcore.js（IIFE, global-name=GmCore）内嵌页面。
//
// ── 包装层三座桥（实测 sm-crypto-v2 与 SDK BC 的字节格式差异）─────────────
// 1) SM2 验签/解密入口只接受 hex；协议线上格式是 base64url → 此层先转 hex。
// 2) SM4-GCM 库接口把 tag 从密文中分离：加密返回 {output, tag}；解密需拆出
//    ciphertext‖tag 尾拼中的末 16B 作为 options.tag 独立传入。
// 3) SM2 密文：库内部格式 C1 = X‖Y（无 04 前缀）；SDK/线上格式 C1 = 04‖X‖Y
//    （65B 未压缩点）。加密后补 '04'，解密前 strip 首字节。
//    另：C1C2C3(旧国标) 与 C1C3C2 长度一致，错序解密【静默返回空串而非抛错】，
//    故 DEK 解包必须以明文载荷格式校验为唯一防线。
//
// ── 协议事实（SDK 源码 + 黄金向量双向钉死，见 GOLDEN_SM）──────────────────
// - 签名：SM3withSM2（ZA 含 userId 预杂凑），线上裸 r‖s 64B → base64url 无填充
//   （恒 86 字符），禁 DER（D9）；验签失败 reason 模糊（I7）。
// - digest：x-wop-content-digest: sm3 <小写hex>，恰一空格；有 body 必传必入签
//   （D2/D3/I1）；SM2 族用 sm3、RSA 族用 sha-256（I5）。
// - L2 信封：BC SM2Engine(C1C3C2) 裸拼接，置于 x-wop-encrypt: L2;dek=<b64u>。
// - SM4-GCM：key 16B / IV 12B / tag 128bit；密文 = ciphertext‖tag 尾拼 b64u，
//   载体 {"encrypted":"..."}；IV 经 DEK 载荷 iv 段传输，不拼密文前缀。
//   库的 GCM 分支不校验 key 长度 → 本层强制 key=16B / iv=12B。
// - DEK 载荷（非 JSON，$ 分隔）：SM4-GCM$base64url(key)$base64url(iv)；
//   SM2 族 dek alg 恒为 "SM4-GCM"，族不符按 OP_GW_2004 拒绝。
// - 校验顺序（F6）固定：验签 → digest 复核 → DEK 解包 → 族比对 → bulk 解密。
// ============================================================================

import { sm2, sm3, sm4 } from './vendor/sm-crypto-v2/dist/index.mjs';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

// SDK（BC）不显式 setUserId 时 javadoc+conformance 双向钉死的默认值；
// 本实现所有签名/验签路径显式传此值（任务书契约空白已查实）。
export const SM2_USER_ID = '1234567812345678';

export const DEK_ALG = 'SM4-GCM';
export const DIGEST_ALG_SM = 'sm3';

// DEK 载荷格式：key16→b64u 22 字符，iv12→b64u 16 字符（均无填充）
const DEK_PAYLOAD_RE = /^SM4-GCM\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{16}$/;

// 黄金向量（TEST-ONLY 固定 k/固定 IV；唯一事实源 gtsp-wop-gateway/docs/crypto-vectors.json，
// 由集成者字节级验证后写入任务书，直接采信）
export const GOLDEN_SM = {
  message: 'WOP 跨语言测试向量 2026-08-28 — The quick brown fox jumps over the lazy dog.',
  sm2UserId: SM2_USER_ID,
  appKey: '1234567812345678',
  pubB64: 'BKYcUacrp3w6tPeXpkEb2yktpbGgfCOsob/F5yo9wq9+LvzIx2Isu+CGnf6Z89tTJpZxm5GX7VUDr8KdsxHzYKg=',
  privB64: 'RyJ/wB0tfgGGSgug0lKZoOwJlj2001kD5wbYmnmPFr0=',
  sigB64u: 'Si7Uw5eZm0Kii3BuIRLXwMGGOxkwFria8ypcVYXnReV376EVgV0TOkQfm21NUnJZNGM-fV0d0fMF23B0Bm3TFw',
  sm3Hex: '23592263765cf506d07cc8614c09067e6de38e64c53e5b672c022532d01737cf',
  sm4KeyHex: '202122232425262728292a2b2c2d2e2f',
  sm4IvHex: '303132333435363738393a3b',
  sm4CtTagB64u: 'wMoKc3V_CJQRGlUASCV4mBki5qb7OVExH7Bgu_j1E43I-Z_SWAKRTPq3q9yDna8wNeI3pPBn4Jt4vMVEuPyWfJBP-qsYObQw1LcbbQYggRXRvCN5vFdoY-NK3j8bF9MkO72Z4eo',
  sm2EncB64u: 'BHg6d-mtZjmeNpGrClMQUsW5CH_89nI-czPleXZbKuDxEbEauHrr7V8Xy4gvzfU7I48lYrL25lHyne9JrkMW5t4FrhxANJVd2vf9vp2nqTSnzUXqLf2Bz6dVfX3rtkOeLBubmIcoIsiwo3Fn7rrtSbWuN86uwvgCbn6Zm2647KdeZd2arZaClU6IURtm97hp',
  sm2EncNegB64u: 'BHg6d-mtZjmeNpGrClMQUsW5CH_89nI-czPleXZbKuDxEbEauHrr7V8Xy4gvzfU7I48lYrL25lHyne9JrkMW5t4bm5iHKCLIsKNxZ-667Um1rjfOrsL4Am5-mZtuuOynXmXdmq2WgpVOiFEbZve4aQWuHEA0lV3a9_2-naepNKfNReot_YHPp1V9feu2Q54s',
  dekPlaintext: 'SM4-GCM$ICEiIyQlJicoKSorLC0uLw$MDEyMzQ1Njc4OTo7'
};
// 黄金向量 hex 视图（由上方 Base64 派生；函数声明提升，此处可用）
GOLDEN_SM.pubHex = hexFromBytes(bytesFromB64(GOLDEN_SM.pubB64));
GOLDEN_SM.privHex = hexFromBytes(bytesFromB64(GOLDEN_SM.privB64));

// ---------------------------------------------------------------------------
// 编码工具（浏览器/node 通用：atob/btoa/TextEncoder 均为两环境全局）。
// 页面切片（gm.js）与自测共用；导出以便单一实现。
// ---------------------------------------------------------------------------

export function utf8Encode(str) { return new TextEncoder().encode(String(str)); }
export function utf8Decode(bytes) { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }

export function b64uOk(s) { return typeof s === 'string' && s.length > 0 && /^[A-Za-z0-9_-]+$/.test(s); }
export function hexOk(s) { return typeof s === 'string' && s.length > 0 && s.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(s); }

export function bytesFromB64(b64) {
  const pad = b64.length % 4 === 0 ? b64 : b64 + '='.repeat(4 - (b64.length % 4));
  const bin = atob(pad);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
export function bytesFromB64u(s) {
  if (!b64uOk(s)) throw new Error('非法 base64url 输入');
  return bytesFromB64(s.replace(/-/g, '+').replace(/_/g, '/'));
}
export function b64FromBytes(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
export function b64uFromBytes(u8) {
  return b64FromBytes(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function bytesFromHex(s) {
  if (!hexOk(s)) throw new Error('非法 hex 输入');
  const u8 = new Uint8Array(s.length / 2);
  for (let i = 0; i < u8.length; i++) u8[i] = parseInt(s.substr(i * 2, 2), 16);
  return u8;
}
export function hexFromBytes(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16);
  return s;
}
export function requireHex(s, len) {
  if (typeof s !== 'string' || !/^[0-9a-fA-F]+$/.test(s) || s.length !== len) {
    throw new Error('hex 长度或字符非法（期望 ' + len + ' 位）');
  }
  return s.toLowerCase();
}
export function requireLen(b, n, what) {
  if (!(b instanceof Uint8Array) || b.length !== n) throw new Error(what + ' 长度必须为 ' + n + ' 字节');
}

// ---------------------------------------------------------------------------
// 最小 DER 构造器（仅 PKCS#8 / RFC5915 所需）
// ---------------------------------------------------------------------------

function derLen(n) { if (n < 128) return [n]; if (n < 256) return [0x81, n]; return [0x82, (n >> 8) & 0xff, n & 0xff]; }
function derTlv(tag, content) { return [tag].concat(derLen(content.length), content); }

// OID 1.2.156.10197.1.301（sm2p256v1 / SM2 曲线）
const OID_SM2_CURVE = [0x2a, 0x81, 0x1c, 0xcf, 0x55, 0x01, 0x82, 0x2d];
// OID 1.2.840.10045.2.1（id-ecPublicKey）
const OID_EC_PUBLIC_KEY = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01];

// ---------------------------------------------------------------------------
// SM2
// ---------------------------------------------------------------------------

/** 生成 SM2 密钥对 → { privateHex(64), publicHex(130, 04‖X‖Y) } */
export function sm2Keygen() {
  const kp = sm2.generateKeyPairHex();
  return { privateHex: kp.privateKey.toLowerCase(), publicHex: kp.publicKey.toLowerCase() };
}

/** 私钥 d hex(64) → 公钥 hex(130, 04‖X‖Y)（曲线点推导；页面往返自验用） */
export function sm2PubFromPriv(privHex) {
  return sm2.getPublicKeyFromPrivateKey(requireHex(privHex, 64)).toLowerCase();
}

/** 公钥 hex(130) → 标准 Base64（密钥分发格式，非 base64url） */
export function pubHexToB64(hex) { return b64FromBytes(bytesFromHex(requireHex(hex, 130))); }

/** 私钥 d hex(64) → 标准 Base64（32B 标量） */
export function privHexToB64(hex) { return b64FromBytes(bytesFromHex(requireHex(hex, 64))); }

/**
 * 私钥 d → PKCS#8 PEM（RFC5915 ECPrivateKey + PKCS#8 外壳）。
 * 外层 algorithm = id-ecPublicKey + sm2p256v1 OID；内层含 version 1、d(32B OCTET STRING)、
 * [0] namedCurve OID；提供 pubHex 时附加 [1] BIT STRING 公钥点（BC 兼容形态）。
 */
export function pkcs8PemFromD(privHex, pubHexOpt) {
  const d = bytesFromHex(requireHex(privHex, 64));
  const innerParts = [
    derTlv(0x02, [0x01]),                              // version 1
    derTlv(0x04, Array.prototype.slice.call(d)),       // privateKey：d 标量 32B（不足/超出均拒绝）
    derTlv(0xa0, derTlv(0x06, OID_SM2_CURVE)),         // [0] namedCurve（EXPLICIT）
  ];
  if (pubHexOpt !== undefined && pubHexOpt !== null && pubHexOpt !== '') {
    const pub = bytesFromHex(requireHex(pubHexOpt, 130));
    innerParts.push(derTlv(0xa1, [0x00].concat(Array.prototype.slice.call(pub)))); // [1] BIT STRING（implicit，0 unused bits）
  }
  const ecPriv = derTlv(0x30, innerParts.reduce((a, p) => a.concat(p), []));
  const algId = derTlv(0x30, derTlv(0x06, OID_EC_PUBLIC_KEY).concat(derTlv(0x06, OID_SM2_CURVE)));
  const pkcs8 = derTlv(0x30, derTlv(0x02, [0x00]).concat(algId, derTlv(0x04, ecPriv)));
  const b64 = b64FromBytes(new Uint8Array(pkcs8));
  const lines = b64.match(/.{1,64}/g) || [];
  return '-----BEGIN PRIVATE KEY-----\n' + lines.join('\n') + '\n-----END PRIVATE KEY-----\n';
}

/**
 * SM3withSM2 签名 → base64url 无填充（裸 r‖s 64B，恒 86 字符；禁 DER，D9）。
 * msgBytes：签名基（canonical）UTF-8 字节。
 */
export function sm2SignBytes(msgBytes, privHex, userId) {
  const uid = userId || SM2_USER_ID;
  const sigHex = sm2.doSignature(msgBytes, requireHex(privHex, 64), { hash: true, userId: uid });
  const out = b64uFromBytes(bytesFromHex(sigHex));
  if (out.length !== 86) throw new Error('签名输出长度异常'); // 64B → b64u 恰 86 字符
  return out;
}

/**
 * SM3withSM2 验签。内部先拒 DER：b64u 解码后长度 ≠ 64 或首字节 0x30 → false（任务书规格）。
 * 任何异常一律 false（不抛出），失败原因对外保持模糊（I7）。
 */
export function sm2VerifyB64u(msgBytes, sigB64u, pubHex, userId) {
  try {
    if (!b64uOk(sigB64u)) return false;
    const sigBytes = bytesFromB64u(sigB64u);
    if (sigBytes.length !== 64) return false;   // DER 序列长度恒 ≠64
    if (sigBytes[0] === 0x30) return false;     // DER SEQUENCE 头
    return sm2.doVerifySignature(msgBytes, hexFromBytes(sigBytes), requireHex(pubHex, 130),
      { hash: true, userId: userId || SM2_USER_ID }) === true;
  } catch (e) {
    return false;
  }
}

/**
 * SM2 加密 DEK 载荷 → base64url（C1C3C2，随机 k，C1=04‖X‖Y 65B 与 BC 字节级一致）。
 * 库输出 C1 无 04 前缀 → 此处补回。
 */
export function sm2EncryptDek(payloadStr, pubHex) {
  const libHex = sm2.doEncrypt(String(payloadStr), requireHex(pubHex, 130), 1);
  return b64uFromBytes(bytesFromHex('04' + libHex));
}

/**
 * SM2 解密 DEK（C1C3C2）。校验：输入为合法 b64u；C1 为 04 开头且总长 ≥ 65+32+1；
 * 解密（库格式需先 strip 04）后明文必须匹配 DEK 载荷格式 —— 这是拒绝 C1C2C3
 * 错序负向量的唯一防线（错序解密静默返回空串/乱码，长度不可区分）。
 */
export function sm2DecryptDek(b64u, privHex) {
  const raw = bytesFromB64u(b64u);
  if (raw.length < 65 + 32 + 1) throw new Error('SM2 密文结构非法');
  if (raw[0] !== 0x04) throw new Error('C1 非未压缩点');
  const libHex = hexFromBytes(raw).slice(2); // strip 04：库格式 X‖Y‖C3‖C2
  const pt = sm2.doDecrypt(libHex, requireHex(privHex, 64), 1);
  if (!DEK_PAYLOAD_RE.test(pt)) throw new Error('DEK 载荷格式非法');
  return pt;
}

// ---------------------------------------------------------------------------
// SM3 / SM4-GCM
// ---------------------------------------------------------------------------

/** SM3 摘要 → 小写 hex（64 字符） */
export function sm3Hex(bytes) { return sm3(bytes); }

/**
 * SM4-GCM 加密 → base64url(ciphertext‖tag 尾拼 16B)。key=16B / iv=12B 强制校验
 * （库 GCM 分支不校验 key 长度）。明文按 UTF-8 处理（WOP 报文体恒为 JSON 文本）。
 */
export function sm4GcmEncrypt(plainBytes, key16, iv12) {
  requireLen(key16, 16, 'SM4 key');
  requireLen(iv12, 12, 'SM4 iv');
  const asStr = utf8Decode(plainBytes); // 库字符串模式按 UTF-8 重编码（tag 仅此模式可得）
  const r = sm4.encrypt(asStr, hexFromBytes(key16), { mode: 'gcm', iv: hexFromBytes(iv12), output: 'string' });
  const ct = bytesFromHex(r.output);
  const tag = bytesFromHex(r.tag);
  requireLen(tag, 16, 'GCM tag');
  const out = new Uint8Array(ct.length + tag.length);
  out.set(ct, 0); out.set(tag, ct.length);
  return b64uFromBytes(out);
}

/**
 * SM4-GCM 解密 base64url(ciphertext‖tag) → 明文 bytes。先自行校验 key=16B/iv=12B；
 * 拆出末 16B 作为 tag 独立传入（先验 tag：篡改即 throw）。
 */
export function sm4GcmDecrypt(b64uCtTag, key16, iv12) {
  requireLen(key16, 16, 'SM4 key');
  requireLen(iv12, 12, 'SM4 iv');
  const raw = bytesFromB64u(b64uCtTag);
  if (raw.length < 16 + 1) throw new Error('密文长度非法');
  const ctHex = hexFromBytes(raw.subarray(0, raw.length - 16));
  const tagHex = hexFromBytes(raw.subarray(raw.length - 16));
  return sm4.decrypt(ctHex, hexFromBytes(key16), { mode: 'gcm', iv: hexFromBytes(iv12), tag: tagHex, output: 'array' });
}

/** CSPRNG 生成 SM4-GCM 的 {key16, iv12} */
export function buildSmDek() {
  const key16 = new Uint8Array(16);
  const iv12 = new Uint8Array(12);
  crypto.getRandomValues(key16);
  crypto.getRandomValues(iv12);
  return { key16, iv12 };
}

/** DEK 载荷拼接：SM4-GCM$base64url(key)$base64url(iv)。alg 恒 SM4-GCM（族内强校验）。 */
export function dekPayload(alg, keyB64u, ivB64u) {
  if (alg !== DEK_ALG) throw new Error('SM 族 DEK alg 必须为 ' + DEK_ALG);
  if (!b64uOk(keyB64u) || !b64uOk(ivB64u)) throw new Error('DEK 段非法 base64url');
  return DEK_ALG + '$' + keyB64u + '$' + ivB64u;
}

// ---------------------------------------------------------------------------
// 请求构造（SM 族单侧）/ 响应校验（F6 固定顺序）
// ---------------------------------------------------------------------------

function hget(headers, name) {
  if (!headers || typeof headers !== 'object') return '';
  const target = name.toLowerCase();
  const keys = Object.keys(headers);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === target) return String(headers[keys[i]]).trim();
  }
  return '';
}

/**
 * 明文流 digest 头：'sm3 <hex>'；空 body 返回 ''（不携带）。
 * D2/D3/I1：有 body 必传必入签；I5：SM2 族 digest 标签恒 sm3。
 */
export function buildSmDigest(body) {
  const b = body == null ? '' : String(body);
  return b ? DIGEST_ALG_SM + ' ' + sm3Hex(utf8Encode(b)) : '';
}

/**
 * L2 国密信封构造（两阶段流第一步）。digest 覆盖线上密文 body——
 * F6 规定 digest 复核先于解密，故必须对传输字节（非明文）可验证。
 * 页面流程：buildSmEnvelope → 把 digest/encryptHeader/encryptedBody 组入
 * canonical（共享 buildCanonical）→ sm2SignBytes(utf8Encode(canonical), privHex)。
 * 输出：{ encryptedBody('{"encrypted":"…"}'), encryptHeader('L2;dek=<b64u>'),
 *         digest('sm3 <hex>'，覆盖 encryptedBody), key16, iv12, dekPayload }
 */
export function buildSmEnvelope(body, platformPubHex) {
  const b = body == null ? '' : String(body);
  if (!b) throw new Error('L2 信封需要非空报文');
  if (!platformPubHex) throw new Error('L2 信封需要平台公钥');
  const dek = buildSmDek();
  const payload = dekPayload(DEK_ALG, b64uFromBytes(dek.key16), b64uFromBytes(dek.iv12));
  const encryptedBody = '{"encrypted":"' + sm4GcmEncrypt(utf8Encode(b), dek.key16, dek.iv12) + '"}';
  return {
    encryptedBody: encryptedBody,
    encryptHeader: 'L2;dek=' + sm2EncryptDek(payload, platformPubHex),
    digest: DIGEST_ALG_SM + ' ' + sm3Hex(utf8Encode(encryptedBody)),
    key16: dek.key16,
    iv12: dek.iv12,
    dekPayload: payload,
  };
}

/**
 * 国密响应校验（F6 固定顺序：验签 → digest 复核 → DEK 解包 → 族比对 → 解密）。
 * 每步独立 ok + 模糊化 reason（I7：不泄露 DER/hex/字节等内部细节）。
 * 输入：headers(对象，键大小写不敏感)，body(线上报文串，密文流即 {"encrypted":…})，
 *       opts = { canonical(签名基), merchantPubHex(验签), platformPrivHex(解 DEK), userId? }
 * 输出：{ steps:[{key,name,ok,reason}], allOk, decryptedBody }（跳过步骤 ok=true，reason 注明）
 */
export function verifySmSuite(headers, body, opts) {
  const o = opts || {};
  const bodyStr = body == null ? '' : String(body);
  const sigHdr = hget(headers, 'x-wop-sign');
  const digHdr = hget(headers, 'x-wop-content-digest');
  const encHdr = hget(headers, 'x-wop-encrypt');
  const steps = [];
  const push = function (key, name, ok, reason) { steps.push({ key: key, name: name, ok: !!ok, reason: ok ? '' : reason }); };

  // 1. SM2 验签（失败 reason 模糊，I7）
  //    x-wop-sign 线上格式：'WOP-SM2-SM3 <authString>/<signedHeaders>/<sigB64u 86>'；
  //    先剥出纯签名段——套件名/格式不符（含裸 sig 旧格式）一律验签失败，不区分原因。
  const sigM = sigHdr ? /^WOP-SM2-SM3 (\S+)\/([^/]+)\/([A-Za-z0-9_-]{86})$/.exec(String(sigHdr).trim()) : null;
  const sigVal = sigM ? sigM[3] : '';
  const sigOk = sigVal && o.canonical && o.merchantPubHex
    ? sm2VerifyB64u(utf8Encode(o.canonical), sigVal, o.merchantPubHex, o.userId)
    : false;
  push('verify', 'SM2 验签', sigOk, '验签失败');

  // 2. digest 复核（有 body 必传必入签；空 body 不应携带）
  const digestParts = digHdr ? /^([a-z0-9-]+) ([0-9a-f]{64})$/.exec(digHdr) : null;
  let digestOk;
  if (bodyStr) {
    digestOk = !!digestParts && digHdr === DIGEST_ALG_SM + ' ' + sm3Hex(utf8Encode(bodyStr));
    push('digest', 'SM3 摘要复核', digestOk, '摘要不一致');
  } else {
    digestOk = !digHdr;
    push('digest', 'SM3 摘要复核', digestOk, '空报文不应携带摘要');
  }

  // 3. DEK 解包（无 x-wop-encrypt 即明文流，跳过）
  let dek = null;
  if (!encHdr) {
    push('dek', 'DEK 解包', true, '');
  } else {
    const m = /^L2;dek=([A-Za-z0-9_-]+)$/.exec(encHdr);
    if (!m) {
      push('dek', 'DEK 解包', false, 'DEK 解包失败');
    } else {
      try {
        const payload = sm2DecryptDek(m[1], o.platformPrivHex || '');
        const parts = payload.split('$');
        dek = { alg: parts[0], keyB64u: parts[1], ivB64u: parts[2] };
        push('dek', 'DEK 解包', true, '');
      } catch (e) {
        push('dek', 'DEK 解包', false, 'DEK 解包失败');
      }
    }
  }

  // 4. 套件族比对（OP_GW_2004）：dek alg 必为 SM4-GCM 且 digest 标签必为 sm3
  const digestAlg = digestParts ? digestParts[1] : '';
  const familyOk = dek
    ? dek.alg === DEK_ALG && digestAlg === DIGEST_ALG_SM
    : (!digestAlg || digestAlg === DIGEST_ALG_SM);
  push('family', '套件族比对', familyOk, '套件不符');

  // 5. 报文解密（{"encrypted":…} → SM4-GCM，先验 tag）
  let decryptedBody = '';
  if (!dek) {
    push('decrypt', '报文解密', true, '');
  } else {
    const m = /^\{"encrypted":"([A-Za-z0-9_-]+)"\}$/.exec(bodyStr.trim());
    if (!m) {
      push('decrypt', '报文解密', false, '解密失败');
    } else {
      try {
        const bytes = sm4GcmDecrypt(m[1], bytesFromB64u(dek.keyB64u), bytesFromB64u(dek.ivB64u));
        decryptedBody = utf8Decode(bytes);
        push('decrypt', '报文解密', true, '');
      } catch (e) {
        push('decrypt', '报文解密', false, '解密失败');
      }
    }
  }

  return { steps: steps, allOk: steps.every(function (s) { return s.ok; }), decryptedBody: decryptedBody };
}

// ---------------------------------------------------------------------------
// 黄金向量自测（node 与浏览器同源执行；断言矩阵见 gm/README.md）
// ---------------------------------------------------------------------------

function throws(fn) { try { fn(); return false; } catch (e) { return true; } }
function flipLastByte(b64u) {
  const u8 = bytesFromB64u(b64u);
  u8[u8.length - 1] ^= 0x01;
  return b64uFromBytes(u8);
}
function flipFirstByte(b64u) {
  const u8 = bytesFromB64u(b64u);
  u8[0] ^= 0x01;
  return b64uFromBytes(u8);
}

export function smGoldenSelfTest() {
  const G = GOLDEN_SM;
  const msgBytes = utf8Encode(G.message);
  const pubHex = hexFromBytes(bytesFromB64(G.pubB64));
  const privHex = hexFromBytes(bytesFromB64(G.privB64));
  const key16 = bytesFromHex(G.sm4KeyHex);
  const iv12 = bytesFromHex(G.sm4IvHex);
  const T = [];
  const t = function (id, name, fn) {
    try {
      const r = fn();
      T.push({ name: id + ' ' + name, pass: r === true, detail: r === true ? '' : String(r) });
    } catch (e) {
      T.push({ name: id + ' ' + name, pass: false, detail: '异常: ' + e.message });
    }
  };

  // 自测 helper：x-wop-sign 恒用线上四段格式 '<suite> <authString>/<signedHeaders>/<sig>'
  function signHdr(names, sigB64u) {
    return 'WOP-SM2-SM3 v1/1800/' + names + '/' + sigB64u;
  }
  // 期望验签通过的场景：重签规避 0x30 前缀（sm2VerifyB64u 按 GM-08 拒 0x30，否则 1/256 闪失败）
  function signValid(canonical, privHex) {
    const bytes = utf8Encode(canonical);
    for (let i = 0; i < 64; i++) {
      const s = sm2SignBytes(bytes, privHex);
      if (bytesFromB64u(s)[0] !== 0x30) return s;
    }
    throw new Error('signValid: 64 次重签均 0x30 前缀');
  }

  // spec:GM-01 SM3 黄金摘要字节级一致
  t('GM-01', 'SM3 黄金摘要', function () { return sm3Hex(msgBytes) === G.sm3Hex || 'got ' + sm3Hex(msgBytes); });

  // spec:GM-02 SM4-GCM 黄金向量解密 → 明文=message
  t('GM-02', 'SM4-GCM 黄金解密', function () {
    return utf8Decode(sm4GcmDecrypt(G.sm4CtTagB64u, key16, iv12)) === G.message || '明文不一致';
  });

  // spec:GM-03 SM4-GCM 确定性加密（同 key/iv）→ ct‖tag 与黄金 b64u 字节一致
  t('GM-03', 'SM4-GCM 确定性加密', function () {
    return sm4GcmEncrypt(msgBytes, key16, iv12) === G.sm4CtTagB64u || '密文不一致';
  });

  // spec:GM-04 篡改 tag → throw（否定式）
  t('GM-04', '篡改 tag 被拒', function () {
    return throws(function () { sm4GcmDecrypt(flipLastByte(G.sm4CtTagB64u), key16, iv12); }) || '未抛错';
  });

  // spec:GM-05 篡改密文首字节 → throw（否定式）
  t('GM-05', '篡改密文被拒', function () {
    const u8 = bytesFromB64u(G.sm4CtTagB64u);
    u8[0] ^= 0x01;
    return throws(function () { sm4GcmDecrypt(b64uFromBytes(u8), key16, iv12); }) || '未抛错';
  });

  // spec:GM-06 SM2 黄金签名验签通过
  t('GM-06', 'SM2 黄金验签', function () {
    return sm2VerifyB64u(msgBytes, G.sigB64u, pubHex) === true || 'verify=false';
  });

  // spec:GM-07 DER 签名被拒：真实 DER（长度≠64）与 64B 伪 0x30 头均 false（否定式）
  t('GM-07', 'DER 签名被拒', function () {
    const derHex = sm2.doSignature(msgBytes, privHex, { hash: true, userId: G.sm2UserId, der: true });
    const derB64u = b64uFromBytes(bytesFromHex(derHex));
    if (sm2VerifyB64u(msgBytes, derB64u, pubHex) !== false) return '真实 DER 未被拒';
    const fake = new Uint8Array(64); fake[0] = 0x30;
    if (sm2VerifyB64u(msgBytes, b64uFromBytes(fake), pubHex) !== false) return '0x30 头未被拒';
    return true;
  });

  // spec:GM-08 自签名裸 r‖s（128 hex / b64u 86 字符）且自验通过
  //   注：随机 k 下 r 首字节可能为 0x30，被任务书规定的 DER 头拒绝规则命中——
  //   此处重签至避开（概率 1/256），该规则冲突已在 README 上报。
  t('GM-08', '自签名裸 r‖s 自验', function () {
    let sigHex = '', tries = 0;
    while (tries++ < 64) {
      sigHex = sm2.doSignature(msgBytes, privHex, { hash: true, userId: G.sm2UserId });
      if (!sigHex.startsWith('30')) break;
    }
    if (sigHex.length !== 128) return 'hex 长度 ' + sigHex.length;
    const sigB64u = b64uFromBytes(bytesFromHex(sigHex));
    if (sigB64u.length !== 86) return 'b64u 长度 ' + sigB64u.length;
    return sm2VerifyB64u(msgBytes, sigB64u, pubHex) === true || '自验失败';
  });

  // spec:GM-09 SM2 黄金加密向量解密 → DEK 载荷
  t('GM-09', 'SM2 黄金加密解密', function () {
    return sm2DecryptDek(G.sm2EncB64u, privHex) === G.dekPlaintext || '载荷不一致';
  });

  // spec:GM-10 C1C2C3 旧国标顺序负向量 → 拒绝（解密错序静默乱码，载荷格式校验兜底；否定式）
  t('GM-10', 'C1C2C3 负向量被拒', function () {
    return throws(function () { sm2DecryptDek(G.sm2EncNegB64u, privHex); }) || '未被拒绝';
  });

  // spec:GM-11 密钥对生成输出合法（64/130 hex、04 开头）且三往返可用
  t('GM-11', '密钥对生成与往返', function () {
    const kp = sm2Keygen();
    if (kp.privateHex.length !== 64 || !/^[0-9a-f]+$/.test(kp.privateHex)) return '私钥格式';
    if (kp.publicHex.length !== 130 || !kp.publicHex.startsWith('04')) return '公钥格式';
    const sig = sm2SignBytes(msgBytes, kp.privateHex);
    if (sm2VerifyB64u(msgBytes, sig, kp.publicHex) !== true) return '签验往返';
    const dek = buildSmDek();
    const payload = dekPayload(DEK_ALG, b64uFromBytes(dek.key16), b64uFromBytes(dek.iv12));
    const ct = sm2EncryptDek(payload, kp.publicHex);
    return sm2DecryptDek(ct, kp.privateHex) === payload || '加解往返';
  });

  // spec:GM-12 pubHexToB64/privHexToB64 与黄金标准 Base64 一致
  t('GM-12', '密钥 Base64 分发格式', function () {
    if (pubHexToB64(pubHex) !== G.pubB64) return '公钥 b64 不一致';
    return privHexToB64(privHex) === G.privB64 || '私钥 b64 不一致';
  });

  // spec:GM-13 PKCS#8 PEM：BEGIN 标记 + sm2p256v1 OID + d 32B OCTET STRING + [1] 公钥点
  t('GM-13', 'PKCS#8 PEM 构造', function () {
    const pem = pkcs8PemFromD(privHex, pubHex);
    if (!/^-----BEGIN PRIVATE KEY-----\n/.test(pem) || !/\n-----END PRIVATE KEY-----\n$/.test(pem)) return 'PEM 标记';
    const der = bytesFromB64(pem.split('\n').slice(1, -2).join(''));
    const derArr = Array.prototype.slice.call(der);
    const contains = function (seq) {
      return derArr.some(function (_, i) {
        return seq.every(function (b, j) { return derArr[i + j] === b; });
      });
    };
    if (!contains(OID_SM2_CURVE)) return '缺 SM2 曲线 OID';
    if (!contains([0x04, 0x20].concat(Array.prototype.slice.call(bytesFromHex(privHex))))) return '缺 d 32B';
    if (!contains([0x00].concat(Array.prototype.slice.call(bytesFromHex(pubHex))))) return '缺 [1] 公钥点';
    return true;
  });

  // spec:GM-14 digest 标签族隔离：SM 族恒 'sm3 '；空 body 不携带；sha-256 标签被族比对拒（跨族否定式）
  t('GM-14', 'digest 标签族隔离', function () {
    const kp = sm2Keygen();
    const body = '{"ok":true}';
    const digest = buildSmDigest(body);
    if (digest.indexOf('sm3 ') !== 0) return 'SM 族 digest 前缀: ' + digest.slice(0, 8);
    if (buildSmDigest('') !== '') return '空 body 应无 digest';
    const canonical = 'POST\n/gm\n\nx-wop-content-digest: ' + digest + '\n' + body;
    const shaHdr = {
      'x-wop-sign': signHdr('x-wop-content-digest', sm2SignBytes(utf8Encode(canonical), kp.privateHex)),
      'x-wop-content-digest': 'sha-256 ' + '0'.repeat(64),
    };
    const v = verifySmSuite(shaHdr, body, { canonical: canonical, merchantPubHex: kp.publicHex });
    const fam = v.steps.filter(function (s) { return s.key === 'family'; })[0];
    return fam && fam.ok === false || 'sha-256 标签未被族比对拒绝';
  });

  // spec:GM-15 DEK alg 恒 SM4-GCM；跨族（AES-GCM）载荷在 DEK 解包步（段格式校验）
  //   或族比对步被拒——F6 顺序下先到的防线生效即合规（否定式）
  t('GM-15', 'DEK alg 族隔离', function () {
    const env = buildSmEnvelope('{"ok":true}', pubHex);
    if (env.dekPayload.indexOf('SM4-GCM$') !== 0) return 'dek alg 非法: ' + env.dekPayload.slice(0, 8);
    const aesPayload = 'AES-GCM$' + b64uFromBytes(new Uint8Array(32)) + '$' + b64uFromBytes(new Uint8Array(12));
    const body2 = '{"encrypted":"' + G.sm4CtTagB64u + '"}';
    const canonical2 = 'POST\n/gm\n\nx-wop-content-digest: ' + buildSmDigest(body2) + '\n' + body2;
    const hdr = {
      'x-wop-sign': signHdr('x-wop-content-digest;x-wop-encrypt', sm2SignBytes(utf8Encode(canonical2), privHex)),
      'x-wop-content-digest': buildSmDigest(body2),
      'x-wop-encrypt': 'L2;dek=' + sm2EncryptDek(aesPayload, pubHex),
    };
    const v = verifySmSuite(hdr, body2, { canonical: canonical2, merchantPubHex: pubHex, platformPrivHex: privHex });
    if (v.allOk) return '跨族载荷未被拒绝';
    const dekStep = v.steps.filter(function (s) { return s.key === 'dek'; })[0];
    const famStep = v.steps.filter(function (s) { return s.key === 'family'; })[0];
    return (dekStep && dekStep.ok === false) || (famStep && famStep.ok === false) || '未被 DEK/族比对拒绝';
  });

  // spec:GM-16 全部线上输出 base64url 无 '=' 填充（签名/DEK 密文/bulk 密文）
  t('GM-16', 'base64url 无填充', function () {
    const env = buildSmEnvelope(G.message, pubHex);
    const canonical = 'POST\n/gm\n\nx-wop-content-digest: ' + env.digest + '\nx-wop-encrypt: ' + env.encryptHeader + '\n' + env.encryptedBody;
    const sign = sm2SignBytes(utf8Encode(canonical), privHex);
    const outs = [sign, env.encryptHeader.slice('L2;dek='.length), env.encryptedBody.slice(14, -2)];
    return outs.every(function (s) { return s.indexOf('=') === -1 && /^[A-Za-z0-9_-]+$/.test(s); }) || '存在填充或非法字符';
  });

  // spec:GM-17 key 非 16B / iv 非 12B → 拒绝（GCM 分支库不校验，本层强制；否定式边界）
  t('GM-17', 'key/iv 长度边界拒绝', function () {
    if (!throws(function () { sm4GcmEncrypt(msgBytes, new Uint8Array(15), iv12); })) return 'key15 未拒';
    if (!throws(function () { sm4GcmEncrypt(msgBytes, key16, new Uint8Array(11)); })) return 'iv11 未拒';
    if (!throws(function () { sm4GcmDecrypt(G.sm4CtTagB64u, new Uint8Array(17), iv12); })) return '解密 key17 未拒';
    if (!throws(function () { sm4GcmDecrypt(G.sm4CtTagB64u, key16, new Uint8Array(13)); })) return '解密 iv13 未拒';
    return true;
  });

  // spec:GM-18 userId 显式 = 1234567812345678（SDK BC 默认，javadoc+conformance 钉死），
  //   且错误 userId 验签必败（证明 ZA 参与签名基）
  t('GM-18', 'userId 显式常量', function () {
    if (SM2_USER_ID !== '1234567812345678') return '常量漂移: ' + SM2_USER_ID;
    return sm2VerifyB64u(msgBytes, G.sigB64u, pubHex, '1234567812345679') === false || '错误 userId 未失效';
  });

  // spec:GM-19 L2 全链路往返：buildSmEnvelope → canonical → 签名 → verifySmSuite
  //   五步全绿且解密还原报文（digest 覆盖密文 body 的正向闭环）
  t('GM-19', 'L2 信封全链路往返', function () {
    const kp = sm2Keygen();
    const body = '{"biz":"国密全链路","n":1}';
    const env = buildSmEnvelope(body, kp.publicHex);
    const canonical = 'POST\n/echo\n\nx-wop-content-digest: ' + env.digest + '\nx-wop-encrypt: ' + env.encryptHeader + '\n' + env.encryptedBody;
    const hdr = {
      'x-wop-sign': signHdr('x-wop-content-digest;x-wop-encrypt', signValid(canonical, kp.privateHex)),
      'x-wop-content-digest': env.digest,
      'x-wop-encrypt': env.encryptHeader,
    };
    const v = verifySmSuite(hdr, env.encryptedBody, { canonical: canonical, merchantPubHex: kp.publicHex, platformPrivHex: kp.privateHex });
    if (!v.allOk) return '步骤失败: ' + v.steps.filter(function (s) { return !s.ok; }).map(function (s) { return s.key; }).join(',');
    return v.decryptedBody === body || '解密报文不一致';
  });

  // spec:GM-20 篡改 body → digest 复核失败（否定式）
  t('GM-20', '篡改报文 digest 失配', function () {
    const kp = sm2Keygen();
    const body = '{"a":1}';
    const digest = buildSmDigest(body);
    const canonical = 'POST\n/echo\n\nx-wop-content-digest: ' + digest + '\n' + body;
    const hdr = { 'x-wop-sign': signHdr('x-wop-content-digest', sm2SignBytes(utf8Encode(canonical), kp.privateHex)), 'x-wop-content-digest': digest };
    const v = verifySmSuite(hdr, '{"a":2}', { canonical: canonical, merchantPubHex: kp.publicHex });
    const dig = v.steps.filter(function (s) { return s.key === 'digest'; })[0];
    return dig && dig.ok === false || '篡改未被发现';
  });

  // spec:GM-21 非本密钥签名 → 验签失败且 reason 模糊（I7：不含内部细节）
  t('GM-21', '验签失败 reason 模糊', function () {
    const other = sm2Keygen();
    const body = '{"a":1}';
    const canonical = 'POST\n/echo\n\nx-wop-content-digest: sm3 ' + sm3Hex(utf8Encode(body)) + '\n' + body;
    const wrongSig = sm2SignBytes(utf8Encode(canonical), other.privateHex);
    const hdr = { 'x-wop-sign': signHdr('x-wop-content-digest', wrongSig), 'x-wop-content-digest': 'sm3 ' + sm3Hex(utf8Encode(body)) };
    const kp2 = sm2Keygen();
    const v = verifySmSuite(hdr, body, { canonical: canonical, merchantPubHex: kp2.publicHex });
    const ver = v.steps.filter(function (s) { return s.key === 'verify'; })[0];
    if (!ver || ver.ok !== false) return '验签未失败';
    return ver.reason === '验签失败' || 'reason 不模糊: ' + ver.reason;
  });

  // spec:GM-22 篡改 DEK C1（首字节非 04）→ 解包失败（否定式）
  t('GM-22', 'DEK C1 篡改被拒', function () {
    const bad = flipFirstByte(G.sm2EncB64u);
    return throws(function () { sm2DecryptDek(bad, privHex); }) || '未被拒绝';
  });

  // spec:GM-23 线上 x-wop-sign 四段格式：完整头剥段验签通过；裸 sig 旧格式与异套件头
  //   一律拒（否定式）——防自测格式与线上格式再漂移（此前四段解析路径从未被测到）
  t('GM-23', '签名头四段格式', function () {
    const kp = sm2Keygen();
    const body = '{"k":"v23"}';
    const digest = buildSmDigest(body);
    const canonical = 'v1/1800\nPOST\n/echo\n\nx-wop-content-digest: ' + digest;
    const sig = signValid(canonical, kp.privateHex);
    const hdr = {
      'x-wop-sign': 'WOP-SM2-SM3 v1/1800/x-wop-content-digest;x-wop-timestamp/' + sig,
      'x-wop-content-digest': digest,
      'x-wop-timestamp': '1756600000000',
    };
    const v = verifySmSuite(hdr, body, { canonical: canonical, merchantPubHex: kp.publicHex });
    if (!v.allOk) return '四段完整头未通过: ' + v.steps.filter(function (s) { return !s.ok; }).map(function (s) { return s.key; }).join(',');
    const vBare = verifySmSuite({ 'x-wop-sign': sig, 'x-wop-content-digest': digest }, body, { canonical: canonical, merchantPubHex: kp.publicHex });
    const ver1 = vBare.steps.filter(function (s) { return s.key === 'verify'; })[0];
    if (!ver1 || ver1.ok !== false) return '裸 sig 旧格式未被拒';
    const vSuite = verifySmSuite({ 'x-wop-sign': 'WOP-RSA3072-SHA256 v1/1800/x/' + sig, 'x-wop-content-digest': digest }, body, { canonical: canonical, merchantPubHex: kp.publicHex });
    const ver2 = vSuite.steps.filter(function (s) { return s.key === 'verify'; })[0];
    if (!ver2 || ver2.ok !== false) return '异套件头未被拒';
    return true;
  });

  return T;
}
