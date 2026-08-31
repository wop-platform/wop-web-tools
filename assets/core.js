'use strict';

/* —— i18n 动态文案（main.*）：走 WF14 字典，未就绪/未命中时回退中文原文 —— */
function T(key, fb, args) {
  let s = fb;
  try { if (window.WF14) s = window.WF14.t(key, fb) || fb; } catch (e) { /* wf14 未就绪，回退 */ }
  if (args) for (const k in args) s = s.split('{' + k + '}').join(args[k]);
  return s;
}

/* ================= ASN.1 / DER 最小工具 ================= */


// 对一个完整 DER 序列的 content 切分顶层 TLV
function derSplit(buf) {
  const elems = [];
  let i = 0;
  while (i < buf.length) {
    const start = i;
    i++; // tag（本场景均为单字节 tag）
    let len = buf[i++];
    if (len & 0x80) {
      const n = len & 0x7f;
      len = 0;
      for (let k = 0; k < n; k++) len = (len << 8) | buf[i++];
    }
    elems.push({ tag: buf[start], content: buf.subarray(i, i + len) });
    i += len;
  }
  return elems;
}


/* ================= PEM / Base64 ================= */

function toBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function toPem(label, der) {
  const b64 = toBase64(der);
  const lines = b64.match(/.{1,64}/g) || [];
  return '-----BEGIN ' + label + '-----\n' + lines.join('\n') + '\n-----END ' + label + '-----\n';
}

function hexColon(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join(':');
}

/* ================= 状态与 UI ================= */

const $ = id => document.getElementById(id);
const state = { pkcs8: null, spki: null, bits: 0, selfTestOk: false };

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 1800);
}

function renderPriv() {
  const fmt = $('privfmt').value;
  $('priv-out').value = fmt === 'pkcs8' ? toPem('PRIVATE KEY', state.pkcs8) : toBase64(state.pkcs8);
}

function renderPub() {
  const fmt = $('pubfmt').value;
  $('pub-out').value = fmt === 'spki' ? toPem('PUBLIC KEY', state.spki) : toBase64(state.spki);
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } finally { ta.remove(); }
  return Promise.resolve();
}

function download(name, text) {
  const blob = new Blob([text], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function extFor(kind) {
  const fmt = $(kind === 'priv' ? 'privfmt' : 'pubfmt').value;
  return fmt === 'base64' ? 'txt' : 'pem';
}

/* ================= 生成与自检 ================= */

async function generate() {
  const bits = Number(document.querySelector('input[name=bits]:checked').value);
  const btn = $('gen');
  btn.disabled = true;
  $('status').textContent = T('main.kg.doing', '正在生成 {bits} 位密钥…（约需数秒）', { bits: bits });
  $('status-banner').className = 'badge';
  $('status-banner').textContent = '';
  state.selfTestOk = false;
  $('result').classList.remove('show');
  $('selftest').className = 'badge';
  $('priv-out').value = '';
  $('pub-out').value = '';
  await new Promise(r => setTimeout(r, 30)); // 先渲染 loading

  try {
    const kp = await crypto.subtle.generateKey(
      { name: 'RSA-OAEP', modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['encrypt', 'decrypt']
    );
    const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey));
    const spki = new Uint8Array(await crypto.subtle.exportKey('spki', kp.publicKey));

    // 自检 1：重新导入为 SHA256withRSA（网关验签算法）做签名/验签往返
    const data = new TextEncoder().encode('WOP-RSA' + bits + ' keypair self-test');
    const signKey = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const verifyKey = await crypto.subtle.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', signKey, data);
    const signOk = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', verifyKey, sig, data);

    // 自检 2：重新导入为 RSA-OAEP-SHA-256（网关 DEK 包装算法）做加密/解密往返
    const encKey = await crypto.subtle.importKey('spki', spki, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
    const decKey = await crypto.subtle.importKey('pkcs8', pkcs8, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
    const dek = crypto.getRandomValues(new Uint8Array(32));
    const wrapped = await crypto.subtle.encrypt('RSA-OAEP', encKey, dek);
    const unwrapped = new Uint8Array(await crypto.subtle.decrypt('RSA-OAEP', decKey, wrapped));
    const wrapOk = unwrapped.length === dek.length && unwrapped.every((b, i) => b === dek[i]);

    // 自检 3：模数位数与所选一致
    const privInfo = derSplit(derSplit(pkcs8)[0].content);       // [version, algId, OCTET STRING]
    const rsaPrivSeq = derSplit(privInfo[2].content)[0];         // RSAPrivateKey SEQUENCE
    const modulus = derSplit(rsaPrivSeq.content)[1].content;     // [version, n, e, d, ...] → n
    let lead = 0;                                                // 去掉 DER 正数的前导 0x00
    while (lead < modulus.length && modulus[lead] === 0) lead++;
    const nBits = lead >= modulus.length ? 0
      : (modulus.length - lead - 1) * 8 + (32 - Math.clz32(modulus[lead]));
    const bitsOk = nBits === bits;

    if (!(signOk && wrapOk && bitsOk)) throw new Error(T('main.kg.stfail', '自检未通过（sign={sign} wrap={wrap} bits={n}）', { sign: signOk, wrap: wrapOk, n: nBits }));

    state.pkcs8 = pkcs8;
    state.spki = spki;
    state.bits = bits;
    state.selfTestOk = true;

    renderPriv();
    renderPub();
    $('priv-out').classList.add('masked');
    $('toggle-mask').textContent = T('main.kg.show', '显示');

    const fp = new Uint8Array(await crypto.subtle.digest('SHA-256', spki));
    $('fp').textContent = T('main.kg.fp', '公钥指纹 SHA-256（SPKI）：\n{fp}', { fp: hexColon(fp) });

    const st = $('selftest');
    st.className = 'badge show';
    st.textContent = T('main.kg.stok', '✓ 自检通过：{bits} 位 · SHA256withRSA 签名/验签往返一致 · RSA-OAEP(SHA-256) 加解密往返一致 · 适用于 WOP-RSA{bits}-SHA256 套件', { bits: bits });

    $('result').classList.add('show');
    $('status').textContent = '';
    toast(T('main.kg.done', '生成成功'));
    $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    const banner = $('status-banner');
    banner.className = 'badge show err';
    banner.textContent = T('main.kg.fail', '生成失败：{msg}。请确认浏览器为 Chrome 37+ / Safari 11+ / Firefox 34+ 且运行在安全上下文（HTTPS 或本地文件）。', { msg: err && err.message ? err.message : err });
    $('status').textContent = '';
  } finally {
    btn.disabled = false;
  }
}

/* ================= 事件绑定 ================= */

$('gen').addEventListener('click', generate);

$('privfmt').addEventListener('change', () => { if (state.pkcs8) renderPriv(); });
$('pubfmt').addEventListener('change', () => { if (state.spki) renderPub(); });

$('toggle-mask').addEventListener('click', () => {
  const ta = $('priv-out');
  const masked = ta.classList.toggle('masked');
  $('toggle-mask').textContent = masked ? T('main.kg.show', '显示') : T('main.kg.hide', '隐藏');
});

document.querySelectorAll('[data-copy]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!state.selfTestOk) return;
    const kind = btn.dataset.copy;
    copyText($(kind === 'priv' ? 'priv-out' : 'pub-out').value)
      .then(() => toast(T('main.kg.copied', '{kind}已复制到剪贴板', { kind: T(kind === 'priv' ? 'main.kg.priv' : 'main.kg.pub', kind === 'priv' ? '私钥' : '公钥') })))
      .catch(() => toast(T('main.kg.copyfail', '复制失败，请手动选择复制')));
  });
});

document.querySelectorAll('[data-download]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!state.selfTestOk) return;
    const kind = btn.dataset.download;
    const ext = extFor(kind);
    const name = 'merchant_rsa_' + state.bits + 'bit_' + (kind === 'priv' ? 'private' : 'public') + '.' + ext;
    download(name, $(kind === 'priv' ? 'priv-out' : 'pub-out').value);
    toast(T('main.kg.downloaded', '已下载 {name}', { name: name }));
  });
});

if (!window.crypto || !crypto.subtle) {
  const banner = $('status-banner');
  banner.className = 'badge show err';
  banner.textContent = T('main.kg.nocrypto', '当前浏览器不支持 Web Crypto API，无法生成密钥。请更换现代浏览器，或确认页面运行在 HTTPS / 本地文件等安全上下文中。');
  $('gen').disabled = true;
}

/* ================================================================
 * Tab 2：WOP 报文联调
 * 协议与 gtsp-wop-gateway 对齐：
 *   canonical = authString \n METHOD \n path \n queryString \n canonicalHeaders
 *   签名 SHA256withRSA → base64url 无填充；DEK 包装 RSA-OAEP(SHA-256/MGF1-SHA-256)
 *   DEK 载荷 "AES-256-GCM$base64url(key)$base64url(iv)"；密文 base64url(GCM ct‖tag)
 *   摘要头 x-wop-content-digest: "sha-256 <64位小写hex>"（恰一空格；入签；canonical 值按 urlencode 空格→%20）
 */
// —— DER 编码工具（商户公钥派生用）——
function concatBytes2() {
  let n = 0;
  for (const a of arguments) n += a.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const a of arguments) { out.set(a, o); o += a.length; }
  return out;
}
function derLenBytes2(n) {
  if (n < 0x80) return [n];
  const bytes = [];
  while (n) { bytes.unshift(n & 0xff); n >>>= 8; }
  return [0x80 | bytes.length].concat(bytes);
}
function derEnc2(tag, content) {
  const l = derLenBytes2(content.length);
  const out = new Uint8Array(1 + l.length + content.length);
  out[0] = tag;
  out.set(l, 1);
  out.set(content, 1 + l.length);
  return out;
}
const WOP_OID_RSA = new Uint8Array([0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01]);
const WOP_RSA_ALG_ID = derEnc2(0x30, concatBytes2(WOP_OID_RSA, new Uint8Array([0x05, 0x00])));

// PKCS#8 → SPKI（提取 n/e 重组公钥）
function pkcs8ToSpki(pkcs8) {
  const info = derSplit(derSplit(pkcs8)[0].content);           // [version, algId, OCTET STRING]
  const rsaPriv = derSplit(info[2].content)[0];                // RSAPrivateKey SEQUENCE
  const f = derSplit(rsaPriv.content);                         // [version, n, e, d, ...]
  const rsaPub = derEnc2(0x30, concatBytes2(derEnc2(0x02, f[1].content), derEnc2(0x02, f[2].content)));
  return derEnc2(0x30, concatBytes2(WOP_RSA_ALG_ID, derEnc2(0x03, concatBytes2(new Uint8Array([0]), rsaPub))));
}

// —— base64url 无填充 ——
function b64urlFromBytes(bytes) {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function bytesFromB64url(s) {
  let t = s.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  while (t.length % 4) t += '=';
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// —— 密钥输入解析：兼容 PEM / 单行 Base64 / base64url ——
function keyInputToDer(text) {
  const t = String(text || '').replace(/-----(BEGIN|END)[^-]*-----/g, '').replace(/\s+/g, '');
  if (t.length < 40) throw new Error(T('main.key.short', '密钥内容为空或过短'));
  return bytesFromB64url(t);
}

// —— canonical 构造（与 CanonicalRequestBuilder 一致）——
function javaUrlEncode(s) {
  // Java URLEncoder：字母数字与 .-_ * 不编码；encodeURIComponent 额外保留 ! ' ( ) ~，需补编码
  return encodeURIComponent(s).replace(/[!'()~]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}
function trimall(s) { return String(s == null ? '' : s).trim().replace(/\s+/g, ' '); }
function canonicalHeaders(map) {
  // 逐项规范化键并携带各自值再排序（若用规范化后的键回查 map，混合大小写/带空格的键会取不到原值而产出空头）
  const entries = Object.keys(map).map(k => [trimall(k).toLowerCase(), map[k]]);
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return entries.map(([k, v]) => javaUrlEncode(k) + ':' + javaUrlEncode(trimall(v))).join('\n');
}
function buildCanonical(auth, method, path, qs, ch) {
  // 与 CanonicalRequestBuilder.build 一致：5 段 '\n' 连接，POST 的 queryString 为空串
  return auth + '\n' + method.toUpperCase() + '\n' + path + '\n' + (qs || '') + '\n' + ch;
}
async function sha256Hex(text) {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text == null ? '' : text)));
  return [...d].map(b => b.toString(16).padStart(2, '0')).join('');
}
// 解析 x-wop-content-digest 头：<alg> <恰一空格> <64 位小写 hex>（D2/F5 语义）
// 返回 { ok:true, alg, hex } 或 { ok:false }；与向量自测（formatRules）共用同一实现
function parseDigestHeader(header) {
  const m = /^(sha-256|sm3) ([0-9a-f]{64})$/.exec(String(header || '').trim());
  return m ? { ok: true, alg: m[1], hex: m[2] } : { ok: false };
}

// base64url 严格性校验（F6/D10 附录）：无填充、字母表、尾字符低 4/2 位须为零
// 与 Go RawURLEncoding.Strict() 对拍一致；页面业务解析保持宽容（容错粘贴），格式判定用本函数
const B64U_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function strictB64urlOk(s) {
  const t = String(s || '').trim();
  if (!t || t.includes('=') || !/^[A-Za-z0-9_-]+$/.test(t)) return false;
  const rem = t.length % 4;
  if (rem === 1) return false; // 不可能出现的长度
  const last = B64U_ALPHABET.indexOf(t.charAt(t.length - 1));
  if (last < 0) return false;
  if (rem === 2) return (last & 0x0f) === 0; // 尾字符低 4 位须为零
  if (rem === 3) return (last & 0x03) === 0; // 尾字符低 2 位须为零
  return true;
}
function randBytes(n) { return crypto.getRandomValues(new Uint8Array(n)); }
function nonce32() { return [...randBytes(16)].map(b => b.toString(16).padStart(2, '0')).join(''); }

// —— Web Crypto 包装 ——
async function importPriv(der) {
  return crypto.subtle.importKey('pkcs8', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
}
async function importPrivSign(der) {
  return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}
async function importPub(der, usage) {
  const alg = usage === 'verify' ? { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } : { name: 'RSA-OAEP', hash: 'SHA-256' };
  return crypto.subtle.importKey('spki', der, alg, false, [usage]);
}

// —— 步骤列表渲染 ——
function renderSteps(el, steps) {
  el.innerHTML = '';
  for (const s of steps) {
    const li = document.createElement('li');
    li.className = s.ok === true ? 'ok' : s.ok === false ? 'bad' : 'skip';
    const st = document.createElement('span');
    st.className = 'st';
    st.textContent = s.ok === true ? '✓' : s.ok === false ? '✗' : '·';
    const detail = document.createElement('span');
    detail.className = 'detail';
    detail.textContent = s.ok === false && s.err ? s.err : s.text;
    li.append(st, detail);
    el.appendChild(li);
  }
}
function setRows(tableId, rows) {
  const tb = $(tableId);
  tb.innerHTML = '';
  for (const [k, v] of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + k + '</td><td class="copyable" title="' + T('main.copy.title', '点击复制') + '"></td>';
    tr.lastChild.textContent = v;
    tr.lastChild.addEventListener('click', () => copyText(v).then(() => toast(T('main.copied.cell', '{k} 已复制', { k: k }))).catch(() => {}));
    tb.appendChild(tr);
  }
}
function shQuote(s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; }

// —— 联调状态 ——
const wopCtx = { platformPriv: null, platformPubDer: null, lastDek: null, lastWireBody: null, lastPlainBody: null };

async function refreshMerchantFp() {
  const raw = $('m-priv').value;
  if (!raw.trim()) {
    return;
  }
  try {
    const spki = pkcs8ToSpki(keyInputToDer(raw));
    const d = new Uint8Array(await crypto.subtle.digest('SHA-256', spki));
    $('m-pub-fp').textContent = T('main.kg.mfp', '商户公钥指纹（SHA-256/SPKI）：{fp}', { fp: [...d].map(b => b.toString(16).padStart(2, '0')).join('') });
  } catch (e) {
    $('m-pub-fp').textContent = T('main.kg.mfpbad', '私钥解析失败：{msg}', { msg: e.message });
  }
}

const WOP_ERRORS = {
  'OP_GW_1001': { d: 'appKey 为空或应用不存在', t: 'BIZ', s: '检查 x-wop-appkey 是否正确传递' },
  'OP_GW_1002': { d: '应用已停用', t: 'BIZ', s: '检查应用状态，联系运营启用' },
  'OP_GW_1003': { d: '无 API 权限（未授权或已过期）', t: 'BIZ', s: '检查应用是否已授权该 API 且授权在有效期内' },
  'OP_GW_1005': { d: 'IP 白名单未通过', t: 'BIZ', s: '检查客户端 IP 是否在应用白名单中' },
  'OP_GW_1006': { d: '签名校验失败', t: 'BIZ', s: '检查签名算法、密钥及待签名串拼接规则' },
  'OP_GW_1007': { d: '签名时效过期（timestamp 超出窗口）', t: 'BIZ', s: '检查 x-wop-timestamp（毫秒时间戳）与服务器时间差是否在 expiredSeconds 窗口内' },
  'OP_GW_1008': { d: 'IP 黑名单拦截', t: 'BIZ', s: '请求 IP 命中平台黑名单' },
  'OP_GW_1009': { d: 'nonce 重复（防重放）', t: 'BIZ', s: '检查 nonce 是否已使用过' },
  'OP_GW_1010': { d: '缺少 x-wop-sign 请求头', t: 'BIZ', s: '检查签名头是否携带' },
  'OP_GW_1011': { d: 'x-wop-sign 格式错误', t: 'BIZ', s: '检查 securityReq 与 authString 的空格分隔及 <protocolVersion>/<expiredSeconds>/<signedHeaders>/<signature> 四段结构' },
  'OP_GW_1012': { d: '不支持的签名协议版本', t: 'BIZ', s: '检查 protocolVersion 是否为 v1' },
  'OP_GW_1013': { d: 'securityReq 无法识别或格式错误', t: 'BIZ', s: '检查 securityReq 是否为 WOP-<密钥算法>-<摘要算法> 结构' },
  'OP_GW_1014': { d: '不支持的密钥算法/摘要算法或密钥长度非法', t: 'BIZ', s: '检查支持的套件组合（RSA3072/RSA4096/SM2）' },
  'OP_GW_1015': { d: '签名时效参数非法（expiredSeconds 缺失/超范围）', t: 'BIZ', s: '检查 expiredSeconds 取值在 (0, 86400] 秒' },
  'OP_GW_1016': { d: 'signature 为空', t: 'BIZ', s: '检查签名串是否完整' },
  'OP_GW_1017': { d: 'signedHeaders 缺失或声明不完整', t: 'BIZ', s: '检查 signedHeaders 必含标头及 x-wop-encrypt 参与签名' },
  'OP_GW_1018': { d: '请求体摘要缺失或不匹配', t: 'BIZ', s: '检查 x-wop-content-sha256 与请求体是否一致' },
  'OP_GW_1019': { d: '缺少 x-wop-nonce（防重放参数缺失）', t: 'BIZ', s: '检查 nonce 头是否携带' },
  'OP_GW_1020': { d: '应用未配置 IP 白名单', t: 'BIZ', s: '联系运营在应用白名单中配置允许 IP' },
  'OP_GW_1021': { d: '老商户固定密钥认证失败（fixed-key 不匹配）', t: 'BIZ', s: '检查 fixed-key 与平台登记的 appSecret 是否一致' },
  'OP_GW_1022': { d: '签名验证失败', t: 'BIZ', s: '检查签名密钥与签名串组装是否符合协议文档' },
  'OP_GW_1023': { d: '请求体摘要缺失或不匹配（x-wop-content-digest）', t: 'BIZ', s: '检查 x-wop-content-digest 值：<sha-256|sm3> + 恰一空格 + 64 位小写 hex，摘要对象为请求体线上原始字节' },
  'OP_GW_2001': { d: '必填字段缺失', t: 'BIZ', s: '检查 api_para 表中 must_fill_flag=1 的字段是否传递' },
  'OP_GW_2002': { d: '加密指令解析失败', t: 'BIZ', s: '检查 x-wop-encrypt Header 格式是否正确' },
  'OP_GW_2003': { d: 'L2 加密指令缺少 dek', t: 'BIZ', s: '检查 L2 加密请求是否携带 x-wop-encrypt 的 dek 段' },
  'OP_GW_2004': { d: 'DEK alg 与套件族不符', t: 'BIZ', s: '检查 x-wop-encrypt 的 dek 段 alg：RSA 族须 AES-256-GCM，SM2 族须 SM4-GCM（公开映射知识）' },
  'OP_GW_2005': { d: '解密失败', t: 'BIZ', s: '检查加密密钥与加密指令是否符合协议文档' },
  'OP_GW_2006': { d: '请求体超过大小上限', t: 'BIZ', s: '检查请求体大小：按线上总字节计（含 Base64 膨胀）不超过 10MB' },
  'OP_GW_3001': { d: '接口状态不允许调用（草稿/已下线）', t: 'BIZ', s: '检查接口发布状态' },
  'OP_GW_3002': { d: '能力包未启用', t: 'BIZ', s: '检查能力表状态' },
  'OP_GW_4001': { d: '下游服务超时（含重试耗尽）', t: 'EXT', s: '检查下游服务响应时间及网络连通性' },
  'OP_GW_4002': { d: '下游服务不可达', t: 'EXT', s: '检查下游服务状态及路由地址配置' },
  'OP_GW_4003': { d: '下游响应为空', t: 'EXT', s: '检查下游服务返回内容' },
  'OP_GW_4004': { d: '下游连接失败/超时（重试耗尽）', t: 'EXT', s: '检查下游服务状态及网络连通性' },
  'OP_GW_4005': { d: '路由调用异常（响应解析等客户端异常）', t: 'EXT', s: '检查下游服务响应格式及网关配置' },
  'OP_GW_5001': { d: '系统内部异常', t: 'SYS', s: '联系运维或开发排障，请携带 traceId' },
  'OP_GW_5002': { d: '配置缺失（路由配置为空等）', t: 'DAT', s: '检查 API 定义中域名和路径配置' },
  'OP_GW_5003': { d: '请求解密失败（DEK 解包失败）', t: 'SYS', s: '检查密钥集与加密算法是否匹配' },
  'OP_GW_5004': { d: '响应加密失败', t: 'SYS', s: '检查密钥与算法配置' },
  'OP_GW_5005': { d: '密钥已过期且无可用密钥', t: 'BIZ', s: '检查 app_secret 表中是否有有效密钥集' },
  'OP_GW_5006': { d: '字段映射失败（类型转换错误）', t: 'DAT', s: '检查 api_field_mapp 表字段类型与请求值格式' },
  'OP_GW_5007': { d: '响应为空（Pipeline 无输出）', t: 'SYS', s: '联系运维排查响应链路' },
  'OP_GW_5008': { d: '后端服务 URL 或 API 路径为空', t: 'DAT', s: '检查后端服务地址与 API 路径配置' },
  'OP_GW_5009': { d: 'API 无全量发布版本', t: 'DAT', s: '检查 API 是否存在已发布的全量版本' },
  'OP_GW_5010': { d: '解密未找到匹配密钥集', t: 'SYS', s: '检查密钥集与验签命中的密钥是否一致' },
  'OP_GW_5011': { d: '无法确定解密算法套件', t: 'SYS', s: '检查加密指令与密钥套件配置' },
  'OP_GW_5012': { d: '密钥集缺少平台私钥', t: 'SYS', s: '检查密钥集中是否登记平台私钥' },
  'OP_GW_5013': { d: 'L2 请求体缺少 encrypted 密文字段', t: 'SYS', s: '检查 L2 报文包装格式' },
  'OP_GW_5014': { d: '解密引擎执行失败', t: 'SYS', s: '检查密钥与算法参数是否正确' },
  'OP_GW_5015': { d: '无法确定加密套件', t: 'SYS', s: '检查出站加密指令与密钥套件配置' },
  'OP_GW_5016': { d: '响应 DEK 包裹失败', t: 'SYS', s: '检查商户公钥与算法配置' },
  'OP_GW_5017': { d: '无法确定出站签名套件', t: 'SYS', s: '检查入站签名套件是否在上下文中保留' },
  'OP_GW_5018': { d: '出站加签失败', t: 'SYS', s: '联系运维排查出站签名链路' },
  'OP_GW_5019': { d: '出站加签未找到匹配密钥集', t: 'DAT', s: '检查密钥集与入站验签是否一致' },
  'OP_GW_5020': { d: '出站加签密钥已失效', t: 'DAT', s: '检查密钥有效期配置' },
  'OP_GW_5021': { d: '出站加签密钥集缺少平台私钥', t: 'DAT', s: '检查密钥集中是否登记平台私钥' },
  'OP_GW_5022': { d: '字段目标路径结构冲突', t: 'DAT', s: '检查 api_field_mapp 目标路径与报文结构是否匹配' },
  'OP_GW_5023': { d: '字段路径表达式非法', t: 'DAT', s: '检查 api_field_mapp 路径表达式语法' },
  'OP_GW_5024': { d: '出参映射失败', t: 'DAT', s: '检查 api_field_mapp 出参规则与下游响应格式' },
  'OP_GW_9001': { d: '请求限流（达到 QPS 配额）', t: 'BIZ', s: '降低请求频率，稍后重试' },
  'OP_GW_9002': { d: '接口熔断中', t: 'BIZ', s: '等待熔断恢复后重试' },
  'OP_GW_9003': { d: '后端服务并发已达上限', t: 'BIZ', s: '降低并发或联系运维调整后端服务 maxConcurrent 配置' },
};

// —— WF8 错误码分类段（wop-specs 冻结分类：编号归属实现、分类/对外语义冻结）——
const ERR_SEG = {
  '1': { name: '鉴权 / 认证（签名、密钥、防重放、IP 白名单）', scope: '商户自查后重试', retry: false },
  '2': { name: '参数校验 / 加密协议（格式、DEK、解密）', scope: '商户自查后重试', retry: false },
  '3': { name: '业务规则（接口状态、能力包）', scope: '按提示处理，必要时联系平台', retry: false },
  '4': { name: '依赖方异常（下游超时 / 不可达）', scope: '稍后重试；持续则携带 traceId 联系平台', retry: true },
  '5': { name: '平台内部错误（配置 / 密钥集 / 映射）', scope: '携带 traceId 联系平台', retry: false },
  '9': { name: '限流 / 降级', scope: '稍后重试', retry: true },
};
// 个别覆盖：平台侧解密链路（DEK 解包）可能与商户使用的公钥配置相关，商户可先自查
const ERR_OVERRIDE = {
  'OP_GW_5003': { scope: '检查是否用平台下发的正确公钥加密；仍失败则携带 traceId 联系平台' },
  'OP_GW_5010': { scope: '检查密钥集与验签命中密钥是否一致；必要时联系平台' },
  'OP_GW_5012': { scope: '检查平台密钥集是否登记平台私钥；必要时联系平台' },
  'OP_GW_5014': { scope: '检查密钥与算法参数；必要时联系平台' },
};

// —— WF7 原始 HTTP 报文解析（起始行 + 头 + 空行 + body，请求/响应方向通用）——
function parseWireMessage(text) {
  const lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
  const out = { start: '', headers: {}, body: '', errors: [] };
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  if (i >= lines.length) { out.errors.push(T('main.wire.empty', '空输入：未找到起始行')); return out; }
  out.start = lines[i].trim(); i++;
  if (!/^(?:[A-Z]+\s+\S+\s+HTTP\/1\.[01]|HTTP\/1\.[01]\s+\d{3})/.test(out.start)) {
    out.errors.push(T('main.wire.badstart', '起始行无法识别：{v}（应为「METHOD 路径 HTTP/1.1」或「HTTP/1.1 状态码」）', { v: out.start.slice(0, 60) }));
  }
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (!l.trim()) { i++; break; }
    const m = /^([^:\s]+):\s*(.*)$/.exec(l);
    if (!m) { out.errors.push(T('main.wire.badhdr', '非法头行（缺少冒号分隔）：{v}', { v: l.slice(0, 60) })); continue; }
    out.headers[m[1].toLowerCase()] = m[2].trim();
  }
  out.body = lines.slice(i).join('\n').trim();
  return out;
}

// spec:WF7 —— 粘贴报文 → 解析 → 填充验证区（含缺头/格式诊断）
function fillVerifyFromWire() {
  const st = [];
  const w = parseWireMessage($('wire-paste').value);
  if (w.errors.length) {
    for (const e of w.errors) st.push({ ok: false, text: T('main.wire.parse', '报文解析：{e}', { e: e }) });
    renderSteps($('wire-steps'), st);
    $('wire-status').textContent = T('main.wire.partial', '解析未完全成功，已填充可识别字段');
    return;
  }
  const H = w.headers;
  const map = { 'x-wop-sign': 'v-sign', 'x-wop-encrypt': 'v-encrypt', 'x-wop-nonce': 'v-nonce', 'x-wop-timestamp': 'v-ts', 'x-wop-content-digest': 'v-sha', 'x-wop-appkey': 'v-appkey' };
  let filled = 0;
  for (const [hk, vid] of Object.entries(map)) {
    if (H[hk] !== undefined) { $(vid).value = H[hk]; filled++; }
  }
  if (w.body) { $('v-body').value = w.body; filled++; }
  st.push({ ok: filled > 0, text: filled > 0 ? T('main.wire.filled', '已填充 {n} 个字段', { n: filled }) : T('main.wire.none', '未识别到任何 WOP 头/报文体') });
  const required = ['x-wop-sign', 'x-wop-content-digest', 'x-wop-nonce', 'x-wop-timestamp'];
  const missing = required.filter(k => H[k] === undefined);
  if (missing.length) st.push({ ok: false, text: T('main.wire.missing', '缺失必填头：{list}（缺项无法完整验签，请补全或改为粘贴完整报文）', { list: missing.join(', ') }) });
  if (H['x-wop-content-digest'] !== undefined && !parseDigestHeader(H['x-wop-content-digest']).ok)
    st.push({ ok: false, text: T('main.wire.digest.bad', 'x-wop-content-digest 格式非法：应为 <sha-256|sm3> + 恰一空格 + 64 位小写 hex') });
  if (H['x-wop-encrypt'] !== undefined && !/^L2;dek=[A-Za-z0-9_-]+$/.test(H['x-wop-encrypt']))
    st.push({ ok: false, text: T('main.wire.enc.bad', 'x-wop-encrypt 格式非法：应为 L2;dek=<base64url（RSA-OAEP 包装后的 DEK 密文）>') });
  if (H['x-wop-sign'] !== undefined && !/^WOP-/.test(H['x-wop-sign']))
    st.push({ ok: false, text: T('main.wire.sign.bad', 'x-wop-sign 应以 securityReq（WOP-<算法>-<摘要>）开头，后接 v1/expiredSeconds/signedHeaders/signature') });
  if (H['x-wop-timestamp'] !== undefined && !/^\d{10,13}$/.test(H['x-wop-timestamp']))
    st.push({ ok: false, text: T('main.wire.ts.bad', 'x-wop-timestamp 应为毫秒时间戳（13 位数字）') });
  renderSteps($('wire-steps'), st);
  $('wire-status').textContent = T('main.wire.done', '完成，可点击「验证并解密」复核');
}

// spec:WF8 —— 平台错误码诊断（62 码公共契约字典 + 信封/报文粘贴识别）
function diagnoseError() {
  const raw = $('err-json').value.trim();
  const out = $('err-out');
  const st = [];
  let code = null, msg = null, traceId = null;
  if (!raw) { $('err-status').textContent = T('main.err.empty', '请先粘贴错误响应信封或错误码'); return; }
  // 尝试整体报文 → 取 body；或直接 JSON 信封；或裸错误码
  const w = parseWireMessage(raw);
  const body = (w.body || raw).trim();
  try {
    const j = JSON.parse(body);
    code = j.code || code; msg = j.msg || j.message || null; traceId = j.traceId || null;
  } catch (e) {
    const m = /(OP_GW_\d{4}|OP_CB_\d{4})/.exec(raw);
    if (m) code = m[1];
  }
  if (!code) {
    st.push({ ok: false, text: T('main.err.nocode', '未识别到错误码：请粘贴 {"code":"OP_GW_xxxx",...} 信封、完整错误响应报文，或裸错误码') });
    renderSteps(out, st);
    $('err-status').textContent = T('main.err.failed', '诊断失败');
    return;
  }
  const info = WOP_ERRORS[code];
  const seg = ERR_SEG[code.slice(6, 7)] || { name: T('main.err.seg.unknown', '未知分类段'), scope: T('main.err.seg.scope', '对照最新协议文档'), retry: false };
  const ov = ERR_OVERRIDE[code] || {};
  const rows = [
    [T('main.err.k.code', '错误码'), code],
    [T('main.err.k.meaning', '含义'), info ? info.d : T('main.err.unknown.dict', '（不在内置 62 码字典内 —— 新契约或非平台码，请对照最新文档）')],
    [T('main.err.k.class', '分类'), seg.name],
    [T('main.err.k.advice', '处置建议'), info ? info.s : '——'],
    [T('main.err.k.owner', '归属'), ov.scope || seg.scope],
    [T('main.err.k.retry', '可重试'), seg.retry ? T('main.err.retry.yes', '可稍后重试') : T('main.err.retry.no', '修复后重试（不建议直接重发原报文）')],
  ];
  if (traceId) rows.push(['traceId', T('main.err.trace', '{id}（联系平台排障时请附带）', { id: traceId })]);
  out.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'card';
  const badge = document.createElement('div');
  badge.className = 'badge ' + (info ? 'ok' : 'err');
  badge.textContent = info ? T('main.err.hit', '字典命中：{code}', { code: code }) : T('main.err.miss', '未知码：{code}', { code: code });
  card.appendChild(badge);
  const tb = document.createElement('table');
  tb.className = 'kv';
  for (const [k, v] of rows) {
    const tr = document.createElement('tr');
    const th = document.createElement('th'); th.textContent = k;
    const td = document.createElement('td'); td.textContent = v;
    tr.appendChild(th); tr.appendChild(td);
    tb.appendChild(tr);
  }
  card.appendChild(tb);
  out.appendChild(card);
  $('err-status').textContent = info ? T('main.err.st.hit', '命中公共契约字典') : T('main.err.st.miss', '未命中（见提示）');
}

/* ============ 构造请求（商户 → 网关） ============ */
async function buildRequest() {
  $('r-status').textContent = '';
  const steps = [];
  renderSteps($('req-steps'), steps);
  let ctx;
  try {
    const suite = $('r-suite').value;
    if (suite === 'WOP-SM2-SM3') throw new Error(T('main.bld.sm2only', '本页请求构造仅支持 RSA 两套件；WOP-SM2-SM3 请切换到「国密」标签页（国密请求构造区，SM2 签名 + SM4-GCM 加密）'));
    const appKey = $('r-appkey').value.trim();
    const path = $('r-path').value.trim();
    const expired = String(parseInt($('r-expired').value, 10) || 1800);
    const level = $('r-level').value;
    const plainBody = $('r-body').value;
    const host = $('r-host').value.trim().replace(/\/+$/, '');
    if (!appKey) throw new Error(T('main.bld.noappkey', 'appKey 不能为空'));
    if (!path.startsWith('/')) throw new Error(T('main.bld.nopath', '请求路径需以 / 开头'));
    if (level === 'L2') { JSON.parse(plainBody); } // L2 明文约定为业务 JSON

    const merchantPrivDer = keyInputToDer($('m-priv').value);
    const merchantPubDer = pkcs8ToSpki(merchantPrivDer);
    const platformPubDer = keyInputToDer($('p-pub').value);

    // 1. 线上请求体（L2：AES-256-GCM 全文加密）与 dek
    let wireBody = plainBody, encryptHeader = null, dek = null;
    if (level === 'L2') {
      dek = randBytes(32);
      const iv = randBytes(12);
      const aesKey = await crypto.subtle.importKey('raw', dek, 'AES-GCM', false, ['encrypt']);
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aesKey, new TextEncoder().encode(plainBody)));
      wireBody = '{"encrypted":"' + b64urlFromBytes(ct) + '"}';
      const payload = 'AES-256-GCM$' + b64urlFromBytes(dek) + '$' + b64urlFromBytes(iv);
      const enc = await importPub(platformPubDer, 'encrypt');
      const wrapped = new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, enc, new TextEncoder().encode(payload)));
      encryptHeader = 'L2;dek=' + b64urlFromBytes(wrapped);
    }

    // 2. 参与签名的头（ASCII 升序由 canonicalHeaders 统一排序）
    const headers = {};
    headers['x-wop-appkey'] = appKey;
    headers['x-wop-content-digest'] = 'sha-256 ' + await sha256Hex(wireBody);
    if (encryptHeader) headers['x-wop-encrypt'] = encryptHeader;
    headers['x-wop-nonce'] = nonce32();
    headers['x-wop-timestamp'] = String(Date.now());

    // 3. canonical + 签名
    const authString = 'v1/' + expired;
    const canonical = buildCanonical(authString, 'POST', path, '', canonicalHeaders(headers));
    const signKey = await importPrivSign(merchantPrivDer);
    const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', signKey, new TextEncoder().encode(canonical)));
    const signature = b64urlFromBytes(sig);
    const signedNames = Object.keys(headers).sort().join(';');
    const signHeader = suite + ' ' + authString + '/' + signedNames + '/' + signature;

    // 4. 本地预检（等价网关 SignFilter 重建路径）
    const verKey = await importPub(merchantPubDer, 'verify');
    const selfOk = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', verKey, sig, new TextEncoder().encode(canonical));
    steps.push({ ok: true, text: level === 'L2' ? T('main.bld.step.dek.l2', 'DEK/密文：AES-256-GCM 32B key + 12B IV，RSA-OAEP(SHA-256) 包装') : T('main.bld.step.dek.l0', 'DEK/密文：L0 明文') });
    steps.push({ ok: selfOk !== false, text: selfOk ? T('main.bld.step.pre.ok', '本地预检：以商户公钥对 canonicalRequest 验签通过') : T('main.bld.step.pre.bad', '本地预检：以商户公钥对 canonicalRequest 验签失败') });
    if (wopCtx.platformPriv && level === 'L2') {
      // 联调模式全链路自检：模拟平台私钥解包 DEK 并解密 body
      const decKey = await crypto.subtle.importKey('pkcs8', wopCtx.platformPriv, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
      const dekPlain = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, decKey, bytesFromB64url(encryptHeader.slice(encryptHeader.indexOf('dek=') + 4))));
      const parts = dekPlain.split('$');
      const aesKey2 = await crypto.subtle.importKey('raw', bytesFromB64url(parts[1]), 'AES-GCM', false, ['decrypt']);
      const wire = JSON.parse(wireBody);
      const plain = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytesFromB64url(parts[2]), tagLength: 128 }, aesKey2, bytesFromB64url(wire.encrypted)));
      steps.push({ ok: plain === plainBody, text: plain === plainBody ? T('main.bld.step.e2e.ok', '联调全链路：模拟平台私钥解包 DEK → AES-GCM 解密 body 一致') : T('main.bld.step.e2e.bad', '联调全链路：模拟平台私钥解包 DEK → AES-GCM 解密 body 不一致！') });
    }

    // 5. 渲染
    wopCtx.lastDek = dek;
    wopCtx.lastPlainBody = plainBody;
    $('req-canonical').textContent = canonical;
    const rows = Object.entries(headers).concat([['x-wop-sign', signHeader]]);
    setRows('req-headers', rows);
    $('req-wire-body').textContent = wireBody;
    const curl = ['curl -X POST ' + shQuote(host + path), "-H 'content-type: application/json'"]
      .concat(rows.map(([k, v]) => '-H ' + shQuote(k + ': ' + v)))
      .concat(['--data-raw ' + shQuote(wireBody)]).join(' \\\n  ');
    $('req-curl').textContent = curl;
    $('req-out').classList.add('show');
    renderSteps($('req-steps'), steps);
    $('r-status').textContent = T('main.bld.done', '构造完成');
  } catch (e) {
    steps.push({ ok: false, err: T('main.bld.fail', '构造失败：{msg}', { msg: e.message || e }) });
    renderSteps($('req-steps'), steps);
    $('r-status').textContent = '';
  }
}

