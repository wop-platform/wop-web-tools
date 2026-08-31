# wop-web-tools — gm 任务书（国密 WOP-SM2-SM3 全套实现）

你是 wop-web-tools 项目的国密实现 agent。项目根：`/Users/dreambt/sources/open-platform/wop-web-tools`。
**先读 `/Users/dreambt/sources/open-platform/wop-web-tools/parallel/WF_CONTRACT.md` 并严格遵循**（目录隔离、注册协议、断言契约、S1/S2 纪律、i18n 约定、交付格式）。

## 背景（重要事实，直接采信，勿重查）

wop-web-tools 现支持 RSA 套件（RSA3072/4096 + AES-256-GCM 信封 + sha-256 digest）。本次为国密全套 **WOP-SM2-SM3** 追加支持。所有协议事实已由集成者从 SDK（gtsp-wop-gateway，codeup 私有仓）源码 + 黄金向量交叉验证，**字节级对齐**：

### 密码库（已选定并验证）
- **sm-crypto-v2 1.15.1**（MIT）：`gm/vendor/sm-crypto-v2/`（package 已解包），noble 依赖 `gm/vendor/noble/{ciphers,curves,hashes}/`。已用 SDK 黄金向量验证：SM3 MATCH、SM4-GCM 解密+确定性加密 MATCH、SM2 黄金签名验签通过（userId 默认 '1234567812345678' 与 SDK BC 一致）、自签名裸 r‖s 128 hex、密钥对生成正常。
- **API 语义（实测，重要）**：
  - `sm3(bytes|string)` → hex 小写
  - `sm2.doSignature(msg, privHex, {hash:true, userId:'1234567812345678'})` → **裸 r‖s 128 hex**（不传 der；der:true 才 DER）。msg 传 Uint8Array
  - `sm2.doVerifySignature(msg, sigHex, pubHex, {hash:true, userId})` → boolean
  - `sm2.doEncrypt(msg, pubHex, 1)` → C1C3C2 拼接 hex（cipherMode=1 默认；0=C1C2C3 旧国标）
  - `sm2.doDecrypt(cipherHex, privHex, 1)` → 明文（C1C3C2）
  - `sm2.generateKeyPairHex()` → {privateKey: 64 hex, publicKey: 130 hex(04‖X‖Y)}
  - `sm4.encrypt(data, key, {mode:'gcm', iv, output:'string'})` → **{output: hex密文, tag: hex}**（字符串模式；Uint8Array 输入返回裸密文数组，勿混用）；data 字符串按 UTF-8 编码
  - `sm4.decrypt(dataHex, key, {mode:'gcm', iv, tag, output:'array'})` → Uint8Array 明文；tag 错抛错
  - **GCM 分支不校验 key 长度——调用方必须自行校验 key=16B**
- **打包方式**：sm-crypto-v2 的 dist/index.mjs 依赖 @noble（外部），页面单文件无构建 → **用 esbuild 把 gm 核心打成 IIFE bundle**：`npx esbuild gm/gmcore.mjs --bundle --format=iife --global-name=GmCore --minify --outfile=gm/gmcore.js`（node_modules 用 gm/vendor/ 下的——在 gm/ 建 node_modules 符号链接或设 `--alias`；可行方案：`npm install --no-save` 在 gm/ 下装 @noble 三包，或 esbuild 加 `--alias:@noble/ciphers=./vendor/noble/ciphers` 等三个 alias）。bundle 后 `grep -E 'fetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|WebSocket|sendBeacon' gm/gmcore.js` **必须零命中**（S1/S2）。产物大小预期 ~22KB。

