# WF14 — i18n 基础设施（中英切换）

框架先行：提供全局 i18n API 与右上角语言切换控件；全量文案翻译在**集成收口阶段**统一完成（现有 `index.html` 中文硬编码不动，由集成者迁移）。

## 文件清单

| 文件 | 说明 |
|---|---|
| `wf14.js` | 实现 + 注册（`WF_REGISTRY['wf14']`）。内嵌 `CSS_TEXT` / `HTML_FRAG`，与独立文件**字节级一致**（自测有同步断言） |
| `wf14.css` | 控件样式（与 `wf14.js` 内嵌 `CSS_TEXT` 双写，改动需同步） |
| `wf14.html` | UI 片段（与 `wf14.js` 内嵌 `HTML_FRAG` 双写，改动需同步） |
| `wf14.selftest.js` | 断言集（13 条，全部 `// spec:WF14-*` 标签），经 `WF14_RUN_SELFTEST` 委托接入 |
| `README.md` | 本文件 |

## 全局 API（`window.WF14`）

| API | 行为 |
|---|---|
| `WF14.t(key, fallback)` | 取当前语言文案。级联：`dict[当前语言]` → `dict.zh` → `fallback` →（fallback 缺省/null）回显 key（便于发现漏翻） |
| `WF14.setLang('zh'\|'en')` | 非法参数（含大小写敏感，`'EN'` 非法）回退 `zh` → 遍历 `[data-i18n]` 更新文本 → 派发 `wop:langchange`（`detail.lang` 为实际语言）。返回生效语言 |
| `WF14.getLang()` | 当前语言（默认 `zh`） |
| `WF14.register({zh:{},en:{}})` | 合并进全局字典，**同 key 后注册覆盖**；未知语言段（如 `fr`）忽略；合并后立即应用到已有 `[data-i18n]`（迟注册字典即时生效）。非法入参返回 `false` 不抛错 |
| `WF14.collectKeys()` | dev 模式收集器：返回全部已注册 key（排序去重），供集成阶段对照遗漏 |
| `WF14.LANGS` / `WF14.PREFIXES` | 只读常量：`['zh','en']` / 预留命名空间 `wf14/wf10/wf9/wf11/wf12/gm` |

**DOM 应用规则（关键）**：`data-i18n` 挂在**叶子元素**（契约的 `<span class="i18n">`）；`applyDom` 仅对**命中字典**的元素写 `textContent`，未注册 key 的元素保留原内联文案——框架先行阶段不清空其他 WF 尚未收口的片段。

**S2 纪律**：语言偏好不落盘（不使用 `'local'+'Storage'` 等任何持久化手段），刷新回中文。这是遵守纪律的设计决定，非缺陷。

## 集成接线（集成者）

1. **加载顺序**：`gm`（契约要求最先）→ `wf14.js` →（其他 WF 产物，可在其 init 中调 `WF14.t` / `WF14.register`）→ `wf14.selftest.js`（顺序不敏感，颠倒亦可）。
2. **锚点**：`wf14.html` 插入 `index.html` 的 `<header>`（约 146 行）内 `<h1>` 同行右侧；样式取 `registry.css` 或 `wf14.css`。
3. **init 时机**：DOM 就绪后统一调 `WF_REGISTRY.wf14.init()`（绑定按钮点击、归一化当前语言、同步激活态；重复调用幂等无害）。
4. **自测接入**：`runSelftest` 聚合时调用 `WF_REGISTRY.wf14.selftest()`（内部委托 `WF14_RUN_SELFTEST`，缺 selftest 文件时返回一条失败断言提醒）。

## 断言矩阵（13 条，正/负路径齐备）

| spec 标签 | 断言名 | 防护点 |
|---|---|---|
| `WF14-T-HIT` | t() 命中已注册 key（zh/en） | 双语取值正确 |
| `WF14-CASCADE` | en 缺失时级联回 zh 文案 | 未翻译 key 露中文而非 fallback |
| `WF14-T-FALLBACK` | 未注册 key 回退 fallback/回显 key | 漏翻兜底可见 |
| `WF14-NEG` | 空 key/空 fallback/非法入参不崩溃 | 否定式 |
| `WF14-SETLANG-DOM` | setLang 后 DOM 文本切换/恢复 | 核心切换闭环 |
| `WF14-DOM-SKIP` | 未注册 key 元素不被清空 | 否定式：不清空他人未收口文案 |
| `WF14-REGISTER-MERGE` | register 同 key 后者覆盖 | 合并语义 |
| `WF14-REGISTER-NEG` | 未知语言段被忽略 | 否定式：lang 拼写错误不入字典 |
| `WF14-EVENT` | wop:langchange 事件派发 | 事件契约（type + detail.lang） |
| `WF14-INVALID` | 非法语言参数回退 zh | 否定式：fr/null/undefined/'EN' |
| `WF14-COLLECT` | collectKeys 全量/排序/去重 | 收集器可信 |
| `WF14-KEY-CONSISTENCY` | 片段 key 前缀/字典/内联文案一致 | 自断言：key 与字典一致（任务书条款） |
| `WF14-INIT-WIRING` | init 按钮接线/激活态同步 | 控件真实可用 |

另有双写一致性校验（内嵌 `CSS_TEXT`/`HTML_FRAG` vs 独立文件，字节级，自测脚本外单独跑，见下）。

## 收口流程（集成阶段，i18n 全量迁移）

1. **提取 key**：`grep -oh 'data-i18n="[^"]*"' wf10/ wf9/ wf11/ wf12/ gm/ 以及集成后 index.html 新增 UI | sort -u`。
2. **中文文案** = 元素内联默认文本；英文翻译由集成者补齐（key 命名沿用各 WF 前缀，见 `WF14.PREFIXES`）。
3. **填充**：把双语字典填进 `wf14.js` 的 `DICT` 占位区（`zh`/`en` 各一），或集成脚本直接 `WF14.register({zh:{...},en:{...}})`。
4. **对照检查**：`WF14.collectKeys()`（控制台执行）vs 第 1 步 key 集：
   - DOM 有而字典无 → 漏翻（运行时元素保持内联中文，`t()` 走 fallback）；
   - 字典有而 DOM 无 → 死 key，删除。
5. **迁移现有 index.html 中文硬编码**：给元素加 `data-i18n` + 抽 key（统一由集成者做，WF agent 不动 index.html）。

## 自测复现

```bash
# Node 断言（13 条）
cat wf14/wf14.js wf14/wf14.selftest.js <runner> | node
# 双写同步校验（css/html 文件 vs 内嵌串）
cat wf14/wf14.js <sync-check> | node
```

浏览器：临时页引入两 JS + 插入片段 + `init()` 后调 `WF_REGISTRY.wf14.selftest()`；实测两种语言切换、激活态、未注册 key 不清空。本次自测：Node 13/13、浏览器 13/13、双写同步 true/true、S1/S2 扫描零命中、无 import/export/require。
