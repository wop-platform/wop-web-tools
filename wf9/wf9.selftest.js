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
      var DQ_BODY = RSA_CTX.body.replace(/"/g, '\\"'); // Java/Go/Py/PHP/C# 内嵌时双引号被转义
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
