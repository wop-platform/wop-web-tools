# wop-web-tools 并行实现 — 文件契约 v1

## 原则
- 每个 WF 一个独立目录，**只写自己的目录，绝不触碰 index.html / docs/ / README**（集成者统一合并）。
- 产出的都是**纯静态可内嵌切片**（JS/CSS/HTML 片段），最终由集成者合并进单文件 index.html。
- 所有功能必须**自含持久断言**（供集成者接入 runSelftest），断言带 `// spec:<ID>` 标签；否定式条款也要断言。
- 禁止以「既有架构/所有权」为由顺延 spec 条款；发现冲突必须上报。

## 目录与命名
- `wf10/`（canonical 可视化）、`wf9/`（代码片段）、`wf11/`（OpenAPI 目录）、`wf12/`（信封图解）、`wf14/`（i18n）、`gm/`（国密）
- 每目录内文件：`<name>.js`（实现 + 注册）、`<name>.css`、`<name>.html`（UI 片段）、`<name>.selftest.js`（断言）
- 产物必须是**浏览器可直接执行的 ES5/ES2015+ 无模块语法**（单文件合并后无 bundler；用 IIFE 或普通函数声明，禁止 import/export/require）

## 注册协议
```js
window.WF_REGISTRY = window.WF_REGISTRY || {};
WF_REGISTRY['wf10'] = {
  id: 'wf10',                       // 唯一
  title: '...',                     // 功能名（中文）
  css: '',                          // CSS 文本（可选）
  html: '<div id="wf10-root">…</div>', // UI 片段（可选）
  init: function () {},             // DOM 就绪后调用（集成者负责时机）
  selftest: function () { return [ {name, pass, detail} ]; } // 断言（集成者接入 runSelftest）
};
```
- html 片段用 `id="wf10-*"` 前缀，杜绝与现有页面 id 冲突。
- init 在集成后由页面统一调用；你的代码**不要自己**加 DOMContentLoaded / window.onload（集成者处理）；可以调用 `document.getElementById('...')`（若你的根节点已插入）。
- 若功能需要挂在现有 Tab（如验证区/请求区），在 html 片段里给出「插入锚点建议」（如：插入到 `#request-panel` 内），由集成者落位；你只负责把片段结构写清楚。

## 共享全局（只读调用，禁止修改其行为）
现有 index.html 提供（可直接调用）：
`$`(id), `b64urlFromBytes`, `bytesFromB64url`, `sha256Hex`, `buildCanonical`, `canonicalHeaders`, `parseDigestHeader`, `strictB64urlOk`, `WOP_VECTORS`, `WOP_ERRORS`, `ERR_SEG`, `ERR_OVERRIDE`, `renderSteps`, `generate`, `buildRequest`, `simulateResponse`, `verifyResponse`（只读展示用；不要改它们的返回值语义）。
- 若你的功能需要**新算法原语**（如 SM2/SM3/SM4），在 `gm/` 目录实现并暴露 `window.GM = { sm2:{}, sm3, sm4:{} }`，你的代码依赖 `window.GM` 存在时可用（集成者保证加载顺序：gm 最先）。
- 若你的功能必须扩展现有函数行为（如 parseDigestHeader 支持 sm3 族），**不要改函数本身**，在你自己目录提供包装函数，并在 html 片段顶部注释里说明集成时需要接线的地方（集成者做接线）。

## i18n 约定（WF14 收口）
- 所有新增 UI 文案：`<span class="i18n" data-i18n="wf10.title">中文默认文案</span>`。
- key 前缀 = 你的功能 id（wf10./wf9./wf11./wf12./gm.）。WF14 agent 负责：提取全部 `data-i18n` key → 建双语字典 → 语言切换逻辑；集成后全页面统一收口。
- 你自己的代码若动态生成文案，统一走 `WF14.t(key, fallback)`（WF14 提供的全局；未加载时回退 fallback 中文）。

## 断言契约
- `selftest()` 返回数组：`[{ name: '短名', pass: true|false, detail: '失败原因' }]`。
- 每条断言都要能防住一个真实 bug（不是摆设）；正/负路径都要有；涉及输入格式的功能必须有「非法输入被拒绝」断言。
- 断言内**禁止**触碰网络/存储（S1/S2 纪律）；断言渲染文案用中文，但禁止包含完整禁词（见下）。

## S1/S2 纪律（宪法级，不可弱化）
- 你的代码（含库代码）内禁止出现完整禁词：`fetch(`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`, `localStorage`, `sessionStorage`, `indexedDB`, `data:` 之外的 `src=`/`href=` 网络 URL。
- 需要引用禁词的场景（注释/文档）必须**拼接书写**（如 `'local' + 'Storage'`）。
- 不要用 CDN/外部 URL；库代码必须自包含进你的目录。

## 交付格式
- 所有产物写完自测通过后，在你的目录里放 `README.md` 说明：功能概述、文件清单、需要集成者接线的地方（锚点/依赖/加载顺序）、你的断言清单（含 spec 标签）。
- 不跑任何构建/格式器/项目级测试（集成者统一做）；你只验证自己的产物（浏览器 console 或 node 直接执行你的 JS 文件做单元验证）。
- 提交前把你的目录 `git add` 并 commit（`git -c user.name="wop-web-tools" -c user.email="dev@wop.local" commit -m "feat: WFxx ..."`，conventional，≤50 字符）；**不要 push**（集成者统一 push）。
