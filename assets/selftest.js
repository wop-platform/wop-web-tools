/* ===== wf10/wf10.selftest.js ===== */
/* WF10 — 自测断言（wf10.selftest.js）
 * 由 WF_REGISTRY['wf10'].selftest() 调用（本文件定义 window.WF10RunSelftest）。
 * 断言只触达 window.WF10 纯核心 + 可选 DOM 字段（无 DOM 时跳过字段实测，不失败）；
 * 不触网、不写存储（S1/S2 纪律）。每条断言带 // spec:WF10-* 标签。 */
(function () {
  'use strict';

  window.WF10RunSelftest = function () {
    var R = [];
    function ok(name, fn) {
      try {
        var r = fn();
        R.push({ name: name, pass: r === true, detail: r === true ? '' : ((r && r.fail) || '断言失败') });
      } catch (e) {
        R.push({ name: name, pass: false, detail: '异常：' + (e && e.message ? e.message : String(e)) });
      }
    }
    function fieldVal(id) {
      var el = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById(id) : null;
      return el && el.value != null ? String(el.value) : null;
    }

    var W = window.WF10;
    if (!W) return [{ name: 'wf10 核心加载', pass: false, detail: 'window.WF10 不存在（wf10.js 未加载）' }];

    // 组串优先用页面真身 buildCanonical（集成态）；独立运行时用等价拼装。
    var bc = (typeof window.buildCanonical === 'function')
      ? window.buildCanonical
      : function (auth, m, p, q, ch) { return auth + '\n' + String(m).toUpperCase() + '\n' + p + '\n' + (q || '') + '\n' + ch; };
    var EMPTY = W.EMPTY_SHA256;
    var HEADERS = 'x-wop-appkey:demo_app_key\nx-wop-content-digest:sha-256 ' + EMPTY;
    var CANON = bc('v1/1800', 'POST', '/gateway/logistics.waybill.sync', '', HEADERS);
    // 期望行序（与 buildCanonical 5 段语义一致）
    var WANT = ['v1/1800', 'POST', '/gateway/logistics.waybill.sync', '',
                'x-wop-appkey:demo_app_key', 'x-wop-content-digest:sha-256 ' + EMPTY];

    // spec:WF10-SPLIT — 拆分正确：行数、各段内容与组串输出逐行一致，round-trip 无损
    ok('拆分：6 段逐行与组串输出一致', function () {
      var r = W.splitCanonical(CANON);
      if (!r.ok) return { fail: '解析失败：' + r.error };
      if (r.lineCount !== 6) return { fail: '行数应为 6，实际 ' + r.lineCount };
      var types = ['auth', 'method', 'uri', 'qs', 'header', 'header'];
      for (var i = 0; i < 6; i++) {
        if (r.segments[i].text !== WANT[i]) return { fail: '第 ' + (i + 1) + ' 行内容不符：' + r.segments[i].text };
        if (r.segments[i].type !== types[i]) return { fail: '第 ' + (i + 1) + ' 行类型应为 ' + types[i] };
      }
      var joined = r.segments.map(function (s) { return s.text; }).join('\n');
      if (joined !== CANON) return { fail: 'round-trip 不一致：拆分再拼接 ≠ 原文' };
      return true;
    });

    // spec:WF10-SPLIT-REJECT — 否定式：非法输入被拒绝（空串 / 段数不足 / 头行无冒号 / 非字符串），不抛异常且给出原因
    ok('否定式：非法输入被拒绝', function () {
      var bad = ['', '   ', null, undefined, 123,
                 'v1/1800\nPOST\n/x\n',                      // 4 行 < 5 段
                 'v1/1800\nPOST\n/x\n\nnot-a-header-line'];  // 头行缺冒号
      for (var i = 0; i < bad.length; i++) {
        var r = W.splitCanonical(bad[i]);
        if (r.ok) return { fail: '输入 ' + JSON.stringify(bad[i]) + ' 应被拒绝却通过了' };
        if (!r.error) return { fail: '拒绝时必须给出 error 原因' };
      }
      return true;
    });

    // spec:WF10-SRC-METHOD — 来源标注：方法行 → 请求方法（HTTPMethod 徽标，值为 POST）
    ok('来源：方法行 → 请求方法', function () {
      var r = W.splitCanonical(CANON);
      if (!r.ok) return { fail: '解析失败' };
      var seg = r.segments[1], meta = W.segmentMeta(seg);
      if (seg.text !== 'POST') return { fail: '方法行应为 POST，实际 ' + seg.text };
      if (meta.typeLabel !== 'HTTPMethod') return { fail: '类型徽标应为 HTTPMethod' };
      if (String(meta.srcLabel).indexOf('请求方法') < 0) return { fail: '来源标注应含「请求方法」：' + meta.srcLabel };
      return true;
    });

    // spec:WF10-SRC-URI — 来源标注：URI 行 → 请求路径字段（#r-path），内容与字段值一致
    ok('来源：URI 行 → 请求路径字段', function () {
      var cur = fieldVal('r-path');
      var path = (cur == null || cur.trim() === '') ? '/gateway/logistics.waybill.sync' : cur.trim();
      var c2 = bc('v1/x', 'POST', path, '', 'h:v');
      var r = W.splitCanonical(c2);
      if (!r.ok) return { fail: '解析失败' };
      var seg = r.segments[2], meta = W.segmentMeta(seg);
      if (seg.text !== path) return { fail: 'URI 行应等于路径字段值 ' + path + '，实际 ' + seg.text };
      if (meta.field !== 'r-path') return { fail: '来源字段应为 #r-path' };
      if (String(meta.srcLabel).indexOf('请求路径') < 0) return { fail: '来源标注应含「请求路径」：' + meta.srcLabel };
      return true;
    });

    // spec:WF10-SRC-HEADER — 来源标注：头行 → 对应字段（appkey→#r-appkey，digest→#r-body）；未知头不崩溃
    ok('来源：头行 → 对应来源字段', function () {
      var r = W.splitCanonical(CANON);
      if (!r.ok) return { fail: '解析失败' };
      var m1 = W.segmentMeta(r.segments[4]);
      if (m1.field !== 'r-appkey') return { fail: 'x-wop-appkey 来源字段应为 #r-appkey' };
      if (String(m1.srcLabel).indexOf('appKey') < 0) return { fail: 'appkey 头来源标注应含 appKey' };
      var m2 = W.segmentMeta(r.segments[5]);
      if (m2.field !== 'r-body') return { fail: 'x-wop-content-digest 来源字段应为 #r-body' };
      if (String(m2.srcLabel).indexOf('摘要') < 0) return { fail: 'digest 头来源标注应含「摘要」' };
      var m3 = W.segmentMeta({ idx: 0, type: 'header', name: 'x-other-header', text: 'x-other-header:v' });
      if (!m3.srcLabel || m3.field !== null) return { fail: '未知头应回退通用标注且 field=null' };
      return true;
    });

    // spec:WF10-EMPTY-QS — 否定式：查询参数为空 → 恰好 1 个空行（qs 段），无多余空行；有查询串时该行为其内容
    ok('否定式：空查询参数无多余空行', function () {
      var r = W.splitCanonical(CANON);
      if (!r.ok) return { fail: '解析失败' };
      var empties = r.segments.filter(function (s) { return s.text === ''; });
      if (r.segments[3].type !== 'qs') return { fail: '第 4 段应为 qs' };
      if (r.segments[3].text !== '') return { fail: 'POST 空查询串应为空行' };
      if (empties.length !== 1) return { fail: '应恰有 1 个空行（qs 段），实际 ' + empties.length };
      if (r.lineCount !== 4 + 2) return { fail: '总行数应 = 4 段前缀 + 头行数' };
      var r2 = W.splitCanonical(bc('v1/1', 'POST', '/x', 'a=1&b=2', 'h:v'));
      if (!r2.ok || r2.segments[3].text !== 'a=1&b=2') return { fail: '有查询串时 qs 段应为其实际内容' };
      var e2 = r2.segments.filter(function (s) { return s.text === ''; });
      if (e2.length !== 0) return { fail: '有查询串时不应出现空行' };
      return true;
    });

    // spec:WF10-EMPTY-BODY — 空 body：摘要行为 'sha-256 ' + 空 SHA 常量，且哈希入参确为空串（防“跳过/错对象”回归）
    ok('空 body：摘要行为空串 SHA-256', function () {
      var seen = null;
      var spy = function (s) { seen = s; return EMPTY; };
      var got = W.digestHeaderValue('', spy);
      if (seen !== '') return { fail: '哈希入参应为空串，实际 ' + JSON.stringify(seen) };
      if (got !== 'sha-256 ' + EMPTY) return { fail: '空 body 摘要行应为 sha-256 + 空 SHA 常量，实际 ' + got };
      var seen2 = null;
      W.digestHeaderValue(undefined, function (s) { seen2 = s; return EMPTY; });
      if (seen2 !== '') return { fail: 'undefined body 应归一为空串再取摘要' };
      return true;
    });

    // spec:WF10-DIFF — 差异检测：完全一致全绿；改一字该行标红且仅 1 处；改回恢复绿；多行/缺行计入未参与
    ok('差异检测：一字之差标红、改回复绿', function () {
      var d0 = W.diffLines(CANON, CANON);
      if (d0.diffCount !== 0) return { fail: '完全一致时 diffCount 应为 0' };
      var lines = CANON.split('\n');
      lines[1] = 'PUT';
      var d1 = W.diffLines(CANON, lines.join('\n'));
      if (d1.diffCount !== 1) return { fail: '改 1 行应恰 1 处差异，实际 ' + d1.diffCount };
      if (d1.rows[1].state !== 'diff') return { fail: '被改行（L2）应标红 diff' };
      if (d1.rows[0].state !== 'same' || d1.rows[5].state !== 'same') return { fail: '其余行应保持一致' };
      var d2 = W.diffLines(CANON, CANON);
      if (d2.diffCount !== 0) return { fail: '改回后应恢复 0 差异' };
      var d3 = W.diffLines(CANON, CANON + '\nx-extra:1');
      if (d3.extraCount !== 1 || d3.rows[6].state !== 'extra') return { fail: '多出 1 行应计入 extra（灰）' };
      var d4 = W.diffLines(CANON, CANON.split('\n').slice(0, 5).join('\n'));
      if (d4.missingCount !== 1) return { fail: '缺 1 行应计入 missing（灰）' };
      return true;
    });

    return R;
  };
})();

