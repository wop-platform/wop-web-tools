# WOP Web Tools — Spec

> 状态：草案（grill 修订 v3） · 版本：v0.3-draft · 日期：2026-08-31
> 对齐：crypto-strategy-spec v0.3-reviewed · **wop-sdk-spec v1.0-ratified（F3/F6/F8）** · wop-skills SECURITY.md S1–S8
> 条款编号用 `WF`（Web Function）前缀，避免与 wop-sdk-spec 的 F1–F9 混淆。
> v0.3 变更：WF7 粘贴解析、WF8 错误诊断由 P1 提前至 P0 并已落地（2026-08-31 增强批次）。

## 0. 参考真源

- [wop-specs/crypto/crypto-strategy-spec.md] 协议契约（D1–D13、I1–I7）——**协议术语唯一权威**
- [wop-specs/sdk/wop-sdk-spec.md] SDK 契约（v1.0-ratified：F3 结构化签名、**F6 响应/回调校验语义**、F8 向量合规）
- [wop-specs/crypto/crypto-vectors.json] 黄金向量——**字节级正确性锚**（fixture 禁手改）
- [wop-skills/SECURITY.md] 安全纪律精神（S1–S8）
- 现有实现：`gtsp-wop-gateway/docs/tools/rsa-keygen.html`（迁移源，行为基线；**语义以真源为准**）

## 1. 范围

浏览器端纯静态工作台：密钥生成与自检、WOP 报文构造/验证/模拟、联调辅助与错误诊断。
不含后端服务、不含真实网关调用、不含私钥持久化。
**协议语义以已批准 spec 为唯一权威；HTML 内嵌推演语义不迁移，迁移即对齐真源。**

## 2. 功能条款

### 2.1 密钥（WF1–WF3，继承现状为基线）

- **WF1 密钥生成**：RSA 3072 / 4096；私钥 PKCS#8、公钥 X.509 SPKI；PEM 与单行 Base64 双格式；复制/下载。
- **WF2 密钥自检**：生成后必做三项自检，任一失败即拒绝输出——
  SHA256withRSA 签名/验签往返、RSA-OAEP(SHA-256) 加解密往返、模数位数与所选一致。
- **WF3 公钥指纹**：输出 SPKI 的 SHA-256 指纹（冒号分隔 hex）；联调页商户私钥填入后自动派生指纹并提示与平台比对。

### 2.2 报文构造（WF4）

- **WF4 构造请求**（商户 → 网关）：
  - 输入 appKey / 请求路径 / expiredSeconds / 加密级别 L0|L2 / 安全套件 / 业务 JSON body；
  - 产出 canonicalRequest（5 段 `\n`、Java URLEncoder 语义、ASCII 头排序）与
    `x-wop-sign`（`v1/<expired>/<signedHeaders>/<b64url 签名>`）、`x-wop-content-digest`（`<alg> <恰一空格> <64 位小写 hex>`）；
  - L2：AES-256-GCM 全文加密 → `{"encrypted":…}`；DEK 载荷 `AES-256-GCM$b64url(key)$b64url(iv)` 以 RSA-OAEP(SHA-256) 包装入 `x-wop-encrypt`；
  - 产出请求头表、线上请求体、可复制 curl 命令；
  - 本地预检：以商户公钥对 canonical 验签（等价网关 SignFilter 重建路径）。
  - 对齐：SDK spec F3（结构化 x-wop-sign）语义。

### 2.3 报文验证（WF5）

- **WF5 验证平台报文**（同步响应 / 异步回调），**校验顺序与 F6 钉死一致**：
  ① 验签 → ② digest 复核 → ③ DEK 解包 → ④ alg 族比对 → ⑤ bulk 解密（I2/I3）；
  - 回调语义对齐 `verifyCallback(headers, body, callbackPath)`：canonical URI 取回调 URL 的 path
    （同步响应取网关请求路径）；
  - **迁移纠正**：源页面当前步骤顺序为「摘要复核→验签」（与 F6 相反），本条款覆盖之；
  - 步骤级可视化（✓/✗ + 失败原因），支持「模拟平台响应/回调」闭环自测（联调密钥仅存会话内存）；
  - **不保留**源页面「回调协议推演、尚未冻结」标注——回调语义已在 v1.0-ratified 冻结。

### 2.4 扩展能力（WF6+，按优先级）

**P0（随 MVP 发布）**

- **WF6 向量自测**：内置黄金向量 fixture（`vectors/crypto-vectors.json` 副本，**禁手改**，
  真源为 wop-specs/crypto/crypto-vectors.json），页面一键跑**字节级**断言：
  正向量（签名/密文/摘要/DEK 组装一致）+ 负向量（tamper/跨族/错长度/带 `=` base64 拒绝），
  通过才提示「本工具与官方规格对齐」（对齐 SDK spec F8 语义）；向量版本号随发布物声明。
- **WF7 整体粘贴解析**：粘贴原始 HTTP 报文（请求/响应/回调方向通用：起始行 + 头 + 空行 + body），
  解析自动填充验证区各头字段与报文体；缺失必填头 / 值格式非法（digest 头、L2;dek=、时间戳）逐项提示；
  解析仅本地字符串处理，不触碰密钥材料（S1/S2 不受影响）。
