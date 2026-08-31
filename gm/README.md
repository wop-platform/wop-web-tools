# WFgm — 国密 WOP-SM2-SM3 套件切片

WOP 网关国密套件（SM2 签名/信封 + SM3 摘要 + SM4-GCM 报文加密）的纯函数核心与页面切片。
黄金向量源自 `gtsp-wop-gateway/docs/crypto-vectors.json`。

## 产物

| 文件 | 角色 |
|---|---|
| `gmcore.mjs` | 源真相（唯一 ESM）：编码工具 + SM2/SM3/SM4 原语 + `buildSmEnvelope`/`verifySmSuite` + 黄金向量与自测 |
| `gmcore.js` | esbuild bundle（iife + minify，全局 `GmCore`），`npx esbuild gm/gmcore.mjs --bundle --format=iife --global-name=GmCore --minify --outfile=gm/gmcore.js` |
| `gm.js` | 页面切片源真相：`WF_REGISTRY['wf-gm']`（keygen / 请求构造 / 验证器三区块） |
| `gm.html` / `gm.css` | **生成物**（从 registry 字段提取，禁止手改；GM-17 守护字节一致） |
| `gm.selftest.js` | 页面级断言 `GM_PAGE_SELFTEST()`（P1..P10），挂 `window.GM_PAGE_SELFTEST` |
| `test.mjs` | node 验收入口：黄金断言 + 契约静态扫描 |

## 断言矩阵（条款 → 测试名）

### 核心 GM-01..GM-23（`smGoldenSelfTest`，node 与浏览器双环境同源运行）

| 条款 | 测试名 | 类型 |
|---|---|---|
| GM-01 | SM3 黄金摘要 | 正向 |
| GM-02 | SM4-GCM 黄金解密 | 正向 |
| GM-03 | SM4-GCM 确定性加密 | 正向 |
| GM-04 | 篡改 tag 被拒 | 否定式 |
| GM-05 | 篡改密文被拒 | 否定式 |
| GM-06 | SM2 黄金验签 | 正向 |
| GM-07 | DER 签名被拒 | 否定式 |
| GM-08 | 自签名裸 r‖s 自验 | 正向 |
| GM-09 | SM2 黄金加密解密 | 正向 |
| GM-10 | C1C2C3 负向量被拒 | 否定式 |
| GM-11 | 密钥对生成与往返 | 正向 |
| GM-12 | 密钥 Base64 分发格式 | 正向 |
| GM-13 | PKCS#8 PEM 构造 | 正向 |
| GM-14 | digest 标签族隔离（sha-256 标签被族比对拒） | 否定式 |
| GM-15 | DEK alg 族隔离（AES-GCM 载荷被拒） | 否定式 |
| GM-16 | base64url 无填充 | 正向 |
| GM-17 | key/iv 长度边界拒绝 | 否定式 |
| GM-18 | userId 显式常量（错 userId 验签失效） | 否定式 |
| GM-19 | L2 信封全链路往返（五步全绿 + 明文还原） | 正向 |
| GM-20 | 篡改报文 digest 失配 | 否定式 |
| GM-21 | 验签失败 reason 模糊（I7，不含内部细节） | 否定式 |
| GM-22 | DEK C1 篡改被拒 | 否定式 |
| GM-23 | 签名头四段格式（完整头通过；裸 sig / 异套件头拒） | 正向 + 否定式 |

### 静态契约断言（`test.mjs`）

| 条款 | 测试名 | 断言 |
|---|---|---|
| GM-18 | 常量与黄金向量一致 | `SM2_USER_ID === GOLDEN_SM.sm2UserId` |
| GM-12a | 黄金 hex 派生字段 | pubHex `04`+128hex / privHex 64hex |
| GM-12b | 私钥→公钥曲线推导 | `sm2PubFromPriv(privHex) === pubHex` |
| GM-16b | 禁词扫描 | 5 产物文件无 fetch/XHR/Storage/indexedDB/非 data: src·href |
| GM-16c | 模块语法扫描 | gm.js / gm.selftest.js 无 import/export/require |
| GM-17 | 产物同源漂移 | `registry.html+'\n' === gm.html`（css 同理），html 片段含 `#wf-gm-root` |
| GM-18b | selftest 挂载 | `function GM_PAGE_SELFTEST` 定义并挂 window；gm.js 引用 |

### 页面 GM-P1..GM-P10（`gm.selftest.js`，浏览器 DOM 环境）

