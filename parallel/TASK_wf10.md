# wop-web-tools — WF10 任务书（canonical 可视化）

你是 wop-web-tools 项目的 WF10 实现 agent。项目根：`/Users/dreambt/sources/open-platform/wop-web-tools`。
**先读 `/Users/dreambt/sources/open-platform/wop-web-tools/parallel/WF_CONTRACT.md` 并严格遵循**（文件隔离、注册协议、断言契约、S1/S2 纪律、i18n 约定、交付格式）。

## 背景（重要事实，勿重查）
现有 `index.html`（单文件，勿改）已实现：请求构造（`buildRequest`）、canonical 组串（`buildCanonical()` 返回 canonicalRequest 字符串，`canonicalHeaders()` 返回规范化头）、签名、响应验证（`verifyResponse`）。商户对接最大损耗是 canonical 组串偏差导致签名失败，但现有工具只输出最终 canonical 字符串，看不出每一行来自哪个字段。

## 目标：WF10 — canonicalRequest 逐段可视化
在「请求构造」Tab 内新增一个可视化面板：用户点击后，把当前请求字段（appKey/appSecret/路径/方法/查询参数/body/headers）→ 生成 canonicalRequest 的**每一行**，每行标注「来源」：

1. 解析 `buildCanonical()` 的输出（或复用 `canonicalHeaders()` 等现有函数），按行拆分：
   - HTTPMethod 行（标注：来自「请求方法」字段）
   - CanonicalURI 行（标注：来自「请求路径」字段 + URL 编码规则）
   - CanonicalQueryString 行（标注：来自「查询参数」字段 + 排序编码规则）
   - CanonicalHeaders 块（每行标注：来自哪个 header 字段，规范化规则）
   - SignedHeaders 行（标注：哪些头参与签名）
   - HashedPayload 行（标注：body 摘要）
2. 每行右侧显示「来源标注」徽标；hover 显示该来源字段的当前值。
3. **差异检测**：若用户手动改了 canonical 文本（textarea），实时比对「与自动生成差异」，高亮不一致行（绿=一致，红=差异，灰=未参与）。
4. 一键「复制 canonicalRequest」按钮（navigator.clipboard 或 textarea select+copy 兜底，注意 S1 纪律——clipboard 是浏览器 API 不违反 S1，但别用 `fetch`）。
5. UI 折叠面板 `<details id="wf10-root">`，默认收起；展开时自动刷新。

## 实现约束
- 只读调用现有全局：`$`, `buildCanonical`, `canonicalHeaders`, `buildRequest` 相关字段读取（读 DOM 输入框即可，不要改它们的语义）。
- 字段输入框 id 参考 index.html（读文件确认）：请求方法/路径/查询参数/headers/body 等。
- 你的 html 片段给出插入锚点建议（如插入到请求构造面板某位置），集成者落位。
- 断言（`// spec:WF10`）至少 6 条，正/负路径都要：
  - canonical 行拆分正确（行数、各段内容与 buildCanonical 输出一致）
  - 来源标注正确（方法行→方法字段、URI 行→路径字段）
  - 差异检测：改一个字符 → 该行标红；改回 → 绿
  - 空字段边界：body 为空时 HashedPayload 行为正确
  - 否定式：查询参数为空时 QueryString 行为正确（无多余空行）
- 中文文案，`data-i18n="wf10.*"`。

## 验收
产物在 `wf10/` 目录（wf10.js / wf10.css / wf10.html / wf10.selftest.js / README.md），自测通过（用 node 直接执行你的纯函数部分做单元验证 + 浏览器 console 验证 DOM 逻辑——本地起 `python3 -m http.server 8932` 也行，但你**不能**改 index.html，临时复制一份到 /tmp 验证你的片段）。commit（身份 wop-web-tools，conventional ≤50 字符），**不 push**。
