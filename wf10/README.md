# WF10 — canonicalRequest 逐段解析

## 功能概述
在「报文联调」Tab 的构造结果区新增折叠面板：把 canonicalRequest 按行拆解，每行标注段类型（AuthString / HTTPMethod / CanonicalURI / CanonicalQueryString / CanonicalHeaders）、来源字段徽标（hover 显示来源输入框当前值）与组串规则；内置逐行差异检测（绿=一致 / 红=差异 / 灰=未参与）与一键复制。两种工作模式：
- **built 模式**：`#req-canonical` 非空（已点「构造请求」）时，实时解析真值串；
- **preview 模式**：未构造请求时按当前字段预估（nonce/时间戳/加密信封为占位值，摘要按明文 body 估算并在状态栏注明），构造后自动切换。

## 文件清单
| 文件 | 说明 |
|---|---|
| `wf10.js` | 实现 + `WF_REGISTRY['wf10']` 注册；纯核心挂 `window.WF10`（splitCanonical / segmentMeta / diffLines / digestHeaderValue / EMPTY_SHA256）；css/html 以模板字面量内嵌于注册项（与独立文件逐字节一致，node harness 已断言无漂移） |
| `wf10.css` | 面板样式（全部 `wf10-` 前缀命名空间，取色对齐现有 `--card/--border/--muted/--mono` 变量并带回退） |
| `wf10.html` | UI 片段（根节点 `<details id="wf10-root">`，默认收起） |
| `wf10.selftest.js` | 断言套件 `window.WF10RunSelftest`（8 条，spec 标签见下）；无 DOM 环境可跑（字段实测自动跳过） |

## 需要集成者接线的地方
- **锚点**：`#tab-request` 内 `#req-out` 第一张 card（「构造结果」）中，紧跟 `#req-canonical` 所在 `details.debug` 之后。
- **加载顺序**：`wf10.js` → `wf10.selftest.js`（selftest 经注册项间接调用，先后皆可，但两者都必须引入）；无 `window.GM` 依赖。
- **时机**：DOM 就绪后调用 `WF_REGISTRY['wf10'].init()`（本切片不自带 DOMContentLoaded 监听）；`WF_REGISTRY['wf10'].selftest()` 接入 runSelftest。
- **样式/片段**：优先直接采用注册项 `css`/`html` 字符串注入；与独立文件内容一致。
- **i18n**：静态文案已用 `data-i18n="wf10.*"`（key：title/subtitle/refresh/copy/diff.title/diff.hint 等）；动态文案走 `WF14.t(key, fallback)`（未加载回退中文），WF14 提取即可。

## 断言清单（selftest 8 条）
| spec 标签 | 断言 | 路径 |
|---|---|---|
| `WF10-SPLIT` | 6 段逐行内容/类型与组串输出一致，round-trip 无损 | 正 |
| `WF10-SPLIT-REJECT` | 空串/全空白/非字符串/段数不足/头行无冒号均被拒绝且有 error 原因，不抛异常 | 负 |
| `WF10-SRC-METHOD` | 方法行=POST，徽标 HTTPMethod，来源含「请求方法」 | 正 |
| `WF10-SRC-URI` | URI 行=请求路径字段值，来源字段 `#r-path` | 正 |
| `WF10-SRC-HEADER` | appkey→`#r-appkey`、digest→`#r-body`、未知头回退通用标注不崩溃 | 正+负 |
| `WF10-EMPTY-QS` | 空查询参数：恰 1 个空行且为 qs 段，总行数=4+头数；有查询串时无空行 | 负定式 |
| `WF10-EMPTY-BODY` | 空 body：哈希入参确为空串，摘要行=`sha-256 `+空 SHA-256 常量（e3b0…b855） | 边界 |
| `WF10-DIFF` | 完全一致 0 差异；改一字恰该行红且 1 处；改回恢复绿；多行=extra、缺行=missing 计数正确 | 正+负 |

## 已上报的 spec 冲突（依契约「发现冲突必须上报」）
任务书按 AWS SigV4 风格列了 SignedHeaders 行与 HashedPayload 行，并提及 appSecret/方法/查询参数输入字段；**实际 `buildCanonical()` 输出为 5 段结构**（AuthString/HTTPMethod/CanonicalURI/CanonicalQueryString/CanonicalHeaders），且：
- 无独立 SignedHeaders 行 —— 等价承载是 `x-wop-sign` 头值第 3 段（参与签名头名，ASCII 升序、`;` 连接），不在 canonical 内；面板底部说明行已标注。
- 无独立 HashedPayload 行 —— 等价承载是 `x-wop-content-digest` 头（`sha-256 ` + 64 位 hex，对线上请求体取摘要）；来源标注已注明。
- 签名机制为 RSA（PKCS#8 私钥），无 appSecret 输入框；请求方法固定 POST、查询串固定空（网关全走 POST catch-all），来源标注如实注明而非虚构字段。

实现以任务书指定的权威来源「`buildCanonical()` 输出」为准。

## 自测结果（2026-08-31）
- **node**（`/tmp/wf10_node_check.js`，stub DOM + 真身组串函数拷贝）：8/8 PASS；S1/S2 禁词与模块语法扫描通过；注册项 css/html 与独立文件零漂移。
- **浏览器**（`/tmp/wf10_verify` 副本按集成契约注入，`python3 -m http.server 8932` + headless 驱动）：密钥生成→带入→联调平台密钥→构造请求全链路后，built 模式 9 行逐段渲染正确（含 hover 来源当前值）；差异检测「改 L2 一字→恰 1 行红，改回→全绿」；页面内 selftest 8/8 PASS；清空 `#req-canonical` 后正确切换 preview 模式（9 行）。
