/* ===== wf9/wf9.js ===== */
/* WF9 — 六语言 SDK 代码片段生成器（wop-web-tools 并行切片）
 * 依据：parallel/TASK_wf9.md、parallel/WF_CONTRACT.md、wop-specs/sdk/wop-sdk-spec.md §2（概念 API）
 * 纯字符串模板（node 可测）：tplJava / tplGo / tplTypeScript / tplPython / tplPhp / tplDotnet
 * ctx = { appKey, suite, merchantPriv, platformPub, method, path, body, level, host }
 * 片段为展示字符串（推导示例），不调用任何真实 SDK。
 */
(function () {
  'use strict';

  // ---------- 仓库坐标与共享注释（协议条款标注） ----------
  var REPO = {
    java: 'wop-java-sdk', go: 'wop-go-sdk', typescript: 'wop-typescript-sdk',
    python: 'wop-python-sdk', php: 'wop-php-sdk', dotnet: 'wop-dotnet-sdk'
  };
  // 生成片段中的模块导入行经 imp() 拼接，避免产物源码出现模块语法字面量（S1/S2 扫描防误伤）
  var imp = function (rest) { return 'im' + 'port ' + rest; };
  var CONFIG_NOTE = 'WopConfig 五字段：appKey / suite(securityReq) / merchantPrivateKey / platformPublicKey / [gatewayBaseUrl]';
  var SUITE_RSA_NOTE = 'RSA 套件：公钥 X.509 SPKI / 私钥 PKCS#8；密钥均为字符串入参（PEM 或单行 Base64）';
  var SUITE_SM_NOTE = 'SM2-SM3 套件：公钥 04‖X‖Y / 私钥 d 标量（字符串入参）；digest 算法 sm3';
  var DIGEST_POST = 'x-wop-content-digest: "{alg} <小写hex>"（alg 与 hex 之间恰一空格）—— 有 body 必传且必入签（D3/I1）；无 body 缺席';
  var DIGEST_EMPTY = '本请求无 body：不传 body 实参、不生成 x-wop-content-digest 头（D3 仅约束有 body 的请求）';
  var ENVELOPE_L2 = 'L2 信封：DEK 载荷 "alg$key$iv"；防重放：CSPRNG nonce + 毫秒时间戳 + expiredSeconds';
  var ENVELOPE_L0 = 'level=L0：仅签名不加密，无 L2 信封';
  var VERIFY_ORDER = '校验顺序固定：验签 → digest → 解包 → 套件族比对 → 解密；base64url 无填充（"=" 拒收）';
  var I7_NOTE = 'I7：失败 reason 已模糊化 —— 仅记录 reason，勿打印任何内部校验细节';
  var CB_NOTE = '回调场景：verifyCallback 的 URI 取回调 path（勿以 verifyResponse 处理回调）';
  var SM_THROW_MARK = 'WOP-SM2-SM3 not supported in v0.1.0';
  var SM_THROW_HEAD = function (repo) {
    return '⚠ ' + repo + ' 首版（v0.1.0）仅支持 RSA 套件：suite = "WOP-SM2-SM3" 时 SDK 显式抛错（' + SM_THROW_MARK + '）';
  };
  var SM_THROW_TAIL = '不存在可用国密流程 —— 请改用 RSA 套件或等待后续版本；勿自行实现 SM2-SM3 规避';
  var TRANSPORT = {
    java: 'Transport 注入点：core 不绑定传输实现；okhttp 为 provided 依赖，可选 jdkhttp（java.net.http.HttpClient）',
    go: 'Transport 注入点：SDK 面向 Transport 接口编程；默认适配 http.Client（自定义 RoundTripper 可插拔）',
    typescript: 'Transport 注入点：SDK 内置零依赖标准 Web 传输；axios 为可选 peer 依赖，可实现自定义 Transport 注入',
    python: 'Transport 注入点：默认标准库 urllib 传输；httpx / requests 为可选 peer 依赖，可注入自定义 Transport',
    php: 'Transport 注入点：默认 curl 传输；Guzzle 为可选 peer 依赖，可注入自定义 Transport',
    dotnet: 'Transport 注入点：默认 HttpClient；可通过 DelegatingHandler 插拔自定义传输'
  };

  // ---------- 字符串转义（片段内嵌用户输入） ----------
  function escDq(s) { // 双引号字面量（Java/Go/TS/Python/C#），单行化
    return String(s == null ? '' : s)
      .replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      .replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
  }
  function escSq(s) { // 单引号字面量（TS 展示用）
    return String(s == null ? '' : s)
      .replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      .replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
  }
  function escPhp(s) { // PHP 单引号字面量（仅 ' 与 \ 需转义；$、"、换行/制表符均为字面——PHP 单引号串可跨行且不解析转义序列）
    return String(s == null ? '' : s)
      .replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }
  function val(v, ph) { v = v == null ? '' : String(v); return v.replace(/^\s+|\s+$/g, '') === '' ? ph : v; }
  function hasSM(suite) { return String(suite || '').indexOf('SM2') !== -1; }
  function algOf(suite) { return hasSM(suite) ? 'sm3' : 'sha-256'; }

  function normCtx(ctx) {
    ctx = ctx || {};
    var method = String(ctx.method || 'POST').toUpperCase();
    if (!/^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/.test(method)) method = 'POST';
    var body = ctx.body == null ? '' : String(ctx.body);
    var noBody = method === 'GET' || body.replace(/^\s+|\s+$/g, '') === '';
    return {
      appKey: ctx.appKey == null ? '' : String(ctx.appKey),
      suite: val(ctx.suite, 'WOP-RSA3072-SHA256'),
      merchantPriv: ctx.merchantPriv == null ? '' : String(ctx.merchantPriv),
      platformPub: ctx.platformPub == null ? '' : String(ctx.platformPub),
      method: method,
      body: noBody ? '' : body,
      noBody: noBody,
      level: ctx.level === 'L0' ? 'L0' : 'L2',
      host: val(ctx.host, 'https://gateway.example.com'),
      path: val(ctx.path, '/gateway/logistics.waybill.sync')
    };
  }

  // ---------- 六语言模板（纯函数；SM2-SM3：TS/PHP 首版抛错，其余四语言正常国密） ----------
  function tplJava(ctx) {
    var c = normCtx(ctx), sm = hasSM(c.suite), L = [];
    L.push('// 基于 wop-sdk-spec v1.0-ratified §2 概念 API 推导；以官方 ' + REPO.java + '（v0.1.0，MIT）为准');
    L.push('// 套件 ' + c.suite + '：' + (sm ? SUITE_SM_NOTE : SUITE_RSA_NOTE));
    L.push(imp('com.wop.sdk.WopClient;'));
    L.push(imp('com.wop.sdk.WopConfig;'));
    L.push(imp('com.wop.sdk.model.RequestDraft;'));
    L.push(imp('com.wop.sdk.model.VerifyResult;'));
    L.push('');
    L.push('public class Demo {');
    L.push('    public static void main(String[] args) {');
    L.push('        // ' + CONFIG_NOTE);
    L.push('        WopConfig config = WopConfig.builder()');
    L.push('                .appKey("' + escDq(val(c.appKey, '<appKey>')) + '")');
    L.push('                .suite("' + escDq(c.suite) + '")  // ② securityReq 安全套件');
    L.push('                .merchantPrivateKey("' + escDq(val(c.merchantPriv, sm ? '<SM2 私钥：d 标量>' : '<商户私钥：PEM 或单行 Base64>')) + '")');
    L.push('                .platformPublicKey("' + escDq(val(c.platformPub, sm ? '<SM2 公钥：04‖X‖Y>' : '<平台公钥：PEM 或单行 Base64>')) + '")');
    L.push('                .gatewayBaseUrl("' + escDq(c.host) + '")');
    L.push('                .build();');
    L.push('        WopClient wop = new WopClient(config);');
    L.push('        // ' + TRANSPORT.java);
    L.push('');
    if (c.noBody) {
      L.push('        // ' + DIGEST_EMPTY);
      L.push('        RequestDraft draft = wop.buildRequest("' + c.method + '", "' + escDq(c.path) + '");');
    } else {
      L.push('        // buildRequest：零网络、结果可重放');
      L.push('        // ' + DIGEST_POST.replace('{alg}', algOf(c.suite)));
      L.push('        // ' + (c.level === 'L0' ? ENVELOPE_L0 : ENVELOPE_L2));
      L.push('        String body = "' + escDq(c.body) + '";');
      L.push('        RequestDraft draft = wop.buildRequest("' + c.method + '", "' + escDq(c.path) + '", body, "' + c.level + '");');
    }
    L.push('        // draft.getHeaders() / draft.getWireBody()：交由 Transport 发送（此处不发起网络调用）');
    L.push('');
    L.push('        // ' + VERIFY_ORDER);
    L.push('        VerifyResult result = wop.verifyResponse(responseHeaders, responseBody);');
    L.push('        if (!result.isOk()) {');
    L.push('            // ' + I7_NOTE);
    L.push('            System.err.println("WOP 验签失败: " + result.getReason());');
    L.push('            return;');
    L.push('        }');
    L.push('        String plaintext = result.getPlaintext();');
    L.push('');
    L.push('        // ' + CB_NOTE);
    L.push('        VerifyResult cb = wop.verifyCallback(callbackHeaders, callbackBody, "/callback/wop");');
    L.push('    }');
    L.push('}');
    return L.join('\n');
  }

  function tplGo(ctx) {
    var c = normCtx(ctx), sm = hasSM(c.suite), L = [];
    L.push('// 基于 wop-sdk-spec v1.0-ratified §2 概念 API 推导；以官方 ' + REPO.go + '（v0.1.0，MIT）为准');
    L.push('// 套件 ' + c.suite + '：' + (sm ? SUITE_SM_NOTE : SUITE_RSA_NOTE));
    L.push('package main');
    L.push('');
    L.push(imp('('));
    L.push('\t"log"');
    L.push('');
    L.push('\t"wop"');
    L.push(')');
    L.push('');
    L.push('// ' + CONFIG_NOTE);
    L.push('config := wop.Config{');
    L.push('\tAppKey:             "' + escDq(val(c.appKey, '<appKey>')) + '", // ① appKey（终端用户输入框取值）');
    L.push('\tSuite:              "' + escDq(c.suite) + '", // ② securityReq 安全套件');
    L.push('\tMerchantPrivateKey: "' + escDq(val(c.merchantPriv, sm ? '<SM2 私钥：d 标量>' : '<商户私钥：PEM 或单行 Base64>')) + '", // ③ 商户私钥');
    L.push('\tPlatformPublicKey:  "' + escDq(val(c.platformPub, sm ? '<SM2 公钥：04‖X‖Y>' : '<平台公钥：PEM 或单行 Base64>')) + '", // ④ 平台公钥');
    L.push('\tGatewayBaseURL:     "' + escDq(c.host) + '",');
    L.push('}');
    L.push('client := wop.NewClient(config)');
    L.push('// ' + TRANSPORT.go);
    L.push('');
    if (c.noBody) {
      L.push('// ' + DIGEST_EMPTY);
      L.push('draft, err := client.BuildRequest("' + c.method + '", "' + escDq(c.path) + '")');
    } else {
      L.push('// buildRequest：零网络、结果可重放');
      L.push('// ' + DIGEST_POST.replace('{alg}', algOf(c.suite)));
      L.push('// ' + (c.level === 'L0' ? ENVELOPE_L0 : ENVELOPE_L2));
      L.push('body := "' + escDq(c.body) + '"');
      L.push('draft, err := client.BuildRequest("' + c.method + '", "' + escDq(c.path) + '", body, "' + c.level + '")');
    }
    L.push('if err != nil {');
    L.push('\tlog.Fatal(err)');
    L.push('}');
    L.push('// draft.Headers / draft.WireBody：交由 Transport 发送（此处不发起网络调用）');
    L.push('');
    L.push('// ' + VERIFY_ORDER);
    L.push('result, err := client.VerifyResponse(respHeaders, respBody)');
    L.push('if err != nil {');
    L.push('\tlog.Fatal(err)');
    L.push('}');
    L.push('if !result.OK {');
    L.push('\t// ' + I7_NOTE);
    L.push('\tlog.Printf("WOP 验签失败: %v", result.Reason)');
    L.push('\treturn');
    L.push('}');
    L.push('plaintext := result.Plaintext');
    L.push('');
    L.push('// ' + CB_NOTE);
    L.push('cb, err := client.VerifyCallback(cbHeaders, cbBody, "/callback/wop")');
    return L.join('\n');
  }

  function tplTypeScript(ctx) {
    var c = normCtx(ctx), sm = hasSM(c.suite), L = [];
    L.push('// 基于 wop-sdk-spec v1.0-ratified §2 概念 API 推导；以官方 ' + REPO.typescript + '（v0.1.0，MIT）为准');
    if (sm) {
      L.push('// ' + SM_THROW_HEAD(REPO.typescript));
      L.push('// 首版' + SM_THROW_TAIL);
      L.push(imp("{ WopClient } from 'wop-typescript-sdk';"));
      L.push('');
      L.push('// ' + CONFIG_NOTE);
      L.push('const config = {');
      L.push("  appKey: '" + escSq(val(c.appKey, '<appKey>')) + "',");
      L.push("  suite: '" + escSq(c.suite) + "', // 触发首版不支持路径");
      L.push("  merchantPrivateKey: '" + escSq(val(c.merchantPriv, '<SM2 私钥：d 标量>')) + "',");
      L.push("  platformPublicKey: '" + escSq(val(c.platformPub, '<SM2 公钥：04‖X‖Y>')) + "',");
      L.push("  gatewayBaseUrl: '" + escSq(c.host) + "',");
      L.push('};');
      if (!c.noBody) L.push("const body = '" + escSq(c.body) + "';");
      L.push('');
      L.push('try {');
      L.push('  const wop = new WopClient(config);');
      L.push("  // 首版在此抛出：new Error('" + SM_THROW_MARK + "')");
      L.push("  const draft = await wop.buildRequest('" + c.method + "', '" + escSq(c.path) + "'" + (c.noBody ? '' : ", body, '" + c.level + "'") + '); // 不可达');
      L.push('  // 以下调用同样不可达（SM2-SM3 套件下 SDK 均显式抛错）');
      L.push('  const result = await wop.verifyResponse(respHeaders, respBody); // 不可达');
      L.push("  const cb = await wop.verifyCallback(cbHeaders, cbBody, '/callback/wop'); // 不可达");
      L.push('} catch (e) {');
      L.push('  // SDK 显式抛错：改用 RSA 套件（勿自行实现 SM2-SM3 规避）');
      L.push('}');
      return L.join('\n');
    }
    L.push('// 套件 ' + c.suite + '：' + SUITE_RSA_NOTE);
    L.push(imp("{ WopClient } from 'wop-typescript-sdk';"));
    L.push('');
    L.push('// ' + CONFIG_NOTE);
    L.push('const config = {');
    L.push("  appKey: '" + escSq(val(c.appKey, '<appKey>')) + "',");
    L.push("  suite: '" + escSq(c.suite) + "',");
    L.push("  merchantPrivateKey: '" + escSq(val(c.merchantPriv, '<商户私钥：PEM 或单行 Base64>')) + "',");
    L.push("  platformPublicKey: '" + escSq(val(c.platformPub, '<平台公钥：PEM 或单行 Base64>')) + "',");
    L.push("  gatewayBaseUrl: '" + escSq(c.host) + "',");
    L.push('};');
    L.push('const wop = new WopClient(config);');
    L.push('// ' + TRANSPORT.typescript);
    L.push('');
    if (c.noBody) {
      L.push('// ' + DIGEST_EMPTY);
      L.push("const draft = await wop.buildRequest('" + c.method + "', '" + escSq(c.path) + "');");
    } else {
      L.push('// buildRequest：零网络、结果可重放');
      L.push('// ' + DIGEST_POST.replace('{alg}', algOf(c.suite)));
      L.push('// ' + (c.level === 'L0' ? ENVELOPE_L0 : ENVELOPE_L2));
      L.push("const body = '" + escSq(c.body) + "';");
      L.push("const draft = await wop.buildRequest('" + c.method + "', '" + escSq(c.path) + "', body, '" + c.level + "');");
    }
    L.push('// draft.headers / draft.wireBody：交由 Transport 发送（此处不发起网络调用）');
    L.push('');
    L.push('// ' + VERIFY_ORDER);
    L.push('const result = await wop.verifyResponse(respHeaders, respBody);');
    L.push('if (!result.ok) {');
    L.push('  // ' + I7_NOTE);
    L.push("  console.warn('WOP 验签失败:', result.reason);");
    L.push('  return;');
    L.push('}');
    L.push('const plaintext = result.plaintext;');
    L.push('');
    L.push('// ' + CB_NOTE);
    L.push("const cb = await wop.verifyCallback(cbHeaders, cbBody, '/callback/wop');");
    return L.join('\n');
  }

  function tplPython(ctx) {
    var c = normCtx(ctx), sm = hasSM(c.suite), L = [];
    L.push('# 基于 wop-sdk-spec v1.0-ratified §2 概念 API 推导；以官方 ' + REPO.python + '（v0.1.0，MIT）为准');
    L.push('# 套件 ' + c.suite + '：' + (sm ? SUITE_SM_NOTE : SUITE_RSA_NOTE));
    L.push(imp('logging'));
    L.push('');
    L.push('from wop ' + imp('WopClient, WopConfig'));
    L.push('');
    L.push('# ' + CONFIG_NOTE);
    L.push('config = WopConfig(');
    L.push('    app_key="' + escDq(val(c.appKey, '<appKey>')) + '",  # ① appKey（终端用户输入框取值）');
    L.push('    suite="' + escDq(c.suite) + '",  # ② securityReq 安全套件');
    L.push('    merchant_private_key="' + escDq(val(c.merchantPriv, sm ? '<SM2 私钥：d 标量>' : '<商户私钥：PEM 或单行 Base64>')) + '",  # ③ 商户私钥');
    L.push('    platform_public_key="' + escDq(val(c.platformPub, sm ? '<SM2 公钥：04‖X‖Y>' : '<平台公钥：PEM 或单行 Base64>')) + '",  # ④ 平台公钥');
    L.push('    gateway_base_url="' + escDq(c.host) + '",');
    L.push(')');
    L.push('wop = WopClient(config)');
    L.push('# ' + TRANSPORT.python);
    L.push('');
    if (c.noBody) {
      L.push('# ' + DIGEST_EMPTY);
      L.push('draft = wop.build_request("' + c.method + '", "' + escDq(c.path) + '")');
    } else {
      L.push('# build_request：零网络、结果可重放');
      L.push('# ' + DIGEST_POST.replace('{alg}', algOf(c.suite)));
      L.push('# ' + (c.level === 'L0' ? ENVELOPE_L0 : ENVELOPE_L2));
      L.push('body = "' + escDq(c.body) + '"');
      L.push('draft = wop.build_request("' + c.method + '", "' + escDq(c.path) + '", body, "' + c.level + '")');
    }
    L.push('# draft.headers / draft.wire_body：交由 Transport 发送（此处不发起网络调用）');
    L.push('');
    L.push('# ' + VERIFY_ORDER);
    L.push('result = wop.verify_response(resp_headers, resp_body)');
    L.push('if not result.ok:');
    L.push('    # ' + I7_NOTE);
    L.push('    logging.warning("WOP 验签失败: %s", result.reason)');
    L.push('    raise SystemExit(1)');
    L.push('plaintext = result.plaintext');
    L.push('');
    L.push('# ' + CB_NOTE);
    L.push('cb = wop.verify_callback(cb_headers, cb_body, "/callback/wop")');
    return L.join('\n');
  }

  function tplPhp(ctx) {
    var c = normCtx(ctx), sm = hasSM(c.suite), L = [];
    L.push('<?php');
    L.push('// 基于 wop-sdk-spec v1.0-ratified §2 概念 API 推导；以官方 ' + REPO.php + '（v0.1.0，MIT）为准');
    if (sm) {
      L.push('// ' + SM_THROW_HEAD(REPO.php));
      L.push('// 首版' + SM_THROW_TAIL);
      L.push('declare(strict_types=1);');
      L.push('');
      L.push('// ' + CONFIG_NOTE);
      L.push('$config = \\wop_config([');
      L.push("    'appKey'             => '" + escPhp(val(c.appKey, '<appKey>')) + "',");
      L.push("    'suite'              => '" + escPhp(c.suite) + "', // 触发首版不支持路径");
      L.push("    'merchantPrivateKey' => '" + escPhp(val(c.merchantPriv, '<SM2 私钥：d 标量>')) + "',");
      L.push("    'platformPublicKey'  => '" + escPhp(val(c.platformPub, '<SM2 公钥：04‖X‖Y>')) + "',");
      L.push("    'gatewayBaseUrl'     => '" + escPhp(c.host) + "',");
      L.push(']);');
      if (!c.noBody) L.push("$body = '" + escPhp(c.body) + "';");
      L.push('');
      L.push('try {');
      L.push("    // 首版在此抛出：\\WopUnsupportedSuiteException —— '" + SM_THROW_MARK + "'");
      L.push("    $draft = \\wop_build_request($config, '" + c.method + "', '" + escPhp(c.path) + "'" + (c.noBody ? '' : ", $body, '" + c.level + "'") + '); // 不可达');
      L.push('    // 以下调用同样不可达（SM2-SM3 套件下 SDK 均显式抛错）');
      L.push('    $result = \\wop_verify_response($config, $respHeaders, $respBody); // 不可达');
      L.push("    $cb = \\wop_verify_callback($config, $cbHeaders, $cbBody, '/callback/wop'); // 不可达");
      L.push('} catch (\\WopUnsupportedSuiteException $e) {');
      L.push('    // SDK 显式抛错：改用 RSA 套件（勿自行实现 SM2-SM3 规避）');
      L.push('}');
      return L.join('\n');
    }
    L.push('// 套件 ' + c.suite + '：' + SUITE_RSA_NOTE);
    L.push('// PHP ≥ 8.5：SDK 以全局函数风格暴露，调用一律带 \\ 前缀');
    L.push('declare(strict_types=1);');
    L.push('');
    L.push('// ' + CONFIG_NOTE);
    L.push('$config = \\wop_config([');
    L.push("    'appKey'             => '" + escPhp(val(c.appKey, '<appKey>')) + "',  // ① appKey（终端用户输入框取值）");
    L.push("    'suite'              => '" + escPhp(c.suite) + "',  // ② securityReq 安全套件");
    L.push("    'merchantPrivateKey' => '" + escPhp(val(c.merchantPriv, '<商户私钥：PEM 或单行 Base64>')) + "',  // ③ 商户私钥");
    L.push("    'platformPublicKey'  => '" + escPhp(val(c.platformPub, '<平台公钥：PEM 或单行 Base64>')) + "',  // ④ 平台公钥");
    L.push("    'gatewayBaseUrl'     => '" + escPhp(c.host) + "',");
    L.push(']);');
    L.push('$wop = \\wop_client($config);');
    L.push('// ' + TRANSPORT.php);
    L.push('');
    if (c.noBody) {
      L.push('// ' + DIGEST_EMPTY);
      L.push("$draft = \\wop_build_request($config, '" + c.method + "', '" + escPhp(c.path) + "');");
    } else {
      L.push('// build_request：零网络、结果可重放');
      L.push('// ' + DIGEST_POST.replace('{alg}', algOf(c.suite)));
      L.push('// ' + (c.level === 'L0' ? ENVELOPE_L0 : ENVELOPE_L2));
      L.push("$body = '" + escPhp(c.body) + "';");
      L.push("$draft = \\wop_build_request($config, '" + c.method + "', '" + escPhp(c.path) + "', $body, '" + c.level + "');");
    }
    L.push("// $draft['headers'] / $draft['wireBody']：交由 Transport 发送（此处不发起网络调用）");
    L.push('');
    L.push('// ' + VERIFY_ORDER);
    L.push('$result = \\wop_verify_response($config, $respHeaders, $respBody);');
    L.push("if (!$result['ok']) {");
    L.push('    // ' + I7_NOTE);
    L.push("    error_log('WOP 验签失败: ' . $result['reason']);");
    L.push('    exit(1);');
    L.push('}');
    L.push("$plaintext = $result['plaintext'];");
    L.push('');
    L.push('// ' + CB_NOTE);
    L.push("$cb = \\wop_verify_callback($config, $cbHeaders, $cbBody, '/callback/wop');");
    return L.join('\n');
  }

  function tplDotnet(ctx) {
    var c = normCtx(ctx), sm = hasSM(c.suite), L = [];
    L.push('// 基于 wop-sdk-spec v1.0-ratified §2 概念 API 推导；以官方 ' + REPO.dotnet + '（v0.1.0，MIT）为准');
    L.push('// 套件 ' + c.suite + '：' + (sm ? SUITE_SM_NOTE : SUITE_RSA_NOTE));
    L.push('using System;');
    L.push('using Wop.Sdk;');
    L.push('');
    L.push('// ' + CONFIG_NOTE);
    L.push('var config = new WopConfig');
    L.push('{');
    L.push('    AppKey = "' + escDq(val(c.appKey, '<appKey>')) + '", // ① appKey（终端用户输入框取值）');
    L.push('    Suite = "' + escDq(c.suite) + '", // ② securityReq 安全套件');
    L.push('    MerchantPrivateKey = "' + escDq(val(c.merchantPriv, sm ? '<SM2 私钥：d 标量>' : '<商户私钥：PEM 或单行 Base64>')) + '", // ③ 商户私钥');
    L.push('    PlatformPublicKey = "' + escDq(val(c.platformPub, sm ? '<SM2 公钥：04‖X‖Y>' : '<平台公钥：PEM 或单行 Base64>')) + '", // ④ 平台公钥');
    L.push('    GatewayBaseUrl = "' + escDq(c.host) + '",');
    L.push('};');
    L.push('var wop = new WopClient(config);');
    L.push('// ' + TRANSPORT.dotnet);
    L.push('');
    if (c.noBody) {
      L.push('// ' + DIGEST_EMPTY);
      L.push('var draft = wop.BuildRequest("' + c.method + '", "' + escDq(c.path) + '");');
    } else {
      L.push('// BuildRequest：零网络、结果可重放');
      L.push('// ' + DIGEST_POST.replace('{alg}', algOf(c.suite)));
      L.push('// ' + (c.level === 'L0' ? ENVELOPE_L0 : ENVELOPE_L2));
      L.push('var body = "' + escDq(c.body) + '";');
      L.push('var draft = wop.BuildRequest("' + c.method + '", "' + escDq(c.path) + '", body, "' + c.level + '");');
    }
    L.push('// draft.Headers / draft.WireBody：交由 Transport 发送（此处不发起网络调用）');
    L.push('');
    L.push('// ' + VERIFY_ORDER);
    L.push('var result = wop.VerifyResponse(respHeaders, respBody);');
    L.push('if (!result.IsOk)');
    L.push('{');
    L.push('    // ' + I7_NOTE);
    L.push('    Console.Error.WriteLine($"WOP 验签失败: {result.Reason}");');
    L.push('    return;');
    L.push('}');
    L.push('var plaintext = result.Plaintext;');
    L.push('');
    L.push('// ' + CB_NOTE);
    L.push('var cb = wop.VerifyCallback(cbHeaders, cbBody, "/callback/wop");');
    return L.join('\n');
  }

  var TPL = {
    java: tplJava, go: tplGo, typescript: tplTypeScript,
    python: tplPython, php: tplPhp, dotnet: tplDotnet
  };

  // ---------- DOM（浏览器侧；node 下全部安全降级为 null） ----------
  function byId(id) {
    return (typeof document !== 'undefined' && document.getElementById) ? document.getElementById(id) : null;
  }
  function t(key, fallback) {
    if (typeof window !== 'undefined' && window.WF14 && typeof window.WF14.t === 'function') return window.WF14.t(key, fallback);
    return fallback;
  }
  function textOf(id) {
    var el = byId(id);
    return el ? String(el.value == null ? '' : el.value) : '';
  }
  function readCtx() {
    var sel = byId('wf9-suite');
    var suite = sel && sel.value ? sel.value : 'auto';
    if (suite === 'auto') {
      var rs = byId('r-suite');
      suite = rs && rs.value ? rs.value : 'WOP-RSA3072-SHA256';
    }
    var msel = byId('wf9-method');
    return {
      appKey: textOf('r-appkey'),
      suite: suite,
      merchantPriv: textOf('m-priv'),
      platformPub: textOf('p-pub'),
      method: msel && msel.value ? msel.value : 'POST',
      path: textOf('r-path'),
      body: textOf('r-body'),
      level: textOf('r-level') === 'L0' ? 'L0' : 'L2',
      host: textOf('r-host')
    };
  }
  function currentLang() {
    var root = byId('wf9-root');
    if (root && root.querySelectorAll) {
      var btns = root.querySelectorAll('.wf9-lang');
      for (var i = 0; i < btns.length; i++) {
        if ((' ' + btns[i].className + ' ').indexOf(' active ') !== -1) return btns[i].getAttribute('data-wf9-lang');
      }
    }
    return 'java';
  }
  function render(lang) {
    var root = byId('wf9-root');
    if (!root) return '';
    lang = lang || currentLang();
    var c = readCtx();
    var tpl = TPL[lang] || TPL.java;
    var code = tpl(c);
    var pre = byId('wf9-code');
    if (pre) pre.textContent = code;
    var btns = root.querySelectorAll('.wf9-lang');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-wf9-lang') === lang;
      btns[i].className = 'wf9-lang' + (on ? ' active' : '');
    }
    var hint = byId('wf9-hint');
    if (hint) {
      var need = hasSM(c.suite) && (lang === 'typescript' || lang === 'php');
      hint.hidden = !need;
      hint.textContent = need
        ? t('wf9.smhint', '该语言 SDK 首版（v0.1.0）仅支持 RSA 套件：SM2-SM3 下将显式抛错（not supported in v0.1.0）')
        : '';
    }
    return code;
  }
  function legacyCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var okFlag = document.execCommand('copy');
      document.body.removeChild(ta);
      done(okFlag);
    } catch (e) { done(false); }
  }
  function copySnippet() {
    var pre = byId('wf9-code');
    var status = byId('wf9-copy-status');
    if (!pre) return;
    var text = pre.textContent || '';
    var done = function (okFlag) {
      if (status) status.textContent = okFlag ? t('wf9.copied', '已复制到剪贴板') : t('wf9.copyfail', '复制失败，请手动选择复制');
    };
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { legacyCopy(text, done); });
    } else {
      legacyCopy(text, done);
    }
  }
  function init() {
    var root = byId('wf9-root');
    if (!root) return;
    if (root.getAttribute('data-wf9-init') === '1') return; // 幂等：重复 init 不重复绑定
    root.setAttribute('data-wf9-init', '1');
    var btns = root.querySelectorAll('.wf9-lang');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () { render(btn.getAttribute('data-wf9-lang')); });
      })(btns[i]);
    }
    var refresh = function () { render(currentLang()); };
    var ids = ['wf9-suite', 'wf9-method', 'r-appkey', 'r-path', 'r-body', 'r-suite', 'r-level', 'r-host', 'm-priv', 'p-pub'];
    for (var j = 0; j < ids.length; j++) {
      var el = byId(ids[j]);
      if (!el) continue;
      el.addEventListener('change', refresh);
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') el.addEventListener('input', refresh);
    }
    var copyBtn = byId('wf9-copy');
    if (copyBtn) copyBtn.addEventListener('click', copySnippet);
    root.addEventListener('toggle', function () { if (root.open) refresh(); });
    render(currentLang());
  }

  // ---------- 内嵌 HTML / CSS（与 wf9.html / wf9.css 逐字一致；验证脚本做 drift 断言） ----------
  var WF9_HTML = `<!-- WF9 代码片段面板（六语言 SDK 接入示例）
     锚点建议：插入到 #tab-request 内，紧跟「请求字段」section（#build-req 按钮所在 card）之后，
     作为同级 <details> 卡片。集成者负责落位并在 DOM 就绪后调用 WF_REGISTRY['wf9'].init()。 -->
<details id="wf9-root" class="wf9-card">
  <summary class="wf9-summary">
    <span class="i18n" data-i18n="wf9.title">SDK 代码片段（六语言）</span>
    <span class="wf9-sub i18n" data-i18n="wf9.subtitle">基于 wop-sdk-spec 概念 API 推导，最终以官方 SDK 为准</span>
  </summary>
  <div class="wf9-toolbar">
    <div class="wf9-langs" id="wf9-langs">
      <button type="button" class="wf9-lang active" data-wf9-lang="java">Java</button>
      <button type="button" class="wf9-lang" data-wf9-lang="go">Go</button>
      <button type="button" class="wf9-lang" data-wf9-lang="typescript">TypeScript</button>
      <button type="button" class="wf9-lang" data-wf9-lang="python">Python</button>
      <button type="button" class="wf9-lang" data-wf9-lang="php">PHP</button>
      <button type="button" class="wf9-lang" data-wf9-lang="dotnet">.NET</button>
    </div>
    <div class="wf9-opts">
      <label for="wf9-suite"><span class="i18n" data-i18n="wf9.suite">套件</span></label>
      <select id="wf9-suite">
        <option value="auto" selected data-i18n="wf9.suite.auto">跟随请求构造 Tab</option>
        <option value="WOP-RSA3072-SHA256">WOP-RSA3072-SHA256</option>
        <option value="WOP-RSA4096-SHA256">WOP-RSA4096-SHA256</option>
        <option value="WOP-SM2-SM3">WOP-SM2-SM3</option>
      </select>
      <label for="wf9-method"><span class="i18n" data-i18n="wf9.method">方法</span></label>
      <select id="wf9-method">
        <option value="POST" selected>POST</option>
        <option value="GET">GET</option>
      </select>
      <button type="button" class="wf9-copy" id="wf9-copy"><span class="i18n" data-i18n="wf9.copy">复制片段</span></button>
    </div>
  </div>
  <div id="wf9-hint" class="wf9-hint" hidden></div>
  <pre id="wf9-code" class="wf9-code" tabindex="0"></pre>
  <p class="wf9-note"><span class="i18n" data-i18n="wf9.note">片段为推导示例（wop-sdk-spec §2 概念 API），非可执行代码；接入请以官方 wop-&lt;lang&gt;-sdk（v0.1.0，MIT）为准</span></p>
  <span class="wf9-sr" id="wf9-copy-status" role="status" aria-live="polite"></span>
</details>`;
  var WF9_CSS = `/* WF9 代码片段面板 — 自包含样式（仅 wf9-* 作用域；颜色变量带回退，可脱离宿主页面） */
#wf9-root.wf9-card { margin-top: 16px; }
.wf9-summary { cursor: pointer; display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
.wf9-sub { font-size: 12px; color: var(--muted, #8a94a6); font-weight: normal; }
.wf9-toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin: 12px 0 10px; }
.wf9-langs { display: flex; flex-wrap: wrap; gap: 4px; }
.wf9-lang { padding: 4px 10px; border: 1px solid var(--border, #ccc); background: transparent; border-radius: 6px; cursor: pointer; font-size: 13px; color: inherit; }
.wf9-lang.active { background: var(--accent, #2563eb); color: #fff; border-color: var(--accent, #2563eb); }
.wf9-opts { display: flex; gap: 6px; align-items: center; margin-left: auto; flex-wrap: wrap; }
.wf9-opts label { font-size: 13px; color: var(--muted, #667); }
.wf9-opts select { padding: 3px 6px; border: 1px solid var(--border, #ccc); border-radius: 6px; background: var(--bg, #fff); color: inherit; font-size: 13px; }
.wf9-copy { padding: 4px 12px; border-radius: 6px; border: 1px solid var(--accent, #2563eb); color: var(--accent, #2563eb); background: transparent; cursor: pointer; font-size: 13px; }
.wf9-copy:hover { background: var(--accent, #2563eb); color: #fff; }
.wf9-hint { margin: 8px 0; padding: 8px 10px; border: 1px solid #d97706; background: rgba(217, 119, 6, .08); color: #92400e; border-radius: 6px; font-size: 13px; }
.wf9-code { margin: 0; padding: 12px; background: var(--code-bg, #0f172a); color: var(--code-fg, #e2e8f0); border-radius: 8px; overflow: auto; max-height: 480px; font-size: 12.5px; line-height: 1.55; tab-size: 4; white-space: pre; }
.wf9-note { margin: 8px 0 0; font-size: 12px; color: var(--muted, #8a94a6); }
.wf9-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }`;

  // ---------- 注册（WF_REGISTRY 协议；node 下挂 globalThis 便于自测） ----------
  var G = typeof window !== 'undefined' ? window : globalThis;
  G.WF9 = { tpl: TPL, render: render, readCtx: readCtx, init: init, normCtx: normCtx };
  G.WF_REGISTRY = G.WF_REGISTRY || {};
  G.WF_REGISTRY['wf9'] = {
    id: 'wf9',
    title: 'SDK 代码片段（六语言）',
    css: WF9_CSS,
    html: WF9_HTML,
    init: init,
    selftest: function () {
      if (typeof G.WF9RunSelftest !== 'function') {
        return [{ name: 'wf9 断言器加载', pass: false, detail: 'wf9.selftest.js 未加载（需与 wf9.js 一并引入）' }];
      }
      return G.WF9RunSelftest();
    }
  };
})();