- **WF8 错误诊断**：粘贴错误响应信封 / 完整错误报文 / 裸错误码 → 按内置 62 码公共契约字典
  （对齐网关 GatewayExceptionEnum，分类/对外语义冻结）输出：含义、处置建议、归属、可重试性；
  未知码按段号分类提示；支持 traceId 携带引导；平台解密类（5003/5010/5012/5014）覆盖为商户自查提示。

**P1（路线图一期）**

- ~~**WF7 整体粘贴解析**：粘贴原始 HTTP 请求（含全部头 + 体）自动拆分填入验证表单，免手抄头。~~
- ~~**WF8 错误诊断**：粘贴错误响应 → 语义 + HTTP 映射 + 修复建议 + 排查路径（对齐 wop-troubleshoot 62 错误码目录）。~~
- **WF9 代码片段生成**：同一请求产出六语言官方 SDK 调用片段（语义对齐 wop-sdk-spec，非手写易错版）。
- **WF10 canonical 可视化**：canonicalRequest 逐段高亮展示 + 字段来源标注，定位签名偏差。

**P2（路线图二期）**

- **WF11 API 目录**：渲染 OpenAPI 3.1 契约（contracts 层），API 表单模板化生成请求。
- **WF12 教学图解**：数字信封流程（L0/L2）交互式演示。
- **WF13 SM2/SM3/SM4 套件**（scope 决策 D2 待拍板）：WebCrypto 原生无 SM2/SM3/SM4，
  需审计三方库并内置打包（S3）；遵循 Q7 裁决精神默认列路线图；若商户国密诉求强可提前。
- **WF14 i18n**：UI 中英双语。

## 3. 安全条款（S1–S7，宪法级）

- **S1 零外发**：密钥材料与明文报文**永不离开浏览器**。页面不得发起任何网络请求、
  不得加载第三方脚本（含 CDN/统计/字体）。构建产物须可审计（无外部资源引用）。
- **S2 不落盘**：私钥仅存内存/剪贴板/用户主动下载的文件；页面刷新即失；
  不得写入 localStorage/sessionStorage/IndexedDB。
- **S3 依赖白名单**：引入密码库须审计 + 版本锁定 + 内置打包（禁止运行时网络加载）；
  依赖清单与版本写入发布物声明。
- **S4 安全上下文**：Web Crypto 需 HTTPS 或本地文件环境；检测到不安全上下文须显式告警并禁用相关功能。
- **S5 文案纪律**：禁止任何诱导「上传私钥/提交平台」的文案；生产密钥管理明确引导至 wop-cli（S1–S8 通道）。
- **S6 契约诚信**：协议行为以已批准 spec 为准；未冻结/推演内容不得宣称正式，
  路线图能力（如 SM2 未实现时）页面须明确标注「未支持/路线图」而非静默缺失。
- **S7 不变量对齐**：先验签后解密、digest 必入签名头、DEK alg 族比对先于 bulk 解密、
  密钥参与判定的失败一律模糊（对齐 I1/I4/I5/I7），页面行为不得违反。

## 4. 治理与发布条款（G1–G5）

- **G1 归属**：wop-platform 组织（D3 待拍板），仓库与 specs/skills 同层治理。
- **G2 Pages**：GitHub Pages 启用（HTTPS）；根路径部署 `index.html`；同时保留仓库内单文件可下载路径。
- **G3 对齐**：协议术语/头名/错误码以 wop-specs 为唯一权威；真源变更须同步修订页面并 bump 版本。
- **G4 版本**：向量变更 = 破坏性变更；发布物声明对齐三元组版本（crypto spec / sdk spec / vectors）。
- **G5 测试载体**：功能条款 → 浏览器端 self-test 页（向量断言）；`spec:<ID>` 标签可 grep 索引；
  否定式条款（S1/S2/S6）须有对应断言。
- **G6 仓惯例**（循 wop-platform 惯例）：MIT License；README 中文默认 + README.en.md（含四段必备：
  快速开始/密钥准备/L0L2 示例/向量自测）；`vectors/crypto-vectors.json` 为 fixture 副本禁手改；
  conventional commits（中文 body 允许）。

## 5. 验收标准（A1–A7）

- **A1** Pages 线上可访问（HTTPS），密钥生成全流程可用。
- **A2** 下载单文件 `index.html` 本地打开（file://），全功能可用（离线卖点成立）。
- **A3** WF6 向量自测通过（正向量字节级一致 + 负向量全部拒绝）；页面声明的对齐版本与 wop-specs 一致。
- **A4** WF5 校验顺序与 F6 一致（验签→digest 复核→DEK 解包→alg 族比对→bulk 解密）；
  页面无「回调推演/未冻结」过时标注。
- **A5** 与 wop-cli 重叠功能行为一致：同一输入（appKey/path/body/密钥）下，
  canonicalRequest 与 x-wop-sign draft 与 `wop sign` 输出逐字节一致。