/* ============ 验证平台报文（同步响应 / 异步回调，网关 → 商户） ============ */
// canonical 的 URI：同步响应取网关请求路径；异步回调取商户回调 URL 的 path
function verifyUri() {
  const type = $('v-type').value;
  if (type !== 'callback') return $('r-path').value.trim();
  const u = new URL($('v-cburl').value.trim());
  return u.pathname || '/';
}

// —— SM2 密钥互转（国密分派用）——
// X.509 SPKI → 04‖X‖Y hex（65B）；主页面 derSplit 逐层剥 BIT STRING
function spkiToPubHex(der) {
  const top = derSplit(der);
  if (top.length !== 1 || top[0].tag !== 0x30) throw new Error(T('main.ver.spki.bad', '平台公钥须为 X.509 SPKI（DER SEQUENCE）'));
  const inner = derSplit(top[0].content);
  // SM2 曲线校验：AlgorithmIdentifier 须含 ecPublicKey(1.2.840.10045.2.1) 与 SM2(1.2.156.10197.1.301)
  const alg = inner.length > 0 && inner[0].tag === 0x30 ? derSplit(inner[0].content) : [];
  const oidHexs = alg.filter(x => x.tag === 0x06).map(x => [...x.content].map(b => b.toString(16).padStart(2, '0')).join(''));
  if (!oidHexs.includes('2a8648ce3d0201') || !oidHexs.includes('2a811ccf5501822d'))
    throw new Error('平台公钥非 SM2 曲线（AlgorithmIdentifier 缺 1.2.156.10197.1.301）');
  const bs = inner.length > 1 && inner[1].tag === 0x03 ? inner[1].content : null;
  if (!bs || bs.length < 66 || bs[0] !== 0x00) throw new Error('SPKI 不含公钥点（BIT STRING 解析失败）');
  const pub = bs.subarray(1);
  if (pub.length !== 65 || pub[0] !== 0x04) throw new Error('平台公钥非 SM2 曲线（须为 04‖X‖Y 65 字节）');
  return [...pub].map(b => b.toString(16).padStart(2, '0')).join('');
}
// SM2 PKCS#8 私钥 → d 标量 hex（32B）；非国密私钥返回 null
function sm2DHexFromPkcs8(der) {
  try {
    const top = derSplit(der);
    if (top.length !== 1 || top[0].tag !== 0x30) return null;
    const outer = derSplit(top[0].content);          // INTEGER version / algId / OCTET STRING privateKey
    if (outer.length !== 3 || outer[0].tag !== 0x02 || outer[2].tag !== 0x04) return null;
    const alg = derSplit(outer[1].content);
    if (alg.length < 2 || alg[0].tag !== 0x06) return null;
    // ECPrivateKey 是 SEQUENCE：标准 PKCS#8 的 OCTET STRING 内先有一层 SEQUENCE（兼容平铺元素列表的宽松输入）
    const ecSeq = derSplit(outer[2].content);
    if (ecSeq.length === 1 && ecSeq[0].tag === 0x30) {
      const inner = derSplit(ecSeq[0].content);      // ECPrivateKey 内：INTEGER 1 / OCTET STRING d / …
      if (inner.length < 2 || inner[0].tag !== 0x02 || inner[1].tag !== 0x04) return null;
      const d = inner[1].content;
      return d.length === 32 ? [...d].map(b => b.toString(16).padStart(2, '0')).join('') : null;
    }
    const inner = derSplit(outer[2].content);        // 宽松输入：直接是 INTEGER 1 / OCTET STRING d / …
    if (inner.length < 2 || inner[0].tag !== 0x02 || inner[1].tag !== 0x04) return null;
    const d = inner[1].content;
    return d.length === 32 ? [...d].map(b => b.toString(16).padStart(2, '0')).join('') : null;
  } catch (e) { return null; }
}

async function verifyResponse() {
  $('v-status').textContent = '';
  const steps = [];
  renderSteps($('resp-steps'), steps);
  $('resp-out').classList.add('show');
  let plainText = null;
  try {
    const body = $('v-body').value;
    const vSign = $('v-sign').value.trim();
    const vEncrypt = $('v-encrypt').value.trim();
    const vNonce = $('v-nonce').value.trim();
    const vTs = $('v-ts').value.trim();
    const vSha = $('v-sha').value.trim();
    if (!vSign) throw new Error(T('main.ver.nosign', 'x-wop-sign 未填写'));

    // step1 解析签名头（F6 顺序：验签 → digest 复核 → DEK 解包 → alg 族比对 → bulk 解密）
    const sp = vSign.indexOf(' ');
    if (sp <= 0) throw new Error(T('main.ver.nospace', 'x-wop-sign 缺少 securityReq 与 authString 的空格分隔'));
    const securityReq = vSign.slice(0, sp);
    const seg = vSign.slice(sp + 1).trim().split('/');
    if (seg.length !== 4) throw new Error(T('main.ver.format4', 'x-wop-sign 应为 <protocolVersion>/<expiredSeconds>/<signedHeaders>/<signature>'));
    steps.push({ ok: true, text: T('main.ver.step.parse', '签名头解析：套件 {sr}，authString {a}', { sr: securityReq, a: seg[0] + '/' + seg[1] }) });

    // step2 重建 canonical 并用平台公钥验签
    const signedNames = seg[2].split(';').map(s => s.trim()).filter(Boolean);
    const avail = { 'x-wop-nonce': vNonce, 'x-wop-timestamp': vTs, 'x-wop-content-digest': vSha, 'x-wop-encrypt': vEncrypt, 'x-wop-appkey': $('v-appkey').value.trim() };
    const hmap = {};
    for (const name of signedNames) {
      if (!(name in avail)) throw new Error(T('main.ver.step.declared', 'signedHeaders 声明了本页未提供的标头: {name}（请人工按 canonical 规则验签）', { name: name }));
      hmap[name] = avail[name];
    }
    const canonical = buildCanonical(seg[0] + '/' + seg[1], 'POST', verifyUri(), '', canonicalHeaders(hmap));
    $('resp-canonical').textContent = canonical;

    // —— 国密套件分派（WOP-SM2-SM3）：SM2 验签 → SM3 复核 → SM2(C1C3C2) DEK 解包 → SM4-GCM 族比对 → 解密 ——
    if (securityReq === 'WOP-SM2-SM3') {
      if (typeof GmCore === 'undefined' || !GmCore.verifySmSuite) throw new Error(T('main.ver.gm.missing', '国密内核未加载（GmCore.verifySmSuite 缺失）'));
      const pubHex = spkiToPubHex(keyInputToDer($('p-pub').value));
      const privD = sm2DHexFromPkcs8(keyInputToDer($('m-priv').value));
      if (!privD) throw new Error(T('main.ver.gm.needpriv', '商户私钥须为 SM2 PKCS#8（国密联调；x-wop-encrypt 的 DEK 解包需要 d 标量）'));
      // SM2 userId 契约（2026-08-31 飞书裁决）：userId = x-wop-appkey header 值
      // golden 向量固定 '1234567812345678' 仅作向量夹具（gmcore GOLDEN_SM），产品路径一律取报文 appkey
      const userId = $('v-appkey').value.trim();
      if (!userId) throw new Error(T('main.ver.gm.needappkey', 'x-wop-appkey 必填（SM2 userId 契约：userId = x-wop-appkey 值）'));
      const gm = GmCore.verifySmSuite(
        { 'x-wop-sign': vSign, 'x-wop-content-digest': vSha, 'x-wop-encrypt': vEncrypt, 'x-wop-nonce': vNonce, 'x-wop-timestamp': vTs },
        body,
        { canonical: canonical, merchantPubHex: pubHex, platformPrivHex: privD, userId: userId });
      for (const s of gm.steps) steps.push({ ok: s.ok, text: s.ok ? s.name : s.name + '：' + s.reason });
      plainText = gm.decryptedBody;
      $('resp-plain').textContent = plainText;
      $('resp-plain-wrap').style.display = '';
      renderSteps($('resp-steps'), steps);
      $('v-status').textContent = gm.allOk ? T('main.ver.ok', '验证通过') : T('main.ver.bad', '存在失败项');
      return;
    }
    const platformPubDer = keyInputToDer($('p-pub').value);
    const verKey = await importPub(platformPubDer, 'verify');
    const sigOk = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', verKey, bytesFromB64url(seg[3]), new TextEncoder().encode(canonical));
    steps.push({ ok: sigOk, text: sigOk ? T($('v-type').value === 'callback' ? 'main.ver.step.sign.ok.cb' : 'main.ver.step.sign.ok.resp',
      $('v-type').value === 'callback' ? '验签通过：平台公钥 SHA256withRSA 校验回调签名' : '验签通过：平台公钥 SHA256withRSA 校验响应签名')
      : T('main.ver.step.sign.bad', '验签失败：检查平台公钥是否匹配、报文类型/回调 URL 是否正确（canonical 的 URI 取自其 path）、头值是否复制完整') });

    // step3 摘要复核（F6：验签之后；I5：RSA 套件只认 sha-256 头，sm3 头视为跨族拒绝）
    const computed = await sha256Hex(body);
    const dh = parseDigestHeader(vSha);
    const shaOk = dh.ok && dh.alg === 'sha-256' && dh.hex === computed;
    steps.push({ ok: shaOk, text: shaOk ? T('main.ver.step.sha.ok', '摘要复核：sha-256(body) 与 x-wop-content-digest 一致')
      : T('main.ver.step.sha.bad', '摘要复核失败：header={h}，实际 sha-256={c}（RSA 套件须为 sha-256 + 恰一空格 + 64 位小写 hex；sm3 头属跨族拒绝；body 可能被篡改或粘贴不完整）', { h: vSha || T('main.empty', '空'), c: computed }) });

    // step4 L2 解密
    if (vEncrypt.toUpperCase().startsWith('L2')) {
      const dekVal = vEncrypt.slice(vEncrypt.indexOf('dek=') + 4).trim();
      const priv = await importPriv(keyInputToDer($('m-priv').value));
      const payload = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, priv, bytesFromB64url(dekVal)));
      const parts = payload.split('$');
      if (parts.length !== 3) throw new Error(T('main.ver.dek.bad', 'DEK 载荷格式错误，应为 alg$key$iv'));
      steps.push({ ok: true, text: T('main.ver.step.dek', 'DEK 解包：算法 {alg}（商户私钥 RSA-OAEP）', { alg: parts[0] }) });
      if (parts[0].toUpperCase() !== 'AES-256-GCM') throw new Error(T('main.ver.alg.unsupported', '暂不支持报文算法 {alg}', { alg: parts[0] }));
      const aesKey = await crypto.subtle.importKey('raw', bytesFromB64url(parts[1]), 'AES-GCM', false, ['decrypt']);
      const wire = JSON.parse(body);
      if (!wire.encrypted) throw new Error(T('main.ver.noenc', '响应体缺少 encrypted 字段'));
      plainText = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytesFromB64url(parts[2]), tagLength: 128 }, aesKey, bytesFromB64url(wire.encrypted)));
      steps.push({ ok: true, text: T('main.ver.step.aes', 'AES-256-GCM 解密成功（GCM tag 校验通过）') });
    } else {
      plainText = body;
      steps.push({ text: T('main.ver.step.l0', 'L0 明文报文，跳过解密') });
    }
    $('resp-plain').textContent = plainText;
    $('resp-plain-wrap').style.display = '';
    renderSteps($('resp-steps'), steps);
    $('v-status').textContent = steps.every(s => s.ok !== false) ? T('main.ver.ok', '验证通过') : T('main.ver.bad', '存在失败项');
  } catch (e) {
    steps.push({ ok: false, err: T('main.ver.fail', '验证失败：{msg}', { msg: e.message || e }) });
    renderSteps($('resp-steps'), steps);
  }
}

/* ============ 模拟平台报文（响应 / 回调，联调闭环） ============ */
async function simulateResponse(kind) {
  $('v-status').textContent = '';
  const isCallback = kind === 'callback';
  try {
    if (!wopCtx.platformPriv) throw new Error(T('main.sim.noplatform', '请先点击「生成联调平台密钥对」'));
    let plainResp;
    let targetUri;
    if (isCallback) {
      const cbUrl = $('v-cburl').value.trim();
      if (!/^https?:\/\//.test(cbUrl)) throw new Error(T('main.sim.badurl', '回调类型需填写完整回调 URL（http(s):// 开头）'));
      targetUri = new URL(cbUrl).pathname || '/';
      plainResp = $('cb-body').value;
      JSON.parse(plainResp);
    } else {
      targetUri = $('r-path').value.trim();
      plainResp = JSON.stringify({ code: 'SUCCESS', message: 'simulated locally', model: JSON.parse($('r-body').value) });
    }
    // 复用入站 DEK（对应 CryptoFilter.post），IV 必须新生成
    const cek = wopCtx.lastDek || randBytes(32);
    const iv = randBytes(12);
    const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, aesKey, new TextEncoder().encode(plainResp)));
    const wire = '{"encrypted":"' + b64urlFromBytes(ct) + '"}';
    const payload = 'AES-256-GCM$' + b64urlFromBytes(cek) + '$' + b64urlFromBytes(iv);
    const merchantPubDer = pkcs8ToSpki(keyInputToDer($('m-priv').value));
    const enc = await importPub(merchantPubDer, 'encrypt');
    const wrapped = new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, enc, new TextEncoder().encode(payload)));
    const encryptHeader = 'L2;dek=' + b64urlFromBytes(wrapped);

    const headers = {
      'x-wop-nonce': nonce32(),
      'x-wop-timestamp': String(Date.now()),
      'x-wop-content-digest': 'sha-256 ' + await sha256Hex(wire),
      'x-wop-encrypt': encryptHeader
    };
    const canonical = buildCanonical('v1/1800', 'POST', targetUri, '', canonicalHeaders(headers));
    const signKey = await importPrivSign(wopCtx.platformPriv);
    const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', signKey, new TextEncoder().encode(canonical)));
    const signHeader = $('r-suite').value + ' v1/1800/' + Object.keys(headers).sort().join(';') + '/' + b64urlFromBytes(sig);

    $('v-sign').value = signHeader;
    $('v-encrypt').value = encryptHeader;
    $('v-nonce').value = headers['x-wop-nonce'];
    $('v-ts').value = headers['x-wop-timestamp'];
    $('v-sha').value = headers['x-wop-content-digest'];
    $('v-body').value = wire;
    await verifyResponse();

    // 回调：生成「平台 → 商户」curl，商户可直接打自己的接收端点自测
    if (isCallback) {
      const cbUrl = $('v-cburl').value.trim().replace(/\/+$/, '');
      const rows = Object.entries(headers).concat([['x-wop-sign', signHeader]]);
      const curl = ['curl -X POST ' + shQuote(cbUrl), "-H 'content-type: application/json'"]
        .concat(rows.map(([k, v]) => '-H ' + shQuote(k + ': ' + v)))
        .concat(['--data-raw ' + shQuote(wire)]).join(' \\\n  ');
      $('cb-curl').textContent = curl;
      $('cb-curl-wrap').hidden = false;
    } else {
      $('cb-curl-wrap').hidden = true;
    }
  } catch (e) {
    const steps = [{ ok: false, err: T('main.sim.fail', '模拟失败：{msg}', { msg: e.message || e }) }];
    renderSteps($('resp-steps'), steps);
    $('resp-out').classList.add('show');
  }
}

/* ============ Tab 与事件绑定 ============ */
document.querySelectorAll('#tabbar button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tabpage').forEach(p => { p.hidden = p.id !== 'tab-' + btn.dataset.tab; });
  });
});

$('m-priv').addEventListener('change', refreshMerchantFp);

// 平台公钥被手动替换后，配对联调私钥即失效（避免全链路自检误报 DEK 解包失败）
$('p-pub').addEventListener('change', async () => {
  if (!wopCtx.platformPriv) return;
  try {
    const cur = keyInputToDer($('p-pub').value);
    if (cur.length !== wopCtx.platformPubDer.length || cur.some((b, i) => b !== wopCtx.platformPubDer[i])) {
      wopCtx.platformPriv = null;
      wopCtx.platformPubDer = null;
      toast(T('main.sim.pubreplaced', '已检测到手动替换平台公钥，联调私钥已清除（全链路自检与模拟响应需重新生成联调密钥对）'));
    }
  } catch (e) { /* 输入暂不完整，不动 */ }
});

