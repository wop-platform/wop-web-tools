# wop-web-tools — WF12 任务书（数字信封图解）

你是 wop-web-tools 项目的 WF12 实现 agent。项目根：`/Users/dreambt/sources/open-platform/wop-web-tools`。
**先读 `/Users/dreambt/sources/open-platform/wop-web-tools/parallel/WF_CONTRACT.md` 并严格遵循**（文件隔离、注册协议、断言契约、S1/S2 纪律、i18n 约定、交付格式）。

## 背景（重要事实，勿重查）
WOP 协议数字信封（L2）流程已实现于 `index.html`（只读）：`generate()` 生成 RSA 密钥、`buildRequest()` 构造带签名+信封的请求、`simulateResponse()`、`verifyResponse()`（验签→digest 复核→DEK 解包→alg 族比对→bulk 解密）。协议细节见 `/Users/dreambt/sources/open-platform/wop-specs/crypto/crypto-strategy-spec.md`（只读，D9/D10/D11 钉死了 RSA/SM2/SM4-GCM 细节）。

## 目标：WF12 — 数字信封 L0/L2 流程图解（教学交互）
商户新手看不懂「签名 + 信封加密」的层级关系。做一个图解 Tab：

1. **层级图**（纯 CSS/SVG 静态渲染，禁止外部图片/字体）：
   - L0 明文 → 签名（私钥）→ 摘要（digest 头）→ L2 信封（DEK 对称加密 body + DEK 被公钥包装）→ 发送
   - 接收侧反向：验签 → digest 复核 → 解包 DEK → 解密 body
   - 用箭头/框图展示数据流动，标注每一步用到的密钥和产物格式（如 `x-wop-encrypt: L2;dek=` 前缀）
2. **交互演示**：输入一段明文 + 点「演示」，用现有函数真实执行：
   - 步骤 1：显示 body 摘要（sha256Hex 或现有摘要函数）
   - 步骤 2：显示签名产物（签名值前缀 + 长度）
   - 步骤 3：显示信封（DEK 载荷结构：alg/key/iv 三段式）
   - 步骤 4：显示解密回明文（verifyResponse 同族逻辑）
   - 每步之间动画高亮（CSS transition 即可，不要引入动画库）
3. 错误路径演示：改坏一个字节 → 显示验签失败/解密失败落在哪一步（对接现有 verifyResponse 的错误语义，只读调用）。
4. 双语文案 `data-i18n="wf12.*"`。

## 实现约束
- 只读调用现有全局：`generate`, `buildRequest`, `simulateResponse`, `verifyResponse`, `b64urlFromBytes`, `bytesFromB64url`, `sha256Hex`, `parseDigestHeader` 等（读 index.html 确认实际签名）。
- 你的演示调用用**固定测试密钥**（自己生成一组固定 RSA 密钥，或读 WOP_VECTORS 里的固定向量），保证演示确定性、不依赖用户已生成密钥。
- 断言（`// spec:WF12`）至少 6 条：
  - 步骤产物正确：摘要值 = 已知向量；签名长度正确
  - 信封结构正确：DEK 载荷三段式（alg/key/iv）解析
  - 解密回明文 = 输入明文（正路径闭环）
  - 错误路径：篡改密文 1 字节 → 明确报错且错误阶段正确
  - 否定式：空明文/非法输入被拒
- 禁止引入外部资源（图片/字体/CDN），纯 CSS/SVG。

## 验收
产物在 `wf12/` 目录（wf12.js / wf12.css / wf12.html / wf12.selftest.js / README.md），自测通过（node 验证纯函数 + 浏览器 console 验证 DOM），commit（身份 wop-web-tools，≤50 字符），**不 push**。