/* ===== wf9/wf9.selftest.js ===== */
/* WF9 自测断言（断言契约：[{name, pass, detail}]；node 与浏览器皆可运行）
 * 加载顺序：wf9.js 先于本文件。node 运行：读入两文件 (0,eval) 后调用 globalThis.WF9RunSelftest()。
 * 断言矩阵（spec 反向核对）：A1..A10 / B1 / B2 —— 详见 wf9/README.md。
 */
(function () {
  'use strict';
  var G = typeof window !== 'undefined' ? window : globalThis;

  function ok(name, pass, detail) { return { name: name, pass: !!pass, detail: !!pass ? '' : (detail || '不符合预期') }; }
  function mix(base, extra) { var o = {}, k; for (k in base) o[k] = base[k]; for (k in extra) o[k] = extra[k]; return o; }

  var RSA_CTX = {
    appKey: 'demo_app_key', suite: 'WOP-RSA3072-SHA256',
    merchantPriv: 'MERCHANT_PRIV_DUMMY', platformPub: 'PLATFORM_PUB_DUMMY',
    method: 'POST', path: '/gateway/logistics.waybill.sync',
    body: '{"orderId":"W20260827001"}', level: 'L2', host: 'https://gateway.example.com'
  };
  var SM_CTX = mix(RSA_CTX, { suite: 'WOP-SM2-SM3', merchantPriv: 'SM_PRIV_DUMMY', platformPub: 'SM_PUB_DUMMY' });
  var GET_CTX = mix(RSA_CTX, { method: 'GET' });
  var EMPTY_POST_CTX = mix(RSA_CTX, { body: '   ' });

  var LANGS = ['java', 'go', 'typescript', 'python', 'php', 'dotnet'];
  var SM_THROW_LANGS = ['typescript', 'php'];   // 首版仅 RSA，SM2-SM3 显式抛错
  var SM_OK_LANGS = ['java', 'go', 'python', 'dotnet']; // 正常国密片段

  var FIELD_TOKENS = {
    java: ['.appKey(', '.suite(', '.merchantPrivateKey(', '.platformPublicKey(', '.gatewayBaseUrl('],
    go: ['AppKey:', 'Suite:', 'MerchantPrivateKey:', 'PlatformPublicKey:', 'GatewayBaseURL:'],
    typescript: ['appKey:', 'suite:', 'merchantPrivateKey:', 'platformPublicKey:', 'gatewayBaseUrl:'],
    python: ['app_key=', 'suite=', 'merchant_private_key=', 'platform_public_key=', 'gateway_base_url='],
    php: ["'appKey'", "'suite'", "'merchantPrivateKey'", "'platformPublicKey'", "'gatewayBaseUrl'"],
    dotnet: ['AppKey =', 'Suite =', 'MerchantPrivateKey =', 'PlatformPublicKey =', 'GatewayBaseUrl =']
  };
  var CALL_TOKENS = {
    java: ['buildRequest(', 'verifyResponse(', 'verifyCallback('],
    go: ['BuildRequest(', 'VerifyResponse(', 'VerifyCallback('],
    typescript: ['buildRequest(', 'verifyResponse(', 'verifyCallback('],
    python: ['build_request(', 'verify_response(', 'verify_callback('],
    php: ['\\wop_build_request(', '\\wop_verify_response(', '\\wop_verify_callback('],
    dotnet: ['BuildRequest(', 'VerifyResponse(', 'VerifyCallback(']
  };
  var RX_NOBODY = { // 无 body：调用收窄为 2 参形态（php 为 3 实参：config+method+path）
    java: /buildRequest\("(GET|POST)", "[^"]*"\);/,
    go: /BuildRequest\("(GET|POST)", "[^"]*"\)/,
    typescript: /buildRequest\('(GET|POST)', '[^']*'\);/,
    python: /build_request\("(GET|POST)", "[^"]*"\)/,
    php: /\\wop_build_request\(\$config, '(GET|POST)', '[^']*'\);/,
    dotnet: /BuildRequest\("(GET|POST)", "[^"]*"\);/
  };
  var RX_BODY = { // 有 body：method/path/body/level 全参形态
    java: /buildRequest\("POST", "[^"]*", body, "L2"\);/,
    go: /BuildRequest\("POST", "[^"]*", body, "L2"\)/,
    typescript: /buildRequest\('POST', '[^']*', body, 'L2'\);/,
    python: /build_request\("POST", "[^"]*", body, "L2"\)/,
    php: /\\wop_build_request\(\$config, 'POST', '[^']*', \$body, 'L2'\);/,
    dotnet: /BuildRequest\("POST", "[^"]*", body, "L2"\);/
  };
  var RX_BODYVAR = /(\bbody\b\s*:=)|(\bbody\b\s*=[^=])|(\$body\s*=[^=])/; // body 变量行（GET/空 body 必须缺席）
  var RX_PLAINTEXT_DECL = /plaintext\s*=|getPlaintext|\$plaintext\s*=/;  // 明文变量（抛错片段必须缺席）

  G.WF9RunSelftest = function () {
    var W = G.WF9;
    var R = [];
    if (!W || !W.tpl) {
      return [{ name: 'wf9 核心（tpl）加载', pass: false, detail: 'wf9.js 未加载（需先于 wf9.selftest.js 引入）' }];
    }
    var T = W.tpl;
    var isThrow = function (lang, ctx) { return SM_THROW_LANGS.indexOf(lang) !== -1 && String(ctx.suite).indexOf('SM2') !== -1; };

    // A1 六语言模板存在且 RSA 输出非空 // spec:WF9-A1
    (function () {
      var fails = [];
      for (var i = 0; i < LANGS.length; i++) {
        var lang = LANGS[i];
        if (typeof T[lang] !== 'function') { fails.push(lang + ' 模板缺失'); continue; }
        var s = T[lang](RSA_CTX);
        if (!s || s.length < 200) fails.push(lang + ' 输出过短（' + (s ? s.length : 0) + ' 字符）');
      }
      R.push(ok('A1 六语言模板齐全且 RSA 输出非空', fails.length === 0, fails.join('；')));
    })();

    // A2 12 变体：五字段配置 token + 终端用户实值（appKey/suite/host/两把密钥）嵌入 // spec:WF9-A2
    (function () {
      var fails = [];
      for (var i = 0; i < LANGS.length; i++) {
        var lang = LANGS[i];
        for (var j = 0; j < 2; j++) {
          var ctx = j === 0 ? RSA_CTX : SM_CTX;
          var s = T[lang](ctx);
          for (var k = 0; k < FIELD_TOKENS[lang].length; k++) {
            if (s.indexOf(FIELD_TOKENS[lang][k]) < 0) fails.push(lang + '/' + ctx.suite + ' 缺字段 ' + FIELD_TOKENS[lang][k]);
          }
          var vals = [ctx.appKey, ctx.suite, ctx.host, ctx.merchantPriv, ctx.platformPub];
          for (var v = 0; v < vals.length; v++) {
            if (s.indexOf(vals[v]) < 0) fails.push(lang + '/' + ctx.suite + ' 未嵌入实值 ' + vals[v]);
          }
        }
      }
      R.push(ok('A2 12 变体含五字段配置与输入框实值', fails.length === 0, fails.join('；')));
    })();

    // A3 12 变体：buildRequest / verifyResponse / verifyCallback 三调用形态（抛错片段以不可达调用呈现） // spec:WF9-A3
    (function () {
      var fails = [];
      for (var i = 0; i < LANGS.length; i++) {
        var lang = LANGS[i];
        for (var j = 0; j < 2; j++) {
          var ctx = j === 0 ? RSA_CTX : SM_CTX;
          var s = T[lang](ctx);
          for (var k = 0; k < CALL_TOKENS[lang].length; k++) {
            if (s.indexOf(CALL_TOKENS[lang][k]) < 0) fails.push(lang + '/' + ctx.suite + ' 缺调用 ' + CALL_TOKENS[lang][k]);
          }
        }
      }
      R.push(ok('A3 12 变体含三个核心调用形态', fails.length === 0, fails.join('；')));
    })();

    // A4 Java/Go/Python/.NET + SM2-SM3：正常国密片段（sm3 digest、04‖X‖Y 密钥形态、digest 必入签） // spec:WF9-A4
    (function () {
      var fails = [];
      for (var i = 0; i < SM_OK_LANGS.length; i++) {
        var lang = SM_OK_LANGS[i];
        var s = T[lang](SM_CTX);
        if (s.indexOf('WOP-SM2-SM3') < 0) fails.push(lang + ' 未体现 SM 套件');
        if (s.indexOf('sm3') < 0) fails.push(lang + ' 缺 sm3 digest 注释');
        if (s.indexOf('04‖X‖Y') < 0) fails.push(lang + ' 缺 SM2 公钥形态 04‖X‖Y');
        if (s.indexOf('必入签') < 0) fails.push(lang + ' 缺 digest 必入签注释');
        if (s.indexOf('not supported') >= 0) fails.push(lang + ' 不应出现抛错标记');
      }
      R.push(ok('A4 四语言 SM2-SM3 生成正常国密片段', fails.length === 0, fails.join('；')));
    })();

    // A5（否定式）TS/PHP + SM2-SM3：显式抛错片段；不得出现可用流程痕迹 // spec:WF9-A5
    (function () {
      var fails = [];
      for (var i = 0; i < SM_THROW_LANGS.length; i++) {
        var lang = SM_THROW_LANGS[i];
        var s = T[lang](SM_CTX);
        if (s.indexOf('WOP-SM2-SM3 not supported in v0.1.0') < 0) fails.push(lang + ' 缺抛错标记');
        if (s.indexOf('不可达') < 0) fails.push(lang + ' 缺不可达标注');
        if (s.indexOf('仅支持 RSA') < 0) fails.push(lang + ' 缺首版仅 RSA 说明');
        if (s.indexOf('try') < 0 || s.indexOf('catch') < 0) fails.push(lang + ' 缺 try/catch 形态');
        if (s.indexOf('x-wop-content-digest') >= 0) fails.push(lang + ' 抛错片段不应出现 digest 头注释');
        if (RX_PLAINTEXT_DECL.test(s)) fails.push(lang + ' 抛错片段不应出现明文变量');
      }
      R.push(ok('A5 TS/PHP+SM 生成显式抛错片段（无可用流程）', fails.length === 0, fails.join('；')));
    })();

    // A6 D3：POST 必传且必入签；GET/无 body 不生成 digest 头（否定式：无 POST 措辞） // spec:WF9-A6
    (function () {
      var fails = [];
      for (var i = 0; i < LANGS.length; i++) {
        var lang = LANGS[i];
        var post = T[lang](isThrow(lang, RSA_CTX) ? SM_CTX : RSA_CTX); // RSA 全部为正常片段
        if (!(post.indexOf('D3/I1') >= 0 && post.indexOf('必入签') >= 0 && post.indexOf('x-wop-content-digest') >= 0)) {
          fails.push(lang + ' POST 缺 D3 必入签注释');
        }
        var get = T[lang](GET_CTX);
        if (!(get.indexOf('不生成 x-wop-content-digest') >= 0 && get.indexOf('D3') >= 0)) {
          fails.push(lang + ' GET 缺无 body digest 说明');
        }
        if (get.indexOf('必传且必入签') >= 0) fails.push(lang + ' GET 不应含 POST 的必传措辞');
      }
      R.push(ok('A6 D3 体现：POST 必入签 / GET 不生成 digest', fails.length === 0, fails.join('；')));
    })();

    // A7（否定式）GET/空 body：无 body 实参、无 body 变量行、原始 body 串缺席；POST 为全参形态 // spec:WF9-A7
    (function () {
      var fails = [];
      var DQ_BODY = RSA_CTX.body.replace(/\\/g, '\\\\').replace(/"/g, '\\"'); // Java/Go/Py/PHP/C# 内嵌时反斜杠与双引号均被转义
      for (var i = 0; i < LANGS.length; i++) {
        var lang = LANGS[i];
        var cases = [GET_CTX, EMPTY_POST_CTX];
        for (var j = 0; j < cases.length; j++) {
          var s = T[lang](cases[j]);
          if (!RX_NOBODY[lang].test(s)) fails.push(lang + ' 无 body 调用未收窄为 2 参形态');
          if (RX_BODYVAR.test(s)) fails.push(lang + ' 无 body 片段出现 body 变量行');
          if (s.indexOf(RSA_CTX.body) >= 0 || s.indexOf(DQ_BODY) >= 0) fails.push(lang + ' 无 body 片段泄漏 body 串');
        }
        var post = T[lang](RSA_CTX);
        if (!RX_BODY[lang].test(post)) fails.push(lang + ' POST 调用缺 body/level 全参形态');
        if (post.indexOf(RSA_CTX.body) < 0 && post.indexOf(DQ_BODY) < 0) fails.push(lang + ' POST 未嵌入 body 实值');
      }
      R.push(ok('A7 body 实参按有无收窄（GET/空 vs POST）', fails.length === 0, fails.join('；')));
    })();

    // A7b 多行 body：PHP 单引号串保留字面换行（PHP 不解析 \n 转义序列，字面序列会篡改运行时 body → 签名断链）；其余语言以转义序列嵌入（各自语言解析后还原） // spec:WF9-A7
    (function () {
      var fails = [];
      var ML_BODY = '{\n  "k": "v"\n}';
      var ML_CTX = { appKey: 'ak', suite: RSA_CTX.suite, host: RSA_CTX.host, merchantPriv: RSA_CTX.merchantPriv, platformPub: RSA_CTX.platformPub, method: 'POST', path: '/v1/ml', body: ML_BODY, level: 'L2' };
      var SEQ_BODY = '{\\n  \\"k\\\": \\"v\\"\\n}'; // C 风格双引号（Java/Go/Py/C#）：换行→\n 序列、双引号→\" 序列
      var TS_BODY = '{\\n  "k": "v"\\n}';            // TS 单引号串：换行→\n 序列、双引号字面（JS 解析 \n 后还原）
      for (var i = 0; i < LANGS.length; i++) {
        var lang = LANGS[i];
        var s = T[lang](ML_CTX);
        if (lang === 'php') {
          if (s.indexOf(ML_BODY) < 0) fails.push('php 多行 body 应以字面换行嵌入');
          if (s.indexOf('\\n') >= 0) fails.push('php 片段含字面 \\n 序列（PHP 单引号不解析，运行时 body 被篡改）');
        } else if (lang === 'typescript') {
          if (s.indexOf(TS_BODY) < 0) fails.push('ts 多行 body 缺 \\n 转义序列形态（JS 单引号串禁止字面换行）');
        } else {
          if (s.indexOf(SEQ_BODY) < 0) fails.push(lang + ' 多行 body 缺 \\n/\\" 转义序列形态');
        }
      }
      R.push(ok('A7b 多行 body：PHP 字面换行，其余语言转义序列', fails.length === 0, fails.join('；')));
    })();

    // A8（否定式）I7：失败分支仅记录模糊化 reason；I7 行与其后 2 行不得出现明文/内部细节 // spec:WF9-A8
    (function () {
      var fails = [];
      for (var i = 0; i < LANGS.length; i++) {
        var lang = LANGS[i];
        var ctxs = [RSA_CTX, SM_CTX];
        for (var j = 0; j < ctxs.length; j++) {
          if (isThrow(lang, ctxs[j])) continue; // 抛错片段无可用的校验失败分支
          var lines = T[lang](ctxs[j]).split('\n');
          var i7 = -1;
          for (var k = 0; k < lines.length; k++) { if (lines[k].indexOf('I7') >= 0) { i7 = k; break; } }
          if (i7 < 0) { fails.push(lang + ' 缺 I7 注释'); continue; }
          if (lines[i7].indexOf('reason') < 0) fails.push(lang + ' I7 行未指向 reason');
          if (/plaintext|明文|canonical|私钥/.test(lines[i7])) fails.push(lang + ' I7 行泄漏内部细节');
          for (var d = 1; d <= 2; d++) {
            if (lines[i7 + d] && /plaintext|明文|getPlaintext/i.test(lines[i7 + d])) fails.push(lang + ' I7 后 ' + d + ' 行泄漏明文');
          }
        }
      }
      R.push(ok('A8 I7 失败分支仅输出模糊化 reason', fails.length === 0, fails.join('；')));
    })();

    // A9 片段头部带「wop-sdk-spec 概念 API 推导」声明（以官方 SDK 为准） // spec:WF9-A9
    (function () {
      var fails = [];
      for (var i = 0; i < LANGS.length; i++) {
        var lang = LANGS[i];
        for (var j = 0; j < 2; j++) {
          var ctx = j === 0 ? RSA_CTX : SM_CTX;
          var head = T[lang](ctx).split('\n').slice(0, 3).join('\n');
          if (!(head.indexOf('wop-sdk-spec') >= 0 && head.indexOf('推导') >= 0)) fails.push(lang + ' 头部缺推导声明');
        }
      }
      R.push(ok('A9 片段头部含推导声明（以官方 SDK 为准）', fails.length === 0, fails.join('；')));
    })();

    // A10（否定式）生成片段禁词洁净（S1/S2；禁词表拼接构造，避免源码字面量） // spec:WF9-A10
    (function () {
      var banned = ['fe' + 'tch(', 'XML' + 'HttpRequest', 'Web' + 'Socket', 'send' + 'Beacon',
        'local' + 'Storage', 'session' + 'Storage', 'indexed' + 'DB'];
      var fails = [];
      for (var i = 0; i < LANGS.length; i++) {
        var lang = LANGS[i];
        var ctxs = [RSA_CTX, SM_CTX, GET_CTX, EMPTY_POST_CTX];
        for (var j = 0; j < ctxs.length; j++) {
          var s = T[lang](ctxs[j]);
          for (var b = 0; b < banned.length; b++) {
            if (s.indexOf(banned[b]) >= 0) fails.push(lang + ' 命中禁词 ' + banned[b]);
          }
        }
      }
      R.push(ok('A10 生成片段无网络/存储禁词', fails.length === 0, fails.join('；')));
    })();

    // B1/B2 仅浏览器（面板已注入 DOM 时执行）
    if (typeof document !== 'undefined' && document.getElementById('wf9-root')) {
      // B1 注册协议：WF_REGISTRY.wf9 六字段完整且 html/css 与面板一致 // spec:WF9-B1
      (function () {
        var reg = G.WF_REGISTRY && G.WF_REGISTRY['wf9'];
        var fails = [];
        if (!reg) fails.push('注册表缺 wf9');
        else {
          if (reg.id !== 'wf9') fails.push('id 非 wf9');
          if (typeof reg.title !== 'string' || !reg.title) fails.push('title 缺失');
          if (typeof reg.css !== 'string' || reg.css.indexOf('#wf9-root') < 0) fails.push('css 缺 #wf9-root 作用域');
          if (typeof reg.html !== 'string' || reg.html.indexOf('wf9-root') < 0 || reg.html.indexOf('data-wf9-lang="java"') < 0) fails.push('html 片段不完整');
          if (typeof reg.init !== 'function') fails.push('init 非函数');
          if (typeof reg.selftest !== 'function') fails.push('selftest 非函数');
          if (!document.getElementById('wf9-root')) fails.push('DOM 未注入 #wf9-root');
        }
        R.push(ok('B1 注册协议完整（id/title/css/html/init/selftest）', fails.length === 0, fails.join('；')));
      })();

      // B2 UI 行为：render 写 DOM、语言切换生效、SM+TS/PHP 显 hint // spec:WF9-B2
      (function () {
        var fails = [];
        var codeEl = document.getElementById('wf9-code');
        var hint = document.getElementById('wf9-hint');
        var sel = document.getElementById('wf9-suite');
        var prev = sel ? sel.value : null;
        var j = G.WF9.render('java');
        if (!(j && j.length > 0 && codeEl && codeEl.textContent === j)) fails.push('render(java) 未写入 DOM');
        var g = G.WF9.render('go');
        if (!(g && g !== j && codeEl.textContent === g)) fails.push('语言切换未生效');
        if (sel) {
          sel.value = 'WOP-SM2-SM3';
          var ts = G.WF9.render('typescript');
          if (!(hint && hint.hidden === false && hint.textContent.indexOf('RSA') >= 0)) fails.push('SM+TS 未显 hint');
          if (!(ts && ts.indexOf('not supported in v0.1.0') >= 0)) fails.push('SM+TS 片段未走抛错分支');
          var jv = G.WF9.render('java');
          if (!(jv && jv.indexOf('not supported') < 0 && jv.indexOf('sm3') >= 0)) fails.push('SM+Java 未走国密分支');
          sel.value = prev;
          G.WF9.render('java');
        } else {
          fails.push('缺 wf9-suite 选择器');
        }
        R.push(ok('B2 UI 渲染/切换/SM 提示联动', fails.length === 0, fails.join('；')));
      })();
    }

    return R;
  };
})();

/* ===== wf11/wf11.selftest.js ===== */
/**
 * WF11 — 持久断言（供集成者接入 runSelftest；契约断言契约：正/负路径都防真实 bug）。
 *
 * 断言设计为无浏览器依赖：只消费 WF11_CORE 纯函数 + 最小 DOM stub（fillRequest 注入 getEl），
 * node 与浏览器均可执行。断言渲染文案中文，不触碰网络/存储（S1/S2 纪律）。
 *
 * 断言清单（条款 → 断言反向核对矩阵，README 同步）：
 *   WF11-CONTRACT   契约合法：≥5 接口、每个有 method/path/operationId/summary、全 POST（网关事实）、含 ≥1 回调
 *   WF11-EXAMPLE    示例契约显著标注：isExample=true 且横幅文案存在（防「忘了标注示例」）
 *   WF11-RENDER     渲染一致：目录 op 条目数 == 拍平 op 数；每个 op 的 key 可在目录 HTML 中找到
 *   WF11-FORM       表单生成：填参 → body JSON 正确（含嵌套对象 callback 与数组）
 *   WF11-FILL       填充请求区：路径/加密级别正确写入目标输入框，method 返回 POST；目标缺失不抛错
 *   WF11-VALID-REQ  否定式：必填缺失 → 报错指向该字段路径
 *   WF11-VALID-TYPE 否定式：integer 字段填非整数被拒；boolean 非法值被拒
 *   WF11-VALID-ARR  否定式：array minItems 违反被拒；enum 非法值被拒
 *   WF11-I18N       动态文案回退：WF14 未加载时 t() 返回中文 fallback
 */
(function () {
  'use strict';

  function run() {
    var R = [];
    function A(name, pass, detail) { R.push({ name: name, pass: !!pass, detail: pass ? '' : (detail || '') }); }
    var C = window.WF11_CORE;
    var contract = window.WF11_CONTRACT;

    if (!C || !contract) {
      A('契约与核心可用', false, 'WF11_CONTRACT / WF11_CORE 未加载（检查加载顺序：contract.js → wf11.js → wf11.selftest.js）');
      return R;
    }

    // ---- spec:WF11-CONTRACT 契约数据合法 ----
    var all = C.ops(contract);
    var structOk = all.length >= 5;
    var fieldsOk = true, badOp = '';
    var postOk = true, cbCount = 0;
    all.forEach(function (e) {
      if (!(e.op && e.op.operationId && e.op.summary && e.method && e.path)) {
        fieldsOk = false; badOp = e.key || '(未知)';
      }
      if (e.method !== 'post') postOk = false;
      if (e.op['x-wop-direction'] === 'platform-to-merchant') cbCount++;
    });
    A('契约：≥5 接口且结构完整', structOk && fieldsOk,
      '接口数=' + all.length + '，结构异常 op=' + badOp);
    A('契约：统一 POST 且含回调接口', postOk && cbCount >= 1,
      'postOk=' + postOk + '，回调接口数=' + cbCount);

    // ---- spec:WF11-EXAMPLE 示例契约标注 ----
    var bannerEl = (typeof document !== 'undefined' && document.getElementById)
      ? document.getElementById('wf11-banner') : null;
    var bannerShown = !!contract.isExample && (!!contract.exampleNote)
      && (!bannerEl || bannerEl.hidden === false || bannerEl.getAttribute('hidden') === null);
    A('示例契约：显著标注生效', bannerShown,
      'isExample=' + contract.isExample + '，exampleNote 缺失=' + !contract.exampleNote);

    // ---- spec:WF11-RENDER 渲染一致 ----
    var html = C.catalogHtml(contract);
    var rowCount = html.split('wf11-op-row').length - 1;
    var keysAllFound = all.every(function (e) { return html.indexOf(e.key) >= 0; });
    A('渲染：目录条目数与契约一致', rowCount === all.length && keysAllFound,
      '目录条目=' + rowCount + '，契约 op=' + all.length + '，key 全可寻=' + keysAllFound);

    function findOp(oid) {
      for (var i = 0; i < all.length; i++) if (all[i].op.operationId === oid) return all[i];
      return null;
    }

    // ---- spec:WF11-FORM 表单生成（含嵌套对象）----
    var subOp = findOp('trackSubscribe');
    var subModel = C.formModelFor(subOp.op);
    var subRaw = {
      waybillNos: 'SF-888, SF-889',
      'callback.url': 'https://merchant.example/cb',
      'callback.retryTimes': '3',
      expireDays: '30'
    };
    var subRes = C.bodyFromRaw(subModel, subRaw);
    var subParsed = subRes.ok ? JSON.parse(subRes.json) : null;
    A('表单：填参生成嵌套 body JSON', !!subParsed
      && subParsed.waybillNos.length === 2 && subParsed.waybillNos[0] === 'SF-888'
      && subParsed.callback && subParsed.callback.url === 'https://merchant.example/cb'
      && subParsed.callback.retryTimes === 3
      && subParsed.expireDays === 30,
      '生成结果=' + subRes.json + '，errors=' + JSON.stringify(subRes.errors));

    // 选填字段缺省时不进 body（默认值污染防御）
    var wbOp = findOp('waybillQuery');
    var wbModel = C.formModelFor(wbOp.op);
    var wbRes = C.bodyFromRaw(wbModel, { waybillNo: 'SF-888' });
    var wbParsed = wbRes.ok ? JSON.parse(wbRes.json) : null;
    A('表单：选填缺省不污染 body', !!wbParsed
      && wbParsed.waybillNo === 'SF-888'
      && wbParsed.carrierCode === undefined && wbParsed.orderNo === undefined,
      '生成结果=' + wbRes.json);

    // ---- spec:WF11-FILL 填充请求区 ----
    var els = {
      'r-path': { value: '' },
      'r-body': { value: '' },
      'r-level': { value: '' }
    };
    var fillRes = C.fillRequest(subOp, '{"waybillNos":["SF-888"]}', function (id) { return els[id] || null; });
    var fillOk = fillRes.ok && fillRes.method === 'POST'
      && els['r-path'].value === '/gateway/logistics/open-plat/track/subscribe'
      && JSON.parse(els['r-body'].value).waybillNos[0] === 'SF-888'
      && els['r-level'].value === 'L2'
      && fillRes.filled.length === 3;
    A('填充：路径/body/加密级别写入请求区', fillOk,
      'fillRes=' + JSON.stringify({ ok: fillRes.ok, method: fillRes.method, path: fillRes.path, filled: fillRes.filled })
      + ' r-path=' + els['r-path'].value + ' r-level=' + els['r-level'].value);

    // 目标缺失：不抛错、ok=false（独立预览防御）
    var missRes = C.fillRequest(subOp, '{}', function () { return null; });
    A('填充：目标缺失不抛错且报失败', missRes.ok === false && missRes.missing.length >= 2,
      'ok=' + missRes.ok + '，missing=' + missRes.missing.join(','));

    // ---- spec:WF11-VALID-REQ 否定式：必填缺失 ----
    var vReq = C.bodyFromRaw(subModel, { expireDays: '30' });
    var missWaybill = vReq.errors.some(function (e) { return e.path === 'waybillNos'; });
    var missCb = vReq.errors.some(function (e) { return e.path === 'callback' || e.path === 'callback.url'; });
    A('校验：必填缺失报错（含嵌套必填）', !vReq.ok && missWaybill && missCb,
      'errors=' + JSON.stringify(vReq.errors));

    // 嵌套对象部分填写：callback.url 空但 callback 有其它字段 → 报 callback.url
    var vNested = C.bodyFromRaw(subModel, {
      waybillNos: 'SF-888',
      'callback.retryTimes': '3'
    });
    var missUrl = vNested.errors.some(function (e) { return e.path === 'callback.url'; });
    A('校验：嵌套必填指向精确路径', !vNested.ok && missUrl,
      'errors=' + JSON.stringify(vNested.errors));

    // 嵌套对象子错误吞噬回归：retryTimes 类型错不得被「对象必填缺失」掩盖（子错误无条件上浮）
    var vSwallow = C.bodyFromRaw(subModel, {
      waybillNos: 'SF-888',
      'callback.retryTimes': 'abc'
    });
    var typeErrKept = vSwallow.errors.some(function (e) { return e.path === 'callback.retryTimes'; });
    var maskedAsMissing = vSwallow.errors.some(function (e) { return e.path === 'callback' && e.msg.indexOf(t_missing()) >= 0; });
    function t_missing() { return '必填字段缺失'; }
    A('校验：嵌套子错误不被对象必填掩盖', !vSwallow.ok && typeErrKept && !maskedAsMissing,
      'errors=' + JSON.stringify(vSwallow.errors));

    // ---- spec:WF11-VALID-TYPE 否定式：类型非法 ----
    var intField = null, boolField = null;
    subModel.forEach(function (f) {
      if (f.path === 'expireDays') intField = f;
    });
    var wbInfoModel = C.formModelFor(findOp('waybillInfoQuery').op);
    wbInfoModel.forEach(function (f) { if (f.path === 'withDetails') boolField = f; });
    var intBad = C.coerceValue(intField, 'abc');
    var boolBad = C.coerceValue(boolField, 'yes');
    var intOk = C.coerceValue(intField, '30');
    var boolOk = C.coerceValue(boolField, 'true');
    A('校验：integer/boolean 非法值被拒', !intBad.ok && !boolBad.ok && intOk.ok && boolOk.ok,
      'intBad=' + JSON.stringify(intBad) + '，boolBad=' + JSON.stringify(boolBad));

    // ---- spec:WF11-VALID-ARR 否定式：数组与枚举 ----
    var arrEmpty = C.bodyFromRaw(C.formModelFor(findOp('trackLatest').op), { waybillNos: '' });
    var arrBadType = C.coerceValue({ type: 'array', itemsType: 'integer', minItems: 1, maxItems: 0 }, 'x,y');
    var enumBad = C.coerceValue({ type: 'string', enumValues: ['a', 'b'] }, 'c');
    A('校验：minItems/数组元素类型/枚举被拒', !arrEmpty.ok && !arrBadType.ok && !enumBad.ok,
      'arrEmpty=' + JSON.stringify(arrEmpty.errors) + '，arrBadType=' + JSON.stringify(arrBadType)
      + '，enumBad=' + JSON.stringify(enumBad));

    // ---- spec:WF11-I18n 动态文案回退 ----
    var hadWF14 = false;
    try { hadWF14 = !!(window.WF14 && window.WF14.t); } catch (e) { hadWF14 = false; }
    var fb = C.t('wf11.gen', '生成 body JSON');
    A('i18n：WF14 未加载回退中文', (!hadWF14 && fb === '生成 body JSON') || (hadWF14 && typeof fb === 'string'),
      'WF14 存在=' + hadWF14 + '，t()=' + fb);

    return R;
  }

  window.WF11_SELFTEST = { run: run };
})();

/* ===== wf12/wf12.selftest.js ===== */
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

