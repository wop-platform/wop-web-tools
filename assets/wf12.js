/* ===== wf12/wf12.js ===== */
/* ============================================================
 * WF12 — 数字信封 L0/L2 流程图解（教学交互）
 * 只读依赖（WF_CONTRACT 共享全局，均存在于 index.html）：
 *   WOP_VECTORS / b64urlFromBytes / bytesFromB64url / sha256Hex /
 *   buildCanonical / canonicalHeaders / parseDigestHeader / strictB64urlOk
 * 依据：wop-specs crypto-strategy-spec v0.3-reviewed
 *   3.3 算法参数 / 6.1 DEK 载荷 / 6.2 alg 族比对时序（D8）
 *   10.1 不变式 I1（digest 入签）I2（先验签后解密）I3（族比对先于解密）
 *        I4（IV 永不复用）I7（对外模糊化）；10.2 错误分类
 * 密钥角色（TEST-ONLY，来源 WOP_VECTORS 黄金向量）：
 *   商户密钥对 = rsa4096（SHA256withRSA 签名，512B/683 字符恒长）
 *   平台密钥对 = rsa3072（RSA-OAEP 双SHA-256 包装/解包 DEK）
 * 注：演示为确定性教学夹具——固定 DEK/IV 仅用于与黄金向量字节级对拍；
 *     生产环境每次出站必须 CSPRNG 新 DEK/IV（I4），界面已标注。
 * ============================================================ */