- **A6** 页面无任何网络请求（DevTools Network 面板为空），无第三方脚本（S1）。
- **A7** README 中英双语（中文默认）四段必备齐全；MIT License；vectors fixture 与真源字节一致。
### 5.1 条款 → 断言反向核对矩阵

| 条款 | 断言载体（grep 索引） | 断言内容 | 语义 |
|---|---|---|---|
| WF2 密钥自检 | `generate()` 三重自检（spec 注） | 签名往返 / OAEP 往返 / 模数位 | 任失败拒绝输出 |
| WF4 构造请求 | `buildRequest()` canonical 预检 | 商户公钥验签 canonical | 等价网关 SignFilter |
| WF5 验证顺序 | `verifyResponse()` 步骤展示 | 验签→digest→DEK→alg 族→bulk（F6 钉死） | I2/I3 |
| WF5 I5 族比对 | `// spec:WF5.I5`（verifyResponse step3） | `h.ok && h.alg==='sha-256'`，sm3 头拒绝 | 与 formatRules 同源 |
| WF6 digest | `// spec:WF6.digest`（runSelftest） | digest-sha256 字节级 + 头格式 | 正向量 |
| WF6 sign | `// spec:WF6.sign` | RSA 3072/4096 签名字节级 | 正向量 |
| WF6 aesgcm | `// spec:WF6.aesgcm` | 密文\|\|tag 字节级 | 正向量 |
| WF6 dek | `// spec:WF6.dek` | DEK 三段式 + OAEP 解包 + MGF1 陷阱拒绝 | 正/负向量 |
| WF6 formatRules | `// spec:WF6.formatRules` | 11 条：族比对推导 accept/reject | 正/负向量 |
| WF7 粘贴解析 | `// spec:WF7`（fillVerifyFromWire） | 报文→字段填充 + 缺头/格式诊断（digest/L2;dek=/ts） | 功能+否定式 |
| WF8 错误诊断 | `// spec:WF8`（diagnoseError） | 62 码字典命中/未知码分类/覆盖码/信封与报文识别 | 功能+否定式 |
| S1 零外发 | `// spec:S1`（scanSelfForBanned） | 源码自扫描：无外部 src/href、无 fetch/XHR/WS/Beacon | 否定式 |
| S2 不落盘 | `// spec:S2`（scanSelfForBanned） | 源码自扫描：无 localStorage/sessionStorage/indexedDB | 否定式 |
| G5 测试载体 | 本矩阵 + `// spec:<ID>` 注释 | 可 grep 索引 | 治理 |

> 注：扫描范围剔除自扫描函数自身源码（toString），描述性文案不误伤；禁词拼接书写双保险。

## 6. 决策记录（D1–D8）

| # | 问题 | 结论 | 状态 |
|---|---|---|---|
| D1 | 回调语义 | 对齐 v1.0-ratified F3/F6，迁移即纠正页面推演标注与步骤顺序 | **已定**（advisory 核实） |
| D2 | SM2 支持时机 | 默认首版仅 RSA、国密列 P2 路线图（Q7 精神；WebCrypto 无 SM2 需三方库） | 待拍板 |
| D3 | 仓库归属 | 默认 wop-platform 组织 / `wop-web-tools` | 待拍板 |
| D4 | 语言 | README 中文默认 + 英文（循惯例） | **已定** |
| D5 | 产物形态 | 源码多文件 + 构建产物单文件（保留离线卖点） | 默认采纳 |
| D6 | 数据来源 | 零网络，数据字典内置打包随版本 | 默认采纳 |
| D7 | 私钥交付 | 复制/下载即唯一副本 + 引导备份；禁止诱导上传 | 默认采纳 |
| D8 | 仓惯例 | MIT / 双语 README / vectors fixture 禁手改 / 向量自测（F8 语义） | **已定** |

## 7. 边界服务能力全景（头脑风暴产出）

```text
场景 A：API 调用（商户 → 网关）          场景 B：回调通知（网关 → 商户）
  WF1–WF3 密钥生命周期                      WF5  回调验证台（F6 顺序：验签→digest→DEK→alg→解密）
  WF4  请求构造工作台                       WF9  回调 curl 自测引导
  WF9  六语言代码片段生成                   WF7  原始 HTTP 整体粘贴解析
  WF10 canonical 可视化调试                 WF12 教学图解
  WF8  错误诊断（62 错误码）
  WF11 API 目录（OpenAPI 3.1）
  WF13 SM2/SM3/SM4 套件（P2，scope 决策）

场景 C：信任与治理（横切）
  WF6  黄金向量自测（正/负向量，F8 语义）
  S1–S7 零外发 / 不落盘 / 依赖白名单 / 契约诚信
  G1–G6 归属 / Pages / 对齐 / 版本 / 测试载体 / 仓惯例
```

 优先级：P0 = 现有两场景上线 + WF5 顺序纠正 + WF6 向量自测 + WF7 粘贴解析 + WF8 错误诊断（2026-08-31 落地）
→ P1 = WF9–WF10（代码片段、canonical 可视化）→ P2 = WF11–WF14（目录、教学、SM2、i18n）。
