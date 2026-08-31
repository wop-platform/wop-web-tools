/* WF14 — i18n 基础设施（中英切换，框架先行；全量文案在集成阶段收口）
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
  // 预留 key 命名空间（占位结构，见 README 收口流程）：
  //   wf10 规范可视化 / wf9 代码片段 / wf11 OpenAPI 目录 / wf12 信封图解 / gm 国密
  var PREFIXES = ['wf14', 'wf10', 'wf9', 'wf11', 'wf12', 'gm'];

  var current = DEFAULT_LANG;

  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  /* 全局双语字典（平铺 key：'<前缀>.<名>'）。
   * ---- 占位区：以下前缀的 key 由集成者在收口阶段从各 WF 产物收集后填充 ----
   *   wf10.*  规范可视化  ｜ wf9.*  代码片段  ｜ wf11.* OpenAPI 目录
   *   wf12.*  信封图解    ｜ gm.*   国密
   * ------------------------------------------------------------------- */
  var DICT = {
    zh: {
      // ---- wf14.*（本模块自身文案）----
      'wf14.lang.zh': '中文',
      'wf14.lang.en': 'English'
    },
    en: {
      'wf14.lang.zh': '中文',
      'wf14.lang.en': 'English'
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
