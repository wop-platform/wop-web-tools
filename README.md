# WOP Web Tools
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/wop-platform/wop-web-tools?utm_source=oss&utm_medium=github&utm_campaign=wop-platform%2Fwop-web-tools&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

浏览器端 WOP 商户工作台：密钥生成 · 报文构造/验证 · 国密 SM2-SM3 · 联调辅助。

- 纯静态单文件，密钥在浏览器本地生成，零上传零网络请求
- GitHub Pages 在线浏览，也可下载 `index.html` 离线使用
- 协议与 [wop-specs](https://github.com/wop-platform/wop-specs) 对齐（crypto-strategy-spec v0.3-reviewed · wop-sdk-spec v1.0-ratified）
- 中英双语 UI（右上角语言切换，刷新回中文，不落盘）

## 功能

| Tab | 能力 |
|---|---|
| 密钥生成 | RSA 3072/4096 密钥对、PKCS#8/SPKI、PEM/Base64、三重自检、公钥指纹 |
| 报文联调 | 构造请求（canonical/sign/digest/L2 信封/curl）、验证平台报文、模拟响应/回调闭环 |
| 国密（WOP-SM2-SM3） | SM2 密钥对生成、国密请求构造（SM4-GCM 信封 + SM2 C1C3C2 DEK 包装）、五步验证流水线（验签→SM3 复核→DEK 解包→套件族比对→SM4-GCM 解密）、黄金向量一键装载 |
| 代码片段（WF9） | 同一请求产出六语言（Java/Go/TS/Python/PHP/.NET）官方 SDK 调用片段 |
| canonical 解析（WF10） | canonicalRequest 逐段来源标注 + 粘贴差异实时比对 |
| API 目录（WF11） | 示例契约渲染、表单模板化（待正式 OpenAPI 替换） |
| 教学图解（WF12） | 数字信封 L0/L2 层级图 + 真实密码学交互演示 + 四类错误路径拦截 |
| 错误诊断（WF8） | 62 码公共契约字典：含义/处置/归属/可重试性 |
| 粘贴解析（WF7） | 原始 HTTP 报文整体粘贴自动回填验证区 |
| 向量自测 | 内置黄金向量一键跑字节级断言（正向量 + 负向量），自测 126 项全绿 |

> 说明：回调协议语义已对齐 wop-sdk-spec v1.0-ratified（F3/F6）；SM2 签名 userId 固定 `1234567812345678`（与网关 BC 侧一致，隐式默认，契约空白见 `docs/spec.md` D2）。

## 自测

页面底部「运行自测」：126 项断言 = WF1–WF14 各切片 + 宪法级 S1/S2 源码自扫描 + 国密金向量（GM-P1..P10）+ 国密分派负路径（GM-K1/K2/K3）。全部通过显示「全部通过」。

- 自扫描守护：源码不得含 `fetch(` / `XMLHttpRequest` / `WebSocket` / `navigator.sendBeacon` / `localStorage` / `sessionStorage` / `indexedDB` / 非 `data:` 的 `src=`/`href=`（S1/S2 宪法级）
- 断言均带 `// spec:<ID>` 标签，条款 → 断言反向核对矩阵见 `docs/spec.md` §5.1

## 开发

- `docs/intent.md` — 意图与边界
- `docs/spec.md` — 规格（条款化，含决策记录与反向核对矩阵）
- `parallel/` — 各 WF 切片任务书（herdr 并行批次）
- 国密内核：`gm/gmcore.mjs`（sm-crypto-v2 审计内置，黄金向量字节级对齐）

## 生态

- 协议真源：[wop-specs](https://github.com/wop-platform/wop-specs)
- 官方 SDK：六语言（java/go/ts/py/php/dotnet）
- 技能层：[wop-skills](https://github.com/wop-platform/wop-skills)
