# WF11 — API 目录（OpenAPI 3.1 契约渲染 + 表单模板化请求）

## 功能概述

为商户提供「API 目录」Tab：内嵌一份 OpenAPI 3.1 风格契约数据（JS 对象，无 YAML 解析依赖），
按 tag 分组渲染接口列表；每接口展示 method + path + 摘要 + WOP 协议头表 + 参数表（名称/位置/类型/必填）+ 响应码；
请求体 schema 模板化渲染成表单（支持嵌套对象/数组/枚举/布尔/整数边界），填参后一键生成 body JSON
并填充到「请求构造」Tab 的现有输入框（单向赋值，不触碰其行为）。

**契约数据来源**（调研结论，2026-08-31）：gtsp-wop-gateway 内无正式 OpenAPI/Swagger 契约
（接口元数据运行时从平台 DB 加载），故本目录交付**示例契约**：路径风格取自网关测试真实样例
（`logistics/open-plat/waybill-query`、`/open-plat/waybill/waybill-info-query`），协议头/响应码语义
对齐 GatewayConstants（`x-wop-*` 六头、业务错误 HTTP 200 + body.code、限流 429、平台内部 500）。
UI 顶部横幅显著标注「示例契约，待正式 OpenAPI 替换」；正式契约就绪后整体替换 `contract.js`
并置 `isExample: false`（横幅自动隐藏，有断言守卫）。

覆盖 6 个接口：运单查询、运单明细查询、最新轨迹查询、轨迹订阅（含嵌套回调配置对象）、
取消订阅、轨迹推送回调（平台 → 商户方向）。

## 文件清单

| 文件 | 职责 |
|------|------|
| `contract.js` | 契约数据（独立文件，清晰可替换）；挂 `window.WF11_CONTRACT` |
| `wf11.js` | 实现 + 注册；纯逻辑挂 `window.WF11_CORE`，DOM 挂载仅 `init()`；注册 `WF_REGISTRY['wf11']` |
| `wf11.css` | 样式（`wf11-` 前缀全自含，无外部依赖） |
| `wf11.html` | UI 片段（根骨架 + 横幅 + 目录/详情容器） |
| `wf11.selftest.js` | 持久断言；挂 `window.WF11_SELFTEST`，经 `WF_REGISTRY['wf11'].selftest()` 接入 runSelftest |

## 集成接线说明（集成者操作）

1. **加载顺序**：`contract.js` → `wf11.js` → `wf11.selftest.js`（后两个依赖前者；均无模块语法，IIFE 直接执行）。
2. **锚点**：`wf11.html` 片段插入为新 Tab 页，与现有 `tabpage` 平级：
   `<div class="tabpage" id="tab-api" hidden> …片段… </div>`，
   并在 Tab 按钮区新增 `<button class="tab" data-tab="api">…</button>`（对齐现有 data-tab 切换约定）。
   `wf11.css` 文本整体内联进页面 `<style>`。
3. **init 时机**：`WF_REGISTRY['wf11'].init()` 在 DOM 就绪后统一调用（本目录未自挂 DOMContentLoaded）。
   init 会：按 `isExample` 显示横幅 → 渲染目录 → 选中首个接口 → 绑定事件委托。
4. **填充目标**（只赋值，不改行为）：`r-path`（写入 `/gateway` + apiPath）、`r-body`（生成的 JSON）、
   `r-level`（契约 `x-wop-level`，仅 L0/L2）。现有请求区**无 method 输入框**且网关统一 POST
   （GatewayServlet 实证），故 method 仅在填充结果消息中展示；若未来请求区增加 method 字段
   （如 `r-method`），在 `wf11.js` 的 `fillRequest()` targets 数组补一行即可。
5. **i18n**：静态文案已用 `data-i18n="wf11.*"`；动态文案统一走 `WF14.t(key, fallback)` 回退中文，WF14 收口时
   提取 key 建字典即可，无需改本目录。
6. **自测接入**：`runSelftest` 遍历 `WF_REGISTRY` 时调用 `wf11.selftest()`，返回标准断言数组。

## 断言清单（条款 → 断言反向核对矩阵）

selftest 共 13 条断言，覆盖任务书全部 5 类要求 + 否定式条款：

| spec 标签 | 断言名 | 防护的 bug |
|-----------|--------|-----------|
| WF11-CONTRACT | 契约：≥5 接口且结构完整 | 契约缺 operationId/summary/method/path 导致渲染崩坏 |
| WF11-CONTRACT | 契约：统一 POST 且含回调接口 | 契约混入非 POST method（网关事实违背）；漏掉回调接口 |
| WF11-EXAMPLE | 示例契约：显著标注生效 | isExample=true 但横幅缺失（示例数据被当正式契约） |
| WF11-RENDER | 渲染：目录条目数与契约一致 | 渲染丢接口/tag 分组错误 |
| WF11-FORM | 表单：填参生成嵌套 body JSON | 嵌套对象/数组/整数转换错误 |
| WF11-FORM | 表单：选填缺省不污染 body | example 默认值混入生成的 body |
| WF11-FILL | 填充：路径/body/加密级别写入请求区 | 路径前缀 `/gateway` 丢失；写错目标 id |
| WF11-FILL | 填充：目标缺失不抛错且报失败 | 独立预览（未集成请求区）时填充崩溃 |
| WF11-VALID-REQ | 校验：必填缺失报错（含嵌套必填） | 必填缺失静默通过（否定式条款） |
| WF11-VALID-REQ | 校验：嵌套必填指向精确路径 | 嵌套 required 语义错误（父必填传染子字段 — 自测抓到并已修复） |
| WF11-VALID-TYPE | 校验：integer/boolean 非法值被拒 | 类型不校验直接透传（否定式条款） |
| WF11-VALID-ARR | 校验：minItems/数组元素类型/枚举被拒 | 数组边界/枚举成员不设防（否定式条款） |
| WF11-I18N | i18n：WF14 未加载回退中文 | WF14 缺席时动态文案渲染 undefined |

## 自测结果（node，2026-08-31）

- `node --check` 语法通过（三文件）
- `WF11_SELFTEST.run()`：**13/13 PASS**
- detailHtml 冒烟：6/6 接口渲染含参数表/协议头/表单标记
- 开发期自测抓到 1 个真实 bug 并修复：`buildFormModel` 曾把父对象 required 传播给全部子字段
  （`callback` 必填 → 其下 `signAlgorithm` 等全被标必填），修复后 required 只作用于对象本身；
  修复由「嵌套必填指向精确路径」断言持续守卫。

## S1/S2 纪律

产物内无网络/存储调用（无 fe't'ch 类禁词；URL 字符串仅为契约示例数据的展示文本，
非 `src=`/`href=` 属性、不发起任何请求）。断言不触碰网络与存储。