### SDK 黄金向量（TEST-ONLY 固定 k/固定 IV；唯一事实源 gtsp-wop-gateway/docs/crypto-vectors.json）
```
message(UTF-8) = WOP 跨语言测试向量 2026-08-28 — The quick brown fox jumps over the lazy dog.
sm2UserId      = 1234567812345678   ← 契约空白已查实：SDK 不显式 setUserId，BC 默认此值，javadoc+conformance 双向钉死。代码必须显式传此值并注释证据
SM2 公钥(65B 04‖X‖Y, 标准Base64) = BKYcUacrp3w6tPeXpkEb2yktpbGgfCOsob/F5yo9wq9+LvzIx2Isu+CGnf6Z89tTJpZxm5GX7VUDr8KdsxHzYKg=
SM2 私钥 d(32B 标量, 标准Base64) = RyJ/wB0tfgGGSgug0lKZoOwJlj2001kD5wbYmnmPFr0=
SM2 签名(裸 r‖s 64B, base64url) = Si7Uw5eZm0Kii3BuIRLXwMGGOxkwFria8ypcVYXnReV376EVgV0TOkQfm21NUnJZNGM-fV0d0fMF23B0Bm3TFw   ← 仅验签侧（生产签名随机 k）
SM3 摘要 hex = 23592263765cf506d07cc8614c09067e6de38e64c53e5b672c022532d01737cf
SM4-GCM: key hex 202122232425262728292A2B2C2D2E2F(16B) / iv hex 303132333435363738393A3B(12B)
  plaintext = 上面 message；ciphertext‖tag base64url = wMoKc3V_CJQRGlUASCV4mBki5qb7OVExH7Bgu_j1E43I-Z_SWAKRTPq3q9yDna8wNeI3pPBn4Jt4vMVEuPyWfJBP-qsYObQw1LcbbQYggRXRvCN5vFdoY-NK3j8bF9MkO72Z4eo（ciphertext 85B‖tag 16B；确定性加密可复现）
SM2 加密(固定 k, 明文=DEK 载荷示例) cipher base64url = BHg6d-mtZjmeNpGrClMQUsW5CH_89nI-czPleXZbKuDxEbEauHrr7V8Xy4gvzfU7I48lYrL25lHyne9JrkMW5t4FrhxANJVd2vf9vp2nqTSnzUXqLf2Bz6dVfX3rtkOeLBubmIcoIsiwo3Fn7rrtSbWuN86uwvgCbn6Zm2647KdeZd2arZaClU6IURtm97hp
  明文 = "SM4-GCM$ICEiIyQlJicoKSorLC0uLw$MDEyMzQ1Njc4OTo7"（即 DEK 载荷 alg$key$iv）← 仅解密侧（库不支持注入固定 k）
C1C2C3 旧国标顺序负向量(须 reject) = BHg6d-mtZjmeNpGrClMQUsW5CH_89nI-czPleXZbKuDxEbEauHrr7V8Xy4gvzfU7I48lYrL25lHyne9JrkMW5t4bm5iHKCLIsKNxZ-667Um1rjfOrsL4Am5-mZtuuOynXmXdmq2WgpVOiFEbZve4aQWuHEA0lV3a9_2-naepNKfNReot_YHPp1V9feu2Q54s
```

