# WF12 — 数字信封 L0/L2 流程图解（教学切片）

以交互演示讲清 WOP 数字信封两档位（L0 明文+签名 / L2 AES-256-GCM+RSA-OAEP 信封）的四步构造
与网关五步校验管线，并逐类演示「单字节篡改分别落在哪一步被拦」。只读复用 index.html 共享脚本
的契约枚举全局（WOP_VECTORS / b64urlFromBytes / bytesFromB64url / sha256Hex / parseDigestHeader /
strictB64urlOk / canonicalHeaders / buildCanonical）与 WF14.t（回退中文）。

## 文件与接线（集成者视角）

| 文件 | 角色 |
| --- | --- |
| wf12.css | 面板样式（`wf12-` 作用域，自包含） |
| wf12.html | UI 片段（根节点 `#wf12-root`，顶部注释含集成锚点建议） |
| wf12.js | IIFE：纯函数构造/校验管线 + 演示与篡改引擎；注册 `WF_REGISTRY['wf12']` |
| wf12.selftest.js | IIFE：`WF12.runAssertions()`（async），12 条 `// spec:WF12.*` 断言 |

接线次序（缺一不可）：

1. `wf12.css` 内联进宿主样式区（或 `<style>` 块）；
2. `wf12.html` 片段挂入对应 Tab 容器；
3. 宿主主脚本之后依序内联 `wf12.js` → `wf12.selftest.js`（selftest 依赖前者先建 `WF12` 命名空间）；
4. Tab 激活时调用 `WF_REGISTRY['wf12'].init()`（幂等，内部有 inited 守卫）；
5. 自检入口 `WF_REGISTRY['wf12'].selftest()` 返回 **Promise**（内部跑 `WF12.runAssertions()`），调用方需 await/then。

