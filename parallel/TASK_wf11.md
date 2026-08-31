# wop-web-tools — WF11 任务书（API 目录：OpenAPI 契约渲染 + 表单模板化）

你是 wop-web-tools 项目的 WF11 实现 agent。项目根：`/Users/dreambt/sources/open-platform/wop-web-tools`。
**先读 `/Users/dreambt/sources/open-platform/wop-web-tools/parallel/WF_CONTRACT.md` 并严格遵循**（文件隔离、注册协议、断言契约、S1/S2 纪律、i18n 约定、交付格式）。

## 背景（重要事实，勿重查）
WOP 是「物流轨迹服务」开放平台，网关实现见 `/Users/dreambt/sources/open-platform/gtsp-wop-gateway`（只读参考）。协议契约见 `/Users/dreambt/sources/open-platform/wop-specs/crypto/crypto-strategy-spec.md` 与 `/Users/dreambt/sources/open-platform/wop-specs/sdk/wop-sdk-spec.md`（只读）。

## 目标：WF11 — API 目录（OpenAPI 3.1 渲染 + 表单模板化请求）
商户要对接 N 个接口，目前靠文档翻查。做一个「API 目录」Tab：

1. **契约源**（先调研再定）：
   - 在 `/Users/dreambt/sources/open-platform/gtsp-wop-gateway` 里 grep `openapi|swagger|\.yaml|\.yml` 找现成 OpenAPI/接口清单（controller 里的 `@RequestMapping`/路由注解也统计接口）。
   - 找到真实接口清单 → 基于它构建契约数据；找不到 → 用 wop-sdk-spec 中列出的接口构建**示例契约**，并在 UI 明显标注「示例契约，待正式 OpenAPI 替换」。
2. **渲染**：内嵌一份 OpenAPI 3.1 契约数据（JS 对象，不用 YAML 解析器），渲染接口列表：
   - 按 tag 分组；每接口显示：method + path + 摘要 + 参数表（名称/位置/类型/必填）+ 响应码
   - 请求体 schema 渲染成**表单**：输入后一键生成 JSON body + 填充到「请求构造」Tab 的 body 字段（通过 `window.buildRequest` 相关输入框赋值——只读调用现有 DOM 元素，给集成者标注接线点）
3. **签名参数提示**：每个接口标注需要哪些 WOP 协议头（appkey/sign/encrypt/digest 等），点击「填充请求区」把接口名/路径/方法填到请求构造 Tab。
4. 契约数据里至少覆盖 5 个接口（真实或示例，含一个回调通知接口如轨迹回调）。

## 实现约束
- 只读调用现有全局：`$` 等；赋值现有输入框 id（读 index.html 确认 id 后再写）。
- 契约数据放 `wf11/contract.js`（独立文件，清晰可替换）。
- 断言（`// spec:WF11`）至少 6 条：
  - 契约数据合法（5+ 接口、每个有 method/path/操作ID）
  - 渲染：接口列表数量与契约一致
  - 表单生成：填参→body JSON 正确（含嵌套对象）
  - 「填充请求区」：路径/方法正确写入目标输入框
  - 否定式：必填缺失时表单校验报错；非法参数类型被拒
- 中文文案，`data-i18n="wf11.*"`。

## 验收
产物在 `wf11/` 目录（wf11.js / wf11.css / wf11.html / wf11.selftest.js / contract.js / README.md），自测通过，commit（身份 wop-web-tools，≤50 字符），**不 push**。