(function () {
  'use strict';

  var HAS_GLOBALS = typeof WOP_VECTORS !== 'undefined' && typeof b64urlFromBytes === 'function'
    && typeof bytesFromB64url === 'function' && typeof sha256Hex === 'function';

  // i18n：动态文案统一走 WF14.t（未加载回退中文）
  function T(key, fb) {
    try { return (typeof window !== 'undefined' && window.WF14 && typeof window.WF14.t === 'function') ? window.WF14.t(key, fb) : fb; }
    catch (e) { return fb; }
  }

  var MERCHANT = 'rsa4096';   // 商户签名密钥（套件 WOP-RSA4096-SHA256）
  var PLATFORM = 'rsa3072';   // 平台 DEK 包装/解包密钥

  // 固定演示参数 → canonical 确定 → PKCS#1 v1.5 签名确定（教学可复现）
  var DEMO = {
    appKey: 'demo_app_key',
    path: '/gateway/order/create',
    nonce: '1a2b3c4d5e6f7890',
    ts: '1756600000000',
    expired: '1800',
    suite: 'WOP-RSA4096-SHA256'
  };

  var STAGES = {
    verify:      { key: 'wf12.stage.verify',  fb: '① 验签（商户公钥 · SHA256withRSA · I2 先验签后解密）' },
    digest:      { key: 'wf12.stage.digest',  fb: '② 摘要复核（sha-256(密文) 对 x-wop-content-digest · I1 入签）' },
    'dek-unwrap':{ key: 'wf12.stage.dek',     fb: '③ DEK 解包（平台私钥 · RSA-OAEP 双SHA-256/空label）' },
    'alg-check': { key: 'wf12.stage.alg',     fb: '④ alg 族比对（期望 AES-256-GCM · I3 bulk 解密前）' },
    decrypt:     { key: 'wf12.stage.decrypt', fb: '⑤ bulk 解密（AES-256-GCM · tag 128bit 校验）' }
  };

  function te(s) { return new TextEncoder().encode(s); }
  function td(b) { return new TextDecoder().decode(b); }

  // —— 本地密钥导入（参数与 index.html importPub/importPriv 同语义；
  //    不直接调用后者：其未列入 WF_CONTRACT 共享全局清单）——
  function impPubVerify(der) {
    return crypto.subtle.importKey('spki', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  }
  function impPubEncrypt(der) {
    return crypto.subtle.importKey('spki', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  }
  function impPrivDecrypt(der) {
    return crypto.subtle.importKey('pkcs8', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
  }
  function impPrivSign(der) {
    return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  }

  /* ============ 纯函数：DEK 载荷（spec 6.1 alg$key$iv 三段式） ============ */

  function buildDekPayload(alg, keyBytes, ivBytes) {
    return alg + '$' + b64urlFromBytes(keyBytes) + '$' + b64urlFromBytes(ivBytes);
  }

  // 解析并校验 DEK 载荷；非法即抛错（负路径明确）
  function parseDekPayload(payload) {
    if (typeof payload !== 'string' || !payload) throw new Error('DEK 载荷为空或非字符串');
    var parts = payload.split('$');
    if (parts.length !== 3) throw new Error('DEK 载荷应为 alg$key$iv 三段式（6.1），实际 ' + parts.length + ' 段');
    if (!parts[0]) throw new Error('DEK 载荷 alg 段为空');
    if (!strictB64urlOk(parts[1])) throw new Error('DEK 载荷 key 段须为无填充 base64url（F6）');
    if (!strictB64urlOk(parts[2])) throw new Error('DEK 载荷 iv 段须为无填充 base64url（F6）');
    return { alg: parts[0], key: bytesFromB64url(parts[1]), iv: bytesFromB64url(parts[2]) };
  }

  /* ============ 纯函数：L2 信封构造（镜像 buildRequest 出站路径） ============ */

  // fixed=true → 使用黄金向量 DEK/IV（字节级可对拍）；false → CSPRNG 新 DEK/IV（I4 生产语义）
  async function buildEnvelope(plaintext, opt) {
    opt = opt || {};
    if (typeof plaintext !== 'string' || !plaintext.length) throw new Error('明文不能为空');
    var fixed = opt.fixed !== false;
    var dek = fixed ? bytesFromB64url(WOP_VECTORS.aesgcm.keyB64u) : crypto.getRandomValues(new Uint8Array(32));
    var iv = fixed ? bytesFromB64url(WOP_VECTORS.aesgcm.ivB64u) : crypto.getRandomValues(new Uint8Array(12));
    var aes = await crypto.subtle.importKey('raw', dek, 'AES-GCM', false, ['encrypt']);
    var ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv, tagLength: 128 }, aes, te(plaintext)));
    var payload = buildDekPayload('AES-256-GCM', dek, iv);
    var wrapKey = await impPubEncrypt(bytesFromB64url(WOP_VECTORS.keys[PLATFORM].pub));
    var wrapped = new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, wrapKey, te(payload)));
    return {
      fixed: fixed,
      plaintext: plaintext,
      dek: dek, iv: iv,
      ciphertext: ct,
      ctB64u: b64urlFromBytes(ct),
      wireBody: '{"encrypted":"' + b64urlFromBytes(ct) + '"}',
      payload: payload,
      wrapped: b64urlFromBytes(wrapped),
      encryptHeader: 'L2;dek=' + b64urlFromBytes(wrapped)
    };
  }

  // 以商户私钥按给定 headers 重算 canonical 并签名（构造与「构造侧缺陷」重签共用）
  async function signMessage(env, headers) {
    var auth = 'v1/' + DEMO.expired;
    env.canonical = buildCanonical(auth, 'POST', DEMO.path, '', canonicalHeaders(headers));
    var signKey = await impPrivSign(bytesFromB64url(WOP_VECTORS.keys[MERCHANT].priv));
    env.sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', signKey, te(env.canonical)));
    env.sigB64u = b64urlFromBytes(env.sig);
    var names = Object.keys(headers).sort().join(';');
    env.signHeader = DEMO.suite + ' ' + auth + '/' + names + '/' + env.sigB64u;
    env.headers = headers;
    env.signedNames = names;
    return env;
  }

  // 完整出站报文：信封 → 密文摘要 → canonical → 签名（与 buildRequest 同构，数据驱动不触 DOM）
  async function buildDemoMessage(plaintext, opt) {
    var env = await buildEnvelope(plaintext, opt);
    env.wireDigest = await sha256Hex(env.wireBody);     // L2 入签摘要（对象是密文）
    env.plainDigest = await sha256Hex(plaintext);        // L0 语义摘要（教学对照）
    var headers = {
      'x-wop-appkey': DEMO.appKey,
      'x-wop-content-digest': 'sha-256 ' + env.wireDigest,
      'x-wop-encrypt': env.encryptHeader,
      'x-wop-nonce': DEMO.nonce,
      'x-wop-timestamp': DEMO.ts
    };
    return signMessage(env, headers);
  }

  /* ============ 纯函数：网关校验管线（F6 时序 / I2 / I3 / I7） ============ */
  // 输入 buildDemoMessage 产物（或其篡改变体），返回五步结果；不因中途失败中断（教学展示纵深防御）
  async function verifyPipeline(msg) {
    var steps = [];
    var push = function (stage, ok, text) { steps.push({ stage: stage, ok: ok, text: text }); };

    // ① 验签（I2：先验签后解密）：网关按收到的头重算 canonical 再验——任何入签头被改动即破签（I1）
    var verKey = await impPubVerify(bytesFromB64url(WOP_VECTORS.keys[MERCHANT].pub));
    var wireCanonical = buildCanonical('v1/' + DEMO.expired, 'POST', DEMO.path, '', canonicalHeaders(msg.headers));
    var sigOk = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', verKey, msg.sig, te(wireCanonical));
    push('verify', sigOk, sigOk
      ? T('wf12.p.verify.ok', '商户公钥验签通过（canonical 五段式一致）')
      : T('wf12.p.verify.bad', '验签失败：按收到的头重算 canonical 与签名不匹配——任何入签头被改动即破签（I1）'));

    // ② 摘要复核（L2 对象为密文 wireBody）
    var computed = await sha256Hex(msg.wireBody);
    var dh = parseDigestHeader(msg.headers['x-wop-content-digest']);
    var digestOk = dh.ok && dh.alg === 'sha-256' && dh.hex === computed;
    push('digest', digestOk, digestOk
      ? T('wf12.p.digest.ok', 'sha-256(密文) 与 x-wop-content-digest 一致')
      : T('wf12.p.digest.bad', '摘要复核失败：header 与实际 sha-256(密文) 不一致（body 可能被篡改）'));

    // ③ DEK 解包（平台私钥）
    var payloadPlain = null;
    try {
      var header = String(msg.headers['x-wop-encrypt'] || '');
      var dekVal = header.slice(header.indexOf('dek=') + 4).trim();
      var decKey = await impPrivDecrypt(bytesFromB64url(WOP_VECTORS.keys[PLATFORM].priv));
      payloadPlain = td(await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, decKey, bytesFromB64url(dekVal)));
      push('dek-unwrap', true, T('wf12.p.dek.ok', '平台私钥解包 DEK 成功（RSA-OAEP 双SHA-256）'));
    } catch (e) {
      push('dek-unwrap', false, T('wf12.p.dek.bad', 'DEK 解包失败（对外语义模糊为「解密失败」· I7）'));
      return steps; // 解不出 DEK，后续两步无从执行
    }

    // ④ alg 族比对（I3：bulk 解密前；D8 时序）
    var dekInfo = null;
    try {
      var parsed = parseDekPayload(payloadPlain);
      var algOk = parsed.alg === 'AES-256-GCM';
      push('alg-check', algOk, algOk
        ? T('wf12.p.alg.ok', 'alg=AES-256-GCM 与 RSA 套件族一致')
        : T('wf12.p.alg.bad', 'alg=' + parsed.alg + ' 与 RSA 套件族不符，拒绝（I5 跨族互斥）'));
      if (algOk) dekInfo = parsed;
    } catch (e) {
      push('alg-check', false, T('wf12.p.alg.parse', 'DEK 载荷解析失败：') + e.message);
    }
    if (!dekInfo) return steps;

    // ⑤ bulk 解密（GCM tag 128bit）
    try {
      var aes = await crypto.subtle.importKey('raw', dekInfo.key, 'AES-GCM', false, ['decrypt']);
      var wire = JSON.parse(msg.wireBody);
      var plain = td(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: dekInfo.iv, tagLength: 128 }, aes, bytesFromB64url(wire.encrypted)));
      msg.decrypted = plain;
      var match = plain === msg.plaintext;
      push('decrypt', match, match
        ? T('wf12.p.dec.ok', 'AES-256-GCM 解密成功，明文与输入一致（tag 校验通过）')
        : T('wf12.p.dec.diff', '解密成功但明文与输入不一致'));
    } catch (e) {
      push('decrypt', false, T('wf12.p.dec.bad', 'GCM 解密失败：tag 校验不过（对外语义模糊为「解密失败」· I7）'));
    }
    return steps;
  }

  function firstFailStage(steps) {
    for (var i = 0; i < steps.length; i++) if (steps[i].ok === false) return steps[i].stage;
    return null;
  }
  function stageLabel(stage) {
    var s = STAGES[stage];
    return s ? T(s.key, s.fb) : String(stage);
  }

  /* ============ 纯函数：单字节篡改构造器（错误路径演示） ============ */

  function flipB64uByte(b64u, idx) {
    var bytes = bytesFromB64url(b64u);
    var i = (idx == null ? bytes.length - 1 : idx);
    if (!(i >= 0 && i < bytes.length)) throw new Error('篡改位置越界');
    bytes[i] ^= 0x80; // 翻转最高位，长度不变
    return b64urlFromBytes(bytes);
  }
  function flipHexChar(hex) {
    var c = parseInt(hex.charAt(0), 16) ^ 1;
    return c.toString(16) + hex.slice(1); // 仍为合法 64 位小写 hex（格式不动，值变）
  }

  // sign/digest/body：MITM 传输篡改——任何入签头被改动都会先破签（I1）；
  // dek：构造侧缺陷模型——损坏 DEK 后以商户私钥重签，签名/摘要均有效，才落到 ③（I7）
  async function tamperVariant(msg, kind) {
    var m = {
      fixed: msg.fixed, plaintext: msg.plaintext,
      wireBody: msg.wireBody, canonical: msg.canonical,
      sig: msg.sig, sigB64u: msg.sigB64u, signHeader: msg.signHeader,
      signedNames: msg.signedNames,
      headers: {}
    };
    var k;
    for (k in msg.headers) m.headers[k] = msg.headers[k];
    if (kind === 'sign') {
      m.sigB64u = flipB64uByte(msg.sigB64u);
      m.sig = bytesFromB64url(m.sigB64u);
      m.signHeader = msg.signHeader.slice(0, msg.signHeader.lastIndexOf('/') + 1) + m.sigB64u;
    } else if (kind === 'digest') {
      var d = msg.headers['x-wop-content-digest'];
      m.headers['x-wop-content-digest'] = d.slice(0, 8) + flipHexChar(d.slice(8)); // sha-256 前缀保留
    } else if (kind === 'body') {
      var wire = JSON.parse(msg.wireBody);
      m.wireBody = '{"encrypted":"' + flipB64uByte(wire.encrypted, 0) + '"}';
    } else if (kind === 'dek') {
      var h = msg.headers['x-wop-encrypt'];
      m.headers['x-wop-encrypt'] = h.slice(0, h.indexOf('dek=') + 4) + flipB64uByte(h.slice(h.indexOf('dek=') + 4));
      await signMessage(m, m.headers); // 重签：构造一条携带坏 DEK 但签名合法的报文
    } else {
      throw new Error('未知篡改类型: ' + kind);
    }
    return m;
  }

  // —— 密封/解封 DEK 载荷（平台密钥；供演示与 selftest 复用）——
  async function wrapPayload(payloadStr) {
    var k = await impPubEncrypt(bytesFromB64url(WOP_VECTORS.keys[PLATFORM].pub));
    return b64urlFromBytes(new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, k, te(payloadStr))));
  }
  async function unwrapPayload(cipherB64u) {
    var k = await impPrivDecrypt(bytesFromB64url(WOP_VECTORS.keys[PLATFORM].priv));
    return td(await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, k, bytesFromB64url(cipherB64u)));
  }

  /* ============ DOM 演示引擎（init 后可用；不自行绑定加载事件） ============ */

  var inited = false;
  var lastMsg = null;

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function trunc(s, head, tail) {
    s = String(s);
    return s.length <= head + tail + 1 ? s : s.slice(0, head) + '…' + s.slice(s.length - tail);
  }
  function kv(k, v) {
    return '<div class="wf12-kv"><span class="wf12-k">' + esc(k) + '</span><span class="wf12-v">' + esc(v) + '</span></div>';
  }
  function badge(cls, text) { return '<span class="wf12-badge ' + cls + '">' + esc(text) + '</span>'; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function resetCards() {
    for (var i = 1; i <= 4; i++) {
      var c = el('wf12-step-' + i);
      c.className = 'wf12-step pending';
      var b = el('wf12-s' + i + '-body'); b.innerHTML = '';
      var g = el('wf12-s' + i + '-badge'); g.innerHTML = ''; g.hidden = true;
    }
    el('wf12-err-out').innerHTML = '';
    el('wf12-err-stage').hidden = true;
  }

  function reveal(i, fill) {
    return new Promise(function (resolve) {
      fill();
      var c = el('wf12-step-' + i);
      void c.offsetWidth; // 强制重排，保证 transition 触发
      c.className = 'wf12-step active';
      resolve();
    });
  }

  function fillDigest(env) {
    var body = el('wf12-s1-body');
    var html = kv('sha-256（明文）', env.plainDigest)
      + kv('x-wop-content-digest（L0 语义）', 'sha-256 ' + env.plainDigest)
      + '<div class="wf12-note">' + esc(T('wf12.demo.s1.note', 'L0 明文模式下入签即此值；L2 模式下入签摘要对象是密文 wireBody（见步骤 ③）——spec 3.3④：L2 下 digest 为纵深防御，用于锁定密文载体')) + '</div>';
    body.innerHTML = html;
    var g = el('wf12-s1-badge');
    if (env.plaintext === WOP_VECTORS.message && env.plainDigest === WOP_VECTORS.digest.expectedHex) {
      g.innerHTML = badge('ok', T('wf12.demo.golden', '与黄金向量一致（字节级）'));
      g.hidden = false;
    }
  }

  function fillSign(env) {
    el('wf12-s2-body').innerHTML =
      kv('签名头（前缀）', trunc(env.signHeader.slice(0, env.signHeader.lastIndexOf('/')), 72, 12))
      + kv('签名值（尾 16 字符）', '…' + env.sigB64u.slice(-16))
      + kv('签名长度', env.sig.length + ' 字节 / base64url ' + env.sigB64u.length + ' 字符（恒长）')
      + kv('算法', 'SHA256withRSA（PKCS#1 v1.5）· 商户 RSA-4096 私钥（TEST-ONLY 向量）')
      + kv('签名对象', 'canonicalRequest 五段式（authString / METHOD / path / queryString / canonicalHeaders）')
      + '<div class="wf12-note">' + esc(T('wf12.demo.s2.note', '签名覆盖全部参与签名的头（含 digest 与 encrypt，I1）；PKCS#1 v1.5 签名确定性——同一 canonical 必得同一签名值')) + '</div>';
  }

  function fillEnvelope(env) {
    el('wf12-s3-body').innerHTML =
      kv('DEK（32 字节）', b64urlFromBytes(env.dek))
      + kv('IV（12 字节）', b64urlFromBytes(env.iv))
      + kv('DEK 载荷（三段式）', trunc(env.payload, 48, 16))
      + kv('DEK 包装', 'RSA-OAEP（SHA-256/MGF1-SHA-256/空 label · D10）· 平台公钥 RSA-3072')
      + kv('x-wop-encrypt', trunc(env.encryptHeader, 30, 12))
      + kv('wireBody（密文）', trunc(env.wireBody, 44, 12))
      + kv('入签摘要 sha-256(密文)', env.wireDigest)
      + (env.fixed ? '' : '<div class="wf12-note">' + esc(T('wf12.demo.s3.rnd', '随机模式：本次 DEK/IV 由 CSPRNG 新生成（I4 生产语义），每次点击输出不同')) + '</div>');
    var g = el('wf12-s3-badge');
    if (env.fixed && env.plaintext === WOP_VECTORS.message && env.ctB64u === WOP_VECTORS.aesgcm.cipherTagB64u) {
      g.innerHTML = badge('ok', T('wf12.demo.golden', '与黄金向量一致（字节级）'));
      g.hidden = false;
    } else if (env.fixed) {
      g.innerHTML = badge('warn', T('wf12.demo.s3.iv', '固定向量 DEK/IV 仅用于教学对拍；生产必须每次 CSPRNG 新 DEK/IV（I4）'));
      g.hidden = false;
    }
  }

  function fillReceive(env, steps) {
    var html = '';
    for (var i = 0; i < steps.length; i++) {
      var s = steps[i];
      html += '<div class="wf12-stage ' + (s.ok ? 'ok' : 'bad') + '"><span class="wf12-mark">' + (s.ok ? '✓' : '✗') + '</span>'
        + '<span class="wf12-stage-name">' + esc(stageLabel(s.stage)) + '</span>'
        + '<span class="wf12-stage-text">' + esc(s.text) + '</span></div>';
    }
    var allOk = firstFailStage(steps) === null;
    if (allOk && env.decrypted != null) {
      html += '<div class="wf12-plain-out">' + esc(T('wf12.demo.s4.plain', '解密回明文：')) + esc(trunc(env.decrypted, 120, 0)) + badge('ok', T('wf12.demo.match', '与输入明文一致')) + '</div>';
    }
    el('wf12-s4-body').innerHTML = html;
  }

  async function runDemo() {
    var btn = el('wf12-run');
    var plain = el('wf12-plain').value;
    var mode = el('wf12-mode').value;
    var inputErr = el('wf12-input-err');
    inputErr.hidden = true;
    resetCards();
    // 否定路径：空明文 / 纯空白明文被拒（不触发任何密码学调用）
    if (!plain || !plain.trim()) {
      inputErr.textContent = T('wf12.demo.empty', '明文为空：信封构造拒绝空明文（负路径）');
      inputErr.hidden = false;
      return;
    }
    btn.disabled = true;
    try {
      var env = await buildDemoMessage(plain, { fixed: mode !== 'random' });
      lastMsg = env;
      await reveal(1, function () { fillDigest(env); }); await sleep(430);
      await reveal(2, function () { fillSign(env); }); await sleep(430);
      await reveal(3, function () { fillEnvelope(env); }); await sleep(430);
      var steps = await verifyPipeline(env);
      await reveal(4, function () { fillReceive(env, steps); });
    } catch (e) {
      el('wf12-s4-body').innerHTML = '<div class="wf12-note bad">' + esc(T('wf12.demo.fail', '演示失败：') + (e && e.message ? e.message : e)) + '</div>';
      el('wf12-step-4').className = 'wf12-step active';
    } finally {
      btn.disabled = false;
    }
  }

  var TAMPER_NOTE = {
    sign:   { key: 'wf12.err.note.sign',   fb: '篡改签名 1 字节 → 落在 ① 验签（I2 第一道防线）' },
    digest: { key: 'wf12.err.note.digest', fb: '篡改 digest 头 1 字符 → 头在签名覆盖内（I1 digest 入签），落在 ① 验签而非 ② 复核——改头必破签' },
    body:   { key: 'wf12.err.note.body',   fb: '篡改密文 body 1 字节 → 头未动，验签通过；sha-256(密文) 复核先拒（②）；纵深末端 GCM tag 亦会拒（⑤）' },
    dek:    { key: 'wf12.err.note.dek',    fb: 'DEK 密文在构造侧即损坏，以商户私钥重签使签名/摘要均有效 → 落在 ③ DEK 解包；对外语义模糊为「解密失败」（I7，防 padding-oracle）' }
  };

  async function runTamper(kind) {
    var out = el('wf12-err-out');
    var stageBox = el('wf12-err-stage');
    out.innerHTML = ''; stageBox.hidden = true;
    try {
      if (!lastMsg) lastMsg = await buildDemoMessage(el('wf12-plain').value || WOP_VECTORS.message, { fixed: true });
      var variant = await tamperVariant(lastMsg, kind);
      var steps = await verifyPipeline(variant);
      var failStage = firstFailStage(steps);
      var html = '';
      for (var i = 0; i < steps.length; i++) {
        var s = steps[i];
        html += '<div class="wf12-stage ' + (s.ok ? 'ok' : 'bad') + (s.stage === failStage ? ' hit' : '') + '"><span class="wf12-mark">' + (s.ok ? '✓' : '✗') + '</span>'
          + '<span class="wf12-stage-name">' + esc(stageLabel(s.stage)) + '</span>'
          + '<span class="wf12-stage-text">' + esc(s.text) + '</span></div>';
      }
      out.innerHTML = html;
      if (failStage) {
        stageBox.innerHTML = esc(T('wf12.errors.stage', '拦截阶段：')) + '<b>' + esc(stageLabel(failStage)) + '</b> —— ' + esc(T(TAMPER_NOTE[kind].key, TAMPER_NOTE[kind].fb));
      } else {
        stageBox.innerHTML = esc(T('wf12.err.none', '无拦截（全部通过）——异常，请上报'));
      }
      stageBox.hidden = false;
    } catch (e) {
      out.innerHTML = '<div class="wf12-note bad">' + esc(T('wf12.demo.fail', '演示失败：') + (e && e.message ? e.message : e)) + '</div>';
    }
  }

  function init() {
    if (inited) return;
    var root = el('wf12-root');
    if (!root) return;
    inited = true;
    if (!HAS_GLOBALS) {
      root.insertAdjacentHTML('afterbegin', '<div class="wf12-note bad">' + esc(T('wf12.noglobals', '缺少共享全局（WOP_VECTORS 等）——请确认本切片已并入 index.html 之后加载')) + '</div>');
      return;
    }
    el('wf12-run').addEventListener('click', runDemo);
    var kinds = ['sign', 'digest', 'body', 'dek'];
    for (var i = 0; i < kinds.length; i++) {
      (function (k) { el('wf12-tamper-' + k).addEventListener('click', function () { runTamper(k); }); })(kinds[i]);
    }
  }

  /* ============ 注册（WF_CONTRACT 协议） ============ */
  var REG = {
    id: 'wf12',
    title: '数字信封图解（L0/L2）',
    css: '',   // CSS 文本见 wf12.css（文件为真源，集成者内联）
    html: '',  // UI 片段见 wf12.html（文件为真源，集成者内联；锚点建议见该文件顶部注释）
    init: init,
    selftest: function () {
      if (typeof WF12 === 'undefined' || typeof WF12.runAssertions !== 'function') {
        return Promise.resolve([{ name: 'WF12 断言加载', pass: false, detail: 'wf12.selftest.js 未加载' }]);
      }
      return WF12.runAssertions();
    }
  };
  if (typeof window !== 'undefined') {
    window.WF_REGISTRY = window.WF_REGISTRY || {};
    window.WF_REGISTRY['wf12'] = REG;
  }

  /* ============ 命名空间导出（供 selftest / 集成者调试） ============ */
  var WF12 = {
    DEMO: DEMO, MERCHANT: MERCHANT, PLATFORM: PLATFORM, STAGES: STAGES,
    buildDekPayload: buildDekPayload, parseDekPayload: parseDekPayload,
    buildEnvelope: buildEnvelope, buildDemoMessage: buildDemoMessage, signMessage: signMessage,
    verifyPipeline: verifyPipeline, firstFailStage: firstFailStage, stageLabel: stageLabel,
    tamperVariant: tamperVariant, flipB64uByte: flipB64uByte, flipHexChar: flipHexChar,
    wrapPayload: wrapPayload, unwrapPayload: unwrapPayload,
    t: T
  };
  if (typeof window !== 'undefined') window.WF12 = WF12;
  else if (typeof globalThis !== 'undefined') globalThis.WF12 = WF12;
})();