$('import-keygen').addEventListener('click', () => {
  if (!state.pkcs8) { toast(T('main.sim.needgen', '请先在「密钥生成」页生成密钥对')); return; }
  $('m-priv').value = toPem('PRIVATE KEY', state.pkcs8);
  refreshMerchantFp();
  toast(T('main.sim.imported', '已带入商户私钥'));
});

$('gen-platform').addEventListener('click', async () => {
  try {
    const bits = 3072;
    const kp = await crypto.subtle.generateKey(
      { name: 'RSA-OAEP', modulusLength: bits, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true, ['encrypt', 'decrypt']);
    wopCtx.platformPriv = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey));
    wopCtx.platformPubDer = new Uint8Array(await crypto.subtle.exportKey('spki', kp.publicKey));
    $('p-pub').value = toPem('PUBLIC KEY', wopCtx.platformPubDer);
    toast(T('main.sim.platform', '已生成联调平台密钥对（仅本会话内存）'));
  } catch (e) { toast(T('main.kg.genfail', '生成失败：{msg}', { msg: e.message || e })); }
});

$('parse-wire').addEventListener('click', fillVerifyFromWire);
$('diag-err').addEventListener('click', diagnoseError);
$('build-req').addEventListener('click', buildRequest);
$('verify-resp').addEventListener('click', () => verifyResponse());
$('sim-resp').addEventListener('click', () => simulateResponse('response'));
$('sim-cb').addEventListener('click', () => simulateResponse('callback'));

// 报文类型切换：回调时展示回调明文样例与回调 URL 输入强调
$('v-type').addEventListener('change', () => {
  const isCb = $('v-type').value === 'callback';
  $('cb-sample-wrap').hidden = !isCb;
});


/* ============================================================
 * 黄金向量 fixture —— 只读副本，禁手改（spec G6 / WF6）
 * 来源：wop-specs/crypto/crypto-vectors.json · 生成：2026-08-28 · TEST-ONLY 密钥
 * 语义锚：wop-sdk-spec v1.0-ratified F8（字节级向量合规）
 * 变更流程：真源更新 → 整体替换本块并 bump 版本声明，禁止手工改单个值
 * ============================================================ */
const WOP_VECTORS = {
 "meta": {
  "generated": "2026-08-28",
  "testOnly": true,
  "source": "wop-specs/crypto/crypto-vectors.json"
 },
 "message": "WOP 跨语言测试向量 2026-08-28 — The quick brown fox jumps over the lazy dog.",
 "dekPlaintext": "AES-256-GCM$AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8$EBESExQVFhcYGRob",
 "keys": {
  "rsa3072": {
   "priv": "MIIG/QIBADANBgkqhkiG9w0BAQEFAASCBucwggbjAgEAAoIBgQC1cm7GsOMA44UHs/YyjQ/34On+Bhlq4gc0rENrPKbc0NV7nXT4X7Rc0reN8vQljkyoIJOkTJtGXSEmtXWw9Y1tF66D03wVJnw32rIxIL8VOVcDxf3IwN/BgxawK52HoqQdV4VRoqPy6p4RWm44u5XTrWM3Ns6Q/Dc6zzEfVzm2ctNhMXI9jm15f5iRf7pzPsGyma2/Z5jX7r9KahgubBPHC43TtcoaXEyVDy4NovAeejLSy8dP7Jinuuhr6cZnQfEuOTaT9c01zSKlY0OGOnFykArdhzI1WLII5KuC7coSIbCk3HlSmSsBEijtXp+puLZCD6tf4DG1Xpxxt8xd7YnYcGqf7xHQx+41G8S6VPQNl60vjSG4lDRQZsPD4rWgrYFIC/PaBZ7VOSbSR9xgVib2mMlXozNSdN5E/G5l8cfMb8lmo7/mSuS3dmVCY9vczzG7yl5Qyv0oUwgnV8kQfxyn/42StkgO10C/kMCh+7ZMDN6QXENDcdzAiCQtZNBwaSMCAwEAAQKCAYAE+DxmfsPI63JiUqCEo+5zCJsAFSSvE7/Exo8WKdQcKjAesaJZhy2GeVMDtUrQmIQq+rFwh5SdKcHVsJSnoyIbgdGK1MkKP0KZuQi2ZcI2D5r9hHe9/uJiB3ggnSE0bNT35MTHBqBc7+YibYqlTSX+ZTpZccvYlr/ggXpD9HylLaHygIszemovMLp6CbiOnYJqpODoZCsAhw6AOEWvR9CG3B8nVExTyoFid8b4IqVXAFvSADjWTJGlzm29PurrOxgXGhmiwKlTxg0gfOtUX+qSknyxO5Kws9yYS9kYdwEjgU3umU6QkF6CeQ8c2P/cge9KaR5LWg5QCX6vcAjXTBScGrfEGyfEDylRvKTZjYdn8JvX+FW38oc3sXNZOK6IFoiRCSxIi95Yy+CObURT5GiiQrWVRu16YR3xNO/h0GoF4QvY+kFDxETrdC+R5qlxFJJpOMIEh4PvcY8dC7+5olbP8F5qhKmQPB/1wdUg4pSOlFVg+tl8j35uEpMQg9/PLRECgcEA839To5aGM1x0aILopl1F7Jlhyt5D4l590FCY2Cn5Tnm3oETmemeTlMqojEooGAJvgRHtXoQYE8PtwmFTQYlv/IHwr7Sepx5OP2PBXRa3DnfB6FatTCCbsGnrljlSYTHblMxN6aNZn2Cj5n8o1UzyiiBKJ/Sw+8hXk2JbGi1en5oEqkGsU1WZ2OPugyutMnP8GVwYziVNXODCy3Qv/UdyDPPMdQVjEIWJs0iUS3+T4z8d/OSbU8dv2p7AvGpWC0S7AoHBAL7DerS3HnGg5lo/yu47u8iOy+lnw+1attZATM+L0rAyZJDk/fgmUGvpt7p8VbJCEjiW9Nip4AALiHkKRm8e8cHJIPg55cwdhQT79VwMU+Qq7nnRGPcKmwSUuiH2b9TLkBVoP7i9tDcY7LNVEqWZvqsH/kLcwJ53/yj9nD6/KD3weiSfXikPJq8QrYABpzb536pAK/DQsPEG8UU7e8iebj0I2fKb6v+BLd2s4MpVIvUDYfmxNRHlnQW3Bkx6E0ZauQKBwClg7NSy4rFdt8Z+4IxM83IGirDP3pdcWWMKHz80utIUKxlIPCZ27YRuf///JhsWZt53LnBOYE0TkZbjtSNA+M/fQQiK2B8sLj3ldNmd35PM1B3ohOCX9f0fstI/gXlU4KzDn0Xh5XwJDzE/ULAWuGyymgd6NI1E+WTpZPPo29ihcsOAD4nF1TQfX8vYo0Ecpq2kke6ONjxfUZsDbphLCN2cnJUSSkhneQQHhHPkBTyr4Cu2qZKuJJrxOW2LYH3fuwKBwCRYzJ14MpXF6X4Sn5DK0tnA03tyaPNlkGa8M6Zr5sXppB2zc+x/KF2XV4lxvUZMrnoX0SkjHOoFSIh/e7IafEfHEcAaD/3XNgwgEbzrIGTeBTgyrgYMAENcLybfdKlf6+EYTuPdSWQiHJ+Cux3QcHLYAAsvUogfJv/hao7OD1XV5v/pWaCLIXzDubslFX41F/exaG3m5X/XKcteLRSpkymP8S73pEvwihOtp9sFY7a5YUaZDBqP3F5FZC7YJ6oFCQKBwQDdTVDa5PuBrtLe02ccIXLJFxOUwitcNY6zRe1on/5XMIufKVZDaE25/4nS7SLrZ3P0Yo5WMvTumhSyaoppqUwJ2W5/YCBXTTN8FUZLO5IlRSznVD7X/cccT1izKbU7+R3XUqASks9Ec3XX4+ttj3kKmL8n/k9J4TtY8Rg3GGXfJj7+Dr/yv9mirXkqmXA3ZzCwSQwSVz5MiFICEIsU9dl2WHfaGCkGTH29cyURvP8olAH4lrOrjwWcGMMy6wcN4c8=",
   "pub": "MIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAtXJuxrDjAOOFB7P2Mo0P9+Dp/gYZauIHNKxDazym3NDVe510+F+0XNK3jfL0JY5MqCCTpEybRl0hJrV1sPWNbReug9N8FSZ8N9qyMSC/FTlXA8X9yMDfwYMWsCudh6KkHVeFUaKj8uqeEVpuOLuV061jNzbOkPw3Os8xH1c5tnLTYTFyPY5teX+YkX+6cz7Bspmtv2eY1+6/SmoYLmwTxwuN07XKGlxMlQ8uDaLwHnoy0svHT+yYp7roa+nGZ0HxLjk2k/XNNc0ipWNDhjpxcpAK3YcyNViyCOSrgu3KEiGwpNx5UpkrARIo7V6fqbi2Qg+rX+AxtV6ccbfMXe2J2HBqn+8R0MfuNRvEulT0DZetL40huJQ0UGbDw+K1oK2BSAvz2gWe1Tkm0kfcYFYm9pjJV6MzUnTeRPxuZfHHzG/JZqO/5krkt3ZlQmPb3M8xu8peUMr9KFMIJ1fJEH8cp/+NkrZIDtdAv5DAofu2TAzekFxDQ3HcwIgkLWTQcGkjAgMBAAE="
  },
  "rsa4096": {
   "priv": "MIIJQgIBADANBgkqhkiG9w0BAQEFAASCCSwwggkoAgEAAoICAQCsoMFMl/c3BeAPcsIaxTrn/OB+NP1+dmCkaWBe8436FUlM891mI+6pyGeSnWdk+/FrkFNWEeexPC5Mb8ADJsY+SU5lKa+PDqnajqOpl7UMAHfOBMsEEIumxmae8R64MHCChHgRNsLtsNKkA+63yok/pWng6zpt97vIbOe1hmZDKkrgwzc0QkSBczNmUJn46P9ekNrodnY+pw6MLQPBYhXXf6NSz2OypUb3JWtLFmCh2b62pEH7v9HVTnP7IhBLJRFSYAVgHHovVqDypAT3pwPbu0D2EN4j4fDVdtdBNOAgEaL8v2HZtsx9We8FQZLB90sx/gM4QTobZtKJJfXofx7GRWpq9fYDhJd13b1Ngxs7hQyRxE8bL+Q/oelSEP//36MLTzJWG56DVLBIDwnZA3gYAPQnlLnt5GCUoW56gXHJGy8ssX5/3XsypdSZtk0WtJ1Yg10cqCkjx+3f5dviScAheLrya19q0B4aQbgZTAlrKbgEK7iGVdjivl5zn/Zhl/R11XiazjirBqR1nrfseZ2yFkbQTYaxT2sfzryywSPOosRyTuboyUqBV2WXBevRWFE+0kUwYIVzk+9VIqlfYNWE8JMCBghWquO17B3MYxgRDPx7yCkTxMen+wCYWGbWBdCLKEPQy8+4gNpLKzvJLc44nuZRV4xfO5DDzyNDwFxHswIDAQABAoICAEzuy5at9w+/f46C7zxs/4aZ7RZx2TM94G4FRFysoG5+hA9WcyntA5UI6heuLIEVww7T4D/wdNhI4L1R5DnDUwA5PUXaYRIZT9tGTGvtX1M89ieLfUqPcR1fOCbHgJBHjiysirHpPNAfSJCt6/peufHybxA85OpTSI3W8yC0B+kQ9RPcDEMu8Ubbp2GGtEf41q43UkfdW28qllIkUZMiemdyy7/BC0Z3X/wO4hUxoNkgqFzPMVTXtNUiRI/8K1TB7UlP37Vom49zRQE91bTk6tRHTHkdJVLKg8EuWFoIDYZdNcz8IcicLeADb4FhKt1kr09VS+wLLbE+jr9uenwmAvlQQP8apop+R0xuujvkpQ7ELxuVodQnx2XZTgJeRTdPTj5hVLtzLrqFOBSMNPx0SPtuK1/0tZyxlYrtzj+HRnH6/2BDs4rX+gQmEK5iwjQ885EQWtRSKTgmJU4pVXUA2B1MPLlBZT0QeT2/nqcDoWs8PkVUeVKZZJBu+AaMwNqf5y7sZZGQi81i78U0S0bdkGeXevwzFeaeQWZXT7r4iEwrLLKR10rQfohFfN2lqcN+hudDbhYTb5hHRRIiMofGPUUjmSJna/6XzoSlXvomRt2nVVyqKKOuX1LPdPf4Qjd48yAc9DYSZaUyBEQakEKgZO+nds4FLxfdunw3alqpr6KBAoIBAQDZ8VmgCBSVIp2q8DkuwCtpCWvD8QWeNRLWDzWbPWlAxm7k81ZEJ15w4mwlIAke2RNQ6b9TpGFT2J58z9hidsF+0KOvx+hhTnDthUgiGJ5cUm3T3EclnsOvpGUsuU9kU/jXkNjKZ0xwSuNqr0ztcEciblHXRwMFWQoRHHUQY3QGhT/gtNHYz5XHTF2rsFW7opNshS8xS/6KY452kPh3oMvJljESPYA3Ye9fvXLPxKme9ZUzIcQdxPoTep6wtGSu9WUFnrrFxtsu419bITJe5kugLeHtII3KBI6yD/tLy2E2WJCTzh0YaLZwXVahVzN+ONgK146Zlg1Bntd0/W0WaibBAoIBAQDKxbS4AR5kCrPgPwupduog4wJWvkGFNPD1yPy4KuVTbNVbOMuwxminF6LizxlpY9AmFvUo9TYdCoVRDoiMgi8jHp5L1zpX6AmwWAtv9xazgNAO4Fuq3RjQg9oLxCmtn5K1o6zoClrJDiO3RnIoTcn9BQSDUCKWDqOOW2iMptI/6aIjQAnNH4uIoIkEfn5k70kfM93eaKEvhkCNDLAyQXyHbjTomz0LczMn7u9zQlNK3NoiE3LWtVP4nM8iRLBKYvB3EcgH1PQneHD3stSktUg9wZo8mBZJaR2OL31wyjGZSW1f7Ztzj3iSCjPXVCTtSMm/EEgVnIWqTY2jX+N6W59zAoIBAAowdng86HlwfN6ZDJNa+KyYfClVA2Y6JP9NBryTSnB01opttgLJtGiirVuu+74td/G4e/F1Jfe9kOtU7FDuLG25Y228cujZuf3g1VaCwCSg1fGpwsnHem6jyPcmUsfmBSRO6VPNMI2vcqJyP656KVk6vyjJcSK23vmd0vtJKwuC/1GKIqV4TxBaSabVP6zeFPZl46byXpwpu2dfr74oDl8GXpTzuyLbuU1Ili2QjD2aTbduRLT/mJGAkhrA1FQ5tNdmbGUCvwyaJMMl8iztp2t9uapUc0yWmfVJOf55K7pWuauvXzzc6Gqocnxoj0e/cJpRKaGUmloPCxO1JXx+ygECggEAUn7jCmVyHtN34QjlTrnRgTW6Ut4uu+oRCn4Ny0OwbyN9HhLaU/40v55PJ6WIOidgnM6ESXiR3njUSmj2RuwED266ijJzSyZdIsB/TrshIkCK5TKEONyg5txtzpGtPzUHtBx2ESV9UAUPpNXlRd54CheLgX0NxS0Jf7ZSr76DFXuQ+nRoSGrIEvr1I73u4FO11Rr97il1QmeFRZ1e5eNcraC5p9TYnhrtOhbslmDqkC+QE4MEGrRFCIWLg+6cJndgS6ERV5ZdCt3mX/ACsUwLqwxkGrjpgE5ituE9ULECQtHrzLZXo0lAjXHXK4jRSTRu1+vg1+IJQ4Mv18MAQlyaXwKCAQEAvF9ZunLtUqUmc+Z6cUj2jCUj7Fqn/B61gdzXWH/ovUw5RtKHJQzxsz5ISch/qWJyFi3vrC78FtZ4HaYZJnqnyaWms7g4qXXE5j8OCf/k3lXgTdJr8rBZhPEm7sk77WpJytBAmHaHp7/vrobQp1bZ1IECx6BpTQp8099Q5UbYdGhH9dHZrX33/SF7RVhlw5LA74NUmQ9aaxjKfBFUrTnENqtHvQJHpzVv20SsV4bNNhZyBxc81vfUU7QJM/Kbg35kyy64y4Fk8piYcqAEOCLH7ZTSUcIe3YwltuKAAlK5m7/O7Ob6pE8fI28QS3WlbULVlNNhTe6YOYQYF3HT/LQ8dQ==",
   "pub": "MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEArKDBTJf3NwXgD3LCGsU65/zgfjT9fnZgpGlgXvON+hVJTPPdZiPuqchnkp1nZPvxa5BTVhHnsTwuTG/AAybGPklOZSmvjw6p2o6jqZe1DAB3zgTLBBCLpsZmnvEeuDBwgoR4ETbC7bDSpAPut8qJP6Vp4Os6bfe7yGzntYZmQypK4MM3NEJEgXMzZlCZ+Oj/XpDa6HZ2PqcOjC0DwWIV13+jUs9jsqVG9yVrSxZgodm+tqRB+7/R1U5z+yIQSyURUmAFYBx6L1ag8qQE96cD27tA9hDeI+Hw1XbXQTTgIBGi/L9h2bbMfVnvBUGSwfdLMf4DOEE6G2bSiSX16H8exkVqavX2A4SXdd29TYMbO4UMkcRPGy/kP6HpUhD//9+jC08yVhueg1SwSA8J2QN4GAD0J5S57eRglKFueoFxyRsvLLF+f917MqXUmbZNFrSdWINdHKgpI8ft3+Xb4knAIXi68mtfatAeGkG4GUwJaym4BCu4hlXY4r5ec5/2YZf0ddV4ms44qwakdZ637HmdshZG0E2GsU9rH868ssEjzqLEck7m6MlKgVdllwXr0VhRPtJFMGCFc5PvVSKpX2DVhPCTAgYIVqrjtewdzGMYEQz8e8gpE8THp/sAmFhm1gXQiyhD0MvPuIDaSys7yS3OOJ7mUVeMXzuQw88jQ8BcR7MCAwEAAQ=="
  }
 },
 "digest": {
  "id": "digest-sha256",
  "algorithm": "SHA-256",
  "input": "WOP 跨语言测试向量 2026-08-28 — The quick brown fox jumps over the lazy dog.",
  "expectedHex": "4cf7ab3bcefc20c8d6116d4ce9a3fdfb0d60ba5391472d7bffcf159da9e033ca",
  "expectedHeader": "sha-256 4cf7ab3bcefc20c8d6116d4ce9a3fdfb0d60ba5391472d7bffcf159da9e033ca"
 },
 "sign": {
  "rsa3072": {
   "id": "rsa3072-sign",
   "key": "rsa3072",
   "message": "WOP 跨语言测试向量 2026-08-28 — The quick brown fox jumps over the lazy dog.",
   "expectedSigB64u": "ESw5IVyqo3e2gyDJ5nPlBXuda0zm12x-estvnYC7noCcG4Xy4v-obI_U2h44NcDCN-LQBZDpWiSG_mZZfTrpLAkqwpoxuH3aLTPB8WqhgG-O3544ggMaEeSwQv-GOmJJ6mvnbY6_IOfyM85gRFdFo2cU3R1Nl-k-c8yzbBI39xRPJEzAwcEr7EVqMKuZWeaVXQEHSIKLOmRg21v2YT54K3VYpNOsKZtwLTKuBcM5HaJ8Q2k0kZez2cyGeKYW5CeRs2lXgZfjksQ6MmmjmbLwWhMeLD0dCek47BGNpfj2W2fIwFyROf-u66cW8GzroKYuTC6k3rAmfa1r3yHRet0iCzbwNhLn67BI1TLZmhTGYkUnE2UpMTKU5eLzkntC_sIDtmg0m9b90igvIMkB6ombA9HicqZJaqsV6vaj1JhISkc0lNPnwfgy4z16JzVyQjEEzT5sm0B1bCH_sp--XIVpy1JZ5FKMItSfRhxfkAzngO6vaO8b5gvYCkSaSj7yfaxg",
   "sigLenBytes": 384,
   "b64uLen": 512
  },
  "rsa4096": {
   "id": "rsa4096-sign",
   "key": "rsa4096",
   "message": "WOP 跨语言测试向量 2026-08-28 — The quick brown fox jumps over the lazy dog.",
   "expectedSigB64u": "J4b0ZA0dEXUYFSNOrzJ9ECh3d6osSisku4mb2wqNKT6550be8xfyNFd3YT1mua9hc6fsIt1ShyRypzfog8Cl-It7hxDuY9pU7bZC_r3LLHzMl5G_K21HJK1acSCP-A_vDMIbalIc0PbQFNea_REFqEUsxFw4Oj05LHba57Q1xqe2kSkfkhD7RnNBMCo1X4tOKoPkiw_cDiBxBWQ7kW6BcCngQULWHqbcg7u34ednNluEO8FrstxrhroPWo65XAYdW-W8BDevdX0U8B4p0PxMegV4HRytHJhmJMr3LCbffhM-qZfQo6eh4nZ-bhQQSdq3AxzxBzVeb9UbAU9KSXodreGGuexW_3DOH2lZU3k2hX7Lpac9U_1jTnwzzBxVLyfFoUZBzH94EDdAKUCSJ3RgIRleg_XpJgziH2vFSNyNV9p1RRCAE_uDLvEL_z9o49xqTD86w0pzNsd0MuO6m8EeqqVjWd9r0A9tcPeqJdTmduKopdcEhlKdqJUILhvxISFcyjJXezLYh2ZcYCgqUDraL_bSfK6VuYXSaMDMkn7b5SBbw5Rvw08ElysqS6W9m-pgNgrPq9C4vlQi01KhmBl1IuAy8nzZh45OsDGGyU_ZN7XyaOT9ACbiaGPNyP19zwkbfqlZfZx7_8qv2hIUpRDBO2bVjTL3RkrutWoflx5nGg8",
   "sigLenBytes": 512,
   "b64uLen": 683
  }
 },
 "aesgcm": {
  "id": "aesgcm-encrypt",
  "algorithm": "AES-256-GCM",
  "keyB64u": "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8",
  "ivB64u": "EBESExQVFhcYGRob",
  "plaintextB64u": "V09QIOi3qOivreiogOa1i-ivleWQkemHjyAyMDI2LTA4LTI4IOKAlCBUaGUgcXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLg",
  "cipherTagB64u": "KrHINqF-kltl2OC1j5_c2D__2-uLU742aNnQV2xieetoxGU71UTue15i-jSq6WZycNdnEZHkLpyceFVJ0_3RBnWLH0w_23kUGehQ3rSgkscd3f3KSCO_iP-Xh7vOUfauwj3kNu8",
  "format": "ciphertext||tag 尾拼（F4），tag 128bit"
 },
 "dek": {
  "id": "dek-rsa",
  "alg": "AES-256-GCM",
  "keyB64u": "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8",
  "ivB64u": "EBESExQVFhcYGRob",
  "expected": "AES-256-GCM$AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8$EBESExQVFhcYGRob"
 },
 "oaepUnwrap": {
  "id": "oaep3072-unwrap",
  "key": "rsa3072",
  "cipherB64u": "jc29n4KH_gmV_3FmM31SpxTXUXsh8Ryi1_7YPT8hm0urytrCnTaKBtcJqMU2KWnXIBkviFJC0F22IM0J8QveqiYsaUrfAo0cCVC13J5EBhxxoM26HYNedUl1Pl95IYirADAKurx5hNxCVWX7uaEj8ZEXo13n6y9NYN3IQi1Xy-iZM3fjHX9CjufeY8IFYPgqZ2MXnSPEN88UkRehGzMVfNYcbuXdBSSfVUadO0o41_ESduouQOzfgXhSQS8R1e3koB0SNvy0zhDOxeSo_Ld6F2FmePJQwquTUF_c0M5OMdZxb6KoH0RTtSX8iP8Auq_mHZ0MlPD1OomE97LHusA5XktGGouj7o20QHgPv8RnGwv1cpyztp6x8b8SnIBccvFcIaczZy6_qbdxjGbTEUPR31T4ucxRMicm0tp4Kp6rgq4YGzPT9p9l9fvFtLRhm9sHWZQUwH-eC1wdWjtrxi2JTmVaTIS5ubPhJ2ucBi7Jaa8BkgEPmbjl1-oPSBV46FHt",
  "expectedPlaintext": "AES-256-GCM$AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8$EBESExQVFhcYGRob",
  "params": "OAEP(SHA-256, MGF1-SHA-256, empty label) — 显式参数化（F2）",
  "expect": "unwrap-equals-plaintext"
 },
 "oaepTrap": {
  "id": "oaep3072-mgf1sha1-trap",
  "key": "rsa3072",
  "cipherB64u": "Y9WE9bvvUkCCcA7qREvKpyBEcpxO5fC78IR_YQyBJIu1wX-OaNPz6oxWBEh2-vQmp_csWIR5ZVBuOK4Jm4c7jmFTZY787EOIGwdn8iTvY2XvBrnz0yzWWhDvm1lvK1INSXa2HD3D2UsRcZyqniZ3fHAD8jv2127l85-fGZuk2a3QjsmTltKcNePDgwVGDTEVsH1jpSDrt6ApVISjVXjOlrJoc9740Jac44SMkFeMgDNADQvUNZSpYj6TLeDbwqwxjQ287aQZnYuuQ5hhjY-qiOWf1X8j7w99wwwp8_Luuv5A0sOxrzlL_hIu0yK6QqwSlee8oiMHTI0J-P7FgQ-VGyaHvd7Q8nygsiMokXkhmUf2a9n-vwWc_3qGL3ny3yCjK996AwkGLieMDZ9R1TkckdL8Cp9usGHeWFrzaECwsmDpqiBdNblPU7wKW9SZiwVEeJW_i7gPvdnPzOlWccETJPW0JW6mFWOz2rYYqK-EF-qa36qyAGGP4zvyasZRvqxD",
  "paramsUsed": "OAEP(SHA-256, MGF1-SHA-1, empty label)",
  "expect": "reject",
  "note": "F2 钉子：以错误 MGF1 包装的密文，用规格参数（双 SHA-256）解包必须失败"
 },
 "formatRules": [
  {
   "id": "header-rsa-ok",
   "value": "sha-256 23592263765cf506d07cc8614c09067e6de38e64c53e5b672c022532d01737cf",
   "expect": "accept",
   "suite": "WOP-RSA3072-SHA256"
  },
  {
   "id": "header-crossfamily",
   "value": "sm3 23592263765cf506d07cc8614c09067e6de38e64c53e5b672c022532d01737cf",
   "expect": "reject",
   "suite": "WOP-RSA3072-SHA256",
   "note": "I5 跨族"
  },
  {
   "id": "header-double-space",
   "value": "sha-256  23592263765cf506d07cc8614c09067e6de38e64c53e5b672c022532d01737cf",
   "expect": "reject",
   "note": "D2 恰一空格"
  },
  {
   "id": "header-uppercase-hex",
   "value": "sha-256 23592263765CF506D07CC8614C09067E6DE38E64C53E5B672C022532D01737CF",
   "expect": "reject",
   "note": "F5 小写"
  },
  {
   "id": "header-wrong-hex-len",
   "value": "sha-256 3592263765cf506d07cc8614c09067e6de38e64c53e5b672c022532d01737cf",
   "expect": "reject",
   "note": "64 字符"
  },
  {
   "id": "b64url-with-padding",
   "value": "abc=",
   "expect": "reject",
   "note": "F6 严格无填充"
  },
  {
   "id": "b64url-illegal-char",
   "value": "ab+c",
   "expect": "reject",
   "note": "F6 字母表"
  },
  {
   "id": "b64url-trailing-bits-noncanonical-2",
   "value": "aE",
   "expect": "reject",
   "note": "F6/D10 严格性补钉：len%4==2 时尾字符低 4 位须为零（E=4）——.NET FromBase64String 宽容收下，须显式拒绝（与 Go RawURLEncoding.Strict() 对拍一致）"
  },
  {
   "id": "b64url-trailing-bits-canonical-2",
   "value": "AA",
   "expect": "accept",
   "note": "len%4==2 canonical（A=0，低 4 位零）→ 1 字节 0x00"
  },
  {
   "id": "b64url-trailing-bits-noncanonical-3",
   "value": "TWF",
   "expect": "reject",
   "note": "len%4==3 时尾字符低 2 位须为零（F=5）——TWF 是 'Ma' 的非规范 3 字符形式"
  },
  {
   "id": "b64url-trailing-bits-canonical-3",
   "value": "TWE",
   "expect": "accept",
   "note": "len%4==3 canonical（E=4，低 2 位零）——TWE 是 'Ma' 的规范 3 字符形式 → 2 字节 0x4D 0x61"
  }
 ]
};

