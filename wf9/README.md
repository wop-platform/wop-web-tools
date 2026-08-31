# WF9 — 六语言 SDK 代码片段生成器

依据 `parallel/TASK_wf9.md` 与 `parallel/WF_CONTRACT.md` 交付。面板读取页面请求构造 Tab 的终端用户输入（appKey / path / body / level / host / 密钥），实时生成 Java / Go / TypeScript / Python / PHP / .NET 六语言的 WOP SDK 接入片段。片段为**推导示例**（wop-sdk-spec §2 概念 API），头部带声明，接入以官方 `wop-<lang>-sdk`（v0.1.0，MIT）为准。

## 行为要点

- **配置五字段**逐语言呈现（`WopConfig`：appKey / suite(securityReq) / merchantPrivateKey / platformPublicKey / [gatewayBaseUrl]），密钥/body 从输入框取值逐字内嵌（空值用占位符），转义为各语言字符串字面量并单行化。
- **套件矩阵**：`WOP-RSA3072-SHA256` / `WOP-RSA4096-SHA256` / `WOP-SM2-SM3`。SM2-SM3 下 Java/Go/Python/.NET 生成正常国密片段（digest=sm3，公钥 04‖X‖Y / 私钥 d 标量）；**TypeScript/PHP 首版（v0.1.0）仅支持 RSA**，生成显式抛错片段（try/catch 内不可达调用），并在 UI 显橙色提示。
- **body 实参收窄**：GET 或 body 空白 → 调用收窄为无 body 形态（如 `buildRequest("GET", path)`）并注明「不生成 x-wop-content-digest 头（D3 仅约束有 body 的请求）」；POST 带 body → 全参形态（method, path, body, level）并注明 D3/I1 必传且必入签。
- **level 跟随** `r-level`：L2 显信封注释（DEK 载荷 alg$key$iv / CSPRNG nonce + 时间戳 + expiredSeconds），L0 显「仅签名不加密，无 L2 信封」。
- 每片段含 `buildRequest` / `verifyResponse` / `verifyCallback` 三调用形态；失败分支仅打印模糊化 reason（I7）；回调注明 URI 取回调 path；各语言带 Transport 注入点说明（okhttp provided / http.Client+RoundTripper / 内置 Web 传输 / urllib / curl / HttpClient+DelegatingHandler）。
- **套件与方法选择器**：面板自带 `wf9-suite`（auto=跟随页面 `r-suite`，另有四项显式套件）与 `wf9-method`（POST/GET）——页面 `r-suite` 当前无 SM 选项，显式提供使 SM 分支在 UI 可达。

## 文件清单

| 文件 | 说明 |
| --- | --- |
| `wf9.js` | 核心：六语言纯函数模板 + DOM 渲染 + `WF_REGISTRY['wf9']` 注册（css/html 内嵌串与独立文件双写） |
| `wf9.html` | UI 片段（canonical；`wf9.js` 内嵌串必须与其逐字一致，验证脚本做 drift 断言） |
| `wf9.css` | 自包含样式（`wf9-*` 作用域，颜色变量带回退） |
| `wf9.selftest.js` | 12 条断言（A1–A10 纯模板、B1/B2 浏览器 DOM），spec 标签 `// spec:WF9-*` |
| `README.md` | 本文件 |

## 集成接线

1. 加载顺序（单文件合并时保持相对顺序，均为普通 `<script>`，无模块语法）：`wf9.js` → `wf9.selftest.js`；建议置于 WF14 之后（可选依赖 `WF14.t`，缺席时中文回退）。
2. 锚点：`#tab-request` 内「请求字段」section（`#build-req` 按钮所在 card）之后，作为同级 `<details>` 卡片（见 `wf9.html` 头部注释）。
3. DOM 就绪后调用 `WF_REGISTRY['wf9'].init()`（幂等：`data-wf9-init` 标记防重复绑定）。
4. i18n：静态文案已带 `data-i18n="wf9.*"` 标记；动态文案走 `WF14.t(key, 中文回退)`。

## 断言矩阵（条款 → 断言名反向核对；负路径 = 否定式条款）

| spec 标签 | 断言名（selftest 输出） | 路径 | 覆盖条款 |
| --- | --- | --- | --- |
| `WF9-A1` | A1 六语言模板齐全且 RSA 输出非空 | 正 | 六语言模板存在且产出实质内容 |
| `WF9-A2` | A2 12 变体含五字段配置与输入框实值 | 正 | 配置五字段逐语言呈现；appKey/套件/host/两把密钥逐字内嵌 |
| `WF9-A3` | A3 12 变体含三个核心调用形态 | 正 | 每片段含 buildRequest/verifyResponse/verifyCallback（抛错片段以不可达调用呈现） |
| `WF9-A4` | A4 四语言 SM2-SM3 生成正常国密片段 | 正 | Java/Go/Python/.NET 国密：sm3 digest、04‖X‖Y 密钥形态、必入签 |
| `WF9-A5` | A5 TS/PHP+SM 生成显式抛错片段（无可用流程） | 负 | 抛错标记+不可达+try/catch；**不得**出现 digest 头注释/明文变量 |
| `WF9-A6` | A6 D3 体现：POST 必入签 / GET 不生成 digest | 正+负 | POST 含 D3/I1 必传且必入签；GET 含「不生成」且**无** POST 措辞 |
| `WF9-A7` | A7 body 实参按有无收窄（GET/空 vs POST） | 正+负 | GET/空：2 参形态、无 body 变量行、无 body 串泄漏；POST：全参+实值内嵌 |
| `WF9-A8` | A8 I7 失败分支仅输出模糊化 reason | 负 | I7 行含 reason 且无明文/canonical/私钥字样；其后 2 行无明文 |
| `WF9-A9` | A9 片段头部含推导声明（以官方 SDK 为准） | 正 | 首 3 行（PHP 计入 `<?php`）含 wop-sdk-spec + 推导 |
| `WF9-A10` | A10 生成片段无网络/存储禁词 | 负 | 全部 24 个变体（6 语言 × 4 ctx）禁词零命中（禁词表拼接构造） |
| `WF9-B1` | B1 注册协议完整（id/title/css/html/init/selftest） | 正 | `WF_REGISTRY['wf9']` 六字段 + DOM 注入（仅浏览器） |
| `WF9-B2` | B2 UI 渲染/切换/SM 提示联动 | 正 | render 写 DOM、语言切换生效、SM+TS 显 hint 且走抛错分支（仅浏览器） |

## 验证

- node：`(0,eval)` 加载两 JS 后调用 `globalThis.WF9RunSelftest()`，另做内嵌串与独立文件的 drift 字节级比对、S1/S2 禁词与模块语法扫描（验证 harness 位于 /tmp，非交付物）。
- 浏览器：/tmp 集成仿真页（index.html 副本 + 本面板注入）跑 `WF9RunSelftest()` 并人工核对语言切换与 SM 提示。
