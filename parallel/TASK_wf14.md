# wop-web-tools — WF14 任务书（i18n 基础设施）

你是 wop-web-tools 项目的 WF14 实现 agent。项目根：`/Users/dreambt/sources/open-platform/wop-web-tools`。
**先读 `/Users/dreambt/sources/open-platform/wop-web-tools/parallel/WF_CONTRACT.md` 并严格遵循**（文件隔离、注册协议、断言契约、S1/S2 纪律、交付格式）。

## 背景（重要事实，勿重查）
现有 `index.html` 全部中文硬编码（勿改——集成者收口时统一迁移）。WF10/WF9/WF11/WF12/国密 5 个并行 agent 会各自产出带 `data-i18n="wf10.*"/"wf9.*"/"wf11.*"/"wf12.*"/"gm.*"` 标记的新 UI（见契约的 i18n 约定）。

## 目标：WF14 — i18n 基础设施（框架先行，全量文案集成阶段收口）
1. **全局 API**（`window.WF14`）：
   - `WF14.t(key, fallback)`：取当前语言文案；无 key 时回退 fallback（中文）
   - `WF14.setLang('zh'|'en')`：切换语言 → 遍历 `[data-i18n]` 元素更新文本 → 触发 `document.dispatchEvent(new CustomEvent('wop:langchange'))`
   - `WF14.register(dict)`：其他 WF 注册自己的字典（合并进全局字典）
   - 字典结构 `{ zh: { 'wf10.title': '...' }, en: { 'wf10.title': '...' } }`
2. **切换控件**：右上角语言切换（中文/English 两个按钮或 select），UI 片段 `id="wf14-*"` 前缀。
3. **动态文案**：页面运行时用 JS 生成的文案（如状态提示），其他 WF 通过 `WF14.t()` 生成；WF14 提供 `WF14.t` 的**待翻译 key 收集器**（dev 模式）：`WF14.collectKeys()` 返回全部已注册 key，供集成阶段检查遗漏。
4. **默认语言**：中文（现有页面语言）。语言偏好不落盘（S2 纪律：禁止 localStorage——语言切换只影响当前会话，刷新回中文；或注释说明遵守 S2）。
5. **占位字典**：预置 `wf10.*/wf9.*/wf11.*/wf12.*/gm.*` 空结构；集成阶段由集成者从各 agent 产物收集实际 key 填进去——你在 README 里写明收口流程（grep `data-i18n` → 提取 key → 生成中英字典）。

## 实现约束
- 断言（`// spec:WF14`）至少 6 条：
  - `WF14.t` 命中已有 key；未注册 key 回退 fallback
  - `setLang('en')` 后 `[data-i18n]` 元素文本切换；切回 'zh' 恢复
  - 注册字典合并正确（同 key 后者覆盖）
  - langchange 事件派发
  - 否定式：空 key/空 fallback 不崩溃；非法语言参数回退 zh
  - collectKeys 返回全部注册 key
- 你的代码零网络、零存储（S1/S2），禁词拼接书写。
- 中文默认文案，`data-i18n` key 与字典必须一致（自断言）。

## 验收
产物在 `wf14/` 目录（wf14.js / wf14.css / wf14.html / wf14.selftest.js / README.md 含收口流程说明），自测通过（node + 浏览器 console），commit（身份 wop-web-tools，≤50 字符），**不 push**。
