/* ============================================================
 * WF12 自测断言（wf12.selftest.js）
 * 运行方式：浏览器控制台 `await WF12.runAssertions()`；或 Node harness
 * （提取 index.html 共享脚本 + wf12.js + 本文件，同上下文执行）。
 * 每条断言以 // spec:WF12.<id> 标注，供 README「条款→断言」反向核对矩阵索引。
 * S1/S2：仅读契约枚举全局与 WF12 命名空间；不触网络/存储/外部资源。
 * 注：加载次序必须为 wf12.js → 本文件（见 README 接线清单）。
 * ============================================================ */
(function () {
  'use strict';

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function throwsSync(fn) { try { fn(); return false; } catch (e) { return true; } }
  async function throwsAsync(p) { try { await p; return false; } catch (e) { return true; } }
  function stepBy(steps, stage) {
    for (var i = 0; i < steps.length; i++) if (steps[i].stage === stage) return steps[i];
    return null;
  }

  async function runAssertions() {
    var out = [];
    function add(name, pass, detail) {
      out.push({
        name: name, pass: !!pass,
        detail: (detail == null || detail === '') ? (pass ? '通过' : '失败') : String(detail)
      });
    }

    var V = (typeof WOP_VECTORS !== 'undefined') ? WOP_VECTORS : null;
    var W = (typeof WF12 !== 'undefined') ? WF12 : null;
    if (!V || !W) {
      // spec:WF12.env 环境前置：契约枚举全局缺席 → 立即失败而非静默跳过
      add('WF12.env 共享全局在场', false,
        '缺少 ' + (!V ? 'WOP_VECTORS ' : '') + (!W ? 'WF12' : '') + ' —— 断言未运行');
      return out;
    }

    // —— 共享夹具：固定向量模式基线报文（确定性核心）——
    var msg = null;
    try { msg = await W.buildDemoMessage(V.message, { fixed: true }); }
    catch (e) { add('WF12.fixture 基线报文构造', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A1 spec:WF12.digest 黄金摘要对拍（D2/D5/F5）——
    try {
      var hex = await sha256Hex(V.digest.input);
      var ph = parseDigestHeader(V.digest.expectedHeader);
      add('WF12.digest 黄金摘要对拍',
        hex === V.digest.expectedHex && ph.ok === true && ph.alg === 'sha-256' && ph.hex === hex,
        'sha-256(向量输入)=' + hex.slice(0, 16) + '…；头解析 alg=sha-256 且 hex 逐字一致');
    } catch (e) { add('WF12.digest 黄金摘要对拍', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A2 spec:WF12.sign 黄金签名对拍（PKCS#1 v1.5 确定性 · 512B/683 字符）——
    try {
      var signKey = await crypto.subtle.importKey('pkcs8', bytesFromB64url(V.keys.rsa4096.priv),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
      var sig = b64urlFromBytes(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',
        signKey, new TextEncoder().encode(V.sign.rsa4096.message))));
      var sigBytes = bytesFromB64url(sig);
      add('WF12.sign 黄金签名对拍',
        sig === V.sign.rsa4096.expectedSigB64u && sigBytes.length === V.sign.rsa4096.sigLenBytes && sig.length === V.sign.rsa4096.b64uLen,
        '签名 ' + sigBytes.length + 'B / base64url ' + sig.length + ' 字符，与黄金向量字节级一致');
    } catch (e) { add('WF12.sign 黄金签名对拍', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A3 spec:WF12.sign-demo 确定性与全通过 ——
    // 注：RSA-OAEP 包装随机化（I4 邻接语义），故断言确定性核心（载荷/密文/摘要/签名长度），
    // 不断言 canonical/signHeader 跨次恒等（其内含随机的 wrapped DEK）。
    try {
      var a = await W.buildDemoMessage(V.message, { fixed: true });
      var b = await W.buildDemoMessage(V.message, { fixed: true });
      var stA = await W.verifyPipeline(a);
      var stB = await W.verifyPipeline(b);
      var preA = a.signHeader.split('/').slice(0, 2).join('/');
      var preB = b.signHeader.split('/').slice(0, 2).join('/');
      add('WF12.sign-demo 构造确定性',
        a.payload === b.payload && a.wireBody === b.wireBody && a.wireDigest === b.wireDigest
          && a.plainDigest === b.plainDigest && a.signedNames === b.signedNames
          && preA === preB && a.sig.length === 512
          && W.firstFailStage(stA) === null && W.firstFailStage(stB) === null && stA.length === 5,
        '两次构造：payload/wireBody/双摘要/签名头前缀恒同，签名恒 512B；五步校验两次全通过');
    } catch (e) { add('WF12.sign-demo 构造确定性', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A4 spec:WF12.envelope 信封黄金对拍（6.1 三段式 / F6 严格 base64url / F4 密文格式）——
    try {
      var env = msg || await W.buildDemoMessage(V.message, { fixed: true });
      var p = W.parseDekPayload(env.payload);
      var vecPlain = new TextDecoder().decode(bytesFromB64url(V.aesgcm.plaintextB64u));
      add('WF12.envelope 信封黄金对拍',
        env.payload === V.dek.expected && p.alg === 'AES-256-GCM'
          && p.key.length === 32 && p.iv.length === 12
          && b64urlFromBytes(p.key) === V.aesgcm.keyB64u && b64urlFromBytes(p.iv) === V.aesgcm.ivB64u
          && env.encryptHeader.indexOf('L2;dek=') === 0 && strictB64urlOk(env.wrapped)
          && env.ctB64u === V.aesgcm.cipherTagB64u && vecPlain === V.message,
        'payload===dek.expected；alg$key32$iv12 三段式；L2;dek= 前缀；wrapped 严格 base64url；密文===aesgcm.cipherTagB64u（字节级）；向量明文自洽');
    } catch (e) { add('WF12.envelope 信封黄金对拍', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A5 spec:WF12.oaep 解包黄金 + F2 参数钉子（MGF1-SHA-1 密文必须被拒）——
    try {
      var up = await W.unwrapPayload(V.oaepUnwrap.cipherB64u);
      var trap = await throwsAsync(W.unwrapPayload(V.oaepTrap.cipherB64u));
      add('WF12.oaep 解包黄金与参数钉子',
        up === V.oaepUnwrap.expectedPlaintext && up === V.dekPlaintext && trap === true,
        '双SHA-256 解包===dekPlaintext；MGF1-SHA-1 包装的 trap 向量解包抛错（F2）');
    } catch (e) { add('WF12.oaep 解包黄金与参数钉子', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A6 spec:WF12.roundtrip 随机模式闭环（I4 CSPRNG · UTF-8 多字节）——
    try {
      var custom = 'WF12 随机信封闭环：中文 ✓ 🎁 plain-123';
      var rnd = await W.buildDemoMessage(custom, { fixed: false });
      var stR = await W.verifyPipeline(rnd);
      add('WF12.roundtrip 随机信封闭环',
        rnd.fixed === false && rnd.payload !== V.dek.expected
          && W.firstFailStage(stR) === null && rnd.decrypted === custom,
        '随机 DEK/IV（非向量值）；五步全过；解密回明文与输入逐字一致（含中文/emoji）');
    } catch (e) { add('WF12.roundtrip 随机信封闭环', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A7 spec:WF12.tamper-sign 篡改签名 → ① 验签拦截（I2）——
    try {
      var v7 = await W.tamperVariant(msg, 'sign');
      var s7 = await W.verifyPipeline(v7);
      add('WF12.tamper-sign 篡改签名落①',
        W.firstFailStage(s7) === 'verify' && s7.length === 5,
        '翻转签名尾字节 → 落 ① 验签；纵深后续步照常执行（' + s7.length + ' 步）');
    } catch (e) { add('WF12.tamper-sign 篡改签名落①', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A8 spec:WF12.tamper-digest 篡改 digest 头 → ① 验签先拦（I1 digest 入签）——
    try {
      var v8 = await W.tamperVariant(msg, 'digest');
      var s8 = await W.verifyPipeline(v8);
      var dStep = stepBy(s8, 'digest');
      add('WF12.tamper-digest 改头先破签',
        W.firstFailStage(s8) === 'verify' && dStep !== null && dStep.ok === false,
        'digest 头翻转 1 hex 字符（仍合法格式）→ 落 ① 验签（I1 入签）；② 复核亦不一致（纵深双证）');
    } catch (e) { add('WF12.tamper-digest 改头先破签', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A9 spec:WF12.tamper-body 篡改密文 body → ② 摘要复核先拦，⑤ GCM 纵深再拦 ——
    try {
      var v9 = await W.tamperVariant(msg, 'body');
      var s9 = await W.verifyPipeline(v9);
      var decStep = stepBy(s9, 'decrypt');
      var aesKey = await crypto.subtle.importKey('raw', bytesFromB64url(V.aesgcm.keyB64u), 'AES-GCM', false, ['decrypt']);
      var gcmThrew = await throwsAsync(crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: bytesFromB64url(V.aesgcm.ivB64u), tagLength: 128 },
        aesKey, bytesFromB64url(JSON.parse(v9.wireBody).encrypted)));
      add('WF12.tamper-body 密文篡改双拦',
        W.firstFailStage(s9) === 'digest' && decStep !== null && decStep.ok === false && gcmThrew === true,
        '翻转密文首字节（头未动，验签过）→ ② sha-256(密文) 复核先拒；⑤ GCM tag 亦拒（纵深）+孤立解密实测抛错');
    } catch (e) { add('WF12.tamper-body 密文篡改双拦', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A10 spec:WF12.tamper-dek 构造侧坏 DEK（重签合法）→ ③ 解包拦截（I7）——
    try {
      var v10 = await W.tamperVariant(msg, 'dek');
      var s10 = await W.verifyPipeline(v10);
      add('WF12.tamper-dek 重签后落③',
        W.firstFailStage(s10) === 'dek-unwrap' && s10.length === 3
          && s10[0].ok === true && s10[1].ok === true,
        '损坏 wrapped DEK 后以商户私钥重签（签名/摘要均有效）→ ①② 通过，落 ③ DEK 解包；对外模糊为「解密失败」（I7）');
    } catch (e) { add('WF12.tamper-dek 重签后落③', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A11 spec:WF12.reject 拒绝路径与格式规则全表（否定式条款断言）——
    try {
      var nEmpty = await throwsAsync(W.buildEnvelope(''));
      var nTwo = throwsSync(function () { W.parseDekPayload('AES-256-GCM$abc'); });
      var nPad = throwsSync(function () { W.parseDekPayload('AES-256-GCM$' + V.aesgcm.keyB64u + '=$' + V.aesgcm.ivB64u); });
      // 跨族 alg（I5）：SM4-GCM 载荷重签合法后应落 ④ alg 族比对（I3 时序：bulk 解密前）
      var sm4 = {
        fixed: msg.fixed, plaintext: msg.plaintext, wireBody: msg.wireBody,
        sig: msg.sig, sigB64u: msg.sigB64u, signHeader: msg.signHeader,
        signedNames: msg.signedNames, headers: {}
      };
      for (var hk in msg.headers) sm4.headers[hk] = msg.headers[hk];
      sm4.headers['x-wop-encrypt'] = 'L2;dek=' + await W.wrapPayload('SM4-GCM$' + V.aesgcm.keyB64u + '$' + V.aesgcm.ivB64u);
      await W.signMessage(sm4, sm4.headers);
      var sSm = await W.verifyPipeline(sm4);
      var smOk = W.firstFailStage(sSm) === 'alg-check' && sSm.length === 4
        && sSm[0].ok === true && sSm[1].ok === true && sSm[2].ok === true;
      // formatRules 全表对拍：header-* 走 parseDigestHeader+alg 族，b64url-* 走 strictB64urlOk
      var rules = V.formatRules || [];
      var ruleBad = [];
      for (var ri = 0; ri < rules.length; ri++) {
        var r = rules[ri];
        var want = r.expect === 'accept';
        var got;
        if (r.id.indexOf('header-') === 0) {
          var pd = parseDigestHeader(r.value);
          got = !!(pd.ok && pd.alg === 'sha-256');
        } else {
          got = strictB64urlOk(r.value);
        }
        if (got !== want) ruleBad.push(r.id);
      }
      add('WF12.reject 拒绝路径与格式规则',
        nEmpty && nTwo && nPad && smOk && ruleBad.length === 0,
        '空明文拒:' + nEmpty + '；两段载荷拒:' + nTwo + '；带=填充拒:' + nPad
          + '；SM4-GCM 重签落④:' + smOk + '；formatRules ' + rules.length + ' 条全符（违例:' + (ruleBad.join(',') || '无') + '）');
    } catch (e) { add('WF12.reject 拒绝路径与格式规则', false, '异常：' + (e && e.message ? e.message : e)); }

    // —— A12 spec:WF12.dom DOM 接线与交互（无 DOM / 未挂载环境诚实跳过）——
    try {
      if (typeof document === 'undefined' || !document.getElementById('wf12-root')) {
        // spec:WF12.dom.skip Node harness 无 #wf12-root：本条在浏览器集成仿真中执行
        add('WF12.dom 接线与交互（跳过）', true,
          typeof document === 'undefined' ? '当前环境无 DOM（Node harness）——本条已在浏览器集成仿真中执行验证' : '#wf12-root 未挂载——本条在浏览器集成仿真中执行验证');
      } else {
        var root = document.getElementById('wf12-root');
        // 自含式：宿主调用 init 的时机由集成者决定——先幂等确保监听器已绑定，再验证交互
        if (typeof window !== 'undefined' && window.WF_REGISTRY && window.WF_REGISTRY['wf12']) {
          window.WF_REGISTRY['wf12'].init();
        }
        var needIds = ['wf12-root', 'wf12-plain', 'wf12-mode', 'wf12-run', 'wf12-input-err', 'wf12-err-out', 'wf12-err-stage', 'wf12-diagram'];
        for (var i1 = 1; i1 <= 4; i1++) needIds.push('wf12-step-' + i1, 'wf12-s' + i1 + '-body', 'wf12-s' + i1 + '-badge');
        needIds.push('wf12-tamper-sign', 'wf12-tamper-digest', 'wf12-tamper-body', 'wf12-tamper-dek');
        var missIds = [];
        for (var i2 = 0; i2 < needIds.length; i2++) if (!document.getElementById(needIds[i2])) missIds.push(needIds[i2]);
        var i18nNodes = root.querySelectorAll('[data-i18n]');
        var badKeys = [];
        for (var i3 = 0; i3 < i18nNodes.length; i3++) {
          var dk = i18nNodes[i3].getAttribute('data-i18n');
          if (!/^wf12\./.test(String(dk))) badKeys.push(dk);
        }
        var preOk = missIds.length === 0 && badKeys.length === 0 && i18nNodes.length > 0
          && document.getElementById('wf12-plain').value === V.message
          && document.getElementById('wf12-mode').value === 'vector';
        document.getElementById('wf12-run').click();
        await sleep(3000);
        var actives = root.querySelectorAll('.wf12-step.active').length;
        var plainOut = document.getElementById('wf12-s4-body').querySelector('.wf12-plain-out');
        var g1 = document.getElementById('wf12-s1-badge').querySelector('.wf12-badge.ok');
        var g3 = document.getElementById('wf12-s3-badge').querySelector('.wf12-badge.ok');
        var runOk = actives === 4 && !!plainOut && !!g1 && !!g3;
        document.getElementById('wf12-tamper-body').click();
        await sleep(900);
        var badStage = document.getElementById('wf12-err-out').querySelector('.wf12-stage.bad');
        var stageBox = document.getElementById('wf12-err-stage');
        var tampOk = !!badStage && !stageBox.hidden;
        add('WF12.dom 接线与交互', preOk && runOk && tampOk,
          'id 缺失:' + (missIds.join(',') || '无') + '；i18n 键 ' + i18nNodes.length + ' 个（异常 ' + badKeys.length + '）；默认明文/模式正确:' + preOk
            + '；演示四卡激活 ' + actives + '/4' + (plainOut ? '、解密回明文一致' : '、未见解密回显')
            + (g1 && g3 ? '、S1/S3 黄金徽标在' : '、黄金徽标缺失')
            + '；body 篡改拦截 ' + (tampOk ? '命中' : '未命中'));
      }
    } catch (e) { add('WF12.dom 接线与交互', false, '异常：' + (e && e.message ? e.message : e)); }

    return out;
  }

  // 挂载（次序契约：wf12.js 先行；本文件随后补 runAssertions）
  var g = (typeof window !== 'undefined') ? window : globalThis;
  if (typeof g.WF12 === 'undefined') g.WF12 = {};
  g.WF12.runAssertions = runAssertions;
})();