// 跨语言 canonical 对拍向量（由页面 javaUrlEncode/trimall/canonicalHeaders/buildCanonical 派生）
// 语义锚 = entry-wise 修复后实现（2026-08-31）：逐项规范化键并携带各自值再排序；供商户跨语言移植对拍
const WOP_CANON_VECTORS = {
  meta: { version: 'v1.0', derived: 'javaUrlEncode/trimall/canonicalHeaders/buildCanonical', note: '期望值为修复后实现字节级输出' },
  enc: [
    { id: 'enc-1', in: 'demo_app_key', out: 'demo_app_key', note: '字母数字免编码' },
    { id: 'enc-2', in: 'hello world', out: 'hello%20world', note: '空格→%20（非 +）' },
    { id: 'enc-3', in: 'a.b-c_d*e', out: 'a.b-c_d*e', note: '._-* 免编码' },
    { id: 'enc-4', in: "it's (a) ~bang~!", out: 'it%27s%20%28a%29%20%7Ebang%7E%21', note: "!'()~ 全编码且 %XX 大写" },
    { id: 'enc-5', in: 'x=y&z?w#p/q', out: 'x%3Dy%26z%3Fw%23p%2Fq', note: '保留字符全编码' },
    { id: 'enc-6', in: '中文 消息', out: '%E4%B8%AD%E6%96%87%20%E6%B6%88%E6%81%AF', note: '多字节 UTF-8 逐字节编码' },
    { id: 'enc-7', in: '100%', out: '100%25', note: '% 本体→%25' }
  ],
  trim: [
    { id: 'trim-1', in: '  demo  ', out: 'demo', note: '首尾空白剥离' },
    { id: 'trim-2', in: 'a\tb\nc\r\nd  e', out: 'a b c d e', note: '内部连续空白折叠为单个空格' },
    { id: 'trim-3', in: null, out: '', note: 'null 归空串' }
  ],
  ch: [
    { id: 'ch-1', in: { 'X-Wop-AppKey ': 'demo_app_key', nonce: 'n1' }, out: 'nonce:n1\nx-wop-appkey:demo_app_key', note: '混合大小写/尾空格键规范化后各自携带原值（规范化键回查 map 丢值陷阱）' },
    { id: 'ch-2', in: { z: '1', a: '2', m: '3' }, out: 'a:2\nm:3\nz:1', note: '规范化后按 UTF-16 码元升序' },
    { id: 'ch-3', in: { k: '  spaced   out  ' }, out: 'k:spaced%20out', note: '值先 trim 折叠再编码（单 %20）' },
    { id: 'ch-4', in: { special: "!'()~" }, out: 'special:%21%27%28%29%7E', note: "值内 !'()~ 全编码大写" },
    { id: 'ch-5', in: {}, out: '', note: '空 map→空串' },
    { id: 'ch-6', in: { '头部': '值 一' }, out: '%E5%A4%B4%E9%83%A8:%E5%80%BC%20%E4%B8%80', note: '键值均过编码器（中文键不豁免）' }
  ],
  canon: [
    { id: 'canon-1', in: ['WOP-HMAC-SHA256 demo_app_key', 'post', '/v1/pay', '', { 'X-Wop-AppKey': 'demo_app_key', 'X-Wop-Nonce': 'n1' }], out: 'WOP-HMAC-SHA256 demo_app_key\nPOST\n/v1/pay\n\nx-wop-appkey:demo_app_key\nx-wop-nonce:n1', note: '五段全串：POST 空 qs 时第 4 行空行保留' }
  ]
};

// 渲染跨语言对拍向量表（textContent 填充，产物仅静态文本，S1/S2 安全）
function renderCanonVectors() {
  const host = $('selftest-canon-table');
  if (!host) return;
  const mkCell = (tag, text) => { const el = document.createElement(tag); el.textContent = text; return el; };
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['ID', '输入', '期望输出', '说明'].forEach(t => hr.appendChild(mkCell('th', t)));
  thead.appendChild(hr);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (const section of ['enc', 'trim', 'ch', 'canon']) {
    for (const v of WOP_CANON_VECTORS[section]) {
      const tr = document.createElement('tr');
      tr.appendChild(mkCell('td', v.id));
      tr.appendChild(mkCell('td', v.in === null ? 'null' : (typeof v.in === 'object' ? JSON.stringify(v.in) : String(v.in))));
      tr.appendChild(mkCell('td', v.out));
      tr.appendChild(mkCell('td', v.note || ''));
      tbody.appendChild(tr);
    }
  }
  table.appendChild(tbody);
  host.appendChild(table);
}
renderCanonVectors();

async function runSelftest() {
  const steps = [];
  // 先清空上次渲染结果：自测文案渲染进 DOM 会污染后续源码自扫描（S1/S2）
  $('selftest-steps').innerHTML = '';
  $('selftest-banner').textContent = '';
  const fail = (id, got, want) => steps.push({ ok: false, text: id + '：不匹配。期望 ' + want + '，实际 ' + got });
  const ok = (id, extra) => steps.push({ ok: true, text: id + (extra ? '：' + extra : '') });
  const V = WOP_VECTORS;

  // spec:WF6.digest —— 正向量：digest-sha256 字节级
  const hex = await sha256Hex(V.message);
  if (hex === V.digest.expectedHex) ok('digest-sha256', V.digest.algorithm + ' 64 位 hex 一致');
  else fail('digest-sha256', hex, V.digest.expectedHex);

  // spec:WF6.digest —— 正向量：头格式（D2/F5：<alg> 恰一空格 <64 小写 hex>）+ 族比对（I5：RSA 套件只认 sha-256）
  const hd = parseDigestHeader(V.digest.expectedHeader);
  if (hd.ok && hd.alg === 'sha-256' && hd.hex === V.digest.expectedHex) ok('digest 头格式', 'sha-256 + 恰一空格 + 64 位小写 hex');
  else fail('digest 头格式', JSON.stringify(hd), V.digest.expectedHeader);

  // spec:WF6.sign —— 正向量：RSA 3072/4096 签名字节级（SHA256withRSA）
  for (const id of ['rsa3072', 'rsa4096']) {
    const s = V.sign[id];
    const key = await importPrivSign(bytesFromB64url(V.keys[id].priv));
    const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(s.message)));
    const sigB64u = b64urlFromBytes(sig);
    if (sigB64u === s.expectedSigB64u) ok(s.id, '签名 ' + sig.length + ' 字节与黄金向量一致');
    else fail(s.id, sigB64u, s.expectedSigB64u);
  }

  // spec:WF6.aesgcm —— 正向量：AES-256-GCM 密文||tag 字节级（tag 128bit）
  const aesKey = await crypto.subtle.importKey('raw', bytesFromB64url(V.aesgcm.keyB64u), 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: bytesFromB64url(V.aesgcm.ivB64u), tagLength: 128 },
    aesKey, bytesFromB64url(V.aesgcm.plaintextB64u)));
  const ctB64u = b64urlFromBytes(ct);
  if (ctB64u === V.aesgcm.cipherTagB64u) ok('aesgcm-encrypt', '密文||tag ' + ct.length + ' 字节与黄金向量一致');
  else fail('aesgcm-encrypt', ctB64u, V.aesgcm.cipherTagB64u);

  // spec:WF6.dek —— 正向量：DEK 载荷组装（AES-256-GCM$b64u(key)$b64u(iv)）
  const dek = V.dek.alg + '$' + V.dek.keyB64u + '$' + V.dek.ivB64u;
  if (dek === V.dek.expected) ok('dek-rsa 载荷', 'AES-256-GCM$key$iv 三段式一致');
  else fail('dek-rsa 载荷', dek, V.dek.expected);

  // spec:WF6.dek —— 正向量：RSA-OAEP(SHA-256) 解包 DEK 字节级
  const priv3072 = await importPriv(bytesFromB64url(V.keys.rsa3072.priv));
  try {
    const plain = new TextDecoder().decode(await crypto.subtle.decrypt(
      { name: 'RSA-OAEP', hash: 'SHA-256' }, priv3072, bytesFromB64url(V.oaepUnwrap.cipherB64u)));
    if (plain === V.dekPlaintext) ok('oaep3072-unwrap', '解出 DEK 载荷与黄金向量一致');
    else fail('oaep3072-unwrap', plain, V.dekPlaintext);
  } catch (e) { fail('oaep3072-unwrap', '解密抛错: ' + e.message, V.dekPlaintext); }

  // spec:WF6.dek —— 负向量：MGF1-SHA1 陷阱（规格参数解密必须失败）
  try {
    await crypto.subtle.decrypt({ name: 'RSA-OAEP', hash: 'SHA-256' }, priv3072, bytesFromB64url(V.oaepTrap.cipherB64u));
    fail('oaep-mgf1sha1-trap', '解密成功', '必须失败');
  } catch (e) { ok('oaep-mgf1sha1-trap', '按规格参数解密被正确拒绝'); }

  // spec:WF6.formatRules —— 11 条格式规则；digest 头以族比对推导（h.ok && h.alg === 'sha-256'），与 verifyResponse 的 I5 语义同源
  for (const r of V.formatRules) {
    let actual;
    if (r.id.startsWith('header-')) {
      const h = parseDigestHeader(r.value);
      actual = (h.ok && h.alg === 'sha-256') ? 'accept' : 'reject';
    } else {
      actual = strictB64urlOk(r.value) ? 'accept' : 'reject';
    }
    if (actual === r.expect) ok('formatRules/' + r.id, '期望 ' + r.expect + ' 一致');
    else fail('formatRules/' + r.id, actual, r.expect);
  }

  // spec:WF7 —— 正路径：原始报文解析（起始行/头/body）+ 验证区回填
  {
    const wf7Wire = [
      'POST /gateway/logistics.waybill.sync HTTP/1.1',
      'x-wop-appkey: demo_app_key',
      'x-wop-content-digest: sha-256 ' + 'a'.repeat(64),
      'x-wop-encrypt: L2;dek=AbC123-_',
      'x-wop-nonce: 1a2b3c4d5e6f7890',
      'x-wop-timestamp: 1756600000000',
      'x-wop-sign: WOP-RSA3072-SHA256 v1/1800/x-wop-content-digest;x-wop-encrypt;x-wop-nonce;x-wop-timestamp/sig123',
      '',
      '{"orderId":"W20260827001"}'
    ].join('\n');
    const pw = parseWireMessage(wf7Wire);
    if (pw.start.startsWith('POST /gateway') && pw.headers['x-wop-sign'] && pw.body.includes('orderId') && !pw.errors.length)
      ok('WF7 报文解析', '起始行/头/body 提取，无告警');
    else fail('WF7 报文解析', JSON.stringify(pw).slice(0, 120), '起始行+头+body 正确');
    $('wire-paste').value = wf7Wire;
    fillVerifyFromWire();
    if ($('v-nonce').value === '1a2b3c4d5e6f7890' && $('v-ts').value === '1756600000000' && $('v-body').value.includes('orderId') && $('v-sign').value.startsWith('WOP-'))
      ok('WF7 回填验证区', '头/体字段自动填充');
    else fail('WF7 回填验证区', '字段未回填', 'nonce/ts/body/sign 回填');
  }

  // spec:WF7 —— 负路径：缺必填头 / 非法 digest / 非法时间戳 逐项告警
  {
    $('wire-paste').value = ['HTTP/1.1 200 OK', 'x-wop-content-digest: sha-256 XYZ_not_hex', 'x-wop-nonce: n1', 'x-wop-timestamp: 123', '', '{}'].join('\n');
    fillVerifyFromWire();
    const li = [...document.querySelectorAll('#wire-steps li')].map(l => l.textContent);
    if (li.some(t => t.includes('缺失必填头：x-wop-sign')) && li.some(t => t.includes('格式非法')) && li.some(t => t.includes('毫秒时间戳')))
      ok('WF7 缺头/格式告警', '缺失必填头 + digest 格式 + 时间戳 3 项提示');
    else fail('WF7 缺头/格式告警', JSON.stringify(li), '3 项负路径告警');
  }

  // spec:WF8 —— 字典完整性：62 码全量（公共契约，分类/对外语义冻结）
  {
    const n = Object.keys(WOP_ERRORS).length;
    if (n === 62) ok('WF8 字典', '62 码全量（OP_GW_ 枚举对齐）');
    else fail('WF8 字典', n, '62');
  }

  // spec:WF8 —— 命中分支：信封→诊断（分类/处置/traceId）
  {
    $('err-json').value = '{"code":"OP_GW_1022","msg":"签名验证失败","traceId":"tk-0001"}';
    diagnoseError();
    const badge = $('err-out').querySelector('.badge');
    const rows = [...$('err-out').querySelectorAll('table tr')].map(tr => tr.textContent);
    if (badge && badge.textContent.includes('字典命中') && rows.some(r => r.includes('鉴权')) && rows.some(r => r.includes('tk-0001')))
      ok('WF8 命中诊断', '1022→鉴权分类 + 处置 + traceId 引导');
    else fail('WF8 命中诊断', badge ? badge.textContent : '无 badge', '字典命中+分类+traceId');
  }

  // spec:WF8 —— 未知码分支：不在字典 → 明确提示，不静默
  {
    $('err-json').value = '{"code":"OP_GW_9999"}';
    diagnoseError();
    const badge = $('err-out').querySelector('.badge');
    if (badge && badge.textContent.includes('未知码')) ok('WF8 未知码分支', '字典外明确提示');
    else fail('WF8 未知码分支', badge ? badge.textContent : '无 badge', '未知码提示');
  }

  // 清理 WF7/WF8 渲染区：断言渲染内容不得污染后续 S1/S2 源码自扫描
  $('err-out').innerHTML = '';
  $('wire-steps').innerHTML = '';
  $('wire-paste').value = '';
  $('err-json').value = '';

  // spec:S1/S2 —— 否定式条款：零外发 + 不落盘（源码自扫描）
  // 扫描范围剔除本函数自身源码（toString 后替换），使描述性注释/文案不误伤；禁词另以拼接书写双保险
  {
    const scan = scanSelfForBanned();
    if (scan.s1.pass) ok('S1 零外发', '外部资源引用 0 处、网络 API 0 处');
    else fail('S1 零外发', scan.s1.detail, '无外部资源/网络 API');
    if (scan.s2.pass) ok('S2 不落盘', '浏览器存储 API 0 处');
    else fail('S2 不落盘', scan.s2.detail, '无浏览器存储 API');
  }

  // spec:GM-K1 —— 国密分派辅助：SPKI DER → 04‖X‖Y hex（正路径）+ 非 SM2 SPKI 抛错（负路径）
  // spec:GM-K2 —— 国密分派辅助：SM2 PKCS#8 PEM/DER → d 标量 hex（正路径）+ RSA PKCS#8 → null（负路径）
  {
    function derLenH(n) { return n < 128 ? n.toString(16).padStart(2, '0') : (128 + n.toString(16).length / 2).toString(16) + n.toString(16); }
    function derSeqH(hex) { return '30' + derLenH(hex.length / 2) + hex; }
    try {
      const kp2 = GmCore.sm2Keygen();
      const pubHex2 = kp2.publicHex, privHex2 = kp2.privateHex;
      const sm2SpkiHex = derSeqH(derSeqH('06072a8648ce3d0201' + '06082a811ccf5501822d') + '03' + derLenH(66) + '00' + pubHex2);
      const spkiB64 = GmCore.b64FromBytes(GmCore.bytesFromHex(sm2SpkiHex));
      const pubBack = spkiToPubHex(keyInputToDer(spkiB64));
      if (pubBack === pubHex2) ok('GM-K1 SPKI→公钥点', 'X.509 SPKI 提取 04‖X‖Y 65B');
      else fail('GM-K1 SPKI→公钥点', pubBack, '与生成公钥一致');
      // 负路径：RSA SPKI（AlgorithmIdentifier = SEQUENCE{OID rsaEncryption, NULL} + 非 65B 点）→ 抛错
      const rsaSpkiHex = derSeqH(derSeqH('06092a864886f70d010101' + '0500') + '03' + derLenH(66) + '00' + '04' + '00'.repeat(64));
      let rsaSpkiRejected = false;
      try { spkiToPubHex(keyInputToDer(GmCore.b64FromBytes(GmCore.bytesFromHex(rsaSpkiHex)))); } catch (e) { rsaSpkiRejected = true; }
      if (rsaSpkiRejected) ok('GM-K1 RSA SPKI 负路径', '非 SM2 曲线被拒');
      else fail('GM-K1 RSA SPKI 负路径', '未抛错', '非 SM2 SPKI 须拒绝');
      // GM-K2 正路径：pkcs8PemFromD → keyInputToDer → sm2DHexFromPkcs8 还原 d
      const pem2 = GmCore.pkcs8PemFromD(privHex2, pubHex2);
      const dBack = sm2DHexFromPkcs8(keyInputToDer(pem2));
      if (dBack === privHex2) ok('GM-K2 PKCS#8→d', 'PEM→DER→d 32B 还原');
      else fail('GM-K2 PKCS#8→d', String(dBack), '与生成私钥一致');
      // GM-K2 负路径：RSA PKCS#8 结构 → null（不抛错）
      const rsaPkcs8Hex = derSeqH('020100' + '06092a864886f70d010101' + '0500' + '04' + derLenH(52) + '30' + derLenH(50) + '020100' + '04' + derLenH(48) + '00'.repeat(48));
      // spec:GM-K3 —— 分派级负路径：RSA SPKI 平台公钥 → 抛「非 SM2 曲线」；RSA PKCS#8 商户私钥 → 抛「SM2 PKCS#8」；内核缺失 → 抛「未加载」；坏签名 → allOk=false「存在失败项」
      const rsaSpkiB64 = GmCore.b64FromBytes(GmCore.bytesFromHex(rsaSpkiHex));
      const rsaPkcs8Pem = '-----BEGIN PRIVATE KEY-----\n' + GmCore.b64FromBytes(GmCore.bytesFromHex(rsaPkcs8Hex)) + '\n-----END PRIVATE KEY-----';
      const kp3 = GmCore.sm2Keygen();
      const env3 = GmCore.buildSmEnvelope('{"a":1}', kp3.publicHex);
      const hmap3 = { 'x-wop-content-digest': env3.digest, 'x-wop-encrypt': env3.encryptHeader, 'x-wop-nonce': 'n3', 'x-wop-timestamp': 't3' };
      const canon3 = buildCanonical('v1/1800', 'POST', '/wop/callback', '', canonicalHeaders(hmap3));
      const badSig = GmCore.sm2SignBytes(new TextEncoder().encode(canon3 + 'x'), kp3.privateHex, '1234567812345678');
      const goodSig = GmCore.sm2SignBytes(new TextEncoder().encode(canon3), kp3.privateHex, '1234567812345678');
      const sigHeader = 'WOP-SM2-SM3 v1/1800/x-wop-content-digest;x-wop-encrypt;x-wop-nonce;x-wop-timestamp/' + goodSig;
      const savedFields = { t: $('v-type').value, cb: $('v-cburl').value, sig: $('v-sign').value, sha: $('v-sha').value,
        enc: $('v-encrypt').value, nonce: $('v-nonce').value, ts: $('v-ts').value, body: $('v-body').value,
        pub: $('p-pub').value, priv: $('m-priv').value };
      $('v-sign').value = sigHeader;
      // verifyResponse 内部 catch 将错误渲染进 resp-steps（v-status 保持空）→ 断言按渲染结果判定
      // ① 平台公钥填 RSA SPKI → 分派拒收
      $('p-pub').value = rsaSpkiB64;
      $('m-priv').value = rsaPkcs8Pem;
      await verifyResponse();
      const curveRej = $('resp-steps').textContent.includes('平台公钥非 SM2 曲线');
      // ② 平台公钥恢复合法 SM2 SPKI，商户私钥仍 RSA PKCS#8 → 分派拒收
      $('p-pub').value = GmCore.b64FromBytes(GmCore.bytesFromHex(derSeqH(derSeqH('06072a8648ce3d0201' + '06082a811ccf5501822d') + '03' + derLenH(66) + '00' + kp3.publicHex)));
      await verifyResponse();
      const privRej = $('resp-steps').textContent.includes('商户私钥须为 SM2 PKCS#8');
      // ③ 内核缺失防护
      const savedCore = window.GmCore;
      window.GmCore = undefined;
      await verifyResponse();
      const coreRej = $('resp-steps').textContent.includes('国密内核未加载');
      window.GmCore = savedCore;
      // ④ 字段全合法但签名被篡改 → allOk=false「存在失败项」
      const savedAppkey = $('v-appkey').value;
      $('v-appkey').value = '1234567812345678'; // 与 badSig/goodSig 的 userId 一致（④ 走 userId 检查）
      $('p-pub').value = GmCore.b64FromBytes(GmCore.bytesFromHex(derSeqH(derSeqH('06072a8648ce3d0201' + '06082a811ccf5501822d') + '03' + derLenH(66) + '00' + kp3.publicHex)));
      $('m-priv').value = GmCore.pkcs8PemFromD(kp3.privateHex, kp3.publicHex);
      $('v-sign').value = 'WOP-SM2-SM3 v1/1800/x-wop-content-digest;x-wop-encrypt;x-wop-nonce;x-wop-timestamp/' + badSig;
      await verifyResponse();
      const allOkFalse = $('v-status').textContent === '存在失败项';
      $('v-appkey').value = savedAppkey;
      if (curveRej) ok('GM-K3 RSA SPKI 分派拒收', '非 SM2 平台公钥被拒');
      else fail('GM-K3 RSA SPKI 分派拒收', '未拒绝', 'verifyResponse 须提示非 SM2 曲线');
      if (privRej) ok('GM-K3 RSA PKCS#8 分派拒收', '商户私钥非 SM2 PKCS#8 被拒');
      else fail('GM-K3 RSA PKCS#8 分派拒收', '未拒绝', 'verifyResponse 须提示 SM2 PKCS#8');
      if (coreRej) ok('GM-K3 内核缺失防护', 'GmCore 缺失时明确提示');
      else fail('GM-K3 内核缺失防护', '未提示', '须提示国密内核未加载');
      if (allOkFalse) ok('GM-K3 坏签名 allOk=false', 'v-status 存在失败项');
      else fail('GM-K3 坏签名 allOk=false', $('v-status').textContent, '坏签名须标记失败');
      // spec:GM-K3-appkey-empty：空 x-wop-appkey → 显式报错（不得静默回退默认；sm-crypto-v2 空串默认会假绿）
      $('v-appkey').value = '';
      await verifyResponse();
      const appkeyRej = $('resp-steps').textContent.indexOf('x-wop-appkey 必填') >= 0;
      $('v-appkey').value = savedAppkey;
      if (appkeyRej) ok('GM-K3 空 appkey 拒收', '缺 x-wop-appkey 显式报错');
      else fail('GM-K3 空 appkey 拒收', '未拒绝', 'verifyResponse 须提示 x-wop-appkey 必填');
    } catch (e) {
      steps.push({ ok: false, text: 'GM-K1/K2/K3 辅助断言抛错：' + (e && e.message ? e.message : e) });
    }
  }

  // —— 各 WF 切片断言（WF10/9/11/12/14/国密；置于 S1/S2 扫描之后执行，
  //    避免切片断言向自身面板渲染的文案污染源码自扫描）——
  {
    const wfIds = ['wf10', 'wf9', 'wf11', 'wf12', 'wf14', 'wf-gm'];
    for (const id of wfIds) {
      const reg = (typeof WF_REGISTRY !== 'undefined' && WF_REGISTRY) ? WF_REGISTRY[id] : null;
      if (!reg || typeof reg.selftest !== 'function') {
        steps.push({ ok: false, text: id + ' 断言器未注册（WF_REGISTRY[' + id + '] 缺失）' });
        continue;
      }
      try {
        const arr = await reg.selftest();
        const list = Array.isArray(arr) ? arr : (arr && arr.steps ? arr.steps : []);
        for (const s of list) {
          const sOk = s.ok !== undefined ? s.ok : !!s.pass;
          steps.push({ ok: sOk, text: (s.text || s.name) + (sOk ? '' : (s.detail ? '：' + s.detail : '')) });
        }
      } catch (e) {
        steps.push({ ok: false, text: id + ' 断言执行抛错：' + (e && e.message ? e.message : e) });
      }
    }
  }

  // spec:WF6.canon-vectors —— 跨语言 canonical 对拍向量：enc/trim/ch/canon 正向量逐条字节级比对
  {
    const CV = WOP_CANON_VECTORS;
    const fns = { enc: javaUrlEncode, trim: trimall, ch: canonicalHeaders };
    for (const section of ['enc', 'trim', 'ch']) {
      for (const v of CV[section]) {
        const got = fns[section](v.in);
        if (got === v.out) ok(v.id, '字节级一致');
        else fail(v.id, JSON.stringify(got), JSON.stringify(v.out));
      }
    }
    for (const v of CV.canon) {
      const got = buildCanonical(v.in[0], v.in[1], v.in[2], v.in[3], canonicalHeaders(v.in[4]));
      if (got === v.out) ok(v.id, '五段全串字节级一致');
      else fail(v.id, JSON.stringify(got), JSON.stringify(v.out));
    }
    // 负向量/陷阱（否定式条款同样必须有测试）
    // spec:WF6.canon-trap-key-loss —— 规范化键回查 map 丢值回归：ch-1 输出不得出现空值头
    if (!/(^|\n)x-wop-appkey:(\n|$)/.test(canonicalHeaders(CV.ch[0].in))) ok('ch-trap-key-loss', '混合大小写/尾空格键值未丢失');
    else fail('ch-trap-key-loss', '出现空值头（规范化键回查 map 回归）', '无空值头');
    // spec:WF6.canon-trap-sort-case —— 小写化必须先于排序：小写键不得排在大写原键之后
    if (canonicalHeaders({ 'X-A': '1', a: '2' }) === 'a:2\nx-a:1') ok('ch-trap-sort-case', '排序前已完成小写化');
    else fail('ch-trap-sort-case', canonicalHeaders({ 'X-A': '1', a: '2' }), 'a:2\nx-a:1');
    // spec:WF6.canon-trap-trim-first —— trim 折叠必须先于编码：值内多空白不得产出 %20%20
    if (canonicalHeaders(CV.ch[2].in).indexOf('%20%20') === -1) ok('ch-trap-trim-first', '折叠后单 %20');
    else fail('ch-trap-trim-first', canonicalHeaders(CV.ch[2].in), 'k:spaced%20out');
    // spec:WF6.canon-trap-empty —— 空 map 产空串；空 qs 时五段恰 5 行且第 4 行为空行
    if (canonicalHeaders({}) === '') ok('ch-trap-empty-map', '空 map→空串');
    else fail('ch-trap-empty-map', '非空串', '');
    if ((function () { const l = buildCanonical('a', 'post', '/p', '', canonicalHeaders({ b: '1' })).split('\n'); return l.length === 5 && l[3] === ''; })()) ok('canon-trap-empty-qs', '恰 5 行且第 4 行为空行');
    else fail('canon-trap-empty-qs', '行数/空行位置错误', '5 行/第 4 行空');
    // spec:WF6.canon-trap-upper-hex —— !'()~ 必须全编码且 %XX 十六进制大写（不得出现小写 %xx）
    var escs = javaUrlEncode(CV.enc[3].in).match(/%../g) || [];
    if (escs.every(e => e === e.toUpperCase())) ok('enc-trap-upper-hex', '转义全大写 %XX');
    else fail('enc-trap-upper-hex', javaUrlEncode(CV.enc[3].in), CV.enc[3].out);
  }

  return steps;
}