> ⚠ 内联拼装坑（本次仿真实测踩过）：若用 JS 字符串替换把本切片内容注入模板，替换串里的
> `$'` / `` $` `` / `$&` 会被当作特殊替换模式，**静默截断注入的脚本**。必须用替换函数
> （`() => str` 形式）而非字符串参数。registry 条目的 css/html 字段留空串是刻意设计：文件为真源。

## TEST-ONLY 密钥角色（不可互换）

| 向量密钥 | 角色 | 黄金向量对位 |
| --- | --- | --- |
| `keys.rsa4096`（sign 段） | **商户**签名私钥：签 canonical | `sign.rsa4096.expectedSigB64u`（512B / b64url 683 字符） |
| `keys.rsa3072` | **平台** DEK 解包私钥：RSA-OAEP 解 wrapped DEK | `oaepUnwrap.expectedPlaintext`（=== `dekPlaintext`） |

密文侧黄金：fixed 模式 DEK/IV 取向量值 → 信封密文与 `aesgcm.cipherTagB64u` **字节级一致**；
`oaepTrap.cipherB64u` 是 MGF1-SHA-1 钉子（双 SHA-256 实现解包必抛，验证参数不被静默放宽）。

## 教学草图顺序 vs 真实构造顺序（诚实标注）

任务书草图：摘要 → 签名 → 信封 → 解密。**真实构造顺序是**：信封（DEK 生成→OAEP 包装→
AES-GCM 加密）→ 对**密文**取摘要 → 组 canonical → 商户签名。L2 下摘要对象是密文（网关先验完整性
再解密）。演示四卡按草图的 4 步教学顺序渐进揭示，卡内文案同时标注真实次序，不误导。

## ① 步验签语义（I1 的拦截机制本身）

网关侧**按收到的头重算 canonical** 再验签（`buildCanonical('v1/'+ts, 'POST', path, '', canonicalHeaders(headers))`），
而非信任请求方自带的 canonical 缓存——任何入签头（含 `x-wop-content-digest`、`x-wop-encrypt`）
被改动即破签。早版本误用发送侧 `msg.canonical` 缓存验签，导致 digest 头篡改漏拦（Node 断言 A8 抓出），已修。

## 两类攻击模型（四篡改按钮）

| 按钮 | 模型 | 构造方式 | 落点 |
| --- | --- | --- | --- |
| tamper-sign | MITM 传输篡改 | 翻转签名尾字节 | ① 验签（纵深后续步照常执行） |
| tamper-digest | MITM 传输篡改 | digest 头翻转 1 个 hex 字符（格式仍合法） | ① 验签（I1 入签）；② 复核亦不一致（双证） |
| tamper-body | MITM 传输篡改 | 翻转密文首字节（头未动，验签过） | ② sha-256(密文) 复核先拒；⑤ GCM tag 纵深再拒 |
| tamper-dek | **构造侧缺陷** | 损坏 wrapped DEK 后以**商户私钥重签**（签名/摘要均有效——MITM 做不到） | ③ DEK 解包；对外模糊为「解密失败」（I7） |

dek 为什么要重签：`x-wop-encrypt` 在签名覆盖内，MITM 直接改头必落①；要演示③必须构造侧
持有商户私钥重签。另 SM4-GCM 载荷重签后落④（算法族不符，A11 断言）。

## OAEP 随机化与 A3 的断言边界

RSA-OAEP 包装带随机性 → 同一 DEK 两次包装的 wrapped 串不同 → canonical/signHeader 跨次不恒等。
A3 因此只断言**确定性核心**：payload / wireBody / 双摘要 / 签名头前缀恒同、签名恒 512B、
五步校验两次全通过；不断言 canonical 跨次恒等。

## 条款 → 断言反向核对矩阵

| spec 条款（grep 索引） | 断言名 | 验证点 |
| --- | --- | --- |
| `spec:WF12.env` | WF12.env 共享全局在场 | 环境前置：契约枚举全局缺席 → 立即失败而非静默跳过 |
| `spec:WF12.digest` | WF12.digest 黄金摘要对拍 | sha-256(向量输入) 逐字一致；头解析 alg=sha-256 |
| `spec:WF12.sign` | WF12.sign 黄金签名对拍 | 512B / 683 字符，与黄金向量字节级一致 |
| `spec:WF12.sign-demo` | WF12.sign-demo 构造确定性 | 两次构造确定性核心恒同；五步校验两次全过 |
| `spec:WF12.envelope` | WF12.envelope 信封黄金对拍 | payload 三段式 / L2;dek= 前缀 / 严格 base64url / 密文字节级对拍 |
| `spec:WF12.oaep` | WF12.oaep 解包黄金与参数钉子 | 双SHA-256 解包===dekPlaintext；MGF1-SHA-1 trap 必抛 |
| `spec:WF12.roundtrip` | WF12.roundtrip 随机信封闭环 | 随机 DEK/IV（I4 CSPRNG）；解密回明文逐字一致（中文/emoji） |
| `spec:WF12.tamper-sign` | WF12.tamper-sign 篡改签名落① | 落①；纵深后续步照常执行 |
| `spec:WF12.tamper-digest` | WF12.tamper-digest 改头先破签 | 落①（I1 入签）；② 复核亦不一致（双证） |
| `spec:WF12.tamper-body` | WF12.tamper-body 密文篡改双拦 | ② 摘要复核先拒 + ⑤ GCM tag 亦拒 + 孤立解密实测抛错 |
| `spec:WF12.tamper-dek` | WF12.tamper-dek 重签后落③ | ①② 过、③ 拦截、对外模糊（I7） |
| `spec:WF12.reject`（含否定式条款） | WF12.reject 拒绝路径与格式规则 | 空明文拒 / 两段载荷拒 / 带=填充拒 / SM4-GCM 落④ / formatRules 11 条全表对拍（违例必须为 0——否定式） |
| `spec:WF12.dom` / `spec:WF12.dom.skip` | WF12.dom 接线与交互 | id 全集在场 / i18n 键全 `wf12.*` 前缀 / 默认明文与模式 / 四卡激活 / S1、S3 黄金徽标 / body 篡改拦截命中 |

否定式条款覆盖：A11 的四个「必须拒绝」与 formatRules 违例计数为 0；A12 的 `dom.skip` 分支
在无 DOM / 未挂载环境以**诚实跳过**占位（断言名明示「跳过」，不冒充通过），浏览器集成仿真中真实执行。

## 自测记录（2026-08-31）

- Node harness（提取 index.html 主脚本 + wf12 两文件同上下文）：**12/12 通过**（A12 诚实跳过）
- 浏览器集成仿真（真实 index.html + 本切片四件内联，`tab.evaluate` 程序化驱动）：**12/12 通过**
  （A12 真实执行：四卡 4/4 激活、解密回显、S1/S3 黄金徽标、body 篡改拦截命中；dek 案例阶段
  渲染 ✓①✓②✗③ 与断言一致，截图存证）
- S1/S2 + 模块语法 + 外部资源引用禁词扫描：`wf12/` 全部文件**零命中**
