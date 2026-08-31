/* ===== gm/gm.selftest.js ===== */
/*! gm.selftest.js — wf-gm 页面级断言（GM_PAGE_SELFTEST）
 * 双环境兼容：浏览器以 script 标签加载挂 window.GM_PAGE_SELFTEST；node 以 new Function('window', code) 捕获。
 * 执行前置：gmcore.js 已加载（window.GmCore）、gm.js 已注册 WF_REGISTRY['wf-gm']。
 * 断言自初始化（obs 26775）：P2 先幂等调用 registry.init() 自行注入面板，不依赖集成器先行调用。
 * 每条断言标签 // spec:GM-P*；条款→断言反向核对矩阵见 gm/README.md。
 */
function GM_PAGE_SELFTEST() {
  'use strict';
  var out = [];
  function ok(name, detail) { out.push({ name: name, pass: true, detail: detail || '' }); }
  function bad(name, detail) { out.push({ name: name, pass: false, detail: detail || '' }); }
  function guard(name, fn) {
    try { fn(); } catch (e) { bad(name, '异常：' + (e && e.message || e)); }
  }
  function click(id) {
    var el = document.getElementById(id);
    if (!el) throw new Error('节点缺失: ' + id);
    el.click(); // 程序化触发（不依赖 actionability，obs 26736）
  }

  // spec:GM-P1 注册协议完整（WF_CONTRACT §注册协议）
  guard('GM-P1 注册协议', function () {
    var reg = window.WF_REGISTRY && window.WF_REGISTRY['wf-gm'];
    if (!reg) throw new Error('WF_REGISTRY["wf-gm"] 未注册');
    if (reg.id !== 'wf-gm') throw new Error('id 非法: ' + reg.id);
    if (typeof reg.title !== 'string' || !reg.title) throw new Error('title 缺失');
    if (typeof reg.css !== 'string' || !reg.css) throw new Error('css 字段缺失');
    if (typeof reg.html !== 'string' || reg.html.indexOf('wf-gm-root') < 0) throw new Error('html 片段缺根节点');
    if (typeof reg.init !== 'function') throw new Error('init 非函数');
    if (typeof reg.selftest !== 'function') throw new Error('selftest 非函数');
    ok('GM-P1 注册协议');
  });

  // spec:GM-P2 自初始化幂等注入（调用 init 两次仅一个根节点；关键 UI 节点齐备）
  guard('GM-P2 自初始化注入', function () {
    var reg = window.WF_REGISTRY['wf-gm'];
    reg.init();
    reg.init(); // 幂等性：二次调用不得重复注入
    var ids = ['wf-gm-root', 'wf-gm-keygen', 'wf-gm-req', 'wf-gm-ver',
      'wf-gm-keygen-btn', 'wf-gm-keygen-pem', 'wf-gm-priv-hex', 'wf-gm-priv-b64', 'wf-gm-priv-pem',
      'wf-gm-pub-hex', 'wf-gm-pub-b64', 'wf-gm-req-priv', 'wf-gm-req-pub', 'wf-gm-req-ppriv',
      'wf-gm-req-appkey', 'wf-gm-req-path', 'wf-gm-req-expired', 'wf-gm-req-body', 'wf-gm-req-l2',
      'wf-gm-req-build', 'wf-gm-req-usekeygen', 'wf-gm-req-tover', 'wf-gm-req-steps',
      'wf-gm-req-canonical', 'wf-gm-req-headers', 'wf-gm-req-wire', 'wf-gm-req-dek', 'wf-gm-req-curl',
      'wf-gm-ver-vpub', 'wf-gm-ver-dpriv', 'wf-gm-ver-method', 'wf-gm-ver-path',
      'wf-gm-ver-headers', 'wf-gm-ver-body', 'wf-gm-ver-run', 'wf-gm-ver-steps', 'wf-gm-ver-plain',
      'wf-gm-ver-golden-l0', 'wf-gm-ver-golden-l2'];
    var miss = ids.filter(function (id) { return !document.getElementById(id); });
    if (miss.length) throw new Error('缺失节点: ' + miss.join(','));
    var n = document.querySelectorAll('#wf-gm-root').length;
    if (n !== 1) throw new Error('重复注入: #wf-gm-root x' + n);
    if (!document.getElementById('wf-gm-style')) throw new Error('样式未注入(#wf-gm-style)');
    ok('GM-P2 自初始化注入', ids.length + ' 节点');
  });

  // spec:GM-P3 i18n 键均有非空中文回退（WF_CONTRACT §i18n；键前缀 wf-gm.）
  guard('GM-P3 i18n 回退文案', function () {
    var els = document.querySelectorAll('#wf-gm-root [data-i18n]');
    if (els.length < 10) throw new Error('data-i18n 节点过少: ' + els.length);
    var problems = [];
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-i18n');
      if (!/^wf-gm\./.test(k)) problems.push('前缀非法:' + k);
      else if (!String(els[i].textContent || '').trim()) problems.push('空回退:' + k);
    }
    if (problems.length) throw new Error(problems.join('; '));
    ok('GM-P3 i18n 回退文案', els.length + ' 键');
  });

  // spec:GM-P4 SM2 密钥生成（hex 格式 + PEM 分支）
  guard('GM-P4 SM2 密钥生成', function () {
    click('wf-gm-keygen-btn');
    var priv = document.getElementById('wf-gm-priv-hex').value;
    var pub = document.getElementById('wf-gm-pub-hex').value;
    if (!/^[0-9a-f]{64}$/.test(priv)) throw new Error('私钥格式非法: ' + priv.slice(0, 12) + '…');
    if (!/^04[0-9a-f]{128}$/.test(pub)) throw new Error('公钥格式非法（应 130 hex 04 开头）');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(document.getElementById('wf-gm-priv-b64').value)) throw new Error('私钥 Base64 格式非法');
    document.getElementById('wf-gm-keygen-pem').checked = true;
    click('wf-gm-keygen-btn');
    var pem = document.getElementById('wf-gm-priv-pem').value;
    if (!/^-----BEGIN PRIVATE KEY-----/.test(pem) || pem.indexOf('-----END PRIVATE KEY-----') < 0) {
      throw new Error('PKCS#8 PEM 格式非法');
    }
    if (document.querySelector('.wf-gm .wf-gm-pem').hidden) throw new Error('PEM 行未随勾选展开');
    document.getElementById('wf-gm-keygen-pem').checked = false;
    ok('GM-P4 SM2 密钥生成');
  });

  // spec:GM-P5 国密请求构造（L2 信封 + canonical 五段 + 签名头落表）
  guard('GM-P5 国密请求构造', function () {
    click('wf-gm-keygen-btn');
    click('wf-gm-req-usekeygen'); // 自闭环填充（演示：同一密钥对扮演两侧）
    document.getElementById('wf-gm-req-l2').checked = true;
    click('wf-gm-req-build');
    var steps = document.querySelectorAll('#wf-gm-req-steps li');
    if (!steps.length) throw new Error('无构造步骤输出');
    var badCnt = 0;
    for (var i = 0; i < steps.length; i++) if ((' ' + steps[i].className).indexOf('bad') >= 0) badCnt++;
    if (badCnt) throw new Error('构造步骤含失败项: ' + document.getElementById('wf-gm-req-steps').textContent.slice(0, 160));
    var wire = document.getElementById('wf-gm-req-wire').textContent.trim();
    if (!/^\{"encrypted":"[A-Za-z0-9_-]+"\}$/.test(wire)) throw new Error('线上密文格式非法: ' + wire.slice(0, 40));
    var lines = document.getElementById('wf-gm-req-canonical').textContent.split('\n');
    if (lines[0].indexOf('v1/') !== 0) throw new Error('canonical 首段非 authString');
    if (lines[1] !== 'POST') throw new Error('canonical 第二段非 POST');
    if (lines[3] !== '') throw new Error('canonical 第四段非空 query string');
    if (lines.length !== 9) throw new Error('canonical 行数非 4 段+5 头: ' + lines.length);
    if (lines[4].indexOf('x-wop-appkey:') !== 0) throw new Error('canonicalHeaders 首头非 appkey');
    var tbl = document.getElementById('wf-gm-req-headers').textContent;
    if (tbl.indexOf('x-wop-sign') < 0 || tbl.indexOf('WOP-SM2-SM3 v1/') < 0) throw new Error('头部表缺 x-wop-sign');
    if (tbl.indexOf('x-wop-encrypt') < 0 || tbl.indexOf('L2;dek=') < 0) throw new Error('头部表缺 x-wop-encrypt(L2)');
    if (tbl.indexOf('x-wop-content-digest') < 0 || tbl.indexOf('sm3 ') < 0) throw new Error('头部表缺 sm3 digest');
    if (tbl.indexOf('x-wop-appkey') < 0) throw new Error('头部表缺 x-wop-appkey（SM2 userId 契约）');
    var dek = document.getElementById('wf-gm-req-dek').textContent;
    if (!/^SM4-GCM\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{16}$/.test(dek)) throw new Error('DEK 载荷格式非法: ' + dek);
    ok('GM-P5 国密请求构造');
  });

  // spec:GM-P6 页内往返（构造 → 填充验证区 → 五步全绿 → 明文还原）
  guard('GM-P6 页内往返', function () {
    click('wf-gm-req-tover');
    click('wf-gm-ver-run');
    var ul = document.getElementById('wf-gm-ver-steps');
    if (ul.getAttribute('data-allok') !== '1') {
      throw new Error('五步未全绿: ' + ul.textContent.slice(0, 200));
    }
    if (ul.querySelectorAll('li.bad').length) throw new Error('存在红步骤');
    if (ul.querySelectorAll('li.ok').length !== 5) throw new Error('步骤数非 5: ' + ul.querySelectorAll('li').length);
    var plain = document.getElementById('wf-gm-ver-plain').value;
    if (plain.indexOf('orderId') < 0) throw new Error('解密报文缺业务字段: ' + plain.slice(0, 60));
    if (plain !== document.getElementById('wf-gm-req-body').value) throw new Error('解密报文与构造明文不一致');
    ok('GM-P6 页内往返');
  });

  // spec:GM-P7 黄金向量 L2 五步全绿（黄金密文字节 100% 复用，仅签名现算）
  guard('GM-P7 黄金 L2 全绿', function () {
    click('wf-gm-ver-golden-l2');
    var ul = document.getElementById('wf-gm-ver-steps');
    if (ul.getAttribute('data-allok') !== '1') throw new Error('黄金 L2 未全绿: ' + ul.textContent.slice(0, 200));
    var G = window.GmCore.GOLDEN_SM;
    var plain = document.getElementById('wf-gm-ver-plain').value;
    if (plain !== G.message) throw new Error('解密报文与黄金 message 不一致: ' + plain.slice(0, 40));
    ok('GM-P7 黄金 L2 全绿');
  });

  // spec:GM-P8 篡改负路径（线上密文改动一字 → 摘要复核步红，全流水线判负）
  guard('GM-P8 篡改被拒', function () {
    click('wf-gm-ver-golden-l2');
    var body = document.getElementById('wf-gm-ver-body');
    var s = body.value;
    var c = s.charAt(s.length - 2); // 倒数第二字符（密文尾）替换为确定不同的字符，长度不变
    body.value = s.slice(0, -2) + (c === 'A' ? 'B' : 'A') + s.slice(-1);
    click('wf-gm-ver-run');
    var ul = document.getElementById('wf-gm-ver-steps');
    if (ul.getAttribute('data-allok') !== '0') throw new Error('篡改后应整体判负');
    var bads = ul.querySelectorAll('li.bad');
    if (!bads.length) throw new Error('无红步骤');
    var texts = '';
    for (var i = 0; i < bads.length; i++) texts += bads[i].textContent + '|';
    if (texts.indexOf('摘要') < 0) throw new Error('红步骤不含摘要复核: ' + texts.slice(0, 120));
    if (document.getElementById('wf-gm-ver-plain').value) throw new Error('判负时不应展示明文');
    ok('GM-P8 篡改被拒', texts.slice(0, 60));
  });

  // spec:GM-P11 跨 appkey 验签必败（userId 契约：构造 appkey=A，验证区 appkey=B → 整体判负）
  guard('GM-P11 跨 appkey 验签被拒', function () {
    click('wf-gm-req-usekeygen');
    click('wf-gm-req-build');
    click('wf-gm-req-tover');
    var h = document.getElementById('wf-gm-ver-headers');
    var lines = h.value.split('\n');
    var idx = -1;
    for (var i = 0; i < lines.length; i++) if (lines[i].indexOf('x-wop-appkey:') === 0) idx = i;
    if (idx < 0) throw new Error('验证区缺 x-wop-appkey 行');
    lines[idx] = 'x-wop-appkey: another-app-key';
    h.value = lines.join('\n');
    click('wf-gm-ver-run');
    var ul = document.getElementById('wf-gm-ver-steps');
    if (ul.getAttribute('data-allok') !== '0') throw new Error('签名 appkey 与验证 appkey 不一致应整体判负');
    var bads = ul.querySelectorAll('li.bad');
    if (!bads.length) throw new Error('无红步骤');
    ok('GM-P11 跨 appkey 验签被拒', '构造 demo_app_key / 验证 another-app-key 判负');
    // spec:GM-P11-build-empty：onBuild 空 appkey → 显式报错（不得静默回退默认）
    var reqAppkey = document.getElementById('wf-gm-req-appkey');
    var savedReqAppkey = reqAppkey.value;
    reqAppkey.value = '';
    click('wf-gm-req-build');
    var reqSteps = document.getElementById('wf-gm-req-steps');
    if (reqSteps.textContent.indexOf('x-wop-appkey 必填') < 0) throw new Error('build 空 appkey 未报错: ' + reqSteps.textContent.slice(0, 60));
    ok('GM-P11 build 空 appkey 拒收', 'onBuild 缺 appkey 显式报错');
    reqAppkey.value = savedReqAppkey;
    // spec:GM-P11-ver-misshead：验证区缺 x-wop-appkey 头且签名未声明 → onVerify needappkey 显式报错（signedNames 不含则 miss 检查不拦截，直达 userId 检查）
    var h2 = document.getElementById('wf-gm-ver-headers');
    var lines3 = h2.value.split('\n');
    var sigIdx = -1;
    for (var j = 0; j < lines3.length; j++) if (lines3[j].indexOf('x-wop-sign:') === 0) sigIdx = j;
    if (sigIdx < 0) throw new Error('验证区缺 x-wop-sign 行');
    var sigLine = lines3[sigIdx];
    var sp2 = sigLine.indexOf(' ');
    var seg2 = sigLine.slice(sp2 + 1).split('/');
    var nms2 = seg2[2].split(';').filter(function (n) { return n && n !== 'x-wop-appkey'; });
    seg2[2] = nms2.join(';');
    lines3[sigIdx] = sigLine.slice(0, sp2 + 1) + seg2.join('/');
    h2.value = lines3.filter(function (l) { return l.indexOf('x-wop-appkey:') !== 0; }).join('\n');
    click('wf-gm-ver-run');
    var ul2 = document.getElementById('wf-gm-ver-steps');
    if (ul2.textContent.indexOf('x-wop-appkey 必填') < 0) throw new Error('onVerify 缺 appkey 头未报错: ' + ul2.textContent.slice(0, 60));
    ok('GM-P11 缺 appkey 头拒收', 'onVerify 缺 x-wop-appkey 头显式报错');
  });

  // spec:GM-P9 黄金向量 L0（明文流：DEK/解密步跳过，其余全绿）
  guard('GM-P9 黄金 L0 全绿', function () {
    click('wf-gm-ver-golden-l0');
    var ul = document.getElementById('wf-gm-ver-steps');
    if (ul.getAttribute('data-allok') !== '1') throw new Error('黄金 L0 未全绿: ' + ul.textContent.slice(0, 200));
    if (document.getElementById('wf-gm-ver-plain').value.indexOf('明文流') < 0) throw new Error('明文流提示缺失');
    ok('GM-P9 黄金 L0 全绿');
  });

  // spec:GM-P10 window.GM 适配器（WF_CONTRACT §33：sm2/sm3/sm4 原语面 + 推导一致性）
  guard('GM-P10 window.GM 适配器', function () {
    var GM = window.GM;
    if (!GM || !GM.sm2 || !GM.sm3 || !GM.sm4) throw new Error('GM 适配器形状缺失');
    ['keygen', 'pubFromPriv', 'sign', 'verify', 'encryptDek', 'decryptDek'].forEach(function (k) {
      if (typeof GM.sm2[k] !== 'function') throw new Error('GM.sm2.' + k + ' 缺失');
    });
    if (typeof GM.sm3.hex !== 'function' || typeof GM.sm3.digestHeader !== 'function') throw new Error('GM.sm3 原语缺失');
    ['gcmEncrypt', 'gcmDecrypt', 'buildDek'].forEach(function (k) {
      if (typeof GM.sm4[k] !== 'function') throw new Error('GM.sm4.' + k + ' 缺失');
    });
    var G = GM.GOLDEN_SM || window.GmCore.GOLDEN_SM;
    if (GM.sm2.pubFromPriv(G.privHex) !== G.pubHex) throw new Error('pubFromPriv 与黄金公钥不一致');
    if (GM.sm3.hex(GM.utf8Encode(G.message)) !== G.sm3Hex) throw new Error('sm3.hex 与黄金摘要不一致');
    ok('GM-P10 window.GM 适配器');
  });

  return out;
}

if (typeof window !== 'undefined') window.GM_PAGE_SELFTEST = GM_PAGE_SELFTEST;

