# WOP Web Tools — Intent

> 状态：草案（grill 后修订） · 日期：2026-08-30 · 归属：wop-platform 生态

## 1. 缘起

`gtsp-wop-gateway`（codeup 内部仓）`docs/tools/rsa-keygen.html` 是一个纯静态单文件工具，
两个能力已被商户实际使用：

1. **密钥生成**：RSA 3072/4096 密钥对（Web Crypto 本地生成，零上传），PKCS#8/SPKI、PEM/Base64，
   三重自检（签名往返 / RSA-OAEP 加密往返 / 模数位校验）+ 公钥指纹 SHA-256。
2. **报文联调**：构造请求（canonicalRequest → x-wop-sign / x-wop-content-digest / L2 数字信封 → curl），
   验证平台报文（摘要复核 / 验签 / L2 解密），本地模拟平台响应与回调闭环。

诉求：
- 移入独立公开项目，发布 GitHub，经 **GitHub Pages** 在线浏览；
- 围绕「商户对接 WOP 的 API 调用与回调通知」扩展更多**边界服务能力**，先 grill，后定 intent/spec。

## 2. 生态定位（事实核对）

wop-platform 组织（GitHub 公开）已存在完整生态：

| 层 | 真源 | 状态 |
|---|---|---|
| 协议 | wop-specs / crypto-strategy-spec | v0.3-reviewed，**三套件冻结**：RSA3072 / RSA4096 / SM2-SM3 |
| SDK 契约 | wop-specs / wop-sdk-spec | v1.0-ratified |
| 官方 SDK | 六语言（java/go/ts/py/php/dotnet） | 4 个已支持 SM2 套件 |
| 技能层 | wop-skills（wop-cli 八件套 + 安全纪律 S1–S8） | 73 测试全绿，覆盖率门禁 |

**本项目生态位**：浏览器端零安装图形化工作台，与 wop-cli **互补**：

- wop-cli：终端/Agent 场景；生产级密钥管理（0600 文件、S1–S8）；批量/脚本化。
- wop-web-tools：人肉场景；零安装零依赖；教学演示；**单文件可离线分发**；产出 curl / 代码片段。

## 3. 问题定义

商户对接 WOP 的高频事故点（与 wop-skills 叙述同源）：

1. 密钥格式/套件错误：3074 位笔误、PKCS#8 与单行 Base64 混用、SM2 密钥无法生成；
2. canonicalRequest 构造偏差：URL 编码语义、头排序、空格规范化；
3. L2 数字信封实现错误：DEK 载荷格式、GCM tag、base64url 无填充、C1C2C3 顺序；
4. 回调报文无法离线验证：无公网内网端点时无从下手；
5. 错误响应看不懂：62 个错误码的语义、HTTP 映射、修复建议；
6. 多语言 SDK 接入片段需要手写，易错。

## 4. 目标

- **G1（已定）**：独立公开仓库 + GitHub Pages 在线浏览；保留「下载单文件离线使用」能力。
- **G2（本 spec 范围）**：边界服务能力清单（P0 随 MVP 发布 / P1 / P2 路线图），见 spec §7。

## 5. 边界（非目标）

- 不做生产私钥托管/持久化存储（浏览器无安全密钥存储承诺；生产密钥管理归 wop-cli）；
- 不做真实网关调用（纯前端不直连网关；只产出 curl / 代码片段 + 本地模拟闭环）；
- 不替代 wop-specs（协议真源）；本项目**消费真源、反向对齐**；
- 不引入任何后端服务（纯静态，GitHub Pages 可承载）。

## 6. 关键决策点（grill 产出，TBD 待拍板）

| # | 决策点 | 默认建议 |
|---|---|---|
| D1 | 回调契约未冻结，公开策略 | 显著 beta 标注，不宣称正式（见 spec S6） |
| D2 | SM2 支持 vs 零依赖 | P0 引入审计过密码库，版本锁定；更正页面"仅支持 3072/4096"过时文案 |
| D3 | 仓库归属 | wop-platform 组织（与 specs/skills 同层），仓库名 `wop-web-tools` |
| D4 | 语言 | 中文优先（商户群体国内），英文列入路线图 |
| D5 | 单文件 vs 模块化 | 源码多文件 + 构建产物单文件（保留离线卖点） |
| D6 | 零网络 vs 在线数据 | 默认零网络，数据字典（错误码/API 目录）内置打包随版本 |
| D7 | 私钥交付安全模型 | 复制/下载即唯一副本提示；引导离线备份；禁止诱导上传 |

## 7. 后续

- spec 批准 → P0 实现 → 发布 GitHub + Pages → 原仓删除文件并更新引用。