### 协议事实（SDK 源码确认）
- **SM2 签名**：SM3withSM2 语义 = 对 message 做 ZA（含 userId）+ SM3 预杂凑 → 签名；线上格式**裸 r‖s 64B → base64url 无填充**（恒 86 字符），禁 DER（D9）。验签失败 reason 模糊（I7）
- **SM3 digest**：`x-wop-content-digest: sm3 <小写hex>`，恰一空格；有 body 必传必入签（D2/D3/I1）；仅 SM2 族用 sm3，RSA 族用 sha-256（I5）
- **SM2 密钥加密（L2 信封 DEK 包装）**：BC `SM2Engine(C1C3C2)` → 裸拼接字节（C1=04‖X‖Y 65B），非 ASN.1；整体 base64url 无填充置于 `x-wop-encrypt: L2;dek=<base64url>`
- **SM4-GCM 报文加密**：key 16B / IV 12B CSPRNG / tag 128bit；密文 = **ciphertext‖tag 尾拼**（tag 不单独放头）；整体 base64url 无填充，载体 `{"encrypted":"<base64url(ciphertext‖tag)>"}`；**IV 经 DEK 载荷 iv 段传输，不拼密文前缀**
- **DEK 载荷**（非 JSON，`$` 分隔字符串）：`SM4-GCM$base64url(key)$base64url(iv)`；SM2 族 dek alg 名 = **"SM4-GCM"**；族不符 OP_GW_2004 拒绝
- **密钥格式**：公钥分发 = 04‖X‖Y 65B **标准 Base64**（非 base64url）；私钥 = PKCS#8 DER 标准 Base64（可选输出 PKCS#8 PEM：ECPrivateKey RFC5915 + PKCS#8 外壳，SM2 OID 1.2.156.10197.1.301，d 标量 + sm2p256v1 参数）
- **校验顺序（F6）**：验签 → digest 复核 → DEK 解包 → alg 族比对 → bulk 解密，固定

## 目标产物

### A. gm/gmcore.mjs（纯函数核心，ESM，无 DOM）
导出（全部纯函数，node 可测）：
- `sm2Keygen()` → {privateHex(64), publicHex(130)}；`pubHexToB64(hex)`/`privHexToB64(hex)` 标准 Base64；`pkcs8PemFromD(privHex)` → PKCS#8 PEM（RFC5915 构造，OID 1.2.156.10197.1.301；d 长度按需编码）
- `sm2SignBytes(msgBytes, privHex, userId)` → base64url（裸 r‖s 86 字符）；`sm2VerifyB64u(msgBytes, sigB64u, pubHex, userId)` → boolean（内部先拒 DER：decode 后长度≠64 或 hex 首字节 0x30 → false）
- `sm2EncryptDek(payloadStr, pubHex)` → base64url（C1C3C2，随机 k）；`sm2DecryptDek(b64u, privHex)` → 明文或 throw（内部**校验 C1 为 04 开头的 65B 未压缩点**，拒绝 C1C2C3：C1C3C2 与 C1C2C3 长度一致无法字节区分，须解密后校验明文格式 `alg$b64u$b64u` 再接受——见下）
- `sm3Hex(bytes)` → 小写 hex
- `sm4GcmEncrypt(plainBytes, key16, iv12)` → base64url(ciphertext‖tag)；`sm4GcmDecrypt(b64uCtTag, key16, iv12)` → bytes（先自行 key=16B/iv=12B 校验；tag 错 throw）
- `buildSmDek()` → `{key16, iv12}`（CSPRNG）；`dekPayload(alg, keyB64u, ivB64u)` → `SM4-GCM$…$…`
- `verifySmSuite(headers, body, {merchantPubHex, platformPrivHex?})` → 分步结果对象（验签/digest 复核/DEK 解包/族比对/解密，每步 ok+reason 模糊化），供页面接线
- 黄金向量常量 `GOLDEN_SM = {...}`（message/sm2UserId/公私钥 hex/签名/digest/加密/负向量/ctTag）+ `smGoldenSelfTest()` → [{name, pass, detail}]

### B. gm/gm.js + gm/gm.css + gm/gm.html（页面包装，WF_REGISTRY 注册 id='wf-gm'）
- **密钥生成 Tab**：国密 SM2 密钥对生成按钮（random）+ 输出：私钥（hex d + 标准 Base64 + PKCS#8 PEM 可选）+ 公钥（hex 04‖X‖Y + 标准 Base64）；一键复制
- **请求构造 Tab**：套件选择支持 WOP-SM2-SM3（RSA 已有能力不动，只加国密）：SM2 签名（userId 固定 1234567812345678）、sm3 digest、L2 信封（SM4-GCM + SM2 包装 DEK）、输出 x-wop-encrypt: L2;dek= 与 {"encrypted":…} 与完整 header 预览
- **验证区**：粘贴国密响应（headers+body）→ 验签（SM2，拒 DER）、digest 复核（sm3）、DEK 解包（SM2 C1C3C2）、SM4-GCM 解密（先验 tag）、族比对；失败输出模糊 reason（I7）
- **接线点标注**：README 说明集成者如何把 `GmCore.verifySmSuite` 接进 index.html 的 `verifyResponse`/`parseDigestHeader`（现有 parseDigestHeader 支持 sha-256，需按 digest 标签分派 sm3）