| 条款 | 测试名 | 类型 |
|---|---|---|
| GM-P1 | 注册协议 | 正向 |
| GM-P2 | 自初始化注入（幂等，二次 init 不重复） | 正向 |
| GM-P3 | i18n 回退文案（data-i18n 键均有非空回退） | 正向 |
| GM-P4 | SM2 密钥生成（hex + PEM 分支） | 正向 |
| GM-P5 | 国密请求构造（L2 信封 + canonical 结构 4 段+4 头 + 签名头落表） | 正向 |
| GM-P6 | 页内往返（构造 → 验证 → 五步全绿 → 明文还原） | 正向 |
| GM-P7 | 黄金 L2 全绿（黄金密文 100% 复用，仅 nonce/ts/签名现算） | 正向 |
| GM-P8 | 篡改被拒（密文翻转一字 → digest 步红，不展示明文） | 否定式 |
| GM-P9 | 黄金 L0 全绿（明文流：DEK/解密步跳过） | 正向 |
| GM-P10 | window.GM 适配器（sm2/sm3/sm4 原语面 + 推导一致性） | 正向 |

## 接线点（宿主页集成）

1. **加载顺序**：`gmcore.js` 最先（定义全局 `GmCore`）→ `gm.selftest.js`（可选）→ `gm.js`（注册 `WF_REGISTRY['wf-gm']`）。三者均无模块语法，`<script>` 直载。
2. **挂载**：`WF_REGISTRY['wf-gm'].init(mount)` 幂等注入 `#wf-gm-root`（含 `#wf-gm-style`），三区块锚点 `#wf-gm-keygen` / `#wf-gm-req` / `#wf-gm-ver`。
3. **套件下拉**：`r-suite` 增加 option 值 `WOP-SM2-SM3`；`verifyResponse` 按 securityReq 前缀 `WOP-SM2-SM3` 分派到本切片验证面板。
4. **canonical 同源**：优先复用宿主页 `window.canonicalHeaders` / `window.buildCanonical`（与验签同页同源），gm.js 内 `chLocal`/`canonLocal` 仅作独立页回退。
5. **window.GM 适配器**：可选依赖——宿主页已有 GM 原语面时直接使用；缺失时切片仍独立自洽。
6. **页面断言入口**：`window.GM_PAGE_SELFTEST()`（P2 自初始化，不依赖集成器先行调用）；`registry.selftest()` 组合 core 24 条 + 页面 10 条。

## 偏差上报（与任务书/推导依据的差异）

1. **digest 覆盖线上密文 body**（非明文）：按 F6 固定顺序（验签→digest→DEK→族比对→解密）与 `index.html` 291 行注释推导——digest 步必须先于解密判密文完整性。
2. **0x30 前缀拒绝规则已移除**（2026-08-31 CodeRabbit 修复）：旧规则按任务书拒首字节 0x30 的裸签名，但 SM2 裸 r‖s 中 r 随机，约 1/256 合法签名以 0x30 开头会被误拒；现仅按长度（≠64）拒 DER，0x30 头合法签名接受（GM-07b 正向断言），`signNo30`/`signValid` 重签规避全部删除。
3. **任务书 `spec:WF9-*` 为笔误**：本切片全部使用 `spec:GM-*` 标签。
4. **x-wop-sign 四段格式初始未测**（本轮修复的契约缺陷）：`verifySmSuite` 曾把完整签名头 `'WOP-SM2-SM3 v1/1800/<names>/<sig>'` 整串当 sigB64u 验签（恒 false），而自测 5 处调用传裸 sig——自测格式与线上格式漂移，四段解析路径从未被测到（node 22/22 全绿是假象）。已改：核心内部剥四段（格式/套件不符一律验签失败），自测同步用线上格式，GM-23 防再漂移。

## 验证复现

```bash
npx esbuild gm/gmcore.mjs --bundle --format=iife --global-name=GmCore --minify --outfile=gm/gmcore.js
node gm/test.mjs        # gmcore 24/24 + 静态扫描 5 文件 ALL GREEN
```

浏览器级：将 `gmcore.js` → `gm.selftest.js` → `gm.js` 依序内联独立页（替换占位符须用 replacer 函数防 `$` 截断，内联前检测 `</script`），加载后 `WF_REGISTRY['wf-gm'].init()` → `GM_PAGE_SELFTEST()`（10/10）→ `registry.selftest()`（33/33）。本轮实测：node 24/24、页面 10/10、registry 34/34、黄金 L2 `#wf-gm-ver-steps[data-allok]=1`。