// spec:S1/S2 —— 页面壳自扫描器：跨源资源引用 / 网络 API / 存储 API
// S1 语义（2026-08-31 修订）：拆分为壳+assets 后，放行同源静态资源（相对路径/data:），
// 仍禁一切跨源 URL（http(s)://、协议相对 //）；assets/*.js 源码级的网络/存储禁词扫描
// 由仓库门禁 scan_banned.mjs（pre-commit/CI）承担——浏览器无网络 API，无法读取自身外链文件。
// 禁词拼接防自命中；文案在函数内随自身剔除。
function scanSelfForBanned() {
  const SRC = document.documentElement.outerHTML.replace(scanSelfForBanned.toString(), '');
  // 只捕跨源引用：src/href 指向 http(s):// 或协议相对 //（同源相对路径与 data: 天然不匹配）
  const extRe = /<(?:script|link|img|iframe|audio|video|source|object|embed)\b[^>]*(?:src|href)\s*=\s*(?:"|')?\s*(?:https?:)?\/\//g;
  const extHits = [...SRC.matchAll(extRe)].map(m => m[0].slice(0, 60));
  const netWords = ['fet' + 'ch(', 'X' + 'MLHttpRequest', 'Web' + 'Socket', 'Event' + 'Source', 'send' + 'Beacon'];
  const netHits = netWords.filter(w => SRC.includes(w));
  const storeWords = ['local' + 'Storage', 'session' + 'Storage', 'indexed' + 'DB'];
  const storeHits = storeWords.filter(w => SRC.includes(w));
  return {
    s1: { pass: !extHits.length && !netHits.length, text: '无跨源资源引用、无网络 API（壳自扫描；assets 源码扫描由仓库门禁承担）', detail: JSON.stringify({ extHits, netHits }) },
    s2: { pass: !storeHits.length, text: '无浏览器存储 API（壳自扫描；assets 源码扫描由仓库门禁承担）', detail: JSON.stringify(storeHits) },
  };
}
$('run-selftest').addEventListener('click', async () => {
  const stepsEl = $('selftest-steps');
  const banner = $('selftest-banner');
  const status = $('selftest-status');
  stepsEl.innerHTML = ''; banner.textContent = ''; banner.className = 'badge';
  status.textContent = T('main.st.running', '运行中…');
  const steps = await runSelftest();
  renderSteps(stepsEl, steps);
  const pass = steps.every(s => s.ok);
  status.textContent = '';
  banner.textContent = pass
    ? T('main.st.pass', '✓ {n} 项断言全部通过 —— 本工具与 wop-specs 黄金向量对齐（v1.0-ratified F8）', { n: steps.length })
    : T('main.st.fail', '✗ {n} 项失败 —— 与规格不一致，请勿用于联调', { n: steps.filter(s => !s.ok).length });
  banner.className = 'badge ' + (pass ? 'ok' : 'err');
});

/* ===== gm/gmcore.js ===== */
var GmCore=(()=>{var Xr=Object.create;var Oe=Object.defineProperty;var Qr=Object.getOwnPropertyDescriptor;var Jr=Object.getOwnPropertyNames;var Fr=Object.getPrototypeOf,to=Object.prototype.hasOwnProperty;var eo=(t=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(t,{get:(e,r)=>(typeof require<"u"?require:e)[r]}):t)(function(t){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+t+'" is not supported')});var no=(t,e)=>{for(var r in e)Oe(t,r,{get:e[r],enumerable:!0})},Gn=(t,e,r,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of Jr(e))!to.call(t,o)&&o!==r&&Oe(t,o,{get:()=>e[o],enumerable:!(n=Qr(e,o))||n.enumerable});return t};var ro=(t,e,r)=>(r=t!=null?Xr(Fr(t)):{},Gn(e||!t||!t.__esModule?Oe(r,"default",{value:t,enumerable:!0}):r,t)),oo=t=>Gn(Oe({},"__esModule",{value:!0}),t);var bs={};no(bs,{DEK_ALG:()=>$t,DIGEST_ALG_SM:()=>ce,GOLDEN_SM:()=>ae,SM2_USER_ID:()=>fe,b64FromBytes:()=>Ae,b64uFromBytes:()=>Q,b64uOk:()=>He,buildSmDek:()=>Kn,buildSmDigest:()=>zt,buildSmEnvelope:()=>en,bytesFromB64:()=>Wt,bytesFromB64u:()=>wt,bytesFromHex:()=>J,dekPayload:()=>jn,hexFromBytes:()=>it,hexOk:()=>zr,pkcs8PemFromD:()=>Wr,privHexToB64:()=>$r,pubHexToB64:()=>Yr,requireHex:()=>xt,requireLen:()=>ue,sm2DecryptDek:()=>ie,sm2EncryptDek:()=>nn,sm2Keygen:()=>Rt,sm2PubFromPriv:()=>ys,sm2SignBytes:()=>Tt,sm2VerifyB64u:()=>Ct,sm3Hex:()=>Mt,sm4GcmDecrypt:()=>Yt,sm4GcmEncrypt:()=>Se,smGoldenSelfTest:()=>xs,utf8Decode:()=>rn,utf8Encode:()=>X,verifySmSuite:()=>Ot});var qt=typeof globalThis=="object"&&"crypto"in globalThis?globalThis.crypto:void 0;function It(t){return t instanceof Uint8Array||ArrayBuffer.isView(t)&&t.constructor.name==="Uint8Array"}function Xt(t){if(!Number.isSafeInteger(t)||t<0)throw new Error("positive integer expected, got "+t)}function vt(t,...e){if(!It(t))throw new Error("Uint8Array expected");if(e.length>0&&!e.includes(t.length))throw new Error("Uint8Array expected of length "+e+", got length="+t.length)}function Le(t){if(typeof t!="function"||typeof t.create!="function")throw new Error("Hash should be wrapped by utils.createHasher");Xt(t.outputLen),Xt(t.blockLen)}function on(t,e=!0){if(t.destroyed)throw new Error("Hash instance has been destroyed");if(e&&t.finished)throw new Error("Hash#digest() has already been called")}function Yn(...t){for(let e=0;e<t.length;e++)t[e].fill(0)}var $n=typeof Uint8Array.from([]).toHex=="function"&&typeof Uint8Array.fromHex=="function",so=Array.from({length:256},(t,e)=>e.toString(16).padStart(2,"0"));function dt(t){if(vt(t),$n)return t.toHex();let e="";for(let r=0;r<t.length;r++)e+=so[t[r]];return e}var bt={_0:48,_9:57,A:65,F:70,a:97,f:102};function zn(t){if(t>=bt._0&&t<=bt._9)return t-bt._0;if(t>=bt.A&&t<=bt.F)return t-(bt.A-10);if(t>=bt.a&&t<=bt.f)return t-(bt.a-10)}function Lt(t){if(typeof t!="string")throw new Error("hex string expected, got "+typeof t);if($n)return Uint8Array.fromHex(t);let e=t.length,r=e/2;if(e%2)throw new Error("hex string expected, got unpadded hex of length "+e);let n=new Uint8Array(r);for(let o=0,s=0;o<r;o++,s+=2){let i=zn(t.charCodeAt(s)),c=zn(t.charCodeAt(s+1));if(i===void 0||c===void 0){let f=t[s]+t[s+1];throw new Error('hex string expected, got non-hex character "'+f+'" at index '+s)}n[o]=i*16+c}return n}function sn(t){if(typeof t!="string")throw new Error("string expected");return new Uint8Array(new TextEncoder().encode(t))}function Wn(t){return typeof t=="string"&&(t=sn(t)),vt(t),t}function ot(...t){let e=0;for(let n=0;n<t.length;n++){let o=t[n];vt(o),e+=o.length}let r=new Uint8Array(e);for(let n=0,o=0;n<t.length;n++){let s=t[n];r.set(s,o),o+=s.length}return r}var Ie=class{};function le(t=32){if(qt&&typeof qt.getRandomValues=="function")return qt.getRandomValues(new Uint8Array(t));if(qt&&typeof qt.randomBytes=="function")return Uint8Array.from(qt.randomBytes(t));throw new Error("crypto.getRandomValues must be defined")}var fn=BigInt(0),un=BigInt(1);function de(t,e=""){if(typeof t!="boolean"){let r=e&&`"${e}"`;throw new Error(r+"expected boolean, got type="+typeof t)}return t}function kt(t,e,r=""){let n=It(t),o=t?.length,s=e!==void 0;if(!n||s&&o!==e){let i=r&&`"${r}" `,c=s?` of length ${e}`:"",f=n?`length=${o}`:`type=${typeof t}`;throw new Error(i+"expected Uint8Array"+c+", got "+f)}return t}function Kt(t){let e=t.toString(16);return e.length&1?"0"+e:e}function ke(t){if(typeof t!="string")throw new Error("hex string expected, got "+typeof t);return t===""?fn:BigInt("0x"+t)}function jt(t){return ke(dt(t))}function _e(t){return vt(t),ke(dt(Uint8Array.from(t).reverse()))}function Qt(t,e){return Lt(t.toString(16).padStart(e*2,"0"))}function Pe(t,e){return Qt(t,e).reverse()}function z(t,e,r){let n;if(typeof e=="string")try{n=Lt(e)}catch(s){throw new Error(t+" must be hex string or Uint8Array, cause: "+s)}else if(It(e))n=Uint8Array.from(e);else throw new Error(t+" must be hex string or Uint8Array");let o=n.length;if(typeof r=="number"&&o!==r)throw new Error(t+" of length "+r+" expected, got "+o);return n}var cn=t=>typeof t=="bigint"&&fn<=t;function an(t,e,r){return cn(t)&&cn(e)&&cn(r)&&e<=t&&t<r}function ln(t,e,r,n){if(!an(e,r,n))throw new Error("expected valid "+t+": "+r+" <= n < "+n+", got "+e)}function he(t){let e;for(e=0;t>fn;t>>=un,e+=1);return e}var Et=t=>(un<<BigInt(t))-un;function dn(t,e,r){if(typeof t!="number"||t<2)throw new Error("hashLen must be a number");if(typeof e!="number"||e<2)throw new Error("qByteLen must be a number");if(typeof r!="function")throw new Error("hmacFn must be a function");let n=d=>new Uint8Array(d),o=d=>Uint8Array.of(d),s=n(t),i=n(t),c=0,f=()=>{s.fill(1),i.fill(0),c=0},l=(...d)=>r(i,s,...d),u=(d=n(0))=>{i=l(o(0),d),s=l(),d.length!==0&&(i=l(o(1),d),s=l())},h=()=>{if(c++>=1e3)throw new Error("drbg: tried 1000 values");let d=0,p=[];for(;d<e;){s=l();let m=s.slice();p.push(m),d+=s.length}return ot(...p)};return(d,p)=>{f(),u(d);let m;for(;!(m=p(h()));)u();return f(),m}}function pe(t,e,r={}){if(!t||typeof t!="object")throw new Error("expected valid options object");function n(o,s,i){let c=t[o];if(i&&c===void 0)return;let f=typeof c;if(f!==s||c===null)throw new Error(`param "${o}" is invalid: expected ${s}, got ${f}`)}Object.entries(e).forEach(([o,s])=>n(o,s,!1)),Object.entries(r).forEach(([o,s])=>n(o,s,!0))}function Ne(t){let e=new WeakMap;return(r,...n)=>{let o=e.get(r);if(o!==void 0)return o;let s=t(r,...n);return e.set(r,s),s}}var Jt=dt;var ct=ot;var $=Kt,C=ke;var Xn=Qt;var Re=class extends Ie{constructor(e,r){super(),this.finished=!1,this.destroyed=!1,Le(e);let n=Wn(r);if(this.iHash=e.create(),typeof this.iHash.update!="function")throw new Error("Expected instance of class which extends utils.Hash");this.blockLen=this.iHash.blockLen,this.outputLen=this.iHash.outputLen;let o=this.blockLen,s=new Uint8Array(o);s.set(n.length>o?e.create().update(n).digest():n);for(let i=0;i<s.length;i++)s[i]^=54;this.iHash.update(s),this.oHash=e.create();for(let i=0;i<s.length;i++)s[i]^=106;this.oHash.update(s),Yn(s)}update(e){return on(this),this.iHash.update(e),this}digestInto(e){on(this),vt(e,this.outputLen),this.finished=!0,this.iHash.digestInto(e),this.oHash.update(e),this.oHash.digestInto(e),this.destroy()}digest(){let e=new Uint8Array(this.oHash.outputLen);return this.digestInto(e),e}_cloneInto(e){e||(e=Object.create(Object.getPrototypeOf(this),{}));let{oHash:r,iHash:n,finished:o,destroyed:s,blockLen:i,outputLen:c}=this;return e=e,e.finished=o,e.destroyed=s,e.blockLen=i,e.outputLen=c,e.oHash=r._cloneInto(e.oHash),e.iHash=n._cloneInto(e.iHash),e}clone(){return this._cloneInto()}destroy(){this.destroyed=!0,this.oHash.destroy(),this.iHash.destroy()}},hn=(t,e,r)=>new Re(t,e).update(r).digest();hn.create=(t,e)=>new Re(t,e);var nt=BigInt(0),W=BigInt(1),Zt=BigInt(2),Fn=BigInt(3),tr=BigInt(4),er=BigInt(5),fo=BigInt(7),nr=BigInt(8),ao=BigInt(9),rr=BigInt(16);function et(t,e){let r=t%e;return r>=nt?r:e+r}function Qn(t,e){if(t===nt)throw new Error("invert: expected non-zero number");if(e<=nt)throw new Error("invert: expected positive modulus, got "+e);let r=et(t,e),n=e,o=nt,s=W,i=W,c=nt;for(;r!==nt;){let l=n/r,u=n%r,h=o-i*l,a=s-c*l;n=r,r=u,o=i,s=c,i=h,c=a}if(n!==W)throw new Error("invert: does not exist");return et(o,e)}function pn(t,e,r){if(!t.eql(t.sqr(e),r))throw new Error("Cannot find square root")}function or(t,e){let r=(t.ORDER+W)/tr,n=t.pow(e,r);return pn(t,n,e),n}function lo(t,e){let r=(t.ORDER-er)/nr,n=t.mul(e,Zt),o=t.pow(n,r),s=t.mul(e,o),i=t.mul(t.mul(s,Zt),o),c=t.mul(s,t.sub(i,t.ONE));return pn(t,c,e),c}function ho(t){let e=Bt(t),r=sr(t),n=r(e,e.neg(e.ONE)),o=r(e,n),s=r(e,e.neg(n)),i=(t+fo)/rr;return(c,f)=>{let l=c.pow(f,i),u=c.mul(l,n),h=c.mul(l,o),a=c.mul(l,s),d=c.eql(c.sqr(u),f),p=c.eql(c.sqr(h),f);l=c.cmov(l,u,d),u=c.cmov(a,h,p);let m=c.eql(c.sqr(u),f),b=c.cmov(l,u,m);return pn(c,b,f),b}}function sr(t){if(t<Fn)throw new Error("sqrt is not defined for small field");let e=t-W,r=0;for(;e%Zt===nt;)e/=Zt,r++;let n=Zt,o=Bt(t);for(;Jn(o,n)===1;)if(n++>1e3)throw new Error("Cannot find square root: probably non-prime P");if(r===1)return or;let s=o.pow(n,e),i=(e+W)/Zt;return function(f,l){if(f.is0(l))return l;if(Jn(f,l)!==1)throw new Error("Cannot find square root");let u=r,h=f.mul(f.ONE,s),a=f.pow(l,e),d=f.pow(l,i);for(;!f.eql(a,f.ONE);){if(f.is0(a))return f.ZERO;let p=1,m=f.sqr(a);for(;!f.eql(m,f.ONE);)if(p++,m=f.sqr(m),p===u)throw new Error("Cannot find square root");let b=W<<BigInt(u-p-1),w=f.pow(h,b);u=p,h=f.sqr(w),a=f.mul(a,h),d=f.mul(d,w)}return d}}function po(t){return t%tr===Fn?or:t%nr===er?lo:t%rr===ao?ho(t):sr(t)}var go=["create","isValid","is0","neg","inv","sqrt","sqr","eql","add","sub","mul","pow","div","addN","subN","mulN","sqrN"];function gn(t){let e={ORDER:"bigint",MASK:"bigint",BYTES:"number",BITS:"number"},r=go.reduce((n,o)=>(n[o]="function",n),e);return pe(t,r),t}function yo(t,e,r){if(r<nt)throw new Error("invalid exponent, negatives unsupported");if(r===nt)return t.ONE;if(r===W)return e;let n=t.ONE,o=e;for(;r>nt;)r&W&&(n=t.mul(n,o)),o=t.sqr(o),r>>=W;return n}function Ce(t,e,r=!1){let n=new Array(e.length).fill(r?t.ZERO:void 0),o=e.reduce((i,c,f)=>t.is0(c)?i:(n[f]=i,t.mul(i,c)),t.ONE),s=t.inv(o);return e.reduceRight((i,c,f)=>t.is0(c)?i:(n[f]=t.mul(i,n[f]),t.mul(i,c)),s),n}function Jn(t,e){let r=(t.ORDER-W)/Zt,n=t.pow(e,r),o=t.eql(n,t.ONE),s=t.eql(n,t.ZERO),i=t.eql(n,t.neg(t.ONE));if(!o&&!s&&!i)throw new Error("invalid Legendre symbol result");return o?1:s?0:-1}function Me(t,e){e!==void 0&&Xt(e);let r=e!==void 0?e:t.toString(2).length,n=Math.ceil(r/8);return{nBitLength:r,nByteLength:n}}function Bt(t,e,r=!1,n={}){if(t<=nt)throw new Error("invalid field: expected ORDER > 0, got "+t);let o,s,i=!1,c;if(typeof e=="object"&&e!=null){if(n.sqrt||r)throw new Error("cannot specify opts in two arguments");let a=e;a.BITS&&(o=a.BITS),a.sqrt&&(s=a.sqrt),typeof a.isLE=="boolean"&&(r=a.isLE),typeof a.modFromBytes=="boolean"&&(i=a.modFromBytes),c=a.allowedLengths}else typeof e=="number"&&(o=e),n.sqrt&&(s=n.sqrt);let{nBitLength:f,nByteLength:l}=Me(t,o);if(l>2048)throw new Error("invalid field: expected ORDER of <= 2048 bytes");let u,h=Object.freeze({ORDER:t,isLE:r,BITS:f,BYTES:l,MASK:Et(f),ZERO:nt,ONE:W,allowedLengths:c,create:a=>et(a,t),isValid:a=>{if(typeof a!="bigint")throw new Error("invalid field element: expected bigint, got "+typeof a);return nt<=a&&a<t},is0:a=>a===nt,isValidNot0:a=>!h.is0(a)&&h.isValid(a),isOdd:a=>(a&W)===W,neg:a=>et(-a,t),eql:(a,d)=>a===d,sqr:a=>et(a*a,t),add:(a,d)=>et(a+d,t),sub:(a,d)=>et(a-d,t),mul:(a,d)=>et(a*d,t),pow:(a,d)=>yo(h,a,d),div:(a,d)=>et(a*Qn(d,t),t),sqrN:a=>a*a,addN:(a,d)=>a+d,subN:(a,d)=>a-d,mulN:(a,d)=>a*d,inv:a=>Qn(a,t),sqrt:s||(a=>(u||(u=po(t)),u(h,a))),toBytes:a=>r?Pe(a,l):Qt(a,l),fromBytes:(a,d=!0)=>{if(c){if(!c.includes(a.length)||a.length>l)throw new Error("Field.fromBytes: expected "+c+" bytes, got "+a.length);let m=new Uint8Array(l);m.set(a,r?0:m.length-a.length),a=m}if(a.length!==l)throw new Error("Field.fromBytes: expected "+l+" bytes, got "+a.length);let p=r?_e(a):jt(a);if(i&&(p=et(p,t)),!d&&!h.isValid(p))throw new Error("invalid field element: outside of range 0..ORDER");return p},invertBatch:a=>Ce(h,a),cmov:(a,d,p)=>p?d:a});return Object.freeze(h)}function ir(t){if(typeof t!="bigint")throw new Error("field order must be bigint");let e=t.toString(2).length;return Math.ceil(e/8)}function yn(t){let e=ir(t);return e+Math.ceil(e/2)}function cr(t,e,r=!1){let n=t.length,o=ir(e),s=yn(e);if(n<16||n<s||n>1024)throw new Error("expected "+s+"-1024 bytes of input, got "+n);let i=r?_e(t):jt(t),c=et(i,e-W)+W;return r?Pe(c,o):Qt(c,o)}var Ft=BigInt(0),Dt=BigInt(1);function ye(t,e){let r=e.negate();return t?r:e}function qe(t,e){let r=Ce(t.Fp,e.map(n=>n.Z));return e.map((n,o)=>t.fromAffine(n.toAffine(r[o])))}function lr(t,e){if(!Number.isSafeInteger(t)||t<=0||t>e)throw new Error("invalid window size, expected [1.."+e+"], got W="+t)}function mn(t,e){lr(t,e);let r=Math.ceil(e/t)+1,n=2**(t-1),o=2**t,s=Et(t),i=BigInt(t);return{windows:r,windowSize:n,mask:s,maxNumber:o,shiftBy:i}}function ur(t,e,r){let{windowSize:n,mask:o,maxNumber:s,shiftBy:i}=r,c=Number(t&o),f=t>>i;c>n&&(c-=s,f+=Dt);let l=e*n,u=l+Math.abs(c)-1,h=c===0,a=c<0,d=e%2!==0;return{nextN:f,offset:u,isZero:h,isNeg:a,isNegF:d,offsetF:l}}function mo(t,e){if(!Array.isArray(t))throw new Error("array expected");t.forEach((r,n)=>{if(!(r instanceof e))throw new Error("invalid point at index "+n)})}function wo(t,e){if(!Array.isArray(t))throw new Error("array of scalars expected");t.forEach((r,n)=>{if(!e.isValid(r))throw new Error("invalid scalar at index "+n)})}var wn=new WeakMap,dr=new WeakMap;function xn(t){return dr.get(t)||1}function fr(t){if(t!==Ft)throw new Error("invalid wNAF")}var Ve=class{constructor(e,r){this.BASE=e.BASE,this.ZERO=e.ZERO,this.Fn=e.Fn,this.bits=r}_unsafeLadder(e,r,n=this.ZERO){let o=e;for(;r>Ft;)r&Dt&&(n=n.add(o)),o=o.double(),r>>=Dt;return n}precomputeWindow(e,r){let{windows:n,windowSize:o}=mn(r,this.bits),s=[],i=e,c=i;for(let f=0;f<n;f++){c=i,s.push(c);for(let l=1;l<o;l++)c=c.add(i),s.push(c);i=c.double()}return s}wNAF(e,r,n){if(!this.Fn.isValid(n))throw new Error("invalid scalar");let o=this.ZERO,s=this.BASE,i=mn(e,this.bits);for(let c=0;c<i.windows;c++){let{nextN:f,offset:l,isZero:u,isNeg:h,isNegF:a,offsetF:d}=ur(n,c,i);n=f,u?s=s.add(ye(a,r[d])):o=o.add(ye(h,r[l]))}return fr(n),{p:o,f:s}}wNAFUnsafe(e,r,n,o=this.ZERO){let s=mn(e,this.bits);for(let i=0;i<s.windows&&n!==Ft;i++){let{nextN:c,offset:f,isZero:l,isNeg:u}=ur(n,i,s);if(n=c,!l){let h=r[f];o=o.add(u?h.negate():h)}}return fr(n),o}getPrecomputes(e,r,n){let o=wn.get(r);return o||(o=this.precomputeWindow(r,e),e!==1&&(typeof n=="function"&&(o=n(o)),wn.set(r,o))),o}cached(e,r,n){let o=xn(e);return this.wNAF(o,this.getPrecomputes(o,e,n),r)}unsafe(e,r,n,o){let s=xn(e);return s===1?this._unsafeLadder(e,r,o):this.wNAFUnsafe(s,this.getPrecomputes(s,e,n),r,o)}createCache(e,r){lr(r,this.bits),dr.set(e,r),wn.delete(e)}hasCache(e){return xn(e)!==1}};function hr(t,e,r,n){let o=e,s=t.ZERO,i=t.ZERO;for(;r>Ft||n>Ft;)r&Dt&&(s=s.add(o)),n&Dt&&(i=i.add(o)),o=o.double(),r>>=Dt,n>>=Dt;return{p1:s,p2:i}}function pr(t,e,r,n){mo(r,t),wo(n,e);let o=r.length,s=n.length;if(o!==s)throw new Error("arrays of points and scalars must have equal length");let i=t.ZERO,c=he(BigInt(o)),f=1;c>12?f=c-3:c>4?f=c-2:c>0&&(f=2);let l=Et(f),u=new Array(Number(l)+1).fill(i),h=Math.floor((e.BITS-1)/f)*f,a=i;for(let d=h;d>=0;d-=f){u.fill(i);for(let m=0;m<s;m++){let b=n[m],w=Number(b>>BigInt(d)&l);u[w]=u[w].add(r[m])}let p=i;for(let m=u.length-1,b=i;m>0;m--)b=b.add(u[m]),p=p.add(b);if(a=a.add(p),d!==0)for(let m=0;m<f;m++)a=a.double()}return a}function ar(t,e,r){if(e){if(e.ORDER!==t)throw new Error("Field.ORDER must match order: Fp == p, Fn == n");return gn(e),e}else return Bt(t,{isLE:r})}function gr(t,e,r={},n){if(n===void 0&&(n=t==="edwards"),!e||typeof e!="object")throw new Error(`expected valid ${t} CURVE object`);for(let f of["p","n","h"]){let l=e[f];if(!(typeof l=="bigint"&&l>Ft))throw new Error(`CURVE.${f} must be positive bigint`)}let o=ar(e.p,r.Fp,n),s=ar(e.n,r.Fn,n),c=["Gx","Gy","a",t==="weierstrass"?"b":"d"];for(let f of c)if(!o.isValid(e[f]))throw new Error(`CURVE.${f} must be valid field element of CURVE.Fp`);return e=Object.freeze(Object.assign({},e)),{CURVE:e,Fp:o,Fn:s}}var yr=(t,e)=>(t+(t>=0?e:-e)/mr)/e;function xo(t,e,r){let[[n,o],[s,i]]=e,c=yr(i*t,r),f=yr(-o*t,r),l=t-c*n-f*s,u=-c*o-f*i,h=l<Ht,a=u<Ht;h&&(l=-l),a&&(u=-u);let d=Et(Math.ceil(he(r)/2))+ee;if(l<Ht||l>=d||u<Ht||u>=d)throw new Error("splitScalar (endomorphism): failed, k="+t);return{k1neg:h,k1:l,k2neg:a,k2:u}}function vn(t){if(!["compact","recovered","der"].includes(t))throw new Error('Signature format must be "compact", "recovered", or "der"');return t}function bn(t,e){let r={};for(let n of Object.keys(e))r[n]=t[n]===void 0?e[n]:t[n];return de(r.lowS,"lowS"),de(r.prehash,"prehash"),r.format!==void 0&&vn(r.format),r}var En=class extends Error{constructor(e=""){super(e)}},St={Err:En,_tlv:{encode:(t,e)=>{let{Err:r}=St;if(t<0||t>256)throw new r("tlv.encode: wrong tag");if(e.length&1)throw new r("tlv.encode: unpadded data");let n=e.length/2,o=Kt(n);if(o.length/2&128)throw new r("tlv.encode: long form length too big");let s=n>127?Kt(o.length/2|128):"";return Kt(t)+s+o+e},decode(t,e){let{Err:r}=St,n=0;if(t<0||t>256)throw new r("tlv.encode: wrong tag");if(e.length<2||e[n++]!==t)throw new r("tlv.decode: wrong tlv");let o=e[n++],s=!!(o&128),i=0;if(!s)i=o;else{let f=o&127;if(!f)throw new r("tlv.decode(long): indefinite length not supported");if(f>4)throw new r("tlv.decode(long): byte length is too big");let l=e.subarray(n,n+f);if(l.length!==f)throw new r("tlv.decode: length bytes not complete");if(l[0]===0)throw new r("tlv.decode(long): zero leftmost byte");for(let u of l)i=i<<8|u;if(n+=f,i<128)throw new r("tlv.decode(long): not minimal encoding")}let c=e.subarray(n,n+i);if(c.length!==i)throw new r("tlv.decode: wrong value length");return{v:c,l:e.subarray(n+i)}}},_int:{encode(t){let{Err:e}=St;if(t<Ht)throw new e("integer: negative integers are not allowed");let r=Kt(t);if(Number.parseInt(r[0],16)&8&&(r="00"+r),r.length&1)throw new e("unexpected DER parsing assertion: unpadded hex");return r},decode(t){let{Err:e}=St;if(t[0]&128)throw new e("invalid signature integer: negative");if(t[0]===0&&!(t[1]&128))throw new e("invalid signature integer: unnecessary leading zero");return jt(t)}},toSig(t){let{Err:e,_int:r,_tlv:n}=St,o=z("signature",t),{v:s,l:i}=n.decode(48,o);if(i.length)throw new e("invalid signature: left bytes after parsing");let{v:c,l:f}=n.decode(2,s),{v:l,l:u}=n.decode(2,f);if(u.length)throw new e("invalid signature: left bytes after parsing");return{r:r.decode(c),s:r.decode(l)}},hexFromSig(t){let{_tlv:e,_int:r}=St,n=e.encode(2,r.encode(t.r)),o=e.encode(2,r.encode(t.s)),s=n+o;return e.encode(48,s)}},Ht=BigInt(0),ee=BigInt(1),mr=BigInt(2),Ke=BigInt(3),bo=BigInt(4);function te(t,e){let{BYTES:r}=t,n;if(typeof e=="bigint")n=e;else{let o=z("private key",e);try{n=t.fromBytes(o)}catch{throw new Error(`invalid private key: expected ui8a of size ${r}, got ${typeof e}`)}}if(!t.isValidNot0(n))throw new Error("invalid private key: out of range [1..N-1]");return n}function vo(t,e={}){let r=gr("weierstrass",t,e),{Fp:n,Fn:o}=r,s=r.CURVE,{h:i,n:c}=s;pe(e,{},{allowInfinityPoint:"boolean",clearCofactor:"function",isTorsionFree:"function",fromBytes:"function",toBytes:"function",endo:"object",wrapPrivateKey:"boolean"});let{endo:f}=e;if(f&&(!n.is0(s.a)||typeof f.beta!="bigint"||!Array.isArray(f.basises)))throw new Error('invalid endo: expected "beta": bigint and "basises": array');let l=xr(n,o);function u(){if(!n.isOdd)throw new Error("compression is not supported: Field does not have .isOdd()")}function h(P,x,y){let{x:g,y:v}=x.toAffine(),S=n.toBytes(g);if(de(y,"isCompressed"),y){u();let U=!n.isOdd(v);return ot(wr(U),S)}else return ot(Uint8Array.of(4),S,n.toBytes(v))}function a(P){kt(P,void 0,"Point");let{publicKey:x,publicKeyUncompressed:y}=l,g=P.length,v=P[0],S=P.subarray(1);if(g===x&&(v===2||v===3)){let U=n.fromBytes(S);if(!n.isValid(U))throw new Error("bad point: is not on curve, wrong x");let A=m(U),H;try{H=n.sqrt(A)}catch(j){let R=j instanceof Error?": "+j.message:"";throw new Error("bad point: is not on curve, sqrt error"+R)}u();let O=n.isOdd(H);return(v&1)===1!==O&&(H=n.neg(H)),{x:U,y:H}}else if(g===y&&v===4){let U=n.BYTES,A=n.fromBytes(S.subarray(0,U)),H=n.fromBytes(S.subarray(U,U*2));if(!b(A,H))throw new Error("bad point: is not on curve");return{x:A,y:H}}else throw new Error(`bad point: got length ${g}, expected compressed=${x} or uncompressed=${y}`)}let d=e.toBytes||h,p=e.fromBytes||a;function m(P){let x=n.sqr(P),y=n.mul(x,P);return n.add(n.add(y,n.mul(P,s.a)),s.b)}function b(P,x){let y=n.sqr(x),g=m(P);return n.eql(y,g)}if(!b(s.Gx,s.Gy))throw new Error("bad curve params: generator point");let w=n.mul(n.pow(s.a,Ke),bo),E=n.mul(n.sqr(s.b),BigInt(27));if(n.is0(n.add(w,E)))throw new Error("bad curve params: a or b");function B(P,x,y=!1){if(!n.isValid(x)||y&&n.is0(x))throw new Error(`bad point coordinate ${P}`);return x}function L(P){if(!(P instanceof k))throw new Error("ProjectivePoint expected")}function T(P){if(!f||!f.basises)throw new Error("no endo");return xo(P,f.basises,o.ORDER)}let G=Ne((P,x)=>{let{X:y,Y:g,Z:v}=P;if(n.eql(v,n.ONE))return{x:y,y:g};let S=P.is0();x==null&&(x=S?n.ONE:n.inv(v));let U=n.mul(y,x),A=n.mul(g,x),H=n.mul(v,x);if(S)return{x:n.ZERO,y:n.ZERO};if(!n.eql(H,n.ONE))throw new Error("invZ was invalid");return{x:U,y:A}}),F=Ne(P=>{if(P.is0()){if(e.allowInfinityPoint&&!n.is0(P.Y))return;throw new Error("bad point: ZERO")}let{x,y}=P.toAffine();if(!n.isValid(x)||!n.isValid(y))throw new Error("bad point: x or y not field elements");if(!b(x,y))throw new Error("bad point: equation left != right");if(!P.isTorsionFree())throw new Error("bad point: not in prime-order subgroup");return!0});function lt(P,x,y,g,v){return y=new k(n.mul(y.X,P),y.Y,y.Z),x=ye(g,x),y=ye(v,y),x.add(y)}class k{constructor(x,y,g){this.X=B("x",x),this.Y=B("y",y,!0),this.Z=B("z",g),Object.freeze(this)}static CURVE(){return s}static fromAffine(x){let{x:y,y:g}=x||{};if(!x||!n.isValid(y)||!n.isValid(g))throw new Error("invalid affine point");if(x instanceof k)throw new Error("projective point not allowed");return n.is0(y)&&n.is0(g)?k.ZERO:new k(y,g,n.ONE)}static fromBytes(x){let y=k.fromAffine(p(kt(x,void 0,"point")));return y.assertValidity(),y}static fromHex(x){return k.fromBytes(z("pointHex",x))}get x(){return this.toAffine().x}get y(){return this.toAffine().y}precompute(x=8,y=!0){return Vt.createCache(this,x),y||this.multiply(Ke),this}assertValidity(){F(this)}hasEvenY(){let{y:x}=this.toAffine();if(!n.isOdd)throw new Error("Field doesn't support isOdd");return!n.isOdd(x)}equals(x){L(x);let{X:y,Y:g,Z:v}=this,{X:S,Y:U,Z:A}=x,H=n.eql(n.mul(y,A),n.mul(S,v)),O=n.eql(n.mul(g,A),n.mul(U,v));return H&&O}negate(){return new k(this.X,n.neg(this.Y),this.Z)}double(){let{a:x,b:y}=s,g=n.mul(y,Ke),{X:v,Y:S,Z:U}=this,A=n.ZERO,H=n.ZERO,O=n.ZERO,I=n.mul(v,v),j=n.mul(S,S),R=n.mul(U,U),_=n.mul(v,S);return _=n.add(_,_),O=n.mul(v,U),O=n.add(O,O),A=n.mul(x,O),H=n.mul(g,R),H=n.add(A,H),A=n.sub(j,H),H=n.add(j,H),H=n.mul(A,H),A=n.mul(_,A),O=n.mul(g,O),R=n.mul(x,R),_=n.sub(I,R),_=n.mul(x,_),_=n.add(_,O),O=n.add(I,I),I=n.add(O,I),I=n.add(I,R),I=n.mul(I,_),H=n.add(H,I),R=n.mul(S,U),R=n.add(R,R),I=n.mul(R,_),A=n.sub(A,I),O=n.mul(R,j),O=n.add(O,O),O=n.add(O,O),new k(A,H,O)}add(x){L(x);let{X:y,Y:g,Z:v}=this,{X:S,Y:U,Z:A}=x,H=n.ZERO,O=n.ZERO,I=n.ZERO,j=s.a,R=n.mul(s.b,Ke),_=n.mul(y,S),M=n.mul(g,U),Z=n.mul(v,A),tt=n.add(y,g),V=n.add(S,U);tt=n.mul(tt,V),V=n.add(_,M),tt=n.sub(tt,V),V=n.add(y,v);let Y=n.add(S,A);return V=n.mul(V,Y),Y=n.add(_,Z),V=n.sub(V,Y),Y=n.add(g,v),H=n.add(U,A),Y=n.mul(Y,H),H=n.add(M,Z),Y=n.sub(Y,H),I=n.mul(j,V),H=n.mul(R,Z),I=n.add(H,I),H=n.sub(M,I),I=n.add(M,I),O=n.mul(H,I),M=n.add(_,_),M=n.add(M,_),Z=n.mul(j,Z),V=n.mul(R,V),M=n.add(M,Z),Z=n.sub(_,Z),Z=n.mul(j,Z),V=n.add(V,Z),_=n.mul(M,V),O=n.add(O,_),_=n.mul(Y,V),H=n.mul(tt,H),H=n.sub(H,_),_=n.mul(tt,M),I=n.mul(Y,I),I=n.add(I,_),new k(H,O,I)}subtract(x){return this.add(x.negate())}is0(){return this.equals(k.ZERO)}multiply(x){let{endo:y}=e;if(!o.isValidNot0(x))throw new Error("invalid scalar: out of range");let g,v,S=U=>Vt.cached(this,U,A=>qe(k,A));if(y){let{k1neg:U,k1:A,k2neg:H,k2:O}=T(x),{p:I,f:j}=S(A),{p:R,f:_}=S(O);v=j.add(_),g=lt(y.beta,I,R,U,H)}else{let{p:U,f:A}=S(x);g=U,v=A}return qe(k,[g,v])[0]}multiplyUnsafe(x){let{endo:y}=e,g=this;if(!o.isValid(x))throw new Error("invalid scalar: out of range");if(x===Ht||g.is0())return k.ZERO;if(x===ee)return g;if(Vt.hasCache(this))return this.multiply(x);if(y){let{k1neg:v,k1:S,k2neg:U,k2:A}=T(x),{p1:H,p2:O}=hr(k,g,S,A);return lt(y.beta,H,O,v,U)}else return Vt.unsafe(g,x)}multiplyAndAddUnsafe(x,y,g){let v=this.multiplyUnsafe(y).add(x.multiplyUnsafe(g));return v.is0()?void 0:v}toAffine(x){return G(this,x)}isTorsionFree(){let{isTorsionFree:x}=e;return i===ee?!0:x?x(k,this):Vt.unsafe(this,c).is0()}clearCofactor(){let{clearCofactor:x}=e;return i===ee?this:x?x(k,this):this.multiplyUnsafe(i)}isSmallOrder(){return this.multiplyUnsafe(i).is0()}toBytes(x=!0){return de(x,"isCompressed"),this.assertValidity(),d(k,this,x)}toHex(x=!0){return dt(this.toBytes(x))}toString(){return`<Point ${this.is0()?"ZERO":this.toHex()}>`}get px(){return this.X}get py(){return this.X}get pz(){return this.Z}toRawBytes(x=!0){return this.toBytes(x)}_setWindowSize(x){this.precompute(x)}static normalizeZ(x){return qe(k,x)}static msm(x,y){return pr(k,o,x,y)}static fromPrivateKey(x){return k.BASE.multiply(te(o,x))}}k.BASE=new k(s.Gx,s.Gy,n.ONE),k.ZERO=new k(n.ZERO,n.ONE,n.ZERO),k.Fp=n,k.Fn=o;let Ue=o.BITS,Vt=new Ve(k,e.endo?Math.ceil(Ue/2):Ue);return k.BASE.precompute(8),k}function wr(t){return Uint8Array.of(t?2:3)}function xr(t,e){return{secretKey:e.BYTES,publicKey:1+t.BYTES,publicKeyUncompressed:1+2*t.BYTES,publicKeyHasPrefix:!0,signature:2*e.BYTES}}function Eo(t,e={}){let{Fn:r}=t,n=e.randomBytes||le,o=Object.assign(xr(t.Fp,r),{seed:yn(r.ORDER)});function s(d){try{return!!te(r,d)}catch{return!1}}function i(d,p){let{publicKey:m,publicKeyUncompressed:b}=o;try{let w=d.length;return p===!0&&w!==m||p===!1&&w!==b?!1:!!t.fromBytes(d)}catch{return!1}}function c(d=n(o.seed)){return cr(kt(d,o.seed,"seed"),r.ORDER)}function f(d,p=!0){return t.BASE.multiply(te(r,d)).toBytes(p)}function l(d){let p=c(d);return{secretKey:p,publicKey:f(p)}}function u(d){if(typeof d=="bigint")return!1;if(d instanceof t)return!0;let{secretKey:p,publicKey:m,publicKeyUncompressed:b}=o;if(r.allowedLengths||p===m)return;let w=z("key",d).length;return w===m||w===b}function h(d,p,m=!0){if(u(d)===!0)throw new Error("first arg must be private key");if(u(p)===!1)throw new Error("second arg must be public key");let b=te(r,d);return t.fromHex(p).multiply(b).toBytes(m)}return Object.freeze({getPublicKey:f,getSharedSecret:h,keygen:l,Point:t,utils:{isValidSecretKey:s,isValidPublicKey:i,randomSecretKey:c,isValidPrivateKey:s,randomPrivateKey:c,normPrivateKeyToScalar:d=>te(r,d),precompute(d=8,p=t.BASE){return p.precompute(d,!1)}},lengths:o})}function Bo(t,e,r={}){Le(e),pe(r,{},{hmac:"function",lowS:"boolean",randomBytes:"function",bits2int:"function",bits2int_modN:"function"});let n=r.randomBytes||le,o=r.hmac||((y,...g)=>hn(e,y,ot(...g))),{Fp:s,Fn:i}=t,{ORDER:c,BITS:f}=i,{keygen:l,getPublicKey:u,getSharedSecret:h,utils:a,lengths:d}=Eo(t,r),p={prehash:!1,lowS:typeof r.lowS=="boolean"?r.lowS:!1,format:void 0,extraEntropy:!1},m="compact";function b(y){let g=c>>ee;return y>g}function w(y,g){if(!i.isValidNot0(g))throw new Error(`invalid signature ${y}: out of range 1..Point.Fn.ORDER`);return g}function E(y,g){vn(g);let v=d.signature,S=g==="compact"?v:g==="recovered"?v+1:void 0;return kt(y,S,`${g} signature`)}class B{constructor(g,v,S){this.r=w("r",g),this.s=w("s",v),S!=null&&(this.recovery=S),Object.freeze(this)}static fromBytes(g,v=m){E(g,v);let S;if(v==="der"){let{r:O,s:I}=St.toSig(kt(g));return new B(O,I)}v==="recovered"&&(S=g[0],v="compact",g=g.subarray(1));let U=i.BYTES,A=g.subarray(0,U),H=g.subarray(U,U*2);return new B(i.fromBytes(A),i.fromBytes(H),S)}static fromHex(g,v){return this.fromBytes(Lt(g),v)}addRecoveryBit(g){return new B(this.r,this.s,g)}recoverPublicKey(g){let v=s.ORDER,{r:S,s:U,recovery:A}=this;if(A==null||![0,1,2,3].includes(A))throw new Error("recovery id invalid");if(c*mr<v&&A>1)throw new Error("recovery id is ambiguous for h>1 curve");let O=A===2||A===3?S+c:S;if(!s.isValid(O))throw new Error("recovery id 2 or 3 invalid");let I=s.toBytes(O),j=t.fromBytes(ot(wr((A&1)===0),I)),R=i.inv(O),_=T(z("msgHash",g)),M=i.create(-_*R),Z=i.create(U*R),tt=t.BASE.multiplyUnsafe(M).add(j.multiplyUnsafe(Z));if(tt.is0())throw new Error("point at infinify");return tt.assertValidity(),tt}hasHighS(){return b(this.s)}toBytes(g=m){if(vn(g),g==="der")return Lt(St.hexFromSig(this));let v=i.toBytes(this.r),S=i.toBytes(this.s);if(g==="recovered"){if(this.recovery==null)throw new Error("recovery bit must be present");return ot(Uint8Array.of(this.recovery),v,S)}return ot(v,S)}toHex(g){return dt(this.toBytes(g))}assertValidity(){}static fromCompact(g){return B.fromBytes(z("sig",g),"compact")}static fromDER(g){return B.fromBytes(z("sig",g),"der")}normalizeS(){return this.hasHighS()?new B(this.r,i.neg(this.s),this.recovery):this}toDERRawBytes(){return this.toBytes("der")}toDERHex(){return dt(this.toBytes("der"))}toCompactRawBytes(){return this.toBytes("compact")}toCompactHex(){return dt(this.toBytes("compact"))}}let L=r.bits2int||function(g){if(g.length>8192)throw new Error("input is too large");let v=jt(g),S=g.length*8-f;return S>0?v>>BigInt(S):v},T=r.bits2int_modN||function(g){return i.create(L(g))},G=Et(f);function F(y){return ln("num < 2^"+f,y,Ht,G),i.toBytes(y)}function lt(y,g){return kt(y,void 0,"message"),g?kt(e(y),void 0,"prehashed message"):y}function k(y,g,v){if(["recovered","canonical"].some(M=>M in v))throw new Error("sign() legacy options not supported");let{lowS:S,prehash:U,extraEntropy:A}=bn(v,p);y=lt(y,U);let H=T(y),O=te(i,g),I=[F(O),F(H)];if(A!=null&&A!==!1){let M=A===!0?n(d.secretKey):A;I.push(z("extraEntropy",M))}let j=ot(...I),R=H;function _(M){let Z=L(M);if(!i.isValidNot0(Z))return;let tt=i.inv(Z),V=t.BASE.multiply(Z).toAffine(),Y=i.create(V.x);if(Y===Ht)return;let Te=i.create(tt*i.create(R+Y*O));if(Te===Ht)return;let Zn=(V.x===Y?0:2)|Number(V.y&ee),Dn=Te;return S&&b(Te)&&(Dn=i.neg(Te),Zn^=1),new B(Y,Dn,Zn)}return{seed:j,k2sig:_}}function Ue(y,g,v={}){y=z("message",y);let{seed:S,k2sig:U}=k(y,g,v);return dn(e.outputLen,i.BYTES,o)(S,U)}function Vt(y){let g,v=typeof y=="string"||It(y),S=!v&&y!==null&&typeof y=="object"&&typeof y.r=="bigint"&&typeof y.s=="bigint";if(!v&&!S)throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");if(S)g=new B(y.r,y.s);else if(v){try{g=B.fromBytes(z("sig",y),"der")}catch(U){if(!(U instanceof St.Err))throw U}if(!g)try{g=B.fromBytes(z("sig",y),"compact")}catch{return!1}}return g||!1}function P(y,g,v,S={}){let{lowS:U,prehash:A,format:H}=bn(S,p);if(v=z("publicKey",v),g=lt(z("message",g),A),"strict"in S)throw new Error("options.strict was renamed to lowS");let O=H===void 0?Vt(y):B.fromBytes(z("sig",y),H);if(O===!1)return!1;try{let I=t.fromBytes(v);if(U&&O.hasHighS())return!1;let{r:j,s:R}=O,_=T(g),M=i.inv(R),Z=i.create(_*M),tt=i.create(j*M),V=t.BASE.multiplyUnsafe(Z).add(I.multiplyUnsafe(tt));return V.is0()?!1:i.create(V.x)===j}catch{return!1}}function x(y,g,v={}){let{prehash:S}=bn(v,p);return g=lt(g,S),B.fromBytes(y,"recovered").recoverPublicKey(g).toBytes()}return Object.freeze({keygen:l,getPublicKey:u,getSharedSecret:h,utils:a,lengths:d,Point:t,sign:Ue,verify:P,recoverPublicKey:x,Signature:B,hash:e})}function So(t){let e={a:t.a,b:t.b,p:t.Fp.ORDER,n:t.n,h:t.h,Gx:t.Gx,Gy:t.Gy},r=t.Fp,n=t.allowedPrivateKeyLengths?Array.from(new Set(t.allowedPrivateKeyLengths.map(i=>Math.ceil(i/2)))):void 0,o=Bt(e.n,{BITS:t.nBitLength,allowedLengths:n,modFromBytes:t.wrapPrivateKey}),s={Fp:r,Fn:o,allowInfinityPoint:t.allowInfinityPoint,endo:t.endo,isTorsionFree:t.isTorsionFree,clearCofactor:t.clearCofactor,fromBytes:t.fromBytes,toBytes:t.toBytes};return{CURVE:e,curveOpts:s}}function Ho(t){let{CURVE:e,curveOpts:r}=So(t),n={hmac:t.hmac,randomBytes:t.randomBytes,lowS:t.lowS,bits2int:t.bits2int,bits2int_modN:t.bits2int_modN};return{CURVE:e,curveOpts:r,hash:t.hash,ecdsaOpts:n}}function Ao(t,e){let r=e.Point;return Object.assign({},e,{ProjectivePoint:r,CURVE:Object.assign({},t,Me(r.Fn.ORDER,r.Fn.BITS))})}function br(t){let{CURVE:e,curveOpts:r,hash:n,ecdsaOpts:o}=Ho(t),s=vo(e,r),i=Bo(s,n,o);return Ao(t,i)}function vr(t){return t instanceof Uint8Array||ArrayBuffer.isView(t)&&t.constructor.name==="Uint8Array"}function me(t,...e){if(!vr(t))throw new Error("Uint8Array expected");if(e.length>0&&!e.includes(t.length))throw new Error("Uint8Array expected of length "+e+", got length="+t.length)}function we(t,e=!0){if(t.destroyed)throw new Error("Hash instance has been destroyed");if(e&&t.finished)throw new Error("Hash#digest() has already been called")}function Bn(t,e){me(t);let r=e.outputLen;if(t.length<r)throw new Error("digestInto() expects output buffer of length at least "+r)}function ne(t){return new Uint32Array(t.buffer,t.byteOffset,Math.floor(t.byteLength/4))}function je(...t){for(let e=0;e<t.length;e++)t[e].fill(0)}function xe(t){return new DataView(t.buffer,t.byteOffset,t.byteLength)}function Uo(t){if(typeof t!="string")throw new Error("string expected");return new Uint8Array(new TextEncoder().encode(t))}function re(t){if(typeof t=="string")t=Uo(t);else if(vr(t))t=Sn(t);else throw new Error("Uint8Array expected, got "+typeof t);return t}function Ze(t,e,r,n){if(typeof t.setBigUint64=="function")return t.setBigUint64(e,r,n);let o=BigInt(32),s=BigInt(4294967295),i=Number(r>>o&s),c=Number(r&s),f=n?4:0,l=n?0:4;t.setUint32(e+f,i,n),t.setUint32(e+l,c,n)}function Sn(t){return Uint8Array.from(t)}var At=16,An=new Uint8Array(16),gt=ne(An),To=225,Oo=(t,e,r,n)=>{let o=n&1;return{s3:r<<31|n>>>1,s2:e<<31|r>>>1,s1:t<<31|e>>>1,s0:t>>>1^To<<24&-(o&1)}},ut=t=>(t>>>0&255)<<24|(t>>>8&255)<<16|(t>>>16&255)<<8|t>>>24&255|0;function Io(t){t.reverse();let e=t[15]&1,r=0;for(let n=0;n<t.length;n++){let o=t[n];t[n]=o>>>1|r,r=(o&1)<<7}return t[0]^=-e&225,t}var Lo=t=>t>64*1024?8:t>1024?4:2,De=class{constructor(e,r){this.blockLen=At,this.outputLen=At,this.s0=0,this.s1=0,this.s2=0,this.s3=0,this.finished=!1,e=re(e),me(e,16);let n=xe(e),o=n.getUint32(0,!1),s=n.getUint32(4,!1),i=n.getUint32(8,!1),c=n.getUint32(12,!1),f=[];for(let p=0;p<128;p++)f.push({s0:ut(o),s1:ut(s),s2:ut(i),s3:ut(c)}),{s0:o,s1:s,s2:i,s3:c}=Oo(o,s,i,c);let l=Lo(r||1024);if(![1,2,4,8].includes(l))throw new Error("ghash: invalid window size, expected 2, 4 or 8");this.W=l;let h=128/l,a=this.windowSize=2**l,d=[];for(let p=0;p<h;p++)for(let m=0;m<a;m++){let b=0,w=0,E=0,B=0;for(let L=0;L<l;L++){if(!(m>>>l-L-1&1))continue;let{s0:G,s1:F,s2:lt,s3:k}=f[l*p+L];b^=G,w^=F,E^=lt,B^=k}d.push({s0:b,s1:w,s2:E,s3:B})}this.t=d}_updateBlock(e,r,n,o){e^=this.s0,r^=this.s1,n^=this.s2,o^=this.s3;let{W:s,t:i,windowSize:c}=this,f=0,l=0,u=0,h=0,a=(1<<s)-1,d=0;for(let p of[e,r,n,o])for(let m=0;m<4;m++){let b=p>>>8*m&255;for(let w=8/s-1;w>=0;w--){let E=b>>>s*w&a,{s0:B,s1:L,s2:T,s3:G}=i[d*c+E];f^=B,l^=L,u^=T,h^=G,d+=1}}this.s0=f,this.s1=l,this.s2=u,this.s3=h}update(e){we(this),e=re(e),me(e);let r=ne(e),n=Math.floor(e.length/At),o=e.length%At;for(let s=0;s<n;s++)this._updateBlock(r[s*4+0],r[s*4+1],r[s*4+2],r[s*4+3]);return o&&(An.set(e.subarray(n*At)),this._updateBlock(gt[0],gt[1],gt[2],gt[3]),je(gt)),this}destroy(){let{t:e}=this;for(let r of e)r.s0=0,r.s1=0,r.s2=0,r.s3=0}digestInto(e){we(this),Bn(e,this),this.finished=!0;let{s0:r,s1:n,s2:o,s3:s}=this,i=ne(e);return i[0]=r,i[1]=n,i[2]=o,i[3]=s,e}digest(){let e=new Uint8Array(At);return this.digestInto(e),this.destroy(),e}},Hn=class extends De{constructor(e,r){e=re(e),me(e);let n=Io(Sn(e));super(n,r),je(n)}update(e){e=re(e),we(this);let r=ne(e),n=e.length%At,o=Math.floor(e.length/At);for(let s=0;s<o;s++)this._updateBlock(ut(r[s*4+3]),ut(r[s*4+2]),ut(r[s*4+1]),ut(r[s*4+0]));return n&&(An.set(e.subarray(o*At)),this._updateBlock(ut(gt[3]),ut(gt[2]),ut(gt[1]),ut(gt[0])),je(gt)),this}digestInto(e){we(this),Bn(e,this),this.finished=!0;let{s0:r,s1:n,s2:o,s3:s}=this,i=ne(e);return i[0]=r,i[1]=n,i[2]=o,i[3]=s,e.reverse()}};function Er(t){let e=(n,o)=>t(o,n.length).update(re(n)).digest(),r=t(new Uint8Array(16),0);return e.outputLen=r.outputLen,e.blockLen=r.blockLen,e.create=(n,o)=>t(n,o),e}var Un=Er((t,e)=>new De(t,e)),Js=Er((t,e)=>new Hn(t,e));var Lr=Object.defineProperty,ko=(t,e,r)=>e in t?Lr(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r,kr=(t,e)=>{for(var r in e)Lr(t,r,{get:e[r],enumerable:!0})},q=(t,e,r)=>(ko(t,typeof e!="symbol"?e+"":e,r),r),mt={};kr(mt,{EmptyArray:()=>Ln,arrayToHex:()=>Fe,arrayToUtf8:()=>Xe,calculateSharedKey:()=>rs,comparePublicKeyHex:()=>ns,compressPublicKeyHex:()=>ts,doDecrypt:()=>is,doEncrypt:()=>ss,doSignature:()=>cs,doVerifySignature:()=>us,ecdh:()=>os,generateKeyPairHex:()=>Rn,getHash:()=>Cn,getPoint:()=>Zr,getPublicKeyFromPrivateKey:()=>jr,getZ:()=>Je,hexToArray:()=>K,initRNGPool:()=>_n,leftPad:()=>D,precomputePublicKey:()=>fs,utf8ToHex:()=>se,verifyPublicKey:()=>es});var $e=BigInt(0),Ee=BigInt(1),_o=BigInt(2),ti=BigInt(3);function Po(t){let e=t.toString(16);if(e[0]!=="-")e.length%2===1?e="0"+e:e.match(/^[0-7]/)||(e="00"+e);else{e=e.substring(1);let r=e.length;r%2===1?r+=1:e.match(/^[0-7]/)||(r+=2);let n="";for(let i=0;i<r;i++)n+="f";e=((C(n)^t)+Ee).toString(16).replace(/^-/,"")}return e}var kn=class{constructor(t=null,e="00",r="00",n=""){this.tlv=t,this.t=e,this.l=r,this.v=n}getEncodedHex(){return this.tlv||(this.v=this.getValue(),this.l=this.getLength(),this.tlv=this.t+this.l+this.v),this.tlv}getLength(){let t=this.v.length/2,e=t.toString(16);return e.length%2===1&&(e="0"+e),t<128?e:(128+e.length/2).toString(16)+e}getValue(){return""}},We=class extends kn{constructor(t){super(),this.t="02",t&&(this.v=Po(t))}getValue(){return this.v}},Br=class extends kn{constructor(t){super(),this.s=t,q(this,"hV",""),this.t="04",t&&(this.v=t.toLowerCase())}getValue(){return this.v}},_r=class extends kn{constructor(t){super(),this.asn1Array=t,q(this,"t","30")}getValue(){return this.v=this.asn1Array.map(t=>t.getEncodedHex()).join(""),this.v}};function Pr(t,e){if(+t[e+2]<8)return 1;let n=t.slice(e+2,e+6).slice(0,2);return 1+(parseInt(n,16)-128)}function In(t,e){let r=Pr(t,e),n=t.substring(e+2,e+2+r*2);return n?+(+n[0]<8?C(n):C(n.substring(2))).toString():-1}function ve(t,e){let r=Pr(t,e);return e+(r+1)*2}function No(t,e){let r=new We(t),n=new We(e);return new _r([r,n]).getEncodedHex()}function Sr(t,e,r,n){let o=new We(t),s=new We(e),i=new Br(r),c=new Br(n);return new _r([o,s,i,c]).getEncodedHex()}function Ro(t){let e=ve(t,0),r=ve(t,e),n=In(t,e),o=t.substring(r,r+n*2),s=r+o.length,i=ve(t,s),c=In(t,s),f=t.substring(i,i+c*2),l=C(o),u=C(f);return{r:l,s:u}}function Co(t){function e(a,d){let p=ve(a,d),m=In(a,d),b=a.substring(p,p+m*2),w=p+b.length;return{value:b,nextStart:w}}let r=ve(t,0),{value:n,nextStart:o}=e(t,r),{value:s,nextStart:i}=e(t,o),{value:c,nextStart:f}=e(t,i),{value:l}=e(t,f),u=C(n),h=C(s);return{x:u,y:h,hash:c,cipher:l}}var Tn=16384,Gt=new Uint8Array(0),oe;async function _n(){if("crypto"in globalThis){oe=globalThis.crypto;return}if(!(Gt.length>Tn/2))if("wx"in globalThis&&"getRandomValues"in globalThis.wx)Gt=await new Promise(t=>{wx.getRandomValues({length:Tn,success(e){t(new Uint8Array(e.randomValues))}})});else try{globalThis.crypto?oe=globalThis.crypto:oe=(await import("crypto")).webcrypto;let t=new Uint8Array(Tn);oe.getRandomValues(t),Gt=t}catch{throw new Error("no available csprng, abort.")}}_n();function Mo(t){if(Gt.length>t){let e=Gt.slice(0,t);return Gt=Gt.slice(t),_n(),e}else throw new Error("random number pool is not ready or insufficient, prevent getting too long random values or too often.")}function Vo(t=0){let e=new Uint8Array(t);return oe?oe.getRandomValues(e):Mo(t)}var Nr=t=>t instanceof Uint8Array,On=t=>new DataView(t.buffer,t.byteOffset,t.byteLength),qo=new Uint8Array(new Uint32Array([287454020]).buffer)[0]===68;if(!qo)throw new Error("Non little-endian hardware is not supported");var Ko=Array.from({length:256},(t,e)=>e.toString(16).padStart(2,"0"));function yt(t){if(!Nr(t))throw new Error("Uint8Array expected");let e="";for(let r=0;r<t.length;r++)e+=Ko[t[r]];return e}var Hr=typeof TextEncoder<"u"&&new TextEncoder,jo=(t,e,r)=>((e==null||e<0)&&(e=0),(r==null||r>t.length)&&(r=t.length),new Uint8Array(t.subarray(e,r)));function Rr(t){if(Hr)return Hr.encode(t);let e=t.length,r=new Uint8Array(t.length+(t.length>>1)),n=0,o=s=>{r[n++]=s};for(let s=0;s<e;++s){if(n+5>r.length){let c=new Uint8Array(n+8+(e-s<<1));c.set(r),r=c}let i=t.charCodeAt(s);i<128?o(i):i<2048?(o(192|i>>6),o(128|i&63)):i>55295&&i<57344?(i=65536+(i&1047552)|t.charCodeAt(++s)&1023,o(240|i>>18),o(128|i>>12&63),o(128|i>>6&63),o(128|i&63)):(o(224|i>>12),o(128|i>>6&63),o(128|i&63))}return jo(r,0,n)}function Pn(t){if(typeof t=="string"&&(t=Rr(t)),!Nr(t))throw new Error(`expected Uint8Array, got ${typeof t}`);return t}var Cr=class{clone(){return this._cloneInto()}};function Zo(t){let e=n=>t().update(Pn(n)).digest(),r=t();return e.outputLen=r.outputLen,e.blockLen=r.blockLen,e.create=()=>t(),e}var Do=(t,e,r)=>t&e|t&r|e&r,Ar=(t,e,r)=>t^e^r,Go=(t,e,r)=>t&e|~t&r;function zo(t,e,r,n){if(typeof t.setBigUint64=="function")return t.setBigUint64(e,r,n);let o=BigInt(32),s=BigInt(4294967295),i=Number(r>>o&s),c=Number(r&s),f=n?4:0,l=n?0:4;t.setUint32(e+f,i,n),t.setUint32(e+l,c,n)}function ft(t,e){let r=e&31;return t<<r|t>>>32-r}function Yo(t){return t^ft(t,9)^ft(t,17)}function $o(t){return t^ft(t,15)^ft(t,23)}var Wo=class extends Cr{constructor(t,e,r,n){super(),this.blockLen=t,this.outputLen=e,this.padOffset=r,this.isLE=n,q(this,"buffer"),q(this,"view"),q(this,"finished",!1),q(this,"length",0),q(this,"pos",0),q(this,"destroyed",!1),this.buffer=new Uint8Array(t),this.view=On(this.buffer)}update(t){let{view:e,buffer:r,blockLen:n}=this;t=Pn(t);let o=t.length;for(let s=0;s<o;){let i=Math.min(n-this.pos,o-s);if(i===n){let c=On(t);for(;n<=o-s;s+=n)this.process(c,s);continue}r.set(t.subarray(s,s+i),this.pos),this.pos+=i,s+=i,this.pos===n&&(this.process(e,0),this.pos=0)}return this.length+=t.length,this.roundClean(),this}digestInto(t){this.finished=!0;let{buffer:e,view:r,blockLen:n,isLE:o}=this,{pos:s}=this;e[s++]=128,this.buffer.subarray(s).fill(0),this.padOffset>n-s&&(this.process(r,0),s=0);for(let u=s;u<n;u++)e[u]=0;zo(r,n-8,BigInt(this.length*8),o),this.process(r,0);let i=On(t),c=this.outputLen;if(c%4)throw new Error("_sha2: outputLen should be aligned to 32bit");let f=c/4,l=this.get();if(f>l.length)throw new Error("_sha2: outputLen bigger than state");for(let u=0;u<f;u++)i.setUint32(4*u,l[u],o)}digest(){let{buffer:t,outputLen:e}=this;this.digestInto(t);let r=t.slice(0,e);return this.destroy(),r}_cloneInto(t){t||(t=new this.constructor),t.set(...this.get());let{blockLen:e,buffer:r,length:n,finished:o,destroyed:s,pos:i}=this;return t.length=n,t.pos=i,t.finished=o,t.destroyed=s,n%e&&t.buffer.set(r),t}},_t=new Uint32Array([1937774191,1226093241,388252375,3666478592,2842636476,372324522,3817729613,2969243214]),ht=new Uint32Array(68),Ur=new Uint32Array(64),Xo=2043430169,Qo=2055708042,Jo=class extends Wo{constructor(){super(64,32,8,!1),q(this,"A",_t[0]|0),q(this,"B",_t[1]|0),q(this,"C",_t[2]|0),q(this,"D",_t[3]|0),q(this,"E",_t[4]|0),q(this,"F",_t[5]|0),q(this,"G",_t[6]|0),q(this,"H",_t[7]|0)}get(){let{A:t,B:e,C:r,D:n,E:o,F:s,G:i,H:c}=this;return[t,e,r,n,o,s,i,c]}set(t,e,r,n,o,s,i,c){this.A=t|0,this.B=e|0,this.C=r|0,this.D=n|0,this.E=o|0,this.F=s|0,this.G=i|0,this.H=c|0}process(t,e){for(let u=0;u<16;u++,e+=4)ht[u]=t.getUint32(e,!1);for(let u=16;u<68;u++)ht[u]=$o(ht[u-16]^ht[u-9]^ft(ht[u-3],15))^ft(ht[u-13],7)^ht[u-6];for(let u=0;u<64;u++)Ur[u]=ht[u]^ht[u+4];let{A:r,B:n,C:o,D:s,E:i,F:c,G:f,H:l}=this;for(let u=0;u<64;u++){let h=u>=0&&u<=15,a=h?Xo:Qo,d=ft(ft(r,12)+i+ft(a,u),7),p=d^ft(r,12),m=(h?Ar(r,n,o):Do(r,n,o))+s+p+Ur[u]|0,b=(h?Ar(i,c,f):Go(i,c,f))+l+d+ht[u]|0;s=o,o=ft(n,9),n=r,r=m,l=f,f=ft(c,19),c=i,i=Yo(b)}r=r^this.A|0,n=n^this.B|0,o=o^this.C|0,s=s^this.D|0,i=i^this.E|0,c=c^this.F|0,f=f^this.G|0,l=l^this.H|0,this.set(r,n,o,s,i,c,f,l)}roundClean(){ht.fill(0)}destroy(){this.set(0,0,0,0,0,0,0,0),this.buffer.fill(0)}},Ut=Zo(()=>new Jo),Mr=class extends Cr{constructor(t,e){super(),q(this,"oHash"),q(this,"iHash"),q(this,"blockLen"),q(this,"outputLen"),q(this,"finished",!1),q(this,"destroyed",!1);let r=Pn(e);if(this.iHash=t.create(),typeof this.iHash.update!="function")throw new Error("Expected instance of class which extends utils.Hash");this.blockLen=this.iHash.blockLen,this.outputLen=this.iHash.outputLen;let n=this.blockLen,o=new Uint8Array(n);o.set(r.length>n?t.create().update(r).digest():r);for(let s=0;s<o.length;s++)o[s]^=54;this.iHash.update(o),this.oHash=t.create();for(let s=0;s<o.length;s++)o[s]^=106;this.oHash.update(o),o.fill(0)}update(t){return this.iHash.update(t),this}digestInto(t){this.finished=!0,this.iHash.digestInto(t),this.oHash.update(t),this.oHash.digestInto(t),this.destroy()}digest(){let t=new Uint8Array(this.oHash.outputLen);return this.digestInto(t),t}_cloneInto(t){t||(t=Object.create(Object.getPrototypeOf(this),{}));let{oHash:e,iHash:r,finished:n,destroyed:o,blockLen:s,outputLen:i}=this;return t=t,t.finished=n,t.destroyed=o,t.blockLen=s,t.outputLen=i,t.oHash=e._cloneInto(t.oHash),t.iHash=r._cloneInto(t.iHash),t}destroy(){this.destroyed=!0,this.oHash.destroy(),this.iHash.destroy()}},Nn=(t,e,r)=>new Mr(t,e).update(r).digest();Nn.create=(t,e)=>new Mr(t,e);var Fo=Bt(BigInt("115792089210356248756420345214020892766250353991924191454421193933289684991999")),N=br({a:BigInt("115792089210356248756420345214020892766250353991924191454421193933289684991996"),b:BigInt("18505919022281880113072981827955639221458448578012075254857346196103069175443"),Fp:Fo,h:Ee,n:BigInt("115792089210356248756420345214020892766061623724957744567843809356293439045923"),Gx:BigInt("22963146547237050559479531362550074578802567295341616970375194840604139615431"),Gy:BigInt("85132369209828568825618990617112496413088388631904505083283536607588877201568"),hash:Ut,hmac:(t,...e)=>Nn(Ut,t,ct(...e)),randomBytes:Vo}),pt=Bt(BigInt(N.CURVE.n));function Rn(t){let e=t?Xn(et(BigInt(t),Ee)+Ee,32):N.utils.randomPrivateKey(),r=N.getPublicKey(e,!1),n=D(Jt(e),64),o=D(Jt(r),64);return{privateKey:n,publicKey:o}}function ts(t){if(t.length!==130)throw new Error("Invalid public key to compress");let e=(t.length-2)/2,r=t.substring(2,2+e),n=C(t.substring(e+2,e+e+2)),o="03";return et(n,_o)===$e&&(o="02"),o+r}function se(t){let e=Rr(t);return Jt(e)}function D(t,e){return t.length>=e?t:new Array(e-t.length+1).join("0")+t}function Fe(t){return t.map(e=>{let r=e.toString(16);return r.length===1?"0"+r:r}).join("")}function Xe(t){let e=[];for(let r=0,n=t.length;r<n;r++)t[r]>=240&&t[r]<=247?(e.push(String.fromCodePoint(((t[r]&7)<<18)+((t[r+1]&63)<<12)+((t[r+2]&63)<<6)+(t[r+3]&63))),r+=3):t[r]>=224&&t[r]<=239?(e.push(String.fromCodePoint(((t[r]&15)<<12)+((t[r+1]&63)<<6)+(t[r+2]&63))),r+=2):t[r]>=192&&t[r]<=223?(e.push(String.fromCodePoint(((t[r]&31)<<6)+(t[r+1]&63))),r++):e.push(String.fromCodePoint(t[r]));return e.join("")}function K(t){let e=t.length;e%2!==0&&(t=D(t,e+1)),e=t.length;let r=e/2,n=new Uint8Array(r);for(let o=0;o<r;o++)n[o]=parseInt(t.substring(o*2,o*2+2),16);return n}function es(t){let e=N.ProjectivePoint.fromHex(t);if(!e)return!1;try{return e.assertValidity(),!0}catch{return!1}}function ns(t,e){let r=N.ProjectivePoint.fromHex(t);if(!r)return!1;let n=N.ProjectivePoint.fromHex(e);return n?r.equals(n):!1}function Be(t){let e=[];for(let r=0,n=t.length;r<n;r++){let o=t.codePointAt(r);if(o<=127)e.push(o);else if(o<=2047)e.push(192|o>>>6),e.push(128|o&63);else if(o<=55295||o>=57344&&o<=65535)e.push(224|o>>>12),e.push(128|o>>>6&63),e.push(128|o&63);else if(o>=65536&&o<=1114111)r++,e.push(240|o>>>18&28),e.push(128|o>>>12&63),e.push(128|o>>>6&63),e.push(128|o&63);else throw e.push(o),new Error("input is not supported")}return new Uint8Array(e)}function Vr(t,e){if(t=typeof t=="string"?Be(t):t,e){if((e.mode||"hmac")!=="hmac")throw new Error("invalid mode");let n=e.key;if(!n)throw new Error("invalid key");return n=typeof n=="string"?K(n):n,yt(Nn(Ut,n,t))}return yt(Ut(t))}function qr(t,e,r){t=typeof t=="string"?Be(t):t;let n=r==null?Ln:typeof r=="string"?Be(r):r,o=new Uint8Array(e),s=1,i=0,c=Ln,f=new Uint8Array(4),l=()=>{f[0]=s>>24&255,f[1]=s>>16&255,f[2]=s>>8&255,f[3]=s&255,c=Ut(ct(t,f,n)),s++,i=0};l();for(let u=0,h=o.length;u<h;u++)i===c.length&&l(),o[u]=c[i++]&255;return o}var Tr=C("80000000000000000000000000000000"),Or=C("7fffffffffffffffffffffffffffffff");function rs(t,e,r,n,o,s=!1,i="1234567812345678",c="1234567812345678"){let f=N.ProjectivePoint.fromHex(e.publicKey),l=N.ProjectivePoint.fromHex(n),u=N.ProjectivePoint.fromHex(r),h=Je(t.publicKey,i),a=Je(r,c);s&&([h,a]=[a,h]);let d=C(e.privateKey),p=C(t.privateKey),m=f.x,b=Tr+(m&Or),w=pt.add(p,pt.mulN(b,d)),E=l.x,B=pt.add(Tr,E&Or),L=l.multiply(B).add(u).multiply(w),T=K(D($(L.x),64)),G=K(D($(L.y),64));return qr(ct(T,G,h,a),o)}var{getSharedSecret:os}=N;function Kr(t,e,r){let n=qr(ct(t,e),r.length);for(let o=0,s=r.length;o<s;o++)r[o]^=n[o]&255}var Qe=0,Ln=new Uint8Array;function ss(t,e,r=1,n){let o=typeof t=="string"?K(se(t)):Uint8Array.from(t),s=typeof e=="string"?N.ProjectivePoint.fromHex(e):e,i=Rn(),c=C(i.privateKey),f=i.publicKey;f.length>128&&(f=f.substring(f.length-128));let l=s.multiply(c),u=K(D($(l.x),64)),h=K(D($(l.y),64)),a=yt(Ut(ct(u,o,h)));Kr(u,h,o);let d=yt(o);if(n?.asn1){let p=N.ProjectivePoint.fromHex(i.publicKey);return r===Qe?Sr(p.x,p.y,d,a):Sr(p.x,p.y,a,d)}return r===Qe?f+d+a:f+a+d}function is(t,e,r=1,n){let{output:o="string",asn1:s=!1}=n||{},i=C(e),c,f,l;if(s){let{x:m,y:b,cipher:w,hash:E}=Co(t);c=N.ProjectivePoint.fromAffine({x:m,y:b}),l=E,f=w,r===Qe&&([f,l]=[l,f])}else c=N.ProjectivePoint.fromHex("04"+t.substring(0,128)),l=t.substring(128,192),f=t.substring(192),r===Qe&&(l=t.substring(t.length-64),f=t.substring(128,t.length-64));let u=K(f),h=c.multiply(i),a=K(D($(h.x),64)),d=K(D($(h.y),64));return Kr(a,d,u),Fe(Array.from(Ut(ct(a,u,d))))===l.toLowerCase()?o==="array"?u:Xe(u):o==="array"?[]:""}function cs(t,e,r={}){let{pointPool:n,der:o,hash:s,publicKey:i,userId:c}=r,f=typeof t=="string"?se(t):Fe(Array.from(t));s&&(i=i||jr(e),f=Cn(f,i,c));let l=C(e),u=C(f),h=null,a=null,d=null;do{do{let p;n&&n.length?p=n.pop():p=Zr(),h=p.k,a=pt.add(u,p.x1)}while(a===$e||a+h===N.CURVE.n);d=pt.mul(pt.inv(pt.addN(l,Ee)),pt.subN(h,pt.mulN(a,l)))}while(d===$e);return o?No(a,d):D($(a),64)+D($(d),64)}function us(t,e,r,n={}){let o,{hash:s,der:i,userId:c}=n,f=typeof r=="string"?r:r.toHex(!1);s?o=Cn(typeof t=="string"?se(t):t,f,c):o=typeof t=="string"?se(t):Fe(Array.from(t));let l,u;if(i){let b=Ro(e);l=b.r,u=b.s}else l=C(e.substring(0,64)),u=C(e.substring(64));let h=typeof r=="string"?N.ProjectivePoint.fromHex(r):r,a=C(o),d=pt.add(l,u);if(d===$e)return!1;let p=N.ProjectivePoint.BASE.multiply(u).add(h.multiply(d)),m=pt.add(a,p.x);return l===m}function Je(t,e="1234567812345678"){e=se(e);let r=D($(N.CURVE.a),64),n=D($(N.CURVE.b),64),o=D($(N.ProjectivePoint.BASE.x),64),s=D($(N.ProjectivePoint.BASE.y),64),i,c;if(t.length===128)i=t.substring(0,64),c=t.substring(64,128);else{let h=N.ProjectivePoint.fromHex(t);i=D($(h.x),64),c=D($(h.y),64)}let f=K(e+r+n+o+s+i+c),l=e.length*4;return Ut(ct(new Uint8Array([l>>8&255,l&255]),f))}function Cn(t,e,r="1234567812345678"){let n=Je(e,r);return yt(Ut(ct(n,typeof t=="string"?K(t):t)))}function fs(t,e){let r=N.ProjectivePoint.fromHex(t);return N.utils.precompute(e,r)}function jr(t){let e=N.getPublicKey(t,!1);return D(Jt(e),64)}function Zr(){let t=Rn(),e=N.ProjectivePoint.fromHex(t.publicKey),r=C(t.privateKey);return{...t,k:r,x1:e.x}}var tn={};kr(tn,{decrypt:()=>ds,encrypt:()=>ls,sm4:()=>Mn});var rt=0,Dr=32,st=16,Ge=Uint8Array.from([214,144,233,254,204,225,61,183,22,182,20,194,40,251,44,5,43,103,154,118,42,190,4,195,170,68,19,38,73,134,6,153,156,66,80,244,145,239,152,122,51,84,11,67,237,207,172,98,228,179,28,169,201,8,232,149,128,223,148,250,117,143,63,166,71,7,167,252,243,115,23,186,131,89,60,25,230,133,79,168,104,107,129,178,113,100,218,139,248,235,15,75,112,86,157,53,30,36,14,94,99,88,209,162,37,34,124,59,1,33,120,135,212,0,70,87,159,211,39,82,76,54,2,231,160,196,200,158,234,191,138,210,64,199,56,181,163,247,242,206,249,97,21,161,224,174,93,164,155,52,26,85,173,147,50,48,245,140,177,227,29,246,226,46,130,102,202,96,192,41,35,171,13,83,78,111,213,219,55,69,222,253,142,47,3,255,106,114,109,108,91,81,141,27,175,146,187,221,188,127,17,217,92,65,31,16,90,216,10,193,49,136,165,205,123,189,45,116,208,18,184,229,180,176,137,105,151,74,12,150,119,126,101,185,241,9,197,110,198,132,24,240,125,236,58,220,77,32,121,238,95,62,215,203,57,72]),ze=new Uint32Array([462357,472066609,943670861,1415275113,1886879365,2358483617,2830087869,3301692121,3773296373,4228057617,404694573,876298825,1347903077,1819507329,2291111581,2762715833,3234320085,3705924337,4177462797,337322537,808926789,1280531041,1752135293,2223739545,2695343797,3166948049,3638552301,4110090761,269950501,741554753,1213159005,1684763257]);function Pt(t){return(Ge[t>>>24&255]&255)<<24|(Ge[t>>>16&255]&255)<<16|(Ge[t>>>8&255]&255)<<8|Ge[t&255]&255}var ci=new Uint32Array(4),ui=new Uint32Array(4);function be(t,e,r){let n=0,o=0,s=0,i=0,c=0,f=0,l=0,u=0;c=t[0]&255,f=t[1]&255,l=t[2]&255,u=t[3]&255,n=c<<24|f<<16|l<<8|u,c=t[4]&255,f=t[5]&255,l=t[6]&255,u=t[7]&255,o=c<<24|f<<16|l<<8|u,c=t[8]&255,f=t[9]&255,l=t[10]&255,u=t[11]&255,s=c<<24|f<<16|l<<8|u,c=t[12]&255,f=t[13]&255,l=t[14]&255,u=t[15]&255,i=c<<24|f<<16|l<<8|u;for(let h=0;h<32;h+=4)c=o^s^i^r[h],c=Pt(c),n^=c^(c<<2|c>>>30)^(c<<10|c>>>22)^(c<<18|c>>>14)^(c<<24|c>>>8),f=s^i^n^r[h+1],f=Pt(f),o^=f^(f<<2|f>>>30)^(f<<10|f>>>22)^(f<<18|f>>>14)^(f<<24|f>>>8),l=i^n^o^r[h+2],l=Pt(l),s^=l^(l<<2|l>>>30)^(l<<10|l>>>22)^(l<<18|l>>>14)^(l<<24|l>>>8),u=n^o^s^r[h+3],u=Pt(u),i^=u^(u<<2|u>>>30)^(u<<10|u>>>22)^(u<<18|u>>>14)^(u<<24|u>>>8);e[0]=i>>>24&255,e[1]=i>>>16&255,e[2]=i>>>8&255,e[3]=i&255,e[4]=s>>>24&255,e[5]=s>>>16&255,e[6]=s>>>8&255,e[7]=s&255,e[8]=o>>>24&255,e[9]=o>>>16&255,e[10]=o>>>8&255,e[11]=o&255,e[12]=n>>>24&255,e[13]=n>>>16&255,e[14]=n>>>8&255,e[15]=n&255}function Gr(t,e,r){let n=0,o=0,s=0,i=0,c=0;n=(t[0]&255)<<24|(t[1]&255)<<16|(t[2]&255)<<8|t[3]&255,o=(t[4]&255)<<24|(t[5]&255)<<16|(t[6]&255)<<8|t[7]&255,s=(t[8]&255)<<24|(t[9]&255)<<16|(t[10]&255)<<8|t[11]&255,i=(t[12]&255)<<24|(t[13]&255)<<16|(t[14]&255)<<8|t[15]&255,n^=2746333894,o^=1453994832,s^=1736282519,i^=2993693404;for(let f=0;f<32;f+=4)c=o^s^i^ze[f+0],c=Pt(c),n^=c^(c<<13|c>>>19)^(c<<23|c>>>9),e[f+0]=n,c=s^i^n^ze[f+1],c=Pt(c),o^=c^(c<<13|c>>>19)^(c<<23|c>>>9),e[f+1]=o,c=i^n^o^ze[f+2],c=Pt(c),s^=c^(c<<13|c>>>19)^(c<<23|c>>>9),e[f+2]=s,c=n^o^s^ze[f+3],c=Pt(c),i^=c^(c<<13|c>>>19)^(c<<23|c>>>9),e[f+3]=i;if(r===rt)for(let f=0;f<16;f++)[e[f],e[31-f]]=[e[31-f],e[f]]}function Ir(t){for(let e=t.length-1;e>=0&&(t[e]++,t[e]===0);e--);}function as(t,e,r,n,o,s){function c(){let w=new Uint32Array(Dr);Gr(e,w,1);let E=new Uint8Array(16).fill(0),B=new Uint8Array(16);be(E,B,w);let L;if(r.length===12)L=new Uint8Array(16),L.set(r,0),L[15]=1;else{let F=Un.create(B);F.update(r);let lt=new Uint8Array(16),k=xe(lt);Ze(k,8,BigInt(r.length*8),!1),F.update(lt),L=F.digest()}let T=new Uint8Array(L);Ir(T);let G=new Uint8Array(16);return be(L,G,w),{roundKey:w,h:B,j0:L,counter:T,tagMask:G}}function f(w,E){let B=n.length,L=E.length,T=Un.create(w);B>0&&T.update(n),T.update(E);let G=new Uint8Array(16),F=xe(G);return Ze(F,0,BigInt(B*8),!1),Ze(F,8,BigInt(L*8),!1),T.update(G),T.digest()}let{roundKey:l,h:u,j0:h,counter:a,tagMask:d}=c();if(o===rt&&s){let w=f(u,t);for(let B=0;B<16;B++)w[B]^=d[B];let E=0;for(let B=0;B<16;B++)E|=w[B]^s[B];if(E!==0)throw new Error("authentication tag mismatch")}let p=new Uint8Array(t.length),m=0,b=t.length;for(;b>=st;){let w=new Uint8Array(st);be(a,w,l);for(let E=0;E<st&&E<b;E++)p[m+E]=t[m+E]^w[E];Ir(a),m+=st,b-=st}if(b>0){let w=new Uint8Array(st);be(a,w,l);for(let E=0;E<b;E++)p[m+E]=t[m+E]^w[E]}if(o!==rt){let w=f(u,p);for(let E=0;E<16;E++)w[E]^=d[E];return{output:p,tag:w}}return{output:p}}var Ye=new Uint8Array(16);function Mn(t,e,r,n={}){let{padding:o="pkcs#7",mode:s,iv:i=new Uint8Array(16),output:c,associatedData:f,outputTag:l,tag:u}=n;if(s==="gcm"){let b=typeof e=="string"?K(e):Uint8Array.from(e),w=typeof i=="string"?K(i):Uint8Array.from(i),E=f?typeof f=="string"?K(f):Uint8Array.from(f):new Uint8Array(0),B;typeof t=="string"?r!==rt?B=Be(t):B=K(t):B=Uint8Array.from(t);let L=u?typeof u=="string"?K(u):Uint8Array.from(u):void 0,T=as(B,b,w,E,r,L);return c==="array"?l&&r!==rt?T:T.output:l&&r!==rt?{output:yt(T.output),tag:T.tag?yt(T.tag):void 0}:r!==rt?{output:yt(T.output),tag:T.tag?yt(T.tag):void 0}:Xe(T.output)}if(s==="cbc"&&(typeof i=="string"&&(i=K(i)),i.length!==128/8))throw new Error("iv is invalid");if(typeof e=="string"&&(e=K(e)),e.length!==128/8)throw new Error("key is invalid");if(typeof t=="string"?r!==rt?t=Be(t):t=K(t):t=Uint8Array.from(t),(o==="pkcs#5"||o==="pkcs#7")&&r!==rt){let b=st-t.length%st,w=new Uint8Array(t.length+b);w.set(t,0);for(let E=0;E<b;E++)w[t.length+E]=b;t=w}let h=new Uint32Array(Dr);Gr(e,h,r);let a=new Uint8Array(t.length),d=i,p=t.length,m=0;for(;p>=st;){let b=t.subarray(m,m+16);if(s==="cbc")for(let w=0;w<st;w++)r!==rt&&(b[w]^=d[w]);be(b,Ye,h);for(let w=0;w<st;w++)s==="cbc"&&r===rt&&(Ye[w]^=d[w]),a[m+w]=Ye[w];s==="cbc"&&(r!==rt?d=Ye:d=b),p-=st,m+=st}if((o==="pkcs#5"||o==="pkcs#7")&&r===rt){let b=a.length,w=a[b-1];for(let E=1;E<=w;E++)if(a[b-E]!==w)throw new Error("padding is invalid");a=a.slice(0,b-w)}return c!=="array"?r!==rt?yt(a):Xe(a):a}function ls(t,e,r={}){return Mn(t,e,1,r)}function ds(t,e,r={}){return Mn(t,e,0,r)}var fe="1234567812345678",$t="SM4-GCM",ce="sm3",hs=/^SM4-GCM\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{16}$/,ae={message:"WOP \u8DE8\u8BED\u8A00\u6D4B\u8BD5\u5411\u91CF 2026-08-28 \u2014 The quick brown fox jumps over the lazy dog.",sm2UserId:fe,appKey:"1234567812345678",pubB64:"BKYcUacrp3w6tPeXpkEb2yktpbGgfCOsob/F5yo9wq9+LvzIx2Isu+CGnf6Z89tTJpZxm5GX7VUDr8KdsxHzYKg=",privB64:"RyJ/wB0tfgGGSgug0lKZoOwJlj2001kD5wbYmnmPFr0=",sigB64u:"Si7Uw5eZm0Kii3BuIRLXwMGGOxkwFria8ypcVYXnReV376EVgV0TOkQfm21NUnJZNGM-fV0d0fMF23B0Bm3TFw",sm3Hex:"23592263765cf506d07cc8614c09067e6de38e64c53e5b672c022532d01737cf",sm4KeyHex:"202122232425262728292a2b2c2d2e2f",sm4IvHex:"303132333435363738393a3b",sm4CtTagB64u:"wMoKc3V_CJQRGlUASCV4mBki5qb7OVExH7Bgu_j1E43I-Z_SWAKRTPq3q9yDna8wNeI3pPBn4Jt4vMVEuPyWfJBP-qsYObQw1LcbbQYggRXRvCN5vFdoY-NK3j8bF9MkO72Z4eo",sm2EncB64u:"BHg6d-mtZjmeNpGrClMQUsW5CH_89nI-czPleXZbKuDxEbEauHrr7V8Xy4gvzfU7I48lYrL25lHyne9JrkMW5t4FrhxANJVd2vf9vp2nqTSnzUXqLf2Bz6dVfX3rtkOeLBubmIcoIsiwo3Fn7rrtSbWuN86uwvgCbn6Zm2647KdeZd2arZaClU6IURtm97hp",sm2EncNegB64u:"BHg6d-mtZjmeNpGrClMQUsW5CH_89nI-czPleXZbKuDxEbEauHrr7V8Xy4gvzfU7I48lYrL25lHyne9JrkMW5t4bm5iHKCLIsKNxZ-667Um1rjfOrsL4Am5-mZtuuOynXmXdmq2WgpVOiFEbZve4aQWuHEA0lV3a9_2-naepNKfNReot_YHPp1V9feu2Q54s",dekPlaintext:"SM4-GCM$ICEiIyQlJicoKSorLC0uLw$MDEyMzQ1Njc4OTo7"};ae.pubHex=it(Wt(ae.pubB64));ae.privHex=it(Wt(ae.privB64));function X(t){return new TextEncoder().encode(String(t))}function rn(t){return new TextDecoder("utf-8",{fatal:!0}).decode(t)}function He(t){return typeof t=="string"&&t.length>0&&/^[A-Za-z0-9_-]+$/.test(t)}function zr(t){return typeof t=="string"&&t.length>0&&t.length%2===0&&/^[0-9a-fA-F]+$/.test(t)}function Wt(t){let e=t.length%4===0?t:t+"=".repeat(4-t.length%4),r=atob(e),n=new Uint8Array(r.length);for(let o=0;o<r.length;o++)n[o]=r.charCodeAt(o);return n}function wt(t){if(!He(t))throw new Error("\u975E\u6CD5 base64url \u8F93\u5165");return Wt(t.replace(/-/g,"+").replace(/_/g,"/"))}function Ae(t){let e="";for(let r=0;r<t.length;r+=32768)e+=String.fromCharCode.apply(null,t.subarray(r,r+32768));return btoa(e)}function Q(t){return Ae(t).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function J(t){if(!zr(t))throw new Error("\u975E\u6CD5 hex \u8F93\u5165");let e=new Uint8Array(t.length/2);for(let r=0;r<e.length;r++)e[r]=parseInt(t.substr(r*2,2),16);return e}function it(t){let e="";for(let r=0;r<t.length;r++)e+=(t[r]<16?"0":"")+t[r].toString(16);return e}function xt(t,e){if(typeof t!="string"||!/^[0-9a-fA-F]+$/.test(t)||t.length!==e)throw new Error("hex \u957F\u5EA6\u6216\u5B57\u7B26\u975E\u6CD5\uFF08\u671F\u671B "+e+" \u4F4D\uFF09");return t.toLowerCase()}function ue(t,e,r){if(!(t instanceof Uint8Array)||t.length!==e)throw new Error(r+" \u957F\u5EA6\u5FC5\u987B\u4E3A "+e+" \u5B57\u8282")}function ps(t){return t<128?[t]:t<256?[129,t]:[130,t>>8&255,t&255]}function at(t,e){return[t].concat(ps(e.length),e)}var qn=[42,129,28,207,85,1,130,45],gs=[42,134,72,206,61,2,1];function Rt(){let t=mt.generateKeyPairHex();return{privateHex:t.privateKey.toLowerCase(),publicHex:t.publicKey.toLowerCase()}}function ys(t){return mt.getPublicKeyFromPrivateKey(xt(t,64)).toLowerCase()}function Yr(t){return Ae(J(xt(t,130)))}function $r(t){return Ae(J(xt(t,64)))}function Wr(t,e){let r=J(xt(t,64)),n=[at(2,[1]),at(4,Array.prototype.slice.call(r)),at(160,at(6,qn))];if(e!=null&&e!==""){let l=J(xt(e,130));n.push(at(161,[0].concat(Array.prototype.slice.call(l))))}let o=at(48,n.reduce((l,u)=>l.concat(u),[])),s=at(48,at(6,gs).concat(at(6,qn))),i=at(48,at(2,[0]).concat(s,at(4,o)));return`-----BEGIN PRIVATE KEY-----
`+(Ae(new Uint8Array(i)).match(/.{1,64}/g)||[]).join(`
`)+`
-----END PRIVATE KEY-----
`}function Tt(t,e,r){let n=r||fe,o=mt.doSignature(t,xt(e,64),{hash:!0,userId:n}),s=Q(J(o));if(s.length!==86)throw new Error("\u7B7E\u540D\u8F93\u51FA\u957F\u5EA6\u5F02\u5E38");return s}function Ct(t,e,r,n){try{if(!He(e))return!1;let o=wt(e);return o.length!==64?!1:mt.doVerifySignature(t,it(o),xt(r,130),{hash:!0,userId:n||fe})===!0}catch{return!1}}function nn(t,e){let r=mt.doEncrypt(String(t),xt(e,130),1);return Q(J("04"+r))}function ie(t,e){let r=wt(t);if(r.length<98)throw new Error("SM2 \u5BC6\u6587\u7ED3\u6784\u975E\u6CD5");if(r[0]!==4)throw new Error("C1 \u975E\u672A\u538B\u7F29\u70B9");let n=it(r).slice(2),o=mt.doDecrypt(n,xt(e,64),1);if(!hs.test(o))throw new Error("DEK \u8F7D\u8377\u683C\u5F0F\u975E\u6CD5");return o}function Mt(t){return Vr(t)}function Se(t,e,r){ue(e,16,"SM4 key"),ue(r,12,"SM4 iv");let n=rn(t),o=tn.encrypt(n,it(e),{mode:"gcm",iv:it(r),output:"string"}),s=J(o.output),i=J(o.tag);ue(i,16,"GCM tag");let c=new Uint8Array(s.length+i.length);return c.set(s,0),c.set(i,s.length),Q(c)}function Yt(t,e,r){ue(e,16,"SM4 key"),ue(r,12,"SM4 iv");let n=wt(t);if(n.length<17)throw new Error("\u5BC6\u6587\u957F\u5EA6\u975E\u6CD5");let o=it(n.subarray(0,n.length-16)),s=it(n.subarray(n.length-16));return tn.decrypt(o,it(e),{mode:"gcm",iv:it(r),tag:s,output:"array"})}function Kn(){let t=new Uint8Array(16),e=new Uint8Array(12);return crypto.getRandomValues(t),crypto.getRandomValues(e),{key16:t,iv12:e}}function jn(t,e,r){if(t!==$t)throw new Error("SM \u65CF DEK alg \u5FC5\u987B\u4E3A "+$t);if(!He(e)||!He(r))throw new Error("DEK \u6BB5\u975E\u6CD5 base64url");return $t+"$"+e+"$"+r}function Vn(t,e){if(!t||typeof t!="object")return"";let r=e.toLowerCase(),n=Object.keys(t);for(let o=0;o<n.length;o++)if(n[o].toLowerCase()===r)return String(t[n[o]]).trim();return""}function zt(t){let e=t==null?"":String(t);return e?ce+" "+Mt(X(e)):""}function en(t,e){let r=t==null?"":String(t);if(!r)throw new Error("L2 \u4FE1\u5C01\u9700\u8981\u975E\u7A7A\u62A5\u6587");if(!e)throw new Error("L2 \u4FE1\u5C01\u9700\u8981\u5E73\u53F0\u516C\u94A5");let n=Kn(),o=jn($t,Q(n.key16),Q(n.iv12)),s='{"encrypted":"'+Se(X(r),n.key16,n.iv12)+'"}';return{encryptedBody:s,encryptHeader:"L2;dek="+nn(o,e),digest:ce+" "+Mt(X(s)),key16:n.key16,iv12:n.iv12,dekPayload:o}}function Ot(t,e,r){let n=r||{},o=e==null?"":String(e),s=Vn(t,"x-wop-sign"),i=Vn(t,"x-wop-content-digest"),c=Vn(t,"x-wop-encrypt"),f=[],l=function(B,L,T,G){f.push({key:B,name:L,ok:!!T,reason:T?"":G})},u=s?/^WOP-SM2-SM3 (\S+)\/([^/]+)\/([A-Za-z0-9_-]{86})$/.exec(String(s).trim()):null,h=u?u[3]:"",a=h&&n.canonical&&n.merchantPubHex?Ct(X(n.canonical),h,n.merchantPubHex,n.userId):!1;l("verify","SM2 \u9A8C\u7B7E",a,"\u9A8C\u7B7E\u5931\u8D25");let d=i?/^([a-z0-9-]+) ([0-9a-f]{64})$/.exec(i):null,p;o?(p=!!d&&i===ce+" "+Mt(X(o)),l("digest","SM3 \u6458\u8981\u590D\u6838",p,"\u6458\u8981\u4E0D\u4E00\u81F4")):(p=!i,l("digest","SM3 \u6458\u8981\u590D\u6838",p,"\u7A7A\u62A5\u6587\u4E0D\u5E94\u643A\u5E26\u6458\u8981"));let m=null;if(!c)l("dek","DEK \u89E3\u5305",!0,"");else{let B=/^L2;dek=([A-Za-z0-9_-]+)$/.exec(c);if(!B)l("dek","DEK \u89E3\u5305",!1,"DEK \u89E3\u5305\u5931\u8D25");else try{let T=ie(B[1],n.platformPrivHex||"").split("$");m={alg:T[0],keyB64u:T[1],ivB64u:T[2]},l("dek","DEK \u89E3\u5305",!0,"")}catch{l("dek","DEK \u89E3\u5305",!1,"DEK \u89E3\u5305\u5931\u8D25")}}let b=d?d[1]:"",w=m?m.alg===$t&&b===ce:!b||b===ce;l("family","\u5957\u4EF6\u65CF\u6BD4\u5BF9",w,"\u5957\u4EF6\u4E0D\u7B26");let E="";if(!m)l("decrypt","\u62A5\u6587\u89E3\u5BC6",!0,"");else{let B=/^\{"encrypted":"([A-Za-z0-9_-]+)"\}$/.exec(o.trim());if(!B)l("decrypt","\u62A5\u6587\u89E3\u5BC6",!1,"\u89E3\u5BC6\u5931\u8D25");else try{let L=Yt(B[1],wt(m.keyB64u),wt(m.ivB64u));E=rn(L),l("decrypt","\u62A5\u6587\u89E3\u5BC6",!0,"")}catch{l("decrypt","\u62A5\u6587\u89E3\u5BC6",!1,"\u89E3\u5BC6\u5931\u8D25")}}return{steps:f,allOk:f.every(function(B){return B.ok}),decryptedBody:E}}function Nt(t){try{return t(),!1}catch{return!0}}function ms(t){let e=wt(t);return e[e.length-1]^=1,Q(e)}function ws(t){let e=wt(t);return e[0]^=1,Q(e)}function xs(){let t=ae,e=X(t.message),r=it(Wt(t.pubB64)),n=it(Wt(t.privB64)),o=J(t.sm4KeyHex),s=J(t.sm4IvHex),i=[],c=function(u,h,a){try{let d=a();i.push({name:u+" "+h,pass:d===!0,detail:d===!0?"":String(d)})}catch(d){i.push({name:u+" "+h,pass:!1,detail:"\u5F02\u5E38: "+d.message})}};function f(u,h){return"WOP-SM2-SM3 v1/1800/"+u+"/"+h}function l(u,h){return Tt(X(u),h)}return c("GM-01","SM3 \u9EC4\u91D1\u6458\u8981",function(){return Mt(e)===t.sm3Hex||"got "+Mt(e)}),c("GM-02","SM4-GCM \u9EC4\u91D1\u89E3\u5BC6",function(){return rn(Yt(t.sm4CtTagB64u,o,s))===t.message||"\u660E\u6587\u4E0D\u4E00\u81F4"}),c("GM-03","SM4-GCM \u786E\u5B9A\u6027\u52A0\u5BC6",function(){return Se(e,o,s)===t.sm4CtTagB64u||"\u5BC6\u6587\u4E0D\u4E00\u81F4"}),c("GM-04","\u7BE1\u6539 tag \u88AB\u62D2",function(){return Nt(function(){Yt(ms(t.sm4CtTagB64u),o,s)})||"\u672A\u629B\u9519"}),c("GM-05","\u7BE1\u6539\u5BC6\u6587\u88AB\u62D2",function(){let u=wt(t.sm4CtTagB64u);return u[0]^=1,Nt(function(){Yt(Q(u),o,s)})||"\u672A\u629B\u9519"}),c("GM-06","SM2 \u9EC4\u91D1\u9A8C\u7B7E",function(){return Ct(e,t.sigB64u,r)===!0||"verify=false"}),c("GM-07","DER \u7B7E\u540D\u88AB\u62D2",function(){let u=mt.doSignature(e,n,{hash:!0,userId:t.sm2UserId,der:!0}),h=Q(J(u));return Ct(e,h,r)===!1||"\u771F\u5B9E DER \u672A\u88AB\u62D2"}),c("GM-07b","0x30 \u5934\u88F8\u7B7E\u540D\u88AB\u63A5\u53D7",function(){for(let u=0;u<4096;u++){let h=Tt(e,n);if(wt(h)[0]===48)return Ct(e,h,r)===!0||"0x30 \u5934\u5408\u6CD5\u7B7E\u540D\u88AB\u8BEF\u62D2"}return"4096 \u6B21\u672A\u547D\u4E2D 0x30 \u5934\uFF081/256 \u6982\u7387\uFF0C\u5F02\u5E38\uFF09"}),c("GM-08","\u81EA\u7B7E\u540D\u88F8 r\u2016s \u81EA\u9A8C",function(){let u=mt.doSignature(e,n,{hash:!0,userId:t.sm2UserId});if(u.length!==128)return"hex \u957F\u5EA6 "+u.length;let h=Q(J(u));return h.length!==86?"b64u \u957F\u5EA6 "+h.length:Ct(e,h,r)===!0||"\u81EA\u9A8C\u5931\u8D25"}),c("GM-09","SM2 \u9EC4\u91D1\u52A0\u5BC6\u89E3\u5BC6",function(){return ie(t.sm2EncB64u,n)===t.dekPlaintext||"\u8F7D\u8377\u4E0D\u4E00\u81F4"}),c("GM-10","C1C2C3 \u8D1F\u5411\u91CF\u88AB\u62D2",function(){return Nt(function(){ie(t.sm2EncNegB64u,n)})||"\u672A\u88AB\u62D2\u7EDD"}),c("GM-11","\u5BC6\u94A5\u5BF9\u751F\u6210\u4E0E\u5F80\u8FD4",function(){let u=Rt();if(u.privateHex.length!==64||!/^[0-9a-f]+$/.test(u.privateHex))return"\u79C1\u94A5\u683C\u5F0F";if(u.publicHex.length!==130||!u.publicHex.startsWith("04"))return"\u516C\u94A5\u683C\u5F0F";let h=Tt(e,u.privateHex);if(Ct(e,h,u.publicHex)!==!0)return"\u7B7E\u9A8C\u5F80\u8FD4";let a=Kn(),d=jn($t,Q(a.key16),Q(a.iv12)),p=nn(d,u.publicHex);return ie(p,u.privateHex)===d||"\u52A0\u89E3\u5F80\u8FD4"}),c("GM-12","\u5BC6\u94A5 Base64 \u5206\u53D1\u683C\u5F0F",function(){return Yr(r)!==t.pubB64?"\u516C\u94A5 b64 \u4E0D\u4E00\u81F4":$r(n)===t.privB64||"\u79C1\u94A5 b64 \u4E0D\u4E00\u81F4"}),c("GM-13","PKCS#8 PEM \u6784\u9020",function(){let u=Wr(n,r);if(!/^-----BEGIN PRIVATE KEY-----\n/.test(u)||!/\n-----END PRIVATE KEY-----\n$/.test(u))return"PEM \u6807\u8BB0";let h=Wt(u.split(`
`).slice(1,-2).join("")),a=Array.prototype.slice.call(h),d=function(p){return a.some(function(m,b){return p.every(function(w,E){return a[b+E]===w})})};return d(qn)?d([4,32].concat(Array.prototype.slice.call(J(n))))?d([0].concat(Array.prototype.slice.call(J(r))))?!0:"\u7F3A [1] \u516C\u94A5\u70B9":"\u7F3A d 32B":"\u7F3A SM2 \u66F2\u7EBF OID"}),c("GM-14","digest \u6807\u7B7E\u65CF\u9694\u79BB",function(){let u=Rt(),h='{"ok":true}',a=zt(h);if(a.indexOf("sm3 ")!==0)return"SM \u65CF digest \u524D\u7F00: "+a.slice(0,8);if(zt("")!=="")return"\u7A7A body \u5E94\u65E0 digest";let d=`POST
/gm

x-wop-content-digest: `+a+`
`+h,p={"x-wop-sign":f("x-wop-content-digest",Tt(X(d),u.privateHex)),"x-wop-content-digest":"sha-256 "+"0".repeat(64)},b=Ot(p,h,{canonical:d,merchantPubHex:u.publicHex}).steps.filter(function(w){return w.key==="family"})[0];return b&&b.ok===!1||"sha-256 \u6807\u7B7E\u672A\u88AB\u65CF\u6BD4\u5BF9\u62D2\u7EDD"}),c("GM-15","DEK alg \u65CF\u9694\u79BB",function(){let u=en('{"ok":true}',r);if(u.dekPayload.indexOf("SM4-GCM$")!==0)return"dek alg \u975E\u6CD5: "+u.dekPayload.slice(0,8);let h="AES-GCM$"+Q(new Uint8Array(32))+"$"+Q(new Uint8Array(12)),a='{"encrypted":"'+t.sm4CtTagB64u+'"}',d=`POST
/gm

x-wop-content-digest: `+zt(a)+`
`+a,p={"x-wop-sign":f("x-wop-content-digest;x-wop-encrypt",Tt(X(d),n)),"x-wop-content-digest":zt(a),"x-wop-encrypt":"L2;dek="+nn(h,r)},m=Ot(p,a,{canonical:d,merchantPubHex:r,platformPrivHex:n});if(m.allOk)return"\u8DE8\u65CF\u8F7D\u8377\u672A\u88AB\u62D2\u7EDD";let b=m.steps.filter(function(E){return E.key==="dek"})[0],w=m.steps.filter(function(E){return E.key==="family"})[0];return b&&b.ok===!1||w&&w.ok===!1||"\u672A\u88AB DEK/\u65CF\u6BD4\u5BF9\u62D2\u7EDD"}),c("GM-16","base64url \u65E0\u586B\u5145",function(){let u=en(t.message,r),h=`POST
/gm

x-wop-content-digest: `+u.digest+`
x-wop-encrypt: `+u.encryptHeader+`
`+u.encryptedBody;return[Tt(X(h),n),u.encryptHeader.slice(7),u.encryptedBody.slice(14,-2)].every(function(p){return p.indexOf("=")===-1&&/^[A-Za-z0-9_-]+$/.test(p)})||"\u5B58\u5728\u586B\u5145\u6216\u975E\u6CD5\u5B57\u7B26"}),c("GM-17","key/iv \u957F\u5EA6\u8FB9\u754C\u62D2\u7EDD",function(){return Nt(function(){Se(e,new Uint8Array(15),s)})?Nt(function(){Se(e,o,new Uint8Array(11))})?Nt(function(){Yt(t.sm4CtTagB64u,new Uint8Array(17),s)})?Nt(function(){Yt(t.sm4CtTagB64u,o,new Uint8Array(13))})?!0:"\u89E3\u5BC6 iv13 \u672A\u62D2":"\u89E3\u5BC6 key17 \u672A\u62D2":"iv11 \u672A\u62D2":"key15 \u672A\u62D2"}),c("GM-18","userId \u663E\u5F0F\u5E38\u91CF",function(){return fe!=="1234567812345678"?"\u5E38\u91CF\u6F02\u79FB: "+fe:Ct(e,t.sigB64u,r,"1234567812345679")===!1||"\u9519\u8BEF userId \u672A\u5931\u6548"}),c("GM-19","L2 \u4FE1\u5C01\u5168\u94FE\u8DEF\u5F80\u8FD4",function(){let u=Rt(),h='{"biz":"\u56FD\u5BC6\u5168\u94FE\u8DEF","n":1}',a=en(h,u.publicHex),d=`POST
/echo

x-wop-content-digest: `+a.digest+`
x-wop-encrypt: `+a.encryptHeader+`
`+a.encryptedBody,p={"x-wop-sign":f("x-wop-content-digest;x-wop-encrypt",l(d,u.privateHex)),"x-wop-content-digest":a.digest,"x-wop-encrypt":a.encryptHeader},m=Ot(p,a.encryptedBody,{canonical:d,merchantPubHex:u.publicHex,platformPrivHex:u.privateHex});return m.allOk?m.decryptedBody===h||"\u89E3\u5BC6\u62A5\u6587\u4E0D\u4E00\u81F4":"\u6B65\u9AA4\u5931\u8D25: "+m.steps.filter(function(b){return!b.ok}).map(function(b){return b.key}).join(",")}),c("GM-20","\u7BE1\u6539\u62A5\u6587 digest \u5931\u914D",function(){let u=Rt(),h='{"a":1}',a=zt(h),d=`POST
/echo

x-wop-content-digest: `+a+`
`+h,p={"x-wop-sign":f("x-wop-content-digest",Tt(X(d),u.privateHex)),"x-wop-content-digest":a},b=Ot(p,'{"a":2}',{canonical:d,merchantPubHex:u.publicHex}).steps.filter(function(w){return w.key==="digest"})[0];return b&&b.ok===!1||"\u7BE1\u6539\u672A\u88AB\u53D1\u73B0"}),c("GM-21","\u9A8C\u7B7E\u5931\u8D25 reason \u6A21\u7CCA",function(){let u=Rt(),h='{"a":1}',a=`POST
/echo

x-wop-content-digest: sm3 `+Mt(X(h))+`
`+h,d=Tt(X(a),u.privateHex),p={"x-wop-sign":f("x-wop-content-digest",d),"x-wop-content-digest":"sm3 "+Mt(X(h))},m=Rt(),w=Ot(p,h,{canonical:a,merchantPubHex:m.publicHex}).steps.filter(function(E){return E.key==="verify"})[0];return!w||w.ok!==!1?"\u9A8C\u7B7E\u672A\u5931\u8D25":w.reason==="\u9A8C\u7B7E\u5931\u8D25"||"reason \u4E0D\u6A21\u7CCA: "+w.reason}),c("GM-22","DEK C1 \u7BE1\u6539\u88AB\u62D2",function(){let u=ws(t.sm2EncB64u);return Nt(function(){ie(u,n)})||"\u672A\u88AB\u62D2\u7EDD"}),c("GM-23","\u7B7E\u540D\u5934\u56DB\u6BB5\u683C\u5F0F",function(){let u=Rt(),h='{"k":"v23"}',a=zt(h),d=`v1/1800
POST
/echo

x-wop-content-digest: `+a,p=l(d,u.privateHex),m={"x-wop-sign":"WOP-SM2-SM3 v1/1800/x-wop-content-digest;x-wop-timestamp/"+p,"x-wop-content-digest":a,"x-wop-timestamp":"1756600000000"},b=Ot(m,h,{canonical:d,merchantPubHex:u.publicHex});if(!b.allOk)return"\u56DB\u6BB5\u5B8C\u6574\u5934\u672A\u901A\u8FC7: "+b.steps.filter(function(T){return!T.ok}).map(function(T){return T.key}).join(",");let E=Ot({"x-wop-sign":p,"x-wop-content-digest":a},h,{canonical:d,merchantPubHex:u.publicHex}).steps.filter(function(T){return T.key==="verify"})[0];if(!E||E.ok!==!1)return"\u88F8 sig \u65E7\u683C\u5F0F\u672A\u88AB\u62D2";let L=Ot({"x-wop-sign":"WOP-RSA3072-SHA256 v1/1800/x/"+p,"x-wop-content-digest":a},h,{canonical:d,merchantPubHex:u.publicHex}).steps.filter(function(T){return T.key==="verify"})[0];return!L||L.ok!==!1?"\u5F02\u5957\u4EF6\u5934\u672A\u88AB\u62D2":!0}),i}return oo(bs);})();
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