### C. gm/README.md
产物清单 + 接线点（WF_REGISTRY 注册、GmCore bundle 内嵌、verifySmSuite 分派、selftest 计数）+ 证据（黄金向量对齐结果）

## 断言（`// spec:WF9-*` 前缀，至少 16 条，含否定式）
1. SM3(message)=黄金 hex（正向字节断言）
2. SM4-GCM 解密黄金向量 → 明文=message（正向）
3. SM4-GCM 确定性加密（同 key/iv）→ ct‖tag=黄金 b64u（正向字节）
4. SM4-GCM 篡改 tag → throw（否定式）
5. SM4-GCM 篡改密文 → throw（否定式）
6. SM2 黄金签名 verify=true（正向）
7. SM2 DER 签名 → verify 拒绝（否定式：decode 后 64B 校验 / 0x30 头拒）
8. SM2 自签名裸 r‖s（128 hex / b64u 86 字符）且自验通过（正向）
9. SM2 黄金加密向量 decrypt → 明文=DEK 载荷（正向）
10. **C1C2C3 负向量 decrypt → 拒绝/解密失败**（否定式）
11. sm2Keygen 输出合法（64/130 hex, 04 开头）（正向）
12. pubHexToB64 ↔ 黄金公钥 b64 一致（正向）
13. pkcs8PemFromD 输出含 BEGIN PRIVATE KEY + OID（正向）；私钥长度 32B（正向）
14. digest 标签 sm3 只用于 SM2 族（正向）；sha-256 请求不产生 sm3 标签（否定式跨族）
15. dek alg 名 = SM4-GCM（正向）；RSA 族不产生 SM4-GCM dek（否定式跨族）
16. 全部输出 base64url 无 `=` 填充（正向）；禁词扫描 gmcore.js/gm.js 零命中（否定式，S1/S2）
17. key 非 16B / iv 非 12B → 拒绝（否定式边界）
18. userId 显式=1234567812345678（常量断言，注释引 SDK 证据）

## 实现约束
- 纯函数核心（gmcore.mjs）node 可测：`node --input-type=module -e "import('./gm/gmcore.mjs').then(...)"` 或临时 .mjs 测试文件跑断言
- gmcore.mjs import 路径用相对 `./vendor/sm-crypto-v2/dist/index.mjs`（node 直接跑需要 @noble——在 gm/ 下 `npm install --no-save @noble/ciphers@^1.2.1 @noble/curves@^1.1.0 @noble/hashes@^1.3.1` 或从 gm/vendor/noble 建 node_modules 链接；二选一，README 说明）
- **S1/S2 纪律**：gmcore.js bundle 后 + 自己写的 js 都不得含禁词（fetch(、XMLHttpRequest、WebSocket、sendBeacon、localStorage、sessionStorage、indexedDB、非 data: 的 src/href）；断言 16 扫描。crypto.getRandomValues 合法（非存储/网络）
- 不碰 index.html、不碰其他 wf* 目录；中文文案 `data-i18n="wf-gm.*"`
- 密钥材料页面生成可随机；黄金向量仅用于断言与验证区「用测试向量」快捷填充（可选）

## 验收
产物在 `gm/` 目录（gmcore.mjs / gmcore.js bundle / gm.js / gm.css / gm.html / selftest 断言文件 / README.md），自测全绿（node 跑 gmcore 断言 + bundle 禁词扫描），commit（身份 wop-web-tools，≤50 字符），**不 push**。
