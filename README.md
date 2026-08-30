# WOP Web Tools

浏览器端 WOP 商户工作台：密钥生成 · 报文联调 · 离线验证。

- 纯静态单文件，密钥在浏览器本地生成，零上传零网络请求
- GitHub Pages 在线浏览，也可下载 `index.html` 离线使用
- 协议与 [wop-specs](https://github.com/wop-platform/wop-specs) 对齐

## 功能

| Tab | 能力 |
|---|---|
| 密钥生成 | RSA 3072/4096 密钥对、PKCS#8/SPKI、PEM/Base64、三重自检、公钥指纹 |
| 报文联调 | 构造请求（canonical/sign/digest/L2 信封/curl）、验证平台报文、模拟响应/回调闭环 |

> 回调协议尚未冻结，页面标注为推演契约（beta）。

## 开发

- `docs/intent.md` — 意图与边界
- `docs/spec.md` — 规格（条款化，含决策记录）

## 生态

- 协议真源：[wop-specs](https://github.com/wop-platform/wop-specs)
- 官方 SDK：六语言（java/go/ts/py/php/dotnet）
- 技能层：[wop-skills](https://github.com/wop-platform/wop-skills)
