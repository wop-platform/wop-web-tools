# wop-web-tools — WF9 任务书（六语言代码片段生成器）

你是 wop-web-tools 项目的 WF9 实现 agent。项目根：`/Users/dreambt/sources/open-platform/wop-web-tools`。
**先读 `/Users/dreambt/sources/open-platform/wop-web-tools/parallel/WF_CONTRACT.md` 并严格遵循**（文件隔离、注册协议、断言契约、S1/S2 纪律、i18n 约定、交付格式）。

## 背景（重要事实，勿重查）
WOP 官方 SDK 规范：`/Users/dreambt/sources/open-platform/wop-specs/sdk/wop-sdk-spec.md`（v1.0-ratified，只读）。已调研确认的关键事实（**直接采信，不要重新推导**）：

1. **spec 无任何语言示例代码、无安装命令/包名坐标**——片段的方法签名只能按 §2 概念 API 按各语言习惯推导，**UI 必须标注「推导片段」**（文案：基于 wop-sdk-spec 概念 API 推导，最终以官方 SDK 为准）。
2. **§2 概念 API（spec 原文，唯一权威形态）**：
   - `WopConfig`: appKey, suite(securityReq), merchantPrivateKey, platformPublicKey, [gatewayBaseUrl]
   - `buildRequest(method, path, body?, level=L0/L2)` → `RequestDraft{headers, wireBody}`（零网络，可重放）
   - `verifyResponse(headers, body)` → `VerifyResult{ok, plaintext?, reason?}`（失败 reason 模糊，I7）
   - `verifyCallback(headers, body, callbackPath)` → VerifyResult（URI 取回调 path）
   - 密钥入参：**字符串**（PEM 或 Base64 单行）；RSA=SPKI/PKCS8、SM2=04‖X‖Y/d 标量
3. **六语言 SDK 仓库**：`wop-platform/wop-{java,go,typescript,python,php,dotnet}-sdk`，v0.1.0，MIT。
4. **套件矩阵**：Java/Go/Python/.NET 双套件 ✅；**TypeScript/PHP 首版仅 RSA，SM2-SM3 必须抛「暂未支持」错误**（SM 片段只能生成「显式抛错」形态）。
5. **传输层**：Java=core+okhttp(provided)+jdkhttp；Go=Transport 接口+http.Client+RoundTripper；TS=fetch 原生+axios peer；Python=stdlib urllib+httpx/requests peer；PHP=curl+Guzzle peer；.NET=HttpClient（DelegatingHandler 可插拔）。片段初始化需体现 Transport 形态（标注注入点即可）。
6. **协议硬约束**（片段正确性红线）：digest=`alg 小写hex` 恰一空格、有 body 必传必入签；L2 信封 DEK 载荷 `alg$key$iv`；校验顺序固定 验签→digest→解包→族比对→解密；base64url 无填充拒收 `=`；防重放 CSPRNG nonce+毫秒 ts+expiredSeconds；PHP ≥8.5 全局函数 `\` 前缀风格。

## 目标：WF9 — 六语言代码片段生成器
在「请求构造」Tab 加一个「代码片段」面板（`<details id="wf9-root">`）：

1. **语言选择**：Java / Go / TypeScript / Python / PHP / .NET 六个 tab/下拉。
2. **片段生成**：根据请求构造 Tab 当前字段（appKey/密钥/路径/方法/body——读现有输入框 id）生成：
   - WopConfig 初始化（五字段，密钥字符串从输入框取值）
   - `buildRequest` 调用（L2 信封，方法/路径/body 从输入框取值）
   - `verifyResponse` / `verifyCallback` 调用（回调场景给出 verifyCallback 形态）
   - 注释标注各步对应协议条款（如 `// x-wop-content-digest 必须入签（D3/I1）`）
3. **片段形态纪律**：
   - 顶部注释：`// 基于 wop-sdk-spec v1.0-ratified §2 概念 API 推导；以官方 wop-<lang>-sdk 为准`
   - TS/PHP + 国密套件（SM2-SM3）→ 生成「SDK 首版暂不支持国密」抛错片段（`throw new Error('WOP-SM2-SM3 not supported in v0.1.0')` 形态），并 UI 提示「该语言首版仅 RSA」
   - I7：verifyResponse 失败分支只显示模糊 reason（不输出内部细节）
4. **复制按钮**：一键复制当前语言片段（clipboard API 或 textarea select+copy，禁 `fetch`）。
5. 片段代码是**展示字符串**（模板生成），不是可执行 JS——不调用真实 SDK。

## 实现约束
- 六种语言的片段模板是纯字符串模板函数（`tplJava(ctx)` / `tplGo(ctx)` …），context = {appKey, suite, merchantPriv, platformPub, method, path, body}。可 node 单元测试。
- 断言（`// spec:WF9`）至少 8 条：
  - 六语言模板齐全（6 个 tpl* 函数存在且输出非空）
  - 每个片段包含：WopConfig 五字段、buildRequest、verifyResponse（或 callback）
  - Java/Go/Python/.NET 片段在 suite=SM2-SM3 时正常生成国密片段
  - **TS/PHP + SM2-SM3 → 片段含「暂未支持」抛错**（否定式：绝不生成可用国密流程）
  - digest 注释/代码体现 D3（必入签）
  - body 为空（GET）时片段不含 body 参数（否定式：不生成空 body）
  - I7：片段中 verifyResponse 失败处理不泄露内部细节
  - 片段含「推导」声明注释
- 中文文案 `data-i18n="wf9.*"`。

## 验收
产物在 `wf9/` 目录（wf9.js / wf9.css / wf9.html / wf9.selftest.js / README.md），自测通过（node 跑模板函数断言），commit（身份 wop-web-tools，≤50 字符），**不 push**。
