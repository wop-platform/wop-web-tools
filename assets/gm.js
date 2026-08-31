/* ===== gm/gm.js ===== */
/*! wf-gm：国密 WOP-SM2-SM3 套件页面切片（源真相；gm.html/gm.css 由本文件 registry 字段生成）
 * 依赖加载顺序：gmcore.js（window.GmCore）→ wf14.js（可选）→ 本文件。
 * 集成接线点：
 *   - 三个区块分别落位（见 HTML_FRAG 头部锚点注释），或整体注入后按 section 拆分；
 *   - init(mount?) 幂等：根节点不存在时注入 html+css（mount 为元素或选择器，缺省 body）；
 *   - registry.selftest() 组合 gmcore 黄金断言（22 条）+ gm.selftest.js 页面断言（P1..P10）；
 *   - window.GM 适配器（WF_CONTRACT §33）在本文件加载时建立，供其他切片复用国密原语。
 * 断言标签：// spec:GM-P*（页面）与 gmcore 内 // spec:GM-*（核心），矩阵见 gm/README.md。
 */
(function () {
  'use strict';

  var SUITE = 'WOP-SM2-SM3';
  var REG_ID = 'wf-gm';

  // ---------------------------------------------------------------------------
  // 基础工具（共享全局优先只读调用，独立运行时本地同源回退）
  // ---------------------------------------------------------------------------

  function C() {
    if (!window.GmCore) throw new Error('gmcore.js 未加载（应先于 gm.js）');
    return window.GmCore;
  }
  function T(key, fb) {
    return (window.WF14 && typeof window.WF14.t === 'function') ? window.WF14.t(key, fb) : fb;
  }
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function toastMsg(m) { if (typeof window.toast === 'function') window.toast(m); }

  // canonical 同源实现（与 index.html 共享全局等价；签名/验证同页同源保证一致性）
  function javaUrlEncode(s) {
    return encodeURIComponent(s).replace(/[!'()~]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
  }
  function trimall(s) { return String(s == null ? '' : s).trim().replace(/\s+/g, ' '); }
  function chLocal(map) {
    // 语义镜像全局 canonicalHeaders：逐项规范化键并携带各自值再排序；键同样过 javaUrlEncode
    var entries = Object.keys(map).map(function (k) { return [trimall(k).toLowerCase(), map[k]]; });
    entries.sort(function (a, b) { return (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0); });
    return entries.map(function (e) {
      return javaUrlEncode(e[0]) + ':' + javaUrlEncode(trimall(e[1]));
    }).join('\n');
  }
  function canonLocal(auth, method, path, qs, ch) {
    return auth + '\n' + method + '\n' + path + '\n' + qs + '\n' + ch;
  }
  function CH(map) {
    return (typeof window.canonicalHeaders === 'function') ? window.canonicalHeaders(map) : chLocal(map);
  }
  function CANON(a, m, p, q, c) {
    return (typeof window.buildCanonical === 'function') ? window.buildCanonical(a, m, p, q, c) : canonLocal(a, m, p, q, c);
  }
  function shq(s) {
    return (typeof window.shQuote === 'function') ? window.shQuote(s)
      : ("'" + String(s).replace(/'/g, "'\\''") + "'");
  }
  function renderStepsGm(el, arr) {
    if (!el) return;
    if (typeof window.renderSteps === 'function') { try { window.renderSteps(el, arr); return; } catch (e) { /* 本地回退 */ } }
    var html = '';
    for (var i = 0; i < arr.length; i++) {
      var st = arr[i];
      html += '<li class="' + (st.ok ? 'ok' : 'bad') + '">' + esc(st.text) + '</li>';
    }
    el.innerHTML = html;
  }
  function setRowsGm(id, rows) {
    if (typeof window.setRows === 'function') { try { window.setRows(id, rows); return; } catch (e) { /* 本地回退 */ } }
    var el = $(id); if (!el) return;
    var html = '<tbody>';
    for (var i = 0; i < rows.length; i++) html += '<tr><td>' + esc(rows[i][0]) + '</td><td>' + esc(rows[i][1]) + '</td></tr>';
    el.innerHTML = html + '</tbody>';
  }
  function nonceHex() {
    var b = new Uint8Array(16);
    (window.crypto || {}).getRandomValues.call(window.crypto, b);
    var g = C();
    return g.hexFromBytes(b);
  }
  function needHex(v, len, what) {
    v = String(v == null ? '' : v).trim().toLowerCase();
    if (!/^[0-9a-f]+$/.test(v) || v.length !== len) throw new Error(what + ' 应为 ' + len + ' 位 hex');
    return v;
  }

  // ---------------------------------------------------------------------------
  // CSS（作用域 wf-gm-*；变量回退保证独立页可用）
  // ---------------------------------------------------------------------------

  var CSS_TEXT = [
    '.wf-gm .hint{color:var(--muted,#888);font-size:13px;margin:6px 0 0}',
    '.wf-gm .wf-gm-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}',
    '.wf-gm .wf-gm-check{display:inline-flex;gap:4px;align-items:center;font-size:13px;color:var(--muted,#555)}',
    '.wf-gm .wf-gm-kv{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}',
    '@media (max-width:860px){.wf-gm .wf-gm-kv{grid-template-columns:1fr}}',
    '.wf-gm .wf-gm-io{display:flex;gap:6px;align-items:flex-start}',
    '.wf-gm .wf-gm-io input,.wf-gm .wf-gm-io textarea{flex:1;min-width:0;font-family:var(--mono,ui-monospace,Menlo,Consolas,monospace);font-size:12px;box-sizing:border-box}',
    '.wf-gm .wf-gm-copy{flex:none;font-size:12px;padding:4px 8px;cursor:pointer}',
    '.wf-gm .wf-gm-pem[hidden]{display:none}',
    '.wf-gm ul.steps{list-style:none;padding:0;margin:10px 0 0}',
    '.wf-gm ul.steps li{padding:4px 10px;border-left:3px solid var(--muted,#999);margin:4px 0;font-size:13px;background:var(--bg2,#f6f7f8);word-break:break-all}',
    '.wf-gm ul.steps li.ok{border-left-color:#2e9e5b}',
    '.wf-gm ul.steps li.bad{border-left-color:#d34836}',
    '.wf-gm table.kv{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}',
    '.wf-gm table.kv td{border:1px solid var(--line,#ddd);padding:4px 8px;word-break:break-all;vertical-align:top}',
    '.wf-gm pre{white-space:pre-wrap;word-break:break-all;font-size:12px;margin:6px 0 0}'
  ].join('\n');

  // ---------------------------------------------------------------------------
  // HTML 片段（锚点建议见头部注释；id 均 wf-gm- 前缀）
  // ---------------------------------------------------------------------------

  var HTML_FRAG = [
    '<!-- wf-gm 国密切片（三区块锚点建议，集成者可按 section 拆开分别落位）：',
    '     1) #wf-gm-keygen → 「密钥工具」tab 现有密钥卡片之后；',
    '     2) #wf-gm-req → #tab-request 内 #build-req 卡片之后（与 wf9 相邻）；',
    '     3) #wf-gm-ver → 验证 tab 现有验证卡片之后。',
    '     依赖：gmcore.js 先于 gm.js 加载（window.GmCore）；本片段内无脚本。 -->',
    '<div id="wf-gm-root" class="wf-gm">',
    '',
    '  <section id="wf-gm-keygen" class="card">',
    '    <h3 data-i18n="wf-gm.keygen.title">SM2 密钥对生成（国密）</h3>',
    '    <p class="hint" data-i18n="wf-gm.keygen.hint">生成 SM2 密钥对：私钥 d（hex / Base64 / PKCS#8 PEM）与公钥（hex / Base64）。签名与验签 userId 取 x-wop-appkey 头值（契约，2026-08-31 飞书裁决）；golden 向量夹具固定 1234567812345678。</p>',
    '    <div class="wf-gm-bar">',
    '      <button id="wf-gm-keygen-btn" class="primary" type="button" data-i18n="wf-gm.keygen.btn">生成 SM2 密钥对</button>',
    '      <label class="wf-gm-check"><input type="checkbox" id="wf-gm-keygen-pem"><span data-i18n="wf-gm.keygen.pem">同时输出 PKCS#8 PEM</span></label>',
    '    </div>',
    '    <div class="wf-gm-kv">',
    '      <div class="field"><label for="wf-gm-priv-hex" data-i18n="wf-gm.keygen.privhex">私钥 d（hex 64）</label>',
    '        <div class="wf-gm-io"><input id="wf-gm-priv-hex" readonly spellcheck="false"><button class="wf-gm-copy" type="button" data-copy="wf-gm-priv-hex" data-i18n="wf-gm.copy">复制</button></div></div>',
    '      <div class="field"><label for="wf-gm-priv-b64" data-i18n="wf-gm.keygen.privb64">私钥（Base64，32B）</label>',
    '        <div class="wf-gm-io"><input id="wf-gm-priv-b64" readonly spellcheck="false"><button class="wf-gm-copy" type="button" data-copy="wf-gm-priv-b64" data-i18n="wf-gm.copy">复制</button></div></div>',
    '      <div class="field wf-gm-pem" hidden><label for="wf-gm-priv-pem" data-i18n="wf-gm.keygen.pem.out">私钥 PKCS#8 PEM</label>',
    '        <div class="wf-gm-io"><textarea id="wf-gm-priv-pem" readonly rows="3" spellcheck="false"></textarea><button class="wf-gm-copy" type="button" data-copy="wf-gm-priv-pem" data-i18n="wf-gm.copy">复制</button></div></div>',
    '      <div class="field"><label for="wf-gm-pub-hex" data-i18n="wf-gm.keygen.pubhex">公钥（hex，04‖X‖Y 130）</label>',
    '        <div class="wf-gm-io"><input id="wf-gm-pub-hex" readonly spellcheck="false"><button class="wf-gm-copy" type="button" data-copy="wf-gm-pub-hex" data-i18n="wf-gm.copy">复制</button></div></div>',
    '      <div class="field"><label for="wf-gm-pub-b64" data-i18n="wf-gm.keygen.pubb64">公钥（Base64，65B）</label>',
    '        <div class="wf-gm-io"><input id="wf-gm-pub-b64" readonly spellcheck="false"><button class="wf-gm-copy" type="button" data-copy="wf-gm-pub-b64" data-i18n="wf-gm.copy">复制</button></div></div>',
    '    </div>',
    '  </section>',
    '',
    '  <section id="wf-gm-req" class="card">',
    '    <h3 data-i18n="wf-gm.req.title">国密请求构造（WOP-SM2-SM3）</h3>',
    '    <p class="hint" data-i18n="wf-gm.req.hint">L2 开启时：SM4-GCM（16B key / 12B IV）加密报文 → DEK 载荷以 SM2（C1C3C2，04 前缀）包装给平台公钥；x-wop-content-digest 覆盖线上密文 body。签名串为 canonicalRequest 五段式。</p>',
    '    <div class="grid2">',
    '      <div class="field"><label for="wf-gm-req-priv" data-i18n="wf-gm.req.priv">商户私钥 d（hex 64）</label>',
    '        <textarea id="wf-gm-req-priv" rows="2" spellcheck="false" placeholder="…"></textarea></div>',
    '      <div class="field"><label for="wf-gm-req-pub" data-i18n="wf-gm.req.pub">平台公钥（hex 130，L2 必填）</label>',
    '        <textarea id="wf-gm-req-pub" rows="2" spellcheck="false" placeholder="…"></textarea></div>',
    '    </div>',
    '    <div class="grid2">',
    '      <div class="field"><label for="wf-gm-req-ppriv" data-i18n="wf-gm.req.ppriv">平台私钥 d（hex 64，可选；联调自验填充验证区用）</label>',
    '        <textarea id="wf-gm-req-ppriv" rows="2" spellcheck="false" placeholder="…"></textarea></div>',
    '      <div class="field"><label for="wf-gm-req-body" data-i18n="wf-gm.req.body">业务报文（JSON 明文）</label>',
    '        <textarea id="wf-gm-req-body" rows="2" spellcheck="false">{"orderId":"W20260831001","amount":100}</textarea></div>',
    '    </div>',
    '    <div class="grid3">',
    '      <div class="field"><label for="wf-gm-req-appkey" data-i18n="wf-gm.req.appkey">x-wop-appkey（必填，SM2 userId）</label>',
    '        <input id="wf-gm-req-appkey" spellcheck="false" placeholder="demo_app_key"></div>',
    '      <div class="field"><label for="wf-gm-req-path" data-i18n="wf-gm.req.path">网关路径</label>',
    '        <input id="wf-gm-req-path" spellcheck="false" value="/gateway/trade.order.create"></div>',
    '      <div class="field"><label for="wf-gm-req-expired" data-i18n="wf-gm.req.expired">expiredSeconds</label>',
    '        <input id="wf-gm-req-expired" type="number" value="1800" min="1" max="86400"></div>',
    '    </div>',
    '    <div class="wf-gm-bar">',
    '      <button id="wf-gm-req-build" class="primary" type="button" data-i18n="wf-gm.req.build">构造国密请求</button>',
    '      <button id="wf-gm-req-usekeygen" type="button" data-i18n="wf-gm.req.usekeygen">用生成密钥自闭环填充（演示）</button>',
    '      <label class="wf-gm-check"><input type="checkbox" id="wf-gm-req-l2" checked><span data-i18n="wf-gm.req.l2">L2 加密（x-wop-encrypt）</span></label>',
    '      <button id="wf-gm-req-tover" type="button" data-i18n="wf-gm.req.tover">→ 填充国密验证区</button>',
    '    </div>',
    '    <ul class="steps" id="wf-gm-req-steps" hidden></ul>',
    '    <details class="debug"><summary data-i18n="wf-gm.req.canonical">canonicalRequest 签名串</summary><pre id="wf-gm-req-canonical"></pre></details>',
    '    <details class="debug" open><summary data-i18n="wf-gm.req.headers">请求头（含 x-wop-sign）</summary><table class="kv" id="wf-gm-req-headers"></table></details>',
    '    <details class="debug" open><summary data-i18n="wf-gm.req.wire">线上请求体（密文）</summary><pre id="wf-gm-req-wire"></pre></details>',
    '    <details class="debug"><summary data-i18n="wf-gm.req.dek">DEK 明文载荷（SM4-GCM$…$…）</summary><pre id="wf-gm-req-dek"></pre></details>',
    '    <details class="debug"><summary>curl</summary><pre id="wf-gm-req-curl"></pre></details>',
    '  </section>',
    '',
    '  <section id="wf-gm-ver" class="card">',
    '    <h3 data-i18n="wf-gm.ver.title">国密验证（WOP-SM2-SM3 五步流水线）</h3>',
    '    <p class="hint" data-i18n="wf-gm.ver.hint">粘贴对端回传的头（每行 name: value，含 x-wop-sign）与线上报文体，按 F6 顺序执行：SM2 验签 → SM3 摘要复核 → DEK 解包 → 套件族比对 → SM4-GCM 解密。方向中立：验签公钥 = 签名方公钥；DEK 解包私钥 = 信封接收方私钥。</p>',
    '    <div class="grid2">',
    '      <div class="field"><label for="wf-gm-ver-vpub" data-i18n="wf-gm.ver.vpub">验签公钥（签名方，hex 130）</label>',
    '        <textarea id="wf-gm-ver-vpub" rows="2" spellcheck="false" placeholder="…"></textarea></div>',
    '      <div class="field"><label for="wf-gm-ver-dpriv" data-i18n="wf-gm.ver.dpriv">DEK 解包私钥（接收方，hex 64）</label>',
    '        <textarea id="wf-gm-ver-dpriv" rows="2" spellcheck="false" placeholder="…"></textarea></div>',
    '    </div>',
    '    <div class="grid3">',
    '      <div class="field"><label for="wf-gm-ver-method" data-i18n="wf-gm.ver.method">方法</label>',
    '        <input id="wf-gm-ver-method" spellcheck="false" value="POST"></div>',
    '      <div class="field"><label for="wf-gm-ver-path" data-i18n="wf-gm.ver.path">路径（重建 canonical 用）</label>',
    '        <input id="wf-gm-ver-path" spellcheck="false" value="/gateway/trade.order.create"></div>',
    '      <div class="field"><label>　</label>',
    '        <div class="wf-gm-bar">',
    '          <button id="wf-gm-ver-golden-l0" type="button" data-i18n="wf-gm.ver.goldenl0">用测试向量 L0</button>',
    '          <button id="wf-gm-ver-golden-l2" type="button" data-i18n="wf-gm.ver.goldenl2">用测试向量 L2</button>',
    '        </div></div>',
    '    </div>',
    '    <div class="field"><label for="wf-gm-ver-headers" data-i18n="wf-gm.ver.headers">请求头（每行 name: value）</label>',
    '      <textarea id="wf-gm-ver-headers" rows="5" spellcheck="false" placeholder="x-wop-content-digest: sm3 …&#10;x-wop-encrypt: L2;dek=…&#10;x-wop-nonce: …&#10;x-wop-timestamp: …&#10;x-wop-sign: WOP-SM2-SM3 v1/1800/…/…"></textarea></div>',
    '    <div class="field"><label for="wf-gm-ver-body" data-i18n="wf-gm.ver.body">线上报文体（密文原文）</label>',
    '      <textarea id="wf-gm-ver-body" rows="3" spellcheck="false" placeholder=\'{"encrypted":"…"}\'></textarea></div>',
    '    <div class="wf-gm-bar"><button id="wf-gm-ver-run" class="primary" type="button" data-i18n="wf-gm.ver.run">执行五步验证</button></div>',
    '    <ul class="steps" id="wf-gm-ver-steps"></ul>',
    '    <div class="field"><label for="wf-gm-ver-plain" data-i18n="wf-gm.ver.plain">解密后报文（L2 时）</label>',
    '      <textarea id="wf-gm-ver-plain" rows="2" readonly spellcheck="false"></textarea></div>',
    '  </section>',
    '',
    '</div>'
  ].join('\n');

  // ---------------------------------------------------------------------------
  // 页面状态与行为
  // ---------------------------------------------------------------------------

  var lastKeys = null;   // 最近一次生成的密钥对 { privateHex, publicHex }
  var lastBuilt = null;  // 最近一次构造的请求 { headers, wire, path, l2 }

  function togglePem(force) {
    var row = document.querySelector('.wf-gm .wf-gm-pem');
    var box = $('wf-gm-keygen-pem');
    if (row && box) row.hidden = force !== undefined ? !force : !box.checked;
  }

  function onKeygen() {
    try {
      var g = C();
      var kp = g.sm2Keygen();
      lastKeys = kp;
      $('wf-gm-priv-hex').value = kp.privateHex;
      $('wf-gm-priv-b64').value = g.privHexToB64(kp.privateHex);
      togglePem();
      if ($('wf-gm-keygen-pem').checked) $('wf-gm-priv-pem').value = g.pkcs8PemFromD(kp.privateHex, kp.publicHex);
      $('wf-gm-pub-hex').value = kp.publicHex;
      $('wf-gm-pub-b64').value = g.pubHexToB64(kp.publicHex);
      toastMsg(T('wf-gm.keygen.done', 'SM2 密钥对已生成'));
    } catch (e) {
      toastMsg('生成失败：' + (e && e.message || e));
    }
  }

  function onGenFill() {
    if (!lastKeys) { toastMsg(T('wf-gm.req.nogen', '请先生成 SM2 密钥对')); return; }
    // 演示自闭环：生成密钥同时扮演商户与平台两侧（联调走真实密钥时分别填写）
    $('wf-gm-req-priv').value = lastKeys.privateHex;
    $('wf-gm-req-pub').value = lastKeys.publicHex;
    $('wf-gm-req-ppriv').value = lastKeys.privateHex;
    $('wf-gm-req-appkey').value = 'demo_app_key';
    toastMsg(T('wf-gm.req.filled', '已用生成密钥自闭环填充'));
  }

  function onBuild() {
    var steps = [];
    var out = { steps: steps };
    try {
      var g = C();
      var privHex = needHex($('wf-gm-req-priv').value, 64, '商户私钥');
      var useL2 = $('wf-gm-req-l2').checked;
      var body = $('wf-gm-req-body').value;
      var path = $('wf-gm-req-path').value.trim() || '/gateway/trade.order.create';
      var expired = String(parseInt($('wf-gm-req-expired').value || '1800', 10) || 1800);
      var appkey = $('wf-gm-req-appkey').value.trim();
      if (!appkey) throw new Error(T('main.ver.gm.needappkey', 'x-wop-appkey 必填（SM2 userId 契约：userId = x-wop-appkey 值）'));
      var wire, digest, encHdr = '', dekPlain = '';

      if (useL2) {
        var pubHex = needHex($('wf-gm-req-pub').value, 130, '平台公钥');
        if (!body.trim()) throw new Error(T('wf-gm.req.emptybody', 'L2 加密需要非空报文'));
        var env = g.buildSmEnvelope(body, pubHex);
        wire = env.encryptedBody; digest = env.digest; encHdr = env.encryptHeader; dekPlain = env.dekPayload;
        steps.push({ ok: true, text: T('wf-gm.req.st.env', 'L2 信封完成：SM4-GCM 密文 + SM2 包装 DEK') });
      } else {
        wire = body;
        digest = g.buildSmDigest(body);
        steps.push({ ok: true, text: T('wf-gm.req.st.l0', 'L0 明文：digest 已覆盖报文') + (digest ? '' : T('wf-gm.req.st.l0e', '（空报文 → 空 digest 头）')) });
      }

      var headers = {};
      if (appkey) headers['x-wop-appkey'] = appkey;
      headers['x-wop-content-digest'] = digest;
      if (useL2) headers['x-wop-encrypt'] = encHdr;
      headers['x-wop-nonce'] = nonceHex();
      headers['x-wop-timestamp'] = String(Date.now());

      var authString = 'v1/' + expired;
      var canonical = CANON(authString, 'POST', path, '', CH(headers));
      var names = Object.keys(headers).sort().join(';');
      var sig = g.sm2SignBytes(g.utf8Encode(canonical), privHex, appkey);
      var signHeader = SUITE + ' ' + authString + '/' + names + '/' + sig;
      steps.push({ ok: true, text: T('wf-gm.req.st.sign', 'canonicalRequest 已签名（SM2，userId = x-wop-appkey 值）') });
      steps.push({ ok: true, text: T('wf-gm.req.st.done', '构造完成，可填充验证区自验') });

      $('wf-gm-req-canonical').textContent = canonical;
      var rows = Object.keys(headers).map(function (k) { return [k, headers[k]]; });
      rows.push(['x-wop-sign', signHeader]);
      setRowsGm('wf-gm-req-headers', rows);
      $('wf-gm-req-wire').textContent = wire;
      $('wf-gm-req-dek').textContent = dekPlain || T('wf-gm.req.nodek', '（L0 无 DEK）');
      var host = 'https://wop-gateway.example.com';
      var curl = ['curl -X POST ' + shq(host + path), '-H ' + shq('content-type: application/json')]
        .concat(rows.map(function (r) { return '-H ' + shq(r[0] + ': ' + r[1]); }))
        .concat(['--data-raw ' + shq(wire)]).join(' \\\n  ');
      $('wf-gm-req-curl').textContent = curl;

      lastBuilt = { headers: headers, signHeader: signHeader, wire: wire, path: path, l2: useL2, privHex: privHex };
      toastMsg(T('wf-gm.req.done', '国密请求构造完成'));
    } catch (e) {
      steps.push({ ok: false, text: '构造失败：' + (e && e.message || e) });
    }
    renderStepsGm($('wf-gm-req-steps'), steps);
    $('wf-gm-req-steps').hidden = false;
    return out;
  }

  function onToVer() {
    if (!lastBuilt) { toastMsg(T('wf-gm.req.nobuild', '请先构造国密请求')); return; }
    var g = C();
    var h = lastBuilt.headers;
    var lines = Object.keys(h).sort().map(function (k) { return k + ': ' + h[k]; });
    lines.push('x-wop-sign: ' + lastBuilt.signHeader);
    $('wf-gm-ver-headers').value = lines.join('\n');
    $('wf-gm-ver-body').value = lastBuilt.wire;
    $('wf-gm-ver-method').value = 'POST';
    $('wf-gm-ver-path').value = lastBuilt.path;
    // 验签公钥 = 签名方（商户）公钥：由商户私钥曲线推导
    try { $('wf-gm-ver-vpub').value = g.sm2PubFromPriv(lastBuilt.privHex); } catch (e) { /* 留空由用户填写 */ }
    // DEK 解包私钥 = 接收方（平台）私钥：联调字段有值则回填
    var pp = $('wf-gm-req-ppriv').value.trim();
    $('wf-gm-ver-dpriv').value = /^[0-9a-f]{64}$/i.test(pp) ? pp.toLowerCase() : '';
    toastMsg(T('wf-gm.req.tover.done', '已填充国密验证区，切到验证页签执行五步验证'));
  }

  function parseHeaderLines(text) {
    var map = {};
    String(text || '').split('\n').forEach(function (raw) {
      var ln = raw.trim();
      if (!ln) return;
      var ix = ln.indexOf(':');
      if (ix <= 0) return;
      map[ln.slice(0, ix).trim().toLowerCase()] = ln.slice(ix + 1).trim();
    });
    return map;
  }

  function onVerify() {
    var steps = [];
    var res = null;
    try {
      var g = C();
      var hmap = parseHeaderLines($('wf-gm-ver-headers').value);
      var sign = hmap['x-wop-sign'];
      if (!sign) throw new Error(T('wf-gm.ver.nosign', '缺少 x-wop-sign 头'));
      var sp = sign.indexOf(' ');
      if (sp <= 0) throw new Error(T('wf-gm.ver.badsign', 'x-wop-sign 缺少套件与授权串的空格分隔'));
      if (sign.slice(0, sp) !== SUITE) throw new Error(T('wf-gm.ver.badsuite', 'securityReq 应为 ' + SUITE));
      var seg = sign.slice(sp + 1).trim().split('/');
      if (seg.length !== 4) throw new Error(T('wf-gm.ver.badseg', '签名头应为 v1/expired/signedHeaders/signature 四段'));
      var names = seg[2].split(';').map(function (s) { return s.trim(); }).filter(Boolean);
      var sub = {}, miss = [];
      names.forEach(function (n) {
        if (hmap[n] === undefined) miss.push(n); else sub[n] = hmap[n];
      });
      if (miss.length) throw new Error(T('wf-gm.ver.miss', '签名头引用但未粘贴的头：') + miss.join(', '));
      var method = $('wf-gm-ver-method').value.trim() || 'POST';
      var path = $('wf-gm-ver-path').value.trim() || '/gateway/trade.order.create';
      var canonical = CANON(seg[0] + '/' + seg[1], method, path, '', CH(sub));
      var userId = hmap['x-wop-appkey'];
      if (!userId) throw new Error(T('main.ver.gm.needappkey', 'x-wop-appkey 必填（SM2 userId 契约：userId = x-wop-appkey 值）'));
      res = g.verifySmSuite(hmap, $('wf-gm-ver-body').value, {
        canonical: canonical,
        merchantPubHex: $('wf-gm-ver-vpub').value.trim() || undefined,
        platformPrivHex: $('wf-gm-ver-dpriv').value.trim() || undefined,
        userId: userId
      });
      steps = res.steps.map(function (s) {
        return { ok: s.ok, text: s.ok ? s.name : s.name + '：' + s.reason };
      });
      $('wf-gm-ver-plain').value = res.allOk
        ? (res.decryptedBody || T('wf-gm.ver.l0note', '（明文流，无解密步骤）'))
        : '';
    } catch (e) {
      steps.push({ ok: false, text: '验证失败：' + (e && e.message || e) });
      $('wf-gm-ver-plain').value = '';
    }
    renderStepsGm($('wf-gm-ver-steps'), steps);
    var ok = !!(res && res.allOk) && steps.length > 0 && steps.every(function (s) { return s.ok; });
    $('wf-gm-ver-steps').setAttribute('data-allok', ok ? '1' : '0');
    return res;
  }

  // 黄金向量快捷填充：黄金密文字节（sm4CtTagB64u / sm2EncB64u）100% 复用，
  // 仅 nonce/timestamp/签名现算，五步应全绿。
  function fillGolden(l2) {
    var g = C();
    var G = g.GOLDEN_SM;
    var body = l2 ? '{"encrypted":"' + G.sm4CtTagB64u + '"}' : G.message;
    var headers = {};
    headers['x-wop-appkey'] = G.appKey;
    headers['x-wop-content-digest'] = g.buildSmDigest(body);
    if (l2) headers['x-wop-encrypt'] = 'L2;dek=' + G.sm2EncB64u;
    headers['x-wop-nonce'] = '00112233445566778899aabbccddeeff';
    headers['x-wop-timestamp'] = String(Date.now());
    var path = $('wf-gm-ver-path').value.trim() || '/gateway/trade.order.create';
    var canonical = CANON('v1/1800', 'POST', path, '', CH(headers));
    var sig = g.sm2SignBytes(g.utf8Encode(canonical), G.privHex, G.appKey);
    var signHeader = SUITE + ' v1/1800/' + Object.keys(headers).sort().join(';') + '/' + sig;

    $('wf-gm-ver-vpub').value = G.pubHex;
    $('wf-gm-ver-dpriv').value = G.privHex;
    $('wf-gm-ver-method').value = 'POST';
    var lines = Object.keys(headers).sort().map(function (k) { return k + ': ' + headers[k]; });
    lines.push('x-wop-sign: ' + signHeader);
    $('wf-gm-ver-headers').value = lines.join('\n');
    $('wf-gm-ver-body').value = body;
    return onVerify();
  }

  function doCopy(id) {
    var el = $(id);
    if (!el) return;
    var v = el.value != null ? el.value : el.textContent;
    if (typeof window.copyText === 'function') { window.copyText(v); return; }
    try {
      el.select();
      document.execCommand('copy');
      toastMsg(T('wf-gm.copied', '已复制'));
    } catch (e) { /* 剪贴板不可用时静默 */ }
  }

  // ---------------------------------------------------------------------------
  // window.GM 适配器（WF_CONTRACT §33：其他切片可依赖的国密原语面）
  // ---------------------------------------------------------------------------

  function ensureGM() {
    if (window.GM) return window.GM;
    var g = C();
    window.GM = {
      sm2: {
        keygen: g.sm2Keygen,
        pubFromPriv: g.sm2PubFromPriv,
        sign: g.sm2SignBytes,
        verify: g.sm2VerifyB64u,
        encryptDek: g.sm2EncryptDek,
        decryptDek: g.sm2DecryptDek,
        pubHexToB64: g.pubHexToB64,
        privHexToB64: g.privHexToB64,
        pkcs8PemFromD: g.pkcs8PemFromD,
        USER_ID: g.SM2_USER_ID
      },
      sm3: { hex: g.sm3Hex, digestHeader: g.buildSmDigest },
      sm4: {
        gcmEncrypt: g.sm4GcmEncrypt,
        gcmDecrypt: g.sm4GcmDecrypt,
        buildDek: g.buildSmDek,
        dekPayload: g.dekPayload
      },
      envelope: g.buildSmEnvelope,
      verifySmSuite: g.verifySmSuite,
      utf8Encode: g.utf8Encode,
      utf8Decode: g.utf8Decode,
      bytesFromB64u: g.bytesFromB64u,
      b64uFromBytes: g.b64uFromBytes,
      bytesFromHex: g.bytesFromHex,
      hexFromBytes: g.hexFromBytes,
      GOLDEN_SM: g.GOLDEN_SM
    };
    return window.GM;
  }

  // ---------------------------------------------------------------------------
  // 注册（协议见 parallel/WF_CONTRACT.md）
  // ---------------------------------------------------------------------------

  var wired = false;

  function wire() {
    function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }
    on('wf-gm-keygen-btn', 'click', onKeygen);
    on('wf-gm-keygen-pem', 'change', function () { togglePem(); });
    on('wf-gm-req-build', 'click', onBuild);
    on('wf-gm-req-usekeygen', 'click', onGenFill);
    on('wf-gm-req-tover', 'click', onToVer);
    on('wf-gm-ver-run', 'click', onVerify);
    on('wf-gm-ver-golden-l0', 'click', function () { fillGolden(false); });
    on('wf-gm-ver-golden-l2', 'click', function () { fillGolden(true); });
    var root = $('wf-gm-root');
    if (root) root.addEventListener('click', function (ev) {
      var t = ev.target;
      var idAttr = t && t.getAttribute ? t.getAttribute('data-copy') : null;
      if (idAttr) doCopy(idAttr);
    });
  }

  function init(mount) {
    try { ensureGM(); } catch (e) { /* gmcore 未就绪时由集成器保证顺序；此处不阻塞 UI 注入 */ }
    if (!document.getElementById('wf-gm-root')) {
      var host = null;
      if (mount) host = typeof mount === 'string' ? document.querySelector(mount) : (mount.nodeType === 1 ? mount : null);
      if (!host) host = document.body;
      if (host) {
        var head = document.head || document.getElementsByTagName('head')[0];
        if (head && !document.getElementById('wf-gm-style')) {
          var style = document.createElement('style');
          style.id = 'wf-gm-style';
          style.textContent = CSS_TEXT;
          head.appendChild(style);
        }
        var wrap = document.createElement('div');
        wrap.innerHTML = HTML_FRAG;
        while (wrap.firstChild) host.appendChild(wrap.firstChild);
      }
    }
    if (!wired) { wire(); wired = true; }
  }

  function selftest() {
    var out = [];
    try { out = out.concat(C().smGoldenSelfTest()); }
    catch (e) { out.push({ name: 'GM-core 黄金断言', pass: false, detail: String(e && e.message || e) }); }
    if (typeof window.GM_PAGE_SELFTEST === 'function') {
      try { out = out.concat(window.GM_PAGE_SELFTEST()); }
      catch (e) { out.push({ name: 'GM 页面断言', pass: false, detail: String(e && e.message || e) }); }
    } else {
      out.push({ name: 'GM 页面断言', pass: false, detail: 'gm.selftest.js 未加载（window.GM_PAGE_SELFTEST 缺失）' });
    }
    return out;
  }

  if (typeof window !== 'undefined') {
    window.WF_REGISTRY = window.WF_REGISTRY || {};
    window.WF_REGISTRY[REG_ID] = {
      id: REG_ID,
      title: '国密 WOP-SM2-SM3',
      css: CSS_TEXT,
      html: HTML_FRAG,
      init: init,
      selftest: selftest
    };
    try { ensureGM(); } catch (e) { /* gmcore 后加载时 init/selftest 再建 */ }
  }
})();

