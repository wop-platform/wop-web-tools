/* WF14 — i18n 基础设施（中英切换，全量文案已收口）
 * 契约：parallel/WF_CONTRACT.md ｜ 任务书：parallel/TASK_wf14.md
 * S1/S2：零网络、零存储。语言偏好不落盘（不使用 'local'+'Storage' 等任何持久化手段），
 *        刷新后回退默认中文 —— 这是遵守 S2 纪律的设计决定，非缺陷。
 * 无模块语法：IIFE，浏览器可直接执行；Node（>=12，globalThis）下亦可加载用于单元自测。
 * 加载顺序：wf14.js 先于 wf14.selftest.js（selftest 通过 WF14_RUN_SELFTEST 委托，颠倒亦可）。
 * 注意：wf14.css / wf14.html 文件内容必须与本文件内嵌 CSS_TEXT / HTML_FRAG 保持一致。
 */
(function (root) {
  'use strict';

  var LANGS = ['zh', 'en'];
  var DEFAULT_LANG = 'zh';
  // key 命名空间（收口完成：main 主页面 / wf9-wf12 各切片 / wf-gm 国密 / wf14 本模块）：
  var PREFIXES = ['wf14', 'main', 'wf10', 'wf9', 'wf11', 'wf12', 'wf-gm'];

  var current = DEFAULT_LANG;

  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  /* 全局双语字典（平铺 key：'<前缀>.<名>'）。
   * 收口完成：main.*（主页面）/ wf9-wf12 / wf-gm 全量文案已填充，zh=en 键集一致。
   * ------------------------------------------------------------------- */
  var DICT = {
    zh: {
      // ---- wf14.*（本模块自身文案）----
      'wf14.lang.zh': '中文',
      'wf14.lang.en': 'English',
      // ---- main.*（主页面：静态 chrome + 动态消息） ----
      'main.bld.done': '构造完成',
      'main.bld.fail': '构造失败：{msg}',
      'main.bld.noappkey': 'appKey 不能为空',
      'main.bld.nopath': '请求路径需以 / 开头',
      'main.bld.sm2only': '本页请求构造仅支持 RSA 两套件；WOP-SM2-SM3 请切换到「国密」标签页（国密请求构造区，SM2 签名 + SM4-GCM 加密）',
      'main.bld.step.dek.l0': 'DEK/密文：L0 明文',
      'main.bld.step.dek.l2': 'DEK/密文：AES-256-GCM 32B key + 12B IV，RSA-OAEP(SHA-256) 包装',
      'main.bld.step.e2e.bad': '联调全链路：模拟平台私钥解包 DEK → AES-GCM 解密 body 不一致！',
      'main.bld.step.e2e.ok': '联调全链路：模拟平台私钥解包 DEK → AES-GCM 解密 body 一致',
      'main.bld.step.pre.bad': '本地预检：以商户公钥对 canonicalRequest 验签失败',
      'main.bld.step.pre.ok': '本地预检：以商户公钥对 canonicalRequest 验签通过',
      'main.copied.cell': '{k} 已复制',
      'main.copy.title': '点击复制',
      'main.empty': '空',
      'main.err.diag': '诊断',
      'main.err.empty': '请先粘贴错误响应信封或错误码',
      'main.err.failed': '诊断失败',
      'main.err.h': '平台错误码诊断（62 码公共契约字典）',
      'main.err.hit': '字典命中：{code}',
      'main.err.k.advice': '处置建议',
      'main.err.k.class': '分类',
      'main.err.k.code': '错误码',
      'main.err.k.meaning': '含义',
      'main.err.k.owner': '归属',
      'main.err.k.retry': '可重试',
      'main.err.miss': '未知码：{code}',
      'main.err.nocode': '未识别到错误码：请粘贴 {"code":"OP_GW_xxxx",...} 信封、完整错误响应报文，或裸错误码',
      'main.err.note.a': '粘贴平台返回的错误响应信封',
      'main.err.note.b': '（或整个错误响应报文、裸错误码），给出类别、含义、处置建议与可重试性。字典对齐网关公共契约（62 码，分类/对外语义冻结）。',
      'main.err.retry.no': '修复后重试（不建议直接重发原报文）',
      'main.err.retry.yes': '可稍后重试',
      'main.err.seg.scope': '对照最新协议文档',
      'main.err.seg.unknown': '未知分类段',
      'main.err.st.hit': '命中公共契约字典',
      'main.err.st.miss': '未命中（见提示）',
      'main.err.trace': '{id}（联系平台排障时请附带）',
      'main.err.unknown.dict': '（不在内置 62 码字典内 —— 新契约或非平台码，请对照最新文档）',
      'main.h1': 'WOP 商户 RSA 密钥生成器',
      'main.intro': '密钥对完全在您的浏览器本地生成，不会上传到任何服务器。生成后将「商户公钥」上传至开放平台，「商户私钥」自行妥善保管。',
      'main.key.short': '密钥内容为空或过短',
      'main.kg.bits': '密钥长度',
      'main.kg.bits.3072': '3072 位（推荐）',
      'main.kg.bits.3072.s': '对应安全套件 WOP-RSA3072-SHA256',
      'main.kg.bits.4096': '4096 位',
      'main.kg.bits.4096.s': '对应安全套件 WOP-RSA4096-SHA256',
      'main.kg.bits.note': '注：如被要求生成「3074 位密钥」，即为笔误——RSA 不存在 3074 位，请选择 3072。平台已冻结三套件（WOP-RSA3072-SHA256 / WOP-RSA4096-SHA256 / WOP-SM2-SM3，见 wop-specs）；本页请求构造支持 RSA 两套件，国密 WOP-SM2-SM3 请切换到「国密」标签页构造与验证。',
      'main.kg.cfg.h': '1. 生成配置',
      'main.kg.copied': '{kind}已复制到剪贴板',
      'main.kg.copy': '复制',
      'main.kg.copyfail': '复制失败，请手动选择复制',
      'main.kg.doing': '正在生成 {bits} 位密钥…（约需数秒）',
      'main.kg.done': '生成成功',
      'main.kg.download': '下载',
      'main.kg.downloaded': '已下载 {name}',
      'main.kg.fail': '生成失败：{msg}。请确认浏览器为 Chrome 37+ / Safari 11+ / Firefox 34+ 且运行在安全上下文（HTTPS 或本地文件）。',
      'main.kg.fp': '公钥指纹 SHA-256（SPKI）：\n{fp}',
      'main.kg.gen': '生成密钥对',
      'main.kg.genfail': '生成失败：{msg}',
      'main.kg.hide': '隐藏',
      'main.kg.mfp': '商户公钥指纹（SHA-256/SPKI）：{fp}',
      'main.kg.mfpbad': '私钥解析失败：{msg}',
      'main.kg.nocrypto': '当前浏览器不支持 Web Crypto API，无法生成密钥。请更换现代浏览器，或确认页面运行在 HTTPS / 本地文件等安全上下文中。',
      'main.kg.priv.h': '商户私钥',
      'main.kg.priv.hint': '（自行保管，切勿外泄）',
      'main.kg.privfmt': '私钥格式',
      'main.kg.privfmt.b64': '单行 Base64（PKCS#8 DER · 网关程序对接格式）',
      'main.kg.privfmt.pem': 'PKCS#8 PEM（推荐 · 平台文档格式）',
      'main.kg.pub.h': '商户公钥',
      'main.kg.pub.hint': '（上传至开放平台）',
      'main.kg.pubfmt': '公钥格式',
      'main.kg.pubfmt.b64': '单行 Base64（SPKI DER · 网关程序对接格式）',
      'main.kg.pubfmt.pem': 'X.509 SPKI PEM（推荐 · 平台文档格式）',
      'main.kg.show': '显示',
      'main.kg.stfail': '自检未通过（sign={sign} wrap={wrap} bits={n}）',
      'main.kg.stok': '✓ 自检通过：{bits} 位 · SHA256withRSA 签名/验签往返一致 · RSA-OAEP(SHA-256) 加解密往返一致 · 适用于 WOP-RSA{bits}-SHA256 套件',
      'main.notice.h': '安全须知',
      'main.notice.li1': '本页面为纯静态单文件，无任何网络请求；密钥生成与报文加解密均在浏览器本地完成（需 HTTPS 或本地文件环境的 Web Crypto API）。',
      'main.notice.li2': '私钥一旦丢失需在平台重新上传公钥并走密钥轮换流程；请离线备份，不要提交到代码仓库。',
      'main.notice.li3': '平台消费 PKCS#8 私钥 / X.509 SPKI 公钥（PEM 或其单行 Base64）；网关以 RSA-OAEP(SHA-256) 包装 DEK、以 SHA256withRSA 验签。',
      'main.req.body': '业务明文 body（JSON）',
      'main.req.build': '构造请求',
      'main.req.build.h': '2. 构造请求（商户 → 网关）',
      'main.req.canon': '调试：canonicalRequest（签名串原文）',
      'main.req.curl': 'curl 命令',
      'main.req.expired': 'expiredSeconds（秒）',
      'main.req.genplat': '生成联调平台密钥对',
      'main.req.headers': '请求头（点击值可复制）',
      'main.req.host': '网关地址（仅用于生成 curl）',
      'main.req.import': '从「密钥生成」页带入',
      'main.req.keys.h': '1. 密钥配置',
      'main.req.level': '加密级别',
      'main.req.level.l0': 'L0 明文',
      'main.req.level.l2': 'L2 全文加密',
      'main.req.mpriv': '商户私钥（PKCS#8，PEM 或单行 Base64）',
      'main.req.out.h': '构造结果',
      'main.req.path': '请求路径',
      'main.req.plat.help': '联调模式：本地生成模拟平台密钥对（私钥仅存本次会话内存，用于「模拟平台响应」），生产环境请粘贴平台下发的真实公钥。',
      'main.req.ppub': '平台公钥（X.509 SPKI，PEM 或单行 Base64）',
      'main.req.suite': '安全套件',
      'main.req.wirebody': '线上请求体（x-wop-content-digest 即对此串取摘要）',
      'main.res.canon': '调试：报文 canonicalRequest',
      'main.res.cbcurl': '平台 → 商户回调 curl（用于自测您的回调接收端点；报文格式为推演契约）',
      'main.res.h': '验证结果',
      'main.res.plain': '解密后的报文明文',
      'main.sim.badurl': '回调类型需填写完整回调 URL（http(s):// 开头）',
      'main.sim.fail': '模拟失败：{msg}',
      'main.sim.imported': '已带入商户私钥',
      'main.sim.needgen': '请先在「密钥生成」页生成密钥对',
      'main.sim.noplatform': '请先点击「生成联调平台密钥对」',
      'main.sim.platform': '已生成联调平台密钥对（仅本会话内存）',
      'main.sim.pubreplaced': '已检测到手动替换平台公钥，联调私钥已清除（全链路自检与模拟响应需重新生成联调密钥对）',
      'main.st.canon.h': '跨语言 canonical 对拍向量',
      'main.st.canon.note': 'javaUrlEncode / trimall / canonicalHeaders / buildCanonical 的字节级期望值（17 正向量 + 6 陷阱断言见上方断言结果）。供商户服务端跨语言实现（Java / Go / Python…）移植对拍：任一语言实现对下表输入逐条产出期望输出，即与本工具签名语义对齐。语义锚 = entry-wise 实现：逐项规范化键并携带各自值，再按码元升序排序。',
      'main.st.fail': '✗ {n} 项失败 —— 与规格不一致，请勿用于联调',
      'main.st.h': '黄金向量自测',
      'main.st.note': '内置 wop-specs 黄金向量（fixture 只读副本，禁手改），一键跑字节级断言：正向量（摘要 / RSA 签名 / AES-GCM 密文 / DEK 载荷 / OAEP 解包）必须一致，负向量（跨族 / 格式错误 / 尾位非规范 / MGF1 陷阱）必须拒绝。全部通过才提示「与官方规格对齐」。',
      'main.st.pass': '✓ {n} 项断言全部通过 —— 本工具与 wop-specs 黄金向量对齐（v1.0-ratified F8）',
      'main.st.res.h': '断言结果',
      'main.st.run': '运行自测',
      'main.st.running': '运行中…',
      'main.tab.api': 'API 目录',
      'main.tab.gm': '国密 WOP-SM2-SM3',
      'main.tab.keygen': '密钥生成',
      'main.tab.request': '报文联调',
      'main.tab.selftest': '向量自测',
      'main.tab.wf12': '数字信封图解',
      'main.ver.alg.unsupported': '暂不支持报文算法 {alg}',
      'main.ver.bad': '存在失败项',
      'main.ver.body.l': '报文体（L2 时为 {"encrypted":"…"} 密文载体）',
      'main.ver.cbbody': '回调业务明文（模拟回调载荷样例，可编辑）',
      'main.ver.cburl': '商户回调 URL（回调类型时必填，如 https://merchant.example.com/wop/callback）',
      'main.ver.dek.bad': 'DEK 载荷格式错误，应为 alg$key$iv',
      'main.ver.enc.l': 'x-wop-encrypt（L2 时填）',
      'main.ver.fail': '验证失败：{msg}',
      'main.ver.format4': 'x-wop-sign 应为 <protocolVersion>/<expiredSeconds>/<signedHeaders>/<signature>',
      'main.ver.gm.missing': '国密内核未加载（GmCore.verifySmSuite 缺失）',
      'main.ver.gm.needpriv': '商户私钥须为 SM2 PKCS#8（国密联调；x-wop-encrypt 的 DEK 解包需要 d 标量）',
      'main.ver.gm.needappkey': 'x-wop-appkey 必填（SM2 userId 契约：userId = x-wop-appkey 值）',
      'main.ver.h': '3. 验证平台报文（同步响应 / 异步回调）',
      'main.ver.noenc': '响应体缺少 encrypted 字段',
      'main.ver.nosign': 'x-wop-sign 未填写',
      'main.ver.nospace': 'x-wop-sign 缺少 securityReq 与 authString 的空格分隔',
      'main.ver.note': '粘贴平台侧报文（网关同步响应，或平台主动发起的异步回调）的头与体，逐项复核验签 / 摘要 / 解密。两类报文处理逻辑一致，仅 canonical 的 URI 不同：响应取网关 API 路径，回调取回调 URL 的 path。联调模式下也可直接本地模拟闭环。',
      'main.ver.note.f6': '校验顺序对齐 wop-sdk-spec v1.0-ratified（F6）：验签 → digest 复核 → DEK 解包 → alg 族比对 → bulk 解密。',
      'main.ver.ok': '验证通过',
      'main.ver.parse': '解析并填充验证区',
      'main.ver.paste.h': '粘贴原始 HTTP 报文，自动解析填充（可选）',
      'main.ver.paste.note': '支持商户请求与平台响应（同步 / 异步回调）两个方向的 HTTP/1.1 报文：起始行 + 头 + 空行 + body。解析后自动填入下方各头字段与报文体；缺失或格式非法的字段逐项提示。',
      'main.ver.simcb': '模拟平台回调并验证',
      'main.ver.simresp': '模拟平台响应并验证',
      'main.ver.spki.bad': '平台公钥须为 X.509 SPKI（DER SEQUENCE）',
      'main.ver.step.aes': 'AES-256-GCM 解密成功（GCM tag 校验通过）',
      'main.ver.step.declared': 'signedHeaders 声明了本页未提供的标头: {name}（请人工按 canonical 规则验签）',
      'main.ver.step.dek': 'DEK 解包：算法 {alg}（商户私钥 RSA-OAEP）',
      'main.ver.step.l0': 'L0 明文报文，跳过解密',
      'main.ver.step.parse': '签名头解析：套件 {sr}，authString {a}',
      'main.ver.step.sha.bad': '摘要复核失败：header={h}，实际 sha-256={c}（RSA 套件须为 sha-256 + 恰一空格 + 64 位小写 hex；sm3 头属跨族拒绝；body 可能被篡改或粘贴不完整）',
      'main.ver.step.sha.ok': '摘要复核：sha-256(body) 与 x-wop-content-digest 一致',
      'main.ver.step.sign.bad': '验签失败：检查平台公钥是否匹配、报文类型/回调 URL 是否正确（canonical 的 URI 取自其 path）、头值是否复制完整',
      'main.ver.type': '报文类型',
      'main.ver.type.cb': '异步回调（URI = 回调 URL path）',
      'main.ver.type.resp': '同步响应（URI = 网关请求路径）',
      'main.ver.verify': '验证并解密',
      'main.wire.badhdr': '非法头行（缺少冒号分隔）：{v}',
      'main.wire.badstart': '起始行无法识别：{v}（应为「METHOD 路径 HTTP/1.1」或「HTTP/1.1 状态码」）',
      'main.wire.digest.bad': 'x-wop-content-digest 格式非法：应为 <sha-256|sm3> + 恰一空格 + 64 位小写 hex',
      'main.wire.done': '完成，可点击「验证并解密」复核',
      'main.wire.empty': '空输入：未找到起始行',
      'main.wire.enc.bad': 'x-wop-encrypt 格式非法：应为 L2;dek=<base64url（RSA-OAEP 包装后的 DEK 密文）>',
      'main.wire.filled': '已填充 {n} 个字段',
      'main.wire.missing': '缺失必填头：{list}（缺项无法完整验签，请补全或改为粘贴完整报文）',
      'main.wire.none': '未识别到任何 WOP 头/报文体',
      'main.wire.parse': '报文解析：{e}',
      'main.wire.partial': '解析未完全成功，已填充可识别字段',
      'main.wire.sign.bad': 'x-wop-sign 应以 securityReq（WOP-<算法>-<摘要>）开头，后接 v1/expiredSeconds/signedHeaders/signature',
      'main.wire.ts.bad': 'x-wop-timestamp 应为毫秒时间戳（13 位数字）',
      'main.kg.priv': '私钥',
      'main.kg.pub': '公钥',
      'main.ver.step.sign.ok.cb': '验签通过：平台公钥 SHA256withRSA 校验回调签名',
      'main.ver.step.sign.ok.resp': '验签通过：平台公钥 SHA256withRSA 校验响应签名',
      // ---- wf9.* ----
      'wf9.copy': '复制片段',
      'wf9.method': '方法',
      'wf9.note': '片段为推导示例（wop-sdk-spec §2 概念 API），非可执行代码；接入请以官方 wop-<lang>-sdk（v0.1.0，MIT）为准',
      'wf9.subtitle': '基于 wop-sdk-spec 概念 API 推导，最终以官方 SDK 为准',
      'wf9.suite': '套件',
      'wf9.suite.auto': '跟随请求构造 Tab',
      'wf9.title': 'SDK 代码片段（六语言）',
      'wf9.copied': '已复制到剪贴板',
      'wf9.copyfail': '复制失败，请手动选择复制',
      'wf9.smhint': '该语言 SDK 首版（v0.1.0）仅支持 RSA 套件：SM2-SM3 下将显式抛错（not supported in v0.1.0）',
      // ---- wf10.* ----
      'wf10.copy': '复制 canonicalRequest',
      'wf10.diff.hint': '每行状态：绿 = 与自动生成一致；红 = 同位置内容有差异；灰 = 未参与（手工串多出的行，或自动生成有而手工串缺失的行）',
      'wf10.diff.title': '差异检测：粘贴 / 修改你的 canonical，实时比对',
      'wf10.refresh': '刷新',
      'wf10.subtitle': '（每一行来自哪个字段）',
      'wf10.title': 'canonicalRequest 逐段解析',
      'wf10.mode.preview': '模式：预览（按当前字段估算）',
      'wf10.mode.built': '模式：已构造请求（实时解析 #req-canonical）',
      'wf10.mode.previewNote': '预览模式：尚未构造请求。nonce / 时间戳为占位值；摘要按明文 body 估算（实际 x-wop-content-digest 对线上请求体取摘要，L2 时为密文信封）。构造请求后自动切换为实测解析。',
      'wf10.hover.field': '来源：',
      'wf10.hover.curval': '当前值：',
      'wf10.hover.method': '来源：请求方法｜本工具网关请求固定为 POST',
      'wf10.hover.qs': '来源：查询参数｜POST 请求查询串为空串（保留空行）',
      'wf10.hover.gen': '来源：',
      'wf10.split.fail': 'canonical 解析失败：',
      'wf10.rule': '组串规则：',
      'wf10.emptyline': '(空行：POST 查询串为空)',
      'wf10.digest.preview': '⚠ 非最终值（预览按明文 body 估算）',
      'wf10.status.builtok': '已解析 N 行',
      'wf10.status.error': '刷新失败：',
      'wf10.status.noauto': '尚无 canonical 可复制，请先刷新',
      'wf10.status.copied': '已复制 canonicalRequest（N 字符）',
      'wf10.status.copyfail': '复制失败：请展开差异检测文本框手动复制',
      'wf10.diff.idle': '粘贴或修改上方文本框内容后，这里逐行给出比对结果。',
      'wf10.diff.sum': '共 N 行：一致 a、差异 b、多余 c、缺失 d',
      'wf10.diff.autoline': '自动生成该行为：',
      'wf10.diff.missline': '自动生成有此行，你的文本缺失：',
      'wf10.diff.allok': '✓ 与自动生成的 canonicalRequest 完全一致',
      'wf10.diff.bad': '✗ 共 N 处不一致（红=内容差异，灰=行数不一致）',
      'wf10.diff.same': '一致',
      'wf10.diff.diff': '差异',
      'wf10.diff.extra': '多余',
      'wf10.diff.missing': '缺失',
      'wf10.note': '说明：本协议 canonicalRequest 为 5 段结构（AuthString/HTTPMethod/CanonicalURI/CanonicalQueryString/CanonicalHeaders）。任务语境中 SignedHeaders 的等价承载是 x-wop-sign 头值第 3 段（参与签名的头名，ASCII 升序、分号连接，不在 canonical 内）；HashedPayload 的等价承载是 x-wop-content-digest 头（sha-256 + 空格 + 64 位 hex，对线上请求体取摘要）。',
      // ---- wf11.* ----
      'wf11.banner': '示例契约（基于 wop-sdk-spec 与网关测试样例构建），待正式 OpenAPI 替换',
      'wf11.groupOther': '其他',
      'wf11.errLine': '字段',
      'wf11.fill.needGen': '请先生成 body JSON（且校验通过）再填充',
      'wf11.form.unset': '（不填）',
      'wf11.err.integer': '须为整数',
      'wf11.err.number': '须为数字',
      'wf11.err.boolean': '须为 true/false',
      'wf11.err.items': '项',
      'wf11.err.minItems': '至少',
      'wf11.err.maxItems': '至多',
      'wf11.err.arrayInt': '数组每项须为整数：',
      'wf11.err.enum': '取值须为：',
      'wf11.err.required': '必填字段缺失',
      'wf11.direction.callback': '回调',
      'wf11.direction.ptm': '平台 → 商户',
      'wf11.direction.mtp': '商户 → 平台',
      'wf11.sec.headers': 'WOP 协议头',
      'wf11.col.header': 'Header',
      'wf11.col.required': '必填',
      'wf11.col.when': '条件',
      'wf11.sec.params': '参数表',
      'wf11.col.name': '名称',
      'wf11.col.in': '位置',
      'wf11.col.type': '类型',
      'wf11.col.desc': '说明',
      'wf11.col.code': '状态码',
      'wf11.sec.responses': '响应码',
      'wf11.yes': '是',
      'wf11.no': '否',
      'wf11.sec.form': '请求体表单（模板化生成）',
      'wf11.gen': '生成 body JSON',
      'wf11.fill': '填充请求区',
      'wf11.fill.help': '「填充请求区」把路径/body/加密级别写入「请求构造」Tab 对应输入框（r-path / r-body / r-level）；网关统一 POST，方法在结果中展示。',
      'wf11.fill.ok': '已填充请求区：',
      'wf11.fill.miss': '未找到请求区输入框（独立预览模式）：',
      // ---- wf12.*（动态消息） ----
      'wf12.demo.empty': '明文为空：信封构造拒绝空明文（负路径）',
      'wf12.demo.fail': '演示失败：',
      'wf12.demo.golden': '与黄金向量一致（字节级）',
      'wf12.demo.match': '与输入明文一致',
      'wf12.demo.mode': '演示模式',
      'wf12.demo.mode.random': '随机 DEK/IV（I4 生产语义）',
      'wf12.demo.mode.vector': '固定向量 DEK/IV（字节级对拍，默认）',
      'wf12.demo.plain': '输入明文（L2 约定为业务 JSON，演示任意文本）',
      'wf12.demo.run': '演示',
      'wf12.demo.s1': '明文摘要（SHA-256）',
      'wf12.demo.s1.note': 'L0 明文模式下入签即此值；L2 模式下入签摘要对象是密文 wireBody（见步骤 ③）——spec 3.3④：L2 下 digest 为纵深防御，用于锁定密文载体',
      'wf12.demo.s2': '签名产物（SHA256withRSA · 商户私钥）',
      'wf12.demo.s2.note': '签名覆盖全部参与签名的头（含 digest 与 encrypt，I1）；PKCS#1 v1.5 签名确定性——同一 canonical 必得同一签名值',
      'wf12.demo.s3': 'L2 信封（AES-256-GCM 密文 + RSA-OAEP DEK 包装）',
      'wf12.demo.s3.iv': '固定向量 DEK/IV 仅用于教学对拍；生产必须每次 CSPRNG 新 DEK/IV（I4）',
      'wf12.demo.s3.rnd': '随机模式：本次 DEK/IV 由 CSPRNG 新生成（I4 生产语义），每次点击输出不同',
      'wf12.demo.s4': '接收侧校验与解密回明文（F6 时序）',
      'wf12.demo.s4.plain': '解密回明文：',
      'wf12.demo.title': '交互演示：真实执行四步（密码学调用为真，非动画）',
      'wf12.diagram.title': '层级图：出站构造（商户）与入站校验（网关）',
      'wf12.err.none': '无拦截（全部通过）——异常，请上报',
      'wf12.errors.body': '篡改密文 body 1 字节',
      'wf12.errors.dek': '构造损坏 DEK（重签合法）',
      'wf12.errors.digest': '篡改 digest 头 1 字符',
      'wf12.errors.hint': '前三项为 MITM 传输篡改（改任何入签头必先破签）；末项为构造侧缺陷：损坏 DEK 后以商户私钥重签，签名/摘要均有效（未演示过则先按当前输入构造一次）',
      'wf12.errors.sign': '篡改签名 1 字节',
      'wf12.errors.stage': '拦截阶段：',
      'wf12.errors.title': '错误路径演示：改坏一个字节，看拦截落在哪一步',
      'wf12.noglobals': '缺少共享全局（WOP_VECTORS 等）——请确认本切片已并入 index.html 之后加载',
      'wf12.p.alg.bad': 'alg=',
      'wf12.p.alg.ok': 'alg=AES-256-GCM 与 RSA 套件族一致',
      'wf12.p.alg.parse': 'DEK 载荷解析失败：',
      'wf12.p.dec.bad': 'GCM 解密失败：tag 校验不过（对外语义模糊为「解密失败」· I7）',
      'wf12.p.dec.diff': '解密成功但明文与输入不一致',
      'wf12.p.dec.ok': 'AES-256-GCM 解密成功，明文与输入一致（tag 校验通过）',
      'wf12.p.dek.bad': 'DEK 解包失败（对外语义模糊为「解密失败」· I7）',
      'wf12.p.dek.ok': '平台私钥解包 DEK 成功（RSA-OAEP 双SHA-256）',
      'wf12.p.digest.bad': '摘要复核失败：header 与实际 sha-256(密文) 不一致（body 可能被篡改）',
      'wf12.p.digest.ok': 'sha-256(密文) 与 x-wop-content-digest 一致',
      'wf12.p.verify.bad': '验签失败：按收到的头重算 canonical 与签名不匹配——任何入签头被改动即破签（I1）',
      'wf12.p.verify.ok': '商户公钥验签通过（canonical 五段式一致）',
      'wf12.sub': '签名与信封加密的层级关系：L2 报文的 digest 摘要对象是密文、DEK 经 RSA-OAEP 包装；演示使用 wop-specs 黄金向量 TEST-ONLY 密钥',
      'wf12.title': '数字信封图解（L0/L2）',
      'wf12.stage.verify': '① 验签（商户公钥 · SHA256withRSA · I2 先验签后解密）',
      'wf12.stage.digest': '② 摘要复核（sha-256(密文) 对 x-wop-content-digest · I1 入签）',
      'wf12.stage.dek': '③ DEK 解包（平台私钥 · RSA-OAEP 双SHA-256/空label）',
      'wf12.stage.alg': '④ alg 族比对（期望 AES-256-GCM · I3 bulk 解密前）',
      'wf12.stage.decrypt': '⑤ bulk 解密（AES-256-GCM · tag 128bit 校验）',
      'wf12.err.note.sign': '篡改签名 1 字节 → 落在 ① 验签（I2 第一道防线）',
      'wf12.err.note.digest': '篡改 digest 头 1 字符 → 头在签名覆盖内（I1 digest 入签），落在 ① 验签而非 ② 复核——改头必破签',
      'wf12.err.note.body': '篡改密文 body 1 字节 → 头未动，验签通过；sha-256(密文) 复核先拒（②）；纵深末端 GCM tag 亦会拒（⑤）',
      'wf12.err.note.dek': 'DEK 密文在构造侧即损坏，以商户私钥重签使签名/摘要均有效 → 落在 ③ DEK 解包；对外语义模糊为「解密失败」（I7，防 padding-oracle）',
      // ---- wf-gm.*（动态消息） ----
      'wf-gm.copied': '已复制',
      'wf-gm.copy': '复制',
      'wf-gm.keygen.btn': '生成 SM2 密钥对',
      'wf-gm.keygen.done': 'SM2 密钥对已生成',
      'wf-gm.keygen.hint': '生成 SM2 密钥对：私钥 d（hex / Base64 / PKCS#8 PEM）与公钥（hex / Base64）。签名与验签 userId 取 x-wop-appkey 头值（契约，2026-08-31 飞书裁决）；golden 向量夹具固定 1234567812345678。',
      'wf-gm.keygen.pem': '同时输出 PKCS#8 PEM',
      'wf-gm.keygen.pem.out': '私钥 PKCS#8 PEM',
      'wf-gm.keygen.privb64': '私钥（Base64，32B）',
      'wf-gm.keygen.privhex': '私钥 d（hex 64）',
      'wf-gm.keygen.pubb64': '公钥（Base64，65B）',
      'wf-gm.keygen.pubhex': '公钥（hex，04‖X‖Y 130）',
      'wf-gm.keygen.title': 'SM2 密钥对生成（国密）',
      'wf-gm.req.body': '业务报文（JSON 明文）',
      'wf-gm.req.build': '构造国密请求',
      'wf-gm.req.canonical': 'canonicalRequest 签名串',
      'wf-gm.req.dek': 'DEK 明文载荷（SM4-GCM$…$…）',
      'wf-gm.req.done': '国密请求构造完成',
      'wf-gm.req.emptybody': 'L2 加密需要非空报文',
      'wf-gm.req.expired': 'expiredSeconds',
      'wf-gm.req.filled': '已用生成密钥自闭环填充',
      'wf-gm.req.headers': '请求头（含 x-wop-sign）',
      'wf-gm.req.hint': 'L2 开启时：SM4-GCM（16B key / 12B IV）加密报文 → DEK 载荷以 SM2（C1C3C2，04 前缀）包装给平台公钥；x-wop-content-digest 覆盖线上密文 body。签名串为 canonicalRequest 五段式。',
      'wf-gm.req.l2': 'L2 加密（x-wop-encrypt）',
      'wf-gm.req.nobuild': '请先构造国密请求',
      'wf-gm.req.nodek': '（L0 无 DEK）',
      'wf-gm.req.nogen': '请先生成 SM2 密钥对',
      'wf-gm.req.path': '网关路径',
      'wf-gm.req.ppriv': '平台私钥 d（hex 64，可选；联调自验填充验证区用）',
      'wf-gm.req.priv': '商户私钥 d（hex 64）',
      'wf-gm.req.pub': '平台公钥（hex 130，L2 必填）',
      'wf-gm.req.st.done': '构造完成，可填充验证区自验',
      'wf-gm.req.st.env': 'L2 信封完成：SM4-GCM 密文 + SM2 包装 DEK',
      'wf-gm.req.st.l0': 'L0 明文：digest 已覆盖报文',
      'wf-gm.req.st.l0e': '（空报文 → 空 digest 头）',
      'wf-gm.req.st.sign': 'canonicalRequest 已签名（SM2，userId = x-wop-appkey 值）',
      'wf-gm.req.title': '国密请求构造（WOP-SM2-SM3）',
      'wf-gm.req.tover': '→ 填充国密验证区',
      'wf-gm.req.tover.done': '已填充国密验证区，切到验证页签执行五步验证',
      'wf-gm.req.usekeygen': '用生成密钥自闭环填充（演示）',
      'wf-gm.req.wire': '线上请求体（密文）',
      'wf-gm.ver.badseg': '签名头应为 v1/expired/signedHeaders/signature 四段',
      'wf-gm.ver.badsign': 'x-wop-sign 缺少套件与授权串的空格分隔',
      'wf-gm.ver.badsuite': 'securityReq 应为 ',
      'wf-gm.ver.body': '线上报文体（密文原文）',
      'wf-gm.ver.dpriv': 'DEK 解包私钥（接收方，hex 64）',
      'wf-gm.ver.goldenl0': '用测试向量 L0',
      'wf-gm.ver.goldenl2': '用测试向量 L2',
      'wf-gm.ver.headers': '请求头（每行 name: value）',
      'wf-gm.ver.hint': '粘贴对端回传的头（每行 name: value，含 x-wop-sign）与线上报文体，按 F6 顺序执行：SM2 验签 → SM3 摘要复核 → DEK 解包 → 套件族比对 → SM4-GCM 解密。方向中立：验签公钥 = 签名方公钥；DEK 解包私钥 = 信封接收方私钥。',
      'wf-gm.ver.l0note': '（明文流，无解密步骤）',
      'wf-gm.ver.method': '方法',
      'wf-gm.ver.miss': '签名头引用但未粘贴的头：',
      'wf-gm.ver.nosign': '缺少 x-wop-sign 头',
      'wf-gm.ver.path': '路径（重建 canonical 用）',
      'wf-gm.ver.plain': '解密后报文（L2 时）',
      'wf-gm.ver.run': '执行五步验证',
      'wf-gm.ver.title': '国密验证（WOP-SM2-SM3 五步流水线）',
      'wf-gm.ver.vpub': '验签公钥（签名方，hex 130）',
    },
    en: {
      // ---- wf14.* ----
      'wf14.lang.zh': '中文',
      'wf14.lang.en': 'English',
      // ---- wf9.* ----
      'wf9.title': 'SDK Snippets (six languages)',
      'wf9.subtitle': 'Derived from wop-sdk-spec conceptual API; official SDK is authoritative',
      'wf9.suite': 'Suite',
      'wf9.suite.auto': 'Follow Request-Build Tab',
      'wf9.method': 'Method',
      'wf9.copy': 'Copy snippet',
      'wf9.note': 'Snippets are derived examples (wop-sdk-spec §2 conceptual API), not runnable code; for integration use the official wop-<lang>-sdk (v0.1.0, MIT)',
      'wf9.copied': 'Copied to clipboard',
      'wf9.copyfail': 'Copy failed; please select and copy manually',
      'wf9.smhint': 'This SDK first release (v0.1.0) supports RSA suites only: SM2-SM3 explicitly throws (not supported in v0.1.0)',
      // ---- wf10.* ----
      'wf10.title': 'canonicalRequest segment breakdown',
      'wf10.subtitle': '(which field each line comes from)',
      'wf10.refresh': 'Refresh',
      'wf10.copy': 'Copy canonicalRequest',
      'wf10.diff.title': 'Diff check: paste / edit your canonical, live compare',
      'wf10.diff.hint': 'Per-line status: green = matches auto-generated; red = same position differs; gray = not participating (extra lines in manual string, or lines missing from it)',
      'wf10.mode.preview': 'Mode: preview (estimated from current fields)',
      'wf10.mode.built': 'Mode: request built (parsing #req-canonical live)',
      'wf10.mode.previewNote': 'Preview mode: no request built yet. nonce / timestamp are placeholders; the digest is estimated from the plaintext body (the actual x-wop-content-digest digests the wire request body; under L2 that is the ciphertext envelope). Once a request is built this switches to live parsing automatically.',
      'wf10.hover.field': 'Source: ',
      'wf10.hover.curval': 'Current value: ',
      'wf10.hover.method': 'Source: request method | gateway requests from this tool are always POST',
      'wf10.hover.qs': 'Source: query string | POST requests carry an empty query string (empty line kept)',
      'wf10.hover.gen': 'Source: ',
      'wf10.split.fail': 'canonical parse failed: ',
      'wf10.rule': 'Assembly rule: ',
      'wf10.emptyline': '(empty line: empty POST query string)',
      'wf10.digest.preview': '⚠ Not final (preview estimated from plaintext body)',
      'wf10.status.builtok': 'Parsed N lines',
      'wf10.status.error': 'Refresh failed: ',
      'wf10.status.noauto': 'No canonical to copy yet; refresh first',
      'wf10.status.copied': 'canonicalRequest copied (N chars)',
      'wf10.status.copyfail': 'Copy failed: open the diff textarea and copy manually',
      'wf10.diff.idle': 'Paste or edit the textarea above to see a line-by-line comparison here.',
      'wf10.diff.sum': 'Sum N lines: a same, b unequal, c extra, d missing',
      'wf10.diff.autoline': 'Auto-generated line: ',
      'wf10.diff.missline': 'Auto output has this line; yours is missing it: ',
      'wf10.diff.allok': '✓ Identical to the auto-generated canonicalRequest',
      'wf10.diff.bad': '✗ N mismatches in total (red = content diff, gray = line-count mismatch)',
      'wf10.diff.same': 'same',
      'wf10.diff.diff': 'diff',
      'wf10.diff.extra': 'extra',
      'wf10.diff.missing': 'missing',
      'wf10.note': 'Note: the canonicalRequest of this protocol has 5 segments (AuthString/HTTPMethod/CanonicalURI/CanonicalQueryString/CanonicalHeaders). In this task context, SignedHeaders is carried by segment 3 of the x-wop-sign header value (signed header names, ASCII ascending, semicolon-joined, not part of canonical); HashedPayload is carried by the x-wop-content-digest header (sha-256 + one space + 64 hex chars, digesting the wire request body).',
      // ---- wf11.* ----
      'wf11.banner': 'Example contract (built from wop-sdk-spec and gateway test fixtures), to be replaced by the official OpenAPI',
      'wf11.groupOther': 'Other',
      'wf11.errLine': 'Field',
      'wf11.fill.needGen': 'Generate the body JSON first (and pass validation) before filling',
      'wf11.form.unset': '(leave empty)',
      'wf11.err.integer': 'must be an integer',
      'wf11.err.number': 'must be a number',
      'wf11.err.boolean': 'must be true/false',
      'wf11.err.items': ' item(s)',
      'wf11.err.minItems': 'At least ',
      'wf11.err.maxItems': 'At most ',
      'wf11.err.arrayInt': 'Every array item must be integer: ',
      'wf11.err.enum': 'Value must be one of: ',
      'wf11.err.required': 'Required field missing',
      'wf11.direction.callback': 'Callback',
      'wf11.direction.ptm': 'Platform → Merchant',
      'wf11.direction.mtp': 'Merchant → Platform',
      'wf11.sec.headers': 'WOP protocol headers',
      'wf11.col.header': 'Header',
      'wf11.col.required': 'Required',
      'wf11.col.when': 'When',
      'wf11.sec.params': 'Parameters',
      'wf11.col.name': 'Name',
      'wf11.col.in': 'In',
      'wf11.col.type': 'Type',
      'wf11.col.desc': 'Description',
      'wf11.col.code': 'Status code',
      'wf11.sec.responses': 'Response codes',
      'wf11.yes': 'Yes',
      'wf11.no': 'No',
      'wf11.sec.form': 'Request body form (template-generated)',
      'wf11.gen': 'Generate body JSON',
      'wf11.fill': 'Fill request section',
      'wf11.fill.help': '"Fill request section" writes path/body/encryption level into the matching inputs of the Request Wire tab (r-path / r-body / r-level); the gateway is POST-only, the method shows up in the result.',
      'wf11.fill.ok': 'Request section filled: ',
      'wf11.fill.miss': 'Request inputs not found (standalone preview mode): ',
      // ---- wf12.* ----
      'wf12.title': 'Digital envelope diagram (L0/L2)',
      'wf12.stage.verify': '① Verify signature (merchant public key · SHA256withRSA · I2 verify-before-decrypt)',
      'wf12.stage.digest': '② Digest re-check (sha-256(ciphertext) vs x-wop-content-digest · I1 digest is signed)',
      'wf12.stage.dek': '③ DEK unwrap (platform private key · RSA-OAEP double SHA-256 / empty label)',
      'wf12.stage.alg': '④ alg family match (expect AES-256-GCM · I3 before bulk decrypt)',
      'wf12.stage.decrypt': '⑤ Bulk decrypt (AES-256-GCM · 128-bit tag check)',
      'wf12.err.note.sign': 'Corrupt the signature by 1 byte → caught at ① signature verify (I2 first line of defense)',
      'wf12.err.note.digest': 'Corrupt the digest header by 1 char → the header is inside the signature coverage (I1 digest signed), caught at ① verify rather than ② re-check — any header change breaks the signature',
      'wf12.err.note.body': 'Corrupt the ciphertext body by 1 byte → headers untouched, signature passes; sha-256(ciphertext) re-check rejects first (②); the GCM tag at the end of the chain also rejects (⑤)',
      'wf12.err.note.dek': 'The DEK blob is corrupted at construction and re-signed with the merchant key so signature/digest stay valid → caught at ③ DEK unwrap; externally blurred as "decryption failed" (I7, anti padding-oracle)',
      'wf12.sub': 'Layering of signing and envelope encryption: the digest of an L2 message covers ciphertext, and the DEK is wrapped with RSA-OAEP; the demo uses wop-specs golden-vector TEST-ONLY keys',
      'wf12.diagram.title': 'Layering: outbound construction (merchant) and inbound verification (gateway)',
      'wf12.demo.title': 'Interactive demo: four steps actually run (real crypto, not animation)',
      'wf12.demo.plain': 'Input plaintext (L2 requires business JSON; demo accepts any text)',
      'wf12.demo.mode': 'Demo mode',
      'wf12.demo.mode.vector': 'Fixed-vector DEK/IV (byte-level parity, default)',
      'wf12.demo.mode.random': 'Random DEK/IV (I4 production semantics)',
      'wf12.demo.run': 'Run',
      'wf12.demo.s1': 'Plaintext digest (SHA-256)',
      'wf12.demo.s2': 'Signature output (SHA256withRSA · merchant private key)',
      'wf12.demo.s3': 'L2 envelope (AES-256-GCM ciphertext + RSA-OAEP-wrapped DEK)',
      'wf12.demo.s4': 'Receiving-side verify and decrypt back to plaintext (F6 flow)',
      'wf12.errors.title': 'Error-path demo: corrupt one byte, see where interception lands',
      'wf12.errors.hint': 'First three corrupt MITM-transmitted data (any signed-header change breaks the signature first); last is a construction-side defect: a broken DEK re-signed with the merchant key keeps signature/digest valid (build once from current input first if not yet demonstrated)',
      'wf12.errors.sign': 'Corrupt signature by 1 byte',
      'wf12.errors.digest': 'Corrupt digest header by 1 char',
      'wf12.errors.body': 'Corrupt ciphertext body by 1 byte',
      'wf12.errors.dek': 'Build broken DEK (legal re-sign)',
      // ---- wf-gm.* ----
      'wf-gm.keygen.title': 'SM2 keypair generation (GM)',
      'wf-gm.keygen.hint': 'Generate an SM2 keypair: private key d (hex / Base64 / PKCS#8 PEM) and public key (hex / Base64). Signing and verification use the x-wop-appkey header value as userId (contract, 2026-08-31 ruling); golden-vector fixtures keep fixed 1234567812345678.',
      'wf-gm.keygen.btn': 'Generate SM2 keypair',
      'wf-gm.keygen.pem': 'Also output PKCS#8 PEM',
      'wf-gm.keygen.privhex': 'Private key d (hex 64)',
      'wf-gm.copy': 'Copy',
      'wf-gm.keygen.privb64': 'Private key (Base64, 32B)',
      'wf-gm.keygen.pem.out': 'Private key PKCS#8 PEM',
      'wf-gm.keygen.pubhex': 'Public key (hex, 04‖X‖Y 130)',
      'wf-gm.keygen.pubb64': 'Public key (Base64, 65B)',
      'wf-gm.req.title': 'GM request build (WOP-SM2-SM3)',
      'wf-gm.req.hint': 'With L2 on: SM4-GCM (16B key / 12B IV) encrypts the payload → the DEK blob is wrapped to the platform public key with SM2 (C1C3C2, 04 prefix); x-wop-content-digest covers the on-wire ciphertext body. The signing string is the five-part canonicalRequest.',
      'wf-gm.req.priv': 'Merchant private key d (hex 64)',
      'wf-gm.req.pub': 'Platform public key (hex 130, required for L2)',
      'wf-gm.req.ppriv': 'Platform private key d (hex 64, optional; for self-check loopback into the verify section)',
      'wf-gm.req.body': 'Business payload (plaintext JSON)',
      'wf-gm.req.path': 'Gateway path',
      'wf-gm.req.expired': 'expiredSeconds',
      'wf-gm.req.build': 'Build GM request',
      'wf-gm.req.usekeygen': 'Auto-fill from generated keys (demo)',
      'wf-gm.req.l2': 'L2 encryption (x-wop-encrypt)',
      'wf-gm.req.tover': '→ Fill into GM verify section',
      'wf-gm.req.canonical': 'canonicalRequest signing string',
      'wf-gm.req.headers': 'Request headers (incl. x-wop-sign)',
      'wf-gm.req.wire': 'On-wire request body (ciphertext)',
      'wf-gm.req.dek': 'DEK plaintext blob (SM4-GCM$…$…)',
      'wf-gm.ver.title': 'GM verify (WOP-SM2-SM3 five-step pipeline)',
      'wf-gm.ver.hint': 'Paste the peer-returned headers (one per line, name: value, incl. x-wop-sign) and the on-wire body; executes in F6 order: SM2 signature → SM3 digest check → DEK unwrap → suite-family match → SM4-GCM decrypt. Direction-neutral: verify key = signer public key; DEK-unwrap key = envelope recipient private key.',
      'wf-gm.ver.vpub': 'Verify public key (signer, hex 130)',
      'wf-gm.ver.dpriv': 'DEK unwrap private key (recipient, hex 64)',
      'wf-gm.ver.method': 'Method',
      'wf-gm.ver.path': 'Path (for canonical rebuild)',
      'wf-gm.ver.goldenl0': 'Use test vector L0',
      'wf-gm.ver.goldenl2': 'Use test vector L2',
      'wf-gm.ver.headers': 'Request headers (one per line, name: value)',
      'wf-gm.ver.body': 'On-wire request body (raw ciphertext)',
      'wf-gm.ver.run': 'Run five-step verify',
      'wf-gm.ver.plain': 'Decrypted payload (when L2)',
      // ---- main.*（主页面：静态 chrome + 动态消息） ----
      'main.bld.done': 'Build complete',
      'main.bld.fail': 'Build failed: {msg}',
      'main.bld.noappkey': 'appKey must not be empty',
      'main.bld.nopath': 'Request path must start with /',
      'main.bld.sm2only': 'This page builds RSA suites only; for WOP-SM2-SM3 switch to the SM tab (SM request build section, SM2 signature + SM4-GCM encryption)',
      'main.bld.step.dek.l0': 'DEK/ciphertext: L0 plaintext',
      'main.bld.step.dek.l2': 'DEK/ciphertext: AES-256-GCM 32B key + 12B IV, wrapped with RSA-OAEP(SHA-256)',
      'main.bld.step.e2e.bad': 'Full debug chain: simulated platform private key unwraps DEK → AES-GCM decrypted body MISMATCH!',
      'main.bld.step.e2e.ok': 'Full debug chain: simulated platform private key unwraps DEK → AES-GCM decrypted body matches',
      'main.bld.step.pre.bad': 'Local pre-check: merchant public key FAILS to verify canonicalRequest signature',
      'main.bld.step.pre.ok': 'Local pre-check: merchant public key verifies canonicalRequest signature',
      'main.copied.cell': '{k} copied',
      'main.copy.title': 'Click to copy',
      'main.empty': '(empty)',
      'main.err.diag': 'Diagnose',
      'main.err.empty': 'Paste an error envelope or error code first',
      'main.err.failed': 'Diagnosis failed',
      'main.err.h': 'Platform error diagnostics (62-code public contract dictionary)',
      'main.err.hit': 'Dictionary hit: {code}',
      'main.err.k.advice': 'Handling advice',
      'main.err.k.class': 'Category',
      'main.err.k.code': 'Code',
      'main.err.k.meaning': 'Meaning',
      'main.err.k.owner': 'Owner',
      'main.err.k.retry': 'Retryable',
      'main.err.miss': 'Unknown code: {code}',
      'main.err.nocode': 'No error code recognized: paste a {"code":"OP_GW_xxxx",...} envelope, the full error response message, or a bare code',
      'main.err.note.a': 'Paste the platform error envelope ',
      'main.err.note.b': '(or the whole error response message, or a bare code) to get category, meaning, handling advice and retryability. The dictionary follows the gateway public contract (62 codes, taxonomy / external semantics frozen).',
      'main.err.retry.no': 'Fix then retry (re-sending the original message as-is is not advised)',
      'main.err.retry.yes': 'Retryable later',
      'main.err.seg.scope': 'Check the latest protocol documentation',
      'main.err.seg.unknown': 'Unknown category segment',
      'main.err.st.hit': 'Public contract dictionary hit',
      'main.err.st.miss': 'No hit (see hints)',
      'main.err.trace': '{id} (include it when contacting platform support)',
      'main.err.unknown.dict': ' (not in the built-in 62-code dictionary — new contract or non-platform code; check the latest docs)',
      'main.h1': 'WOP Merchant RSA Keypair Generator',
      'main.intro': 'Keypairs are generated entirely in your browser and never uploaded. After generation, upload the merchant public key to the open platform and keep the merchant private key safe.',
      'main.key.short': 'Key content is empty or too short',
      'main.kg.bits': 'Key length',
      'main.kg.bits.3072': '3072-bit (recommended)',
      'main.kg.bits.3072.s': 'Suite WOP-RSA3072-SHA256',
      'main.kg.bits.4096': '4096-bit',
      'main.kg.bits.4096.s': 'Suite WOP-RSA4096-SHA256',
      'main.kg.bits.note': 'Note: if asked for a "3074-bit key", that is a typo — RSA has no 3074-bit size; choose 3072. The platform has frozen three suites (WOP-RSA3072-SHA256 / WOP-RSA4096-SHA256 / WOP-SM2-SM3, see wop-specs); this page builds RSA requests; for WOP-SM2-SM3 switch to the SM tab.',
      'main.kg.cfg.h': '1. Configuration',
      'main.kg.copied': '{kind} copied to clipboard',
      'main.kg.copy': 'Copy',
      'main.kg.copyfail': 'Copy failed; please select and copy manually',
      'main.kg.doing': 'Generating {bits}-bit key… (takes a few seconds)',
      'main.kg.done': 'Keypair generated',
      'main.kg.download': 'Download',
      'main.kg.downloaded': 'Downloaded {name}',
      'main.kg.fail': 'Generation failed: {msg}. Make sure the browser is Chrome 37+ / Safari 11+ / Firefox 34+ and running in a secure context (HTTPS or local file).',
      'main.kg.fp': 'Public key fingerprint SHA-256 (SPKI):\n{fp}',
      'main.kg.gen': 'Generate keypair',
      'main.kg.genfail': 'Generation failed: {msg}',
      'main.kg.hide': 'Hide',
      'main.kg.mfp': 'Merchant public key fingerprint (SHA-256/SPKI): {fp}',
      'main.kg.mfpbad': 'Private key parse failed: {msg}',
      'main.kg.nocrypto': 'This browser does not support the Web Crypto API and cannot generate keys. Use a modern browser, and make sure the page runs in a secure context (HTTPS / local file).',
      'main.kg.priv.h': 'Merchant private key',
      'main.kg.priv.hint': '(keep secret; never disclose)',
      'main.kg.privfmt': 'Private key format',
      'main.kg.privfmt.b64': 'Single-line Base64 (PKCS#8 DER · gateway integration format)',
      'main.kg.privfmt.pem': 'PKCS#8 PEM (recommended · platform doc format)',
      'main.kg.pub.h': 'Merchant public key',
      'main.kg.pub.hint': '(upload to the open platform)',
      'main.kg.pubfmt': 'Public key format',
      'main.kg.pubfmt.b64': 'Single-line Base64 (SPKI DER · gateway integration format)',
      'main.kg.pubfmt.pem': 'X.509 SPKI PEM (recommended · platform doc format)',
      'main.kg.show': 'Show',
      'main.kg.stfail': 'Self-test failed (sign={sign} wrap={wrap} bits={n})',
      'main.kg.stok': '✓ Self-test passed: {bits}-bit · SHA256withRSA sign/verify round-trip consistent · RSA-OAEP(SHA-256) encrypt/decrypt round-trip consistent · valid for WOP-RSA{bits}-SHA256 suite',
      'main.notice.h': 'Security notes',
      'main.notice.li1': 'This page is a pure static single file with zero network requests; key generation and message crypto all run locally in the browser (Web Crypto API over HTTPS or a local-file context).',
      'main.notice.li2': 'If the private key is lost you must re-upload the public key and go through key rotation; back it up offline and never commit it to a repository.',
      'main.notice.li3': 'The platform consumes PKCS#8 private keys / X.509 SPKI public keys (PEM or its single-line Base64); the gateway wraps the DEK with RSA-OAEP(SHA-256) and verifies signatures with SHA256withRSA.',
      'main.req.body': 'Plaintext business body (JSON)',
      'main.req.build': 'Build request',
      'main.req.build.h': '2. Build request (merchant → gateway)',
      'main.req.canon': 'Debug: canonicalRequest (signed string)',
      'main.req.curl': 'curl command',
      'main.req.expired': 'expiredSeconds (s)',
      'main.req.genplat': 'Generate platform keypair (debug)',
      'main.req.headers': 'Request headers (click a value to copy)',
      'main.req.host': 'Gateway host (for curl only)',
      'main.req.import': 'Import from Keygen tab',
      'main.req.keys.h': '1. Key configuration',
      'main.req.level': 'Encryption level',
      'main.req.level.l0': 'L0 plaintext',
      'main.req.level.l2': 'L2 full encryption',
      'main.req.mpriv': 'Merchant private key (PKCS#8, PEM or single-line Base64)',
      'main.req.out.h': 'Build result',
      'main.req.path': 'Request path',
      'main.req.plat.help': 'Debug mode: generate a simulated platform keypair locally (private key kept in session memory only, used by "Simulate platform response"); in production paste the real platform public key.',
      'main.req.ppub': 'Platform public key (X.509 SPKI, PEM or single-line Base64)',
      'main.req.suite': 'Security suite',
      'main.req.wirebody': 'Wire body (x-wop-content-digest is computed over this)',
      'main.res.canon': 'Debug: message canonicalRequest',
      'main.res.cbcurl': 'Platform → merchant callback curl (to self-test your receiving endpoint; message format per inferred contract)',
      'main.res.h': 'Verification result',
      'main.res.plain': 'Decrypted plaintext',
      'main.sim.badurl': 'Callback type requires a full callback URL (starting with http(s)://)',
      'main.sim.fail': 'Simulation failed: {msg}',
      'main.sim.imported': 'Merchant private key imported',
      'main.sim.needgen': 'Generate a keypair on the Keygen tab first',
      'main.sim.noplatform': 'Click "Generate platform keypair (debug)" first',
      'main.sim.platform': 'Debug platform keypair generated (session memory only)',
      'main.sim.pubreplaced': 'Manual platform public key replacement detected; debug private key cleared (full-chain self-check and simulated response require regenerating the debug keypair)',
      'main.st.canon.h': 'Cross-language canonical test vectors',
      'main.st.canon.note': 'Byte-level expected values of javaUrlEncode / trimall / canonicalHeaders / buildCanonical (17 positives + 6 trap assertions above). For merchants porting the signing logic server-side (Java / Go / Python…): any implementation that produces the expected output for each input row below is signature-compatible with this tool. Semantic anchor = entry-wise implementation: normalize each key with its own value, then sort by ascending code unit.',
      'main.st.fail': '✗ {n} assertions failed — not aligned with the spec; do not use for integration',
      'main.st.h': 'Golden vector self-test',
      'main.st.note': 'Built-in wop-specs golden vectors (read-only fixture copy, do not edit) run byte-level assertions in one click: positives (digest / RSA signature / AES-GCM ciphertext / DEK blob / OAEP unwrap) must match, negatives (cross-family / malformed / non-canonical trailing bits / MGF1 trap) must be rejected. Only a full pass shows "aligned with the official spec".',
      'main.st.pass': '✓ All {n} assertions passed — this tool is aligned with the wop-specs golden vectors (v1.0-ratified F8)',
      'main.st.res.h': 'Assertion results',
      'main.st.run': 'Run self-test',
      'main.st.running': 'Running…',
      'main.tab.api': 'API Catalog',
      'main.tab.gm': 'SM Suite (WOP-SM2-SM3)',
      'main.tab.keygen': 'Keygen',
      'main.tab.request': 'Request Wire',
      'main.tab.selftest': 'Vector Self-test',
      'main.tab.wf12': 'Envelope Diagram',
      'main.ver.alg.unsupported': 'Message algorithm {alg} not supported',
      'main.ver.bad': 'Some checks failed',
      'main.ver.body.l': 'Message body (for L2: {"encrypted":"…"} ciphertext carrier)',
      'main.ver.cbbody': 'Callback plaintext (sample payload, editable)',
      'main.ver.cburl': 'Merchant callback URL (required for callback type, e.g. https://merchant.example.com/wop/callback)',
      'main.ver.dek.bad': 'Malformed DEK blob; expected alg$key$iv',
      'main.ver.enc.l': 'x-wop-encrypt (for L2)',
      'main.ver.fail': 'Verification failed: {msg}',
      'main.ver.format4': 'x-wop-sign must be <protocolVersion>/<expiredSeconds>/<signedHeaders>/<signature>',
      'main.ver.gm.missing': 'SM core not loaded (GmCore.verifySmSuite missing)',
      'main.ver.gm.needpriv': 'Merchant private key must be SM2 PKCS#8 (SM debug; DEK unwrap of x-wop-encrypt needs the d scalar)',
      'main.ver.gm.needappkey': 'x-wop-appkey required (SM2 userId contract: userId = x-wop-appkey value)',
      'main.ver.h': '3. Verify platform message (sync response / async callback)',
      'main.ver.noenc': 'Response body is missing the encrypted field',
      'main.ver.nosign': 'x-wop-sign is empty',
      'main.ver.nospace': 'x-wop-sign is missing the space between securityReq and authString',
      'main.ver.note': 'Paste the headers and body of a platform-side message (gateway sync response, or a platform-initiated async callback) to re-check signature / digest / decryption item by item. Both message kinds share the same logic and differ only in the canonical URI: responses use the gateway API path, callbacks use the callback URL path. In debug mode you can also close the loop locally.',
      'main.ver.note.f6': 'Verification order follows wop-sdk-spec v1.0-ratified (F6): signature → digest re-check → DEK unwrap → alg family match → bulk decrypt.',
      'main.ver.ok': 'Verification passed',
      'main.ver.parse': 'Parse & fill verification form',
      'main.ver.paste.h': 'Paste raw HTTP message, auto-parse & fill (optional)',
      'main.ver.paste.note': 'Supports both directions of HTTP/1.1 messages — merchant requests and platform responses (sync / async callback): start line + headers + blank line + body. Parsing fills the header fields and body below; missing or malformed fields are reported item by item.',
      'main.ver.simcb': 'Simulate callback & verify',
      'main.ver.simresp': 'Simulate response & verify',
      'main.ver.spki.bad': 'Platform public key must be X.509 SPKI (DER SEQUENCE)',
      'main.ver.step.aes': 'AES-256-GCM decryption succeeded (GCM tag check passed)',
      'main.ver.step.declared': 'signedHeaders declares a header this page does not provide: {name} (verify manually per canonical rules)',
      'main.ver.step.dek': 'DEK unwrap: algorithm {alg} (merchant private key, RSA-OAEP)',
      'main.ver.step.l0': 'L0 plaintext message; decryption skipped',
      'main.ver.step.parse': 'Signature header parsed: suite {sr}, authString {a}',
      'main.ver.step.sha.bad': 'Digest re-check failed: header={h}, actual sha-256={c} (RSA suites require sha-256 + exactly one space + 64 lowercase hex; an sm3 header is a cross-family rejection; body may be tampered or incompletely pasted)',
      'main.ver.step.sha.ok': 'Digest re-check: sha-256(body) matches x-wop-content-digest',
      'main.ver.step.sign.bad': 'Signature verification failed: check that the platform public key matches, message type / callback URL are correct (the canonical URI comes from its path), and header values were copied in full',
      'main.ver.type': 'Message type',
      'main.ver.type.cb': 'Async callback (URI = callback URL path)',
      'main.ver.type.resp': 'Sync response (URI = gateway request path)',
      'main.ver.verify': 'Verify & decrypt',
      'main.wire.badhdr': 'Malformed header line (missing colon separator): {v}',
      'main.wire.badstart': 'Unrecognized start line: {v} (expected "METHOD path HTTP/1.1" or "HTTP/1.1 status")',
      'main.wire.digest.bad': 'Malformed x-wop-content-digest: expected <sha-256|sm3> + exactly one space + 64 lowercase hex chars',
      'main.wire.done': 'Done; click "Verify & decrypt" to re-check',
      'main.wire.empty': 'Empty input: no start line found',
      'main.wire.enc.bad': 'Malformed x-wop-encrypt: expected L2;dek=<base64url (RSA-OAEP-wrapped DEK ciphertext)>',
      'main.wire.filled': '{n} fields filled',
      'main.wire.missing': 'Missing required headers: {list} (verification cannot complete; fill them in or paste the full message)',
      'main.wire.none': 'No WOP headers / message body recognized',
      'main.wire.parse': 'Message parse: {e}',
      'main.wire.partial': 'Parsing incomplete; recognized fields were filled',
      'main.wire.sign.bad': 'x-wop-sign must start with securityReq (WOP-<alg>-<digest>) followed by v1/expiredSeconds/signedHeaders/signature',
      'main.wire.ts.bad': 'x-wop-timestamp must be a millisecond timestamp (13 digits)',
      'main.kg.priv': 'private key',
      'main.kg.pub': 'public key',
      'main.ver.step.sign.ok.cb': 'Signature verified: platform public key SHA256withRSA checked the callback signature',
      'main.ver.step.sign.ok.resp': 'Signature verified: platform public key SHA256withRSA checked the response signature',
      // ---- wf12.*（动态消息） ----
      'wf12.demo.empty': 'Plaintext empty: envelope construction rejects empty plaintext (negative path)',
      'wf12.demo.fail': 'Demo failed: ',
      'wf12.demo.golden': 'Matches golden vector (byte-level)',
      'wf12.demo.match': 'Matches input plaintext',
      'wf12.demo.s1.note': 'Under L0 plaintext mode this is the signed digest; under L2 the digest input is the ciphertext wireBody (see step ③) — spec 3.3④: under L2 the digest is defense-in-depth, locking the ciphertext carrier',
      'wf12.demo.s2.note': 'The signature covers all signed headers (incl. digest and encrypt, I1); PKCS#1 v1.5 signatures are deterministic — the same canonical always yields the same signature',
      'wf12.demo.s3.iv': 'Fixed-vector DEK/IV is for teaching parity only; production must generate a fresh DEK/IV from CSPRNG each time (I4)',
      'wf12.demo.s3.rnd': 'Random mode: this run used a freshly CSPRNG-generated DEK/IV (I4 production semantics); output differs per click',
      'wf12.demo.s4.plain': 'Decrypted back to plaintext: ',
      'wf12.err.none': 'No interception (all passed) — abnormal, please report',
      'wf12.errors.stage': 'Interception stage: ',
      'wf12.noglobals': 'Missing shared globals (WOP_VECTORS etc.) — make sure this slice is merged into index.html before loading',
      'wf12.p.alg.bad': 'alg=',
      'wf12.p.alg.ok': 'alg=AES-256-GCM matches the RSA suite family',
      'wf12.p.alg.parse': 'DEK blob parse failed: ',
      'wf12.p.dec.bad': 'GCM decryption failed: tag check failed (externally blurred as "decryption failed" · I7)',
      'wf12.p.dec.diff': 'Decryption succeeded but plaintext differs from input',
      'wf12.p.dec.ok': 'AES-256-GCM decryption succeeded; plaintext matches input (tag check passed)',
      'wf12.p.dek.bad': 'DEK unwrap failed (externally blurred as "decryption failed" · I7)',
      'wf12.p.dek.ok': 'Platform private key unwrapped DEK (RSA-OAEP double SHA-256)',
      'wf12.p.digest.bad': 'Digest re-check failed: header does not match actual sha-256(ciphertext) (body may be tampered)',
      'wf12.p.digest.ok': 'sha-256(ciphertext) matches x-wop-content-digest',
      'wf12.p.verify.bad': 'Signature verification failed: canonical rebuilt from received headers does not match — any change to a signed header breaks the signature (I1)',
      'wf12.p.verify.ok': 'Merchant public key signature verified (five-part canonical consistent)',
      'wf-gm.copied': 'Copied',
      'wf-gm.keygen.done': 'SM2 keypair generated',
      'wf-gm.req.done': 'GM request built',
      'wf-gm.req.emptybody': 'L2 encryption requires a non-empty body',
      'wf-gm.req.filled': 'Auto-filled from generated keys (closed loop)',
      'wf-gm.req.nobuild': 'Build a GM request first',
      'wf-gm.req.nodek': '(L0 has no DEK)',
      'wf-gm.req.nogen': 'Generate an SM2 keypair first',
      'wf-gm.req.st.done': 'Build complete; fill the verify section to self-check',
      'wf-gm.req.st.env': 'L2 envelope complete: SM4-GCM ciphertext + SM2-wrapped DEK',
      'wf-gm.req.st.l0': 'L0 plaintext: digest covers the body',
      'wf-gm.req.st.l0e': '(empty body → empty digest header)',
      'wf-gm.req.st.sign': 'canonicalRequest signed (SM2, userId = x-wop-appkey value)',
      'wf-gm.req.tover.done': 'GM verify section filled; switch to the verify tab and run the five-step check',
      'wf-gm.ver.badseg': 'Signature header must be four segments v1/expired/signedHeaders/signature',
      'wf-gm.ver.badsign': 'x-wop-sign is missing the space between suite and auth string',
      'wf-gm.ver.badsuite': 'securityReq must be ',
      'wf-gm.ver.l0note': '(plaintext flow; no decryption step)',
      'wf-gm.ver.miss': 'Headers referenced by the signature but not pasted: ',
      'wf-gm.ver.nosign': 'x-wop-sign header missing',
    }
  };

  /* 级联查字典：dict[当前语言] → dict.zh → undefined */
  function lookup(key, lang) {
    var d = DICT[lang];
    if (d && hasOwn(d, key)) return d[key];
    if (lang !== DEFAULT_LANG) {
      d = DICT[DEFAULT_LANG];
      if (d && hasOwn(d, key)) return d[key];
    }
    return undefined;
  }

  /* WF14.t(key, fallback)：取当前语言文案。
   * 级联：dict[当前语言] → dict.zh → fallback →（fallback 缺省时）回显 key，便于发现漏翻。 */
  function t(key, fallback) {
    var k = key == null ? '' : String(key); // spec:WF14-NEG 空 key 不崩溃
    var v = lookup(k, current);
    if (v !== undefined) return String(v);
    if (fallback === undefined || fallback === null) return k; // spec:WF14-T-FALLBACK
    return String(fallback);
  }

  /* DOM 应用：遍历 [data-i18n]，命中字典才写 textContent（约定 data-i18n 挂在叶子 span 上）。
   * 未注册 key 保留元素原内联文案 —— 框架先行阶段不得清空其他 WF 尚未收口的文案。 */
  function applyDom() {
    var doc = root.document;
    if (!doc || typeof doc.querySelectorAll !== 'function') return;
    var els = doc.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute && el.getAttribute('data-i18n');
      if (!key) continue;
      var v = lookup(key, current);
      if (v === undefined) continue; // spec:WF14-DOM-SKIP
      el.textContent = v;
    }
  }

  function fireEvent() {
    var doc = root.document;
    if (!doc || typeof doc.dispatchEvent !== 'function') return;
    var ev;
    if (typeof root.CustomEvent === 'function') {
      ev = new root.CustomEvent('wop:langchange', { detail: { lang: current } });
    } else {
      ev = { type: 'wop:langchange', detail: { lang: current } }; // 无 CustomEvent 环境（Node 自测）兜底
    }
    doc.dispatchEvent(ev); // spec:WF14-EVENT
  }

  function getLang() { return current; }

  /* WF14.setLang('zh'|'en')：非法参数回退 zh → 应用到 [data-i18n] → 派发 wop:langchange。
   * 返回实际生效语言。语言偏好不落盘（S2），刷新回中文。 */
  function setLang(lang) {
    current = LANGS.indexOf(lang) !== -1 ? lang : DEFAULT_LANG; // spec:WF14-INVALID
    applyDom();
    fireEvent();
    return current;
  }

  /* WF14.register({ zh:{key:文案}, en:{key:text} })：合并进全局字典，同 key 后注册覆盖；
   * 未知语言段（如 fr）忽略。合并后立即应用到已有 [data-i18n]（迟注册字典即时生效）。 */
  function register(dict) {
    if (!dict || typeof dict !== 'object') return false; // spec:WF14-NEG 非法入参不崩溃
    var merged = false;
    for (var i = 0; i < LANGS.length; i++) {
      var lang = LANGS[i];
      var section = dict[lang];
      if (!section || typeof section !== 'object') continue;
      for (var k in section) {
        if (!hasOwn(section, k)) continue;
        DICT[lang][k] = section[k]; // spec:WF14-REGISTER-MERGE 后者覆盖
        merged = true;
      }
    }
    if (merged) applyDom();
    return merged;
  }

  /* WF14.collectKeys()：dev 模式收集器，返回全部已注册 key（排序去重），供集成阶段对照遗漏。 */
  function collectKeys() {
    var seen = {};
    for (var i = 0; i < LANGS.length; i++) {
      var d = DICT[LANGS[i]];
      for (var k in d) if (hasOwn(d, k)) seen[k] = 1;
    }
    var out = [];
    for (var k2 in seen) if (hasOwn(seen, k2)) out.push(k2);
    out.sort();
    return out;
  }

  /* ---- 切换控件接线（init 由集成者在 DOM 就绪后统一调用，本文件不自行绑定加载事件）---- */
  var BTN_IDS = ['wf14-btn-zh', 'wf14-btn-en'];

  function syncButtons() {
    var doc = root.document;
    if (!doc) return;
    for (var i = 0; i < BTN_IDS.length; i++) {
      var b = doc.getElementById(BTN_IDS[i]);
      if (!b) continue;
      var on = b.getAttribute('data-wf14-lang') === current;
      if (b.classList) {
        if (on) b.classList.add('wf14-active'); else b.classList.remove('wf14-active');
      }
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function init() {
    var doc = root.document;
    if (!doc) return;
    for (var i = 0; i < BTN_IDS.length; i++) {
      (function (btn) {
        if (!btn) return;
        btn.addEventListener('click', function () {
          setLang(btn.getAttribute('data-wf14-lang')); // 非法 data-wf14-lang 由 setLang 回退 zh
        });
      })(doc.getElementById(BTN_IDS[i]));
    }
    applyDom();    // 归一化当前语言（默认 zh 与内联中文一致，幂等）
    syncButtons();
    doc.addEventListener('wop:langchange', syncButtons); // 外部调用 setLang 也同步按钮态
  }

  /* ---- UI 片段（与 wf14.html / wf14.css 文件内容保持一致）---- */
  var HTML_FRAG =
    '<!-- WF14 语言切换控件（内容与 wf14.html 一致）\n' +
    '     锚点建议：插入页面右上角 —— 现有 index.html 的 <header>（约 146 行）内 <h1> 同行右侧。\n' +
    '     接线说明：片段插入 DOM 后由集成者统一调用 WF_REGISTRY.wf14.init()；本片段不自带事件绑定。 -->\n' +
    '<div id="wf14-lang-switch" role="group" aria-label="语言 / Language">\n' +
    '  <button type="button" id="wf14-btn-zh" class="wf14-lang-btn wf14-active" data-wf14-lang="zh" aria-pressed="true"><span class="i18n" data-i18n="wf14.lang.zh">中文</span></button>\n' +
    '  <button type="button" id="wf14-btn-en" class="wf14-lang-btn" data-wf14-lang="en" aria-pressed="false"><span class="i18n" data-i18n="wf14.lang.en">English</span></button>\n' +
    '</div>';

  var CSS_TEXT =
    '/* WF14 语言切换控件样式（内容与 wf14.js 内嵌 CSS_TEXT 保持一致，改动需双写） */\n' +
    '#wf14-lang-switch{display:inline-flex;gap:2px;align-items:center;border:1px solid #d0d7de;border-radius:8px;padding:2px;background:#f6f8fa;vertical-align:middle}\n' +
    '.wf14-lang-btn{border:0;background:transparent;color:#57606a;font-size:12px;line-height:1;padding:5px 10px;border-radius:6px;cursor:pointer;font-family:inherit}\n' +
    '.wf14-lang-btn:hover{background:#eaeef2}\n' +
    '.wf14-lang-btn.wf14-active{background:#0969da;color:#fff}\n';

  var WF14 = {
    t: t,
    setLang: setLang,
    getLang: getLang,
    register: register,
    collectKeys: collectKeys,
    LANGS: LANGS.slice(),
    PREFIXES: PREFIXES.slice()
  };
  root.WF14 = WF14;

  var registry = root.WF_REGISTRY || (root.WF_REGISTRY = {});
  registry['wf14'] = {
    id: 'wf14',
    title: 'i18n 中英切换',
    css: CSS_TEXT,
    html: HTML_FRAG,
    init: init,
    selftest: function () {
      if (typeof root.WF14_RUN_SELFTEST !== 'function') {
        return [{ name: 'WF14 断言文件未加载', pass: false, detail: '缺少 wf14.selftest.js（wf14.js → wf14.selftest.js，颠倒亦可）' }];
      }
      return root.WF14_RUN_SELFTEST();
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
