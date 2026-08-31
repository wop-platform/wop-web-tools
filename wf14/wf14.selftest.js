/* WF14 自测断言集 — 每条断言带 // spec:WF14-* 标签（grep 索引，见 wf14/README.md 断言矩阵）
 * 浏览器：集成者接入 runSelftest → WF_REGISTRY['wf14'].selftest()
 * Node 单测：cat wf14/wf14.js wf14/wf14.selftest.js <runner> | node（Node>=12）
 * 断言零网络零存储（S1/S2）。环境：浏览器真 DOM；Node 用迷你 DOM 桩（仅实现本模块用到的接口）。
 */
(function (root) {
  'use strict';

  function hasOwn(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  /* ---- Node 迷你 DOM 桩（仅覆盖 wf14.js 用到的接口）---- */
  function stubEnv() {
    function El(tag) {
      this.tagName = tag; this._attrs = {}; this._cls = []; this._handlers = {};
      this.textContent = ''; this.parentNode = null; this.children = [];
    }
    El.prototype.getAttribute = function (k) { return hasOwn(this._attrs, k) ? this._attrs[k] : null; };
    El.prototype.setAttribute = function (k, v) { this._attrs[k] = String(v); };
    El.prototype.addEventListener = function (t, fn) { (this._handlers[t] = this._handlers[t] || []).push(fn); };
    El.prototype.removeEventListener = function (t, fn) {
      var hs = this._handlers[t] || [], i = hs.indexOf(fn);
      if (i !== -1) hs.splice(i, 1);
    };
    El.prototype.fire = function (t) {
      var hs = (this._handlers[t] || []).slice();
      for (var i = 0; i < hs.length; i++) hs[i]({ type: t, currentTarget: this });
    };
    El.prototype.appendChild = function (c) { c.parentNode = this; this.children.push(c); return c; };
    El.prototype.removeChild = function (c) {
      var i = this.children.indexOf(c);
      if (i !== -1) this.children.splice(i, 1);
      c.parentNode = null; return c;
    };
    Object.defineProperty(El.prototype, 'classList', {
      get: function () {
        var self = this;
        return {
          add: function (c) { if (self._cls.indexOf(c) === -1) self._cls.push(c); },
          remove: function (c) { var i = self._cls.indexOf(c); if (i !== -1) self._cls.splice(i, 1); },
          contains: function (c) { return self._cls.indexOf(c) !== -1; }
        };
      }
    });
    function StubDoc() { this._all = []; this._byId = {}; this._handlers = {}; }
    StubDoc.prototype.createElement = function (tag) { var el = new El(tag); this._all.push(el); return el; };
    StubDoc.prototype.getElementById = function (id) { return hasOwn(this._byId, id) ? this._byId[id] : null; };
    StubDoc.prototype.querySelectorAll = function (sel) {
      if (sel !== '[data-i18n]') throw new Error('DOM 桩仅支持 [data-i18n] 选择器：' + sel);
      var out = [];
      for (var i = 0; i < this._all.length; i++) {
        if (this._all[i].getAttribute('data-i18n') !== null) out.push(this._all[i]);
      }
      return out;
    };
    StubDoc.prototype.addEventListener = function (t, fn) { (this._handlers[t] = this._handlers[t] || []).push(fn); };
    StubDoc.prototype.removeEventListener = function (t, fn) {
      var hs = this._handlers[t] || [], i = hs.indexOf(fn);
      if (i !== -1) hs.splice(i, 1);
    };
    StubDoc.prototype.dispatchEvent = function (ev) {
      var hs = (this._handlers[ev.type] || []).slice();
      for (var i = 0; i < hs.length; i++) hs[i](ev);
      return true;
    };
    return { real: false, doc: new StubDoc() };
  }

  var ENV = (typeof document !== 'undefined' && document && typeof document.querySelectorAll === 'function')
    ? { real: true }
    : stubEnv();
  if (!ENV.real) root.document = ENV.doc; // 让 wf14.js 的 DOM 路径在 Node 下可测

  var WF14 = root.WF14;
  var REG = root.WF_REGISTRY && root.WF_REGISTRY['wf14'];

  function run() {
    if (!WF14 || !REG) {
      return [{ name: '依赖缺失：需先加载 wf14.js', pass: false, detail: 'WF14/WF_REGISTRY 未定义' }];
    }
    var R = [];
    function A(name, pass, detail) { R.push({ name: name, pass: !!pass, detail: pass ? '' : String(detail || '') }); }
    var doc = ENV.real ? document : ENV.doc;
    var saved = WF14.getLang();

    function mkEl(key, text) {
      var el = doc.createElement('span');
      el.setAttribute('data-i18n', key);
      el.textContent = text;
      if (ENV.real) (doc.body || doc.documentElement).appendChild(el);
      return el;
    }
    function rmEl(el) {
      if (ENV.real) { if (el.parentNode) el.parentNode.removeChild(el); }
      else { var i = ENV.doc._all.indexOf(el); if (i !== -1) ENV.doc._all.splice(i, 1); }
    }
    function click(el) { if (ENV.real) el.click(); else el.fire('click'); }

    /* 1 // spec:WF14-T-HIT — t() 命中已注册 key（zh/en 两语言取值正确） */
    (function () {
      WF14.setLang('zh');
      var a = WF14.t('wf14.lang.zh') === '中文';
      WF14.setLang('en');
      var b = WF14.t('wf14.lang.en') === 'English';
      A('t() 命中已注册 key（zh/en）', a && b, 'zh=' + a + ' en=' + b);
    })();

    /* 2 // spec:WF14-CASCADE — en 未翻译 key 级联回 zh 文案（而非 fallback） */
    (function () {
      WF14.register({ zh: { 'wf14.__zhonly': '仅中文值' } });
      WF14.setLang('en');
      var v = WF14.t('wf14.__zhonly', '兜底文案');
      A('en 缺失时级联回 zh 文案', v === '仅中文值', '实际=' + v);
    })();

    /* 3 // spec:WF14-T-FALLBACK — 未注册 key 回退 fallback；fallback 缺省回显 key */
    (function () {
      var a = WF14.t('wf14.__missing', '备用文案') === '备用文案';
      var b = WF14.t('wf14.__missing') === 'wf14.__missing';
      A('未注册 key 回退 fallback/回显 key', a && b, 'fallback=' + a + ' 回显=' + b);
    })();

    /* 4 // spec:WF14-NEG — 否定式：空 key/空 fallback/非法 register 入参均不崩溃 */
    (function () {
      var ok = true, why = '';
      try {
        if (WF14.t('', 'x') !== 'x') { ok = false; why = '空 key'; }
        if (WF14.t(null, 'n') !== 'n') { ok = false; why = 'null key'; }
        if (WF14.t('wf14.__missing', '') !== '') { ok = false; why = '空 fallback'; }
        if (WF14.register(null) !== false) { ok = false; why = 'register(null)'; }
        if (WF14.register('str') !== false) { ok = false; why = 'register(str)'; }
      } catch (e) { ok = false; why = '抛异常:' + e.message; }
      A('空 key/空 fallback/非法入参不崩溃', ok, why);
    })();

    /* 5 // spec:WF14-SETLANG-DOM — setLang 后 [data-i18n] 元素文本切换，切回 zh 恢复 */
    (function () {
      var el = mkEl('wf14.__dom', '中文原文');
      WF14.register({ zh: { 'wf14.__dom': '中文原文' }, en: { 'wf14.__dom': 'english text' } });
      WF14.setLang('en');
      var a = el.textContent === 'english text';
      WF14.setLang('zh');
      var b = el.textContent === '中文原文';
      rmEl(el);
      A('setLang 后 DOM 文本切换/恢复', a && b, 'en→' + el.textContent);
    })();

    /* 6 // spec:WF14-DOM-SKIP — 否定式：未注册 key 的元素文案不被清空（框架先行不破坏他人片段） */
    (function () {
      var el = mkEl('wf10.__ghost', '他人未收口文案');
      WF14.setLang('en');
      var v = el.textContent;
      WF14.setLang('zh');
      rmEl(el);
      A('未注册 key 元素不被清空', v === '他人未收口文案', '实际=' + v);
    })();

    /* 7 // spec:WF14-REGISTER-MERGE — register 合并：同 key 后注册覆盖先注册 */
    (function () {
      WF14.register({ zh: { 'wf14.__m': '第一次' }, en: { 'wf14.__m': 'first' } });
      var a = WF14.t('wf14.__m') === '第一次';
      WF14.register({ zh: { 'wf14.__m': '第二次' }, en: { 'wf14.__m': 'second' } });
      var b = WF14.t('wf14.__m') === '第二次';
      WF14.setLang('en');
      var c = WF14.t('wf14.__m') === 'second';
      A('register 同 key 后者覆盖', a && b && c, [a, b, c].join(','));
    })();

    /* 8 // spec:WF14-REGISTER-NEG — 否定式：未知语言段（拼写错误的 lang）被忽略，不入字典 */
    (function () {
      var before = WF14.collectKeys().indexOf('wf14.__fr') !== -1;
      var ret = WF14.register({ fr: { 'wf14.__fr': 'x' } });
      var after = WF14.collectKeys().indexOf('wf14.__fr') !== -1;
      A('未知语言段被忽略', ret === false && !before && !after, 'ret=' + ret + ' inDict=' + after);
    })();

    /* 9 // spec:WF14-EVENT — setLang 派发 wop:langchange，detail.lang 正确 */
    (function () {
      var got = null;
      function onLang(ev) { got = ev; }
      doc.addEventListener('wop:langchange', onLang);
      WF14.setLang('en');
      var a = !!got && got.type === 'wop:langchange';
      var b = !!got && got.detail && got.detail.lang === 'en';
      doc.removeEventListener('wop:langchange', onLang);
      A('wop:langchange 事件派发', a && b, 'type=' + (got && got.type) + ' lang=' + (got && got.detail && got.detail.lang));
    })();

    /* 10 // spec:WF14-INVALID — 否定式：非法语言参数（大小写敏感）一律回退 zh */
    (function () {
      var ok = true, why = '';
      try {
        WF14.setLang('fr');
        if (WF14.getLang() !== 'zh') { ok = false; why = 'fr'; }
        WF14.setLang(null);
        if (WF14.getLang() !== 'zh') { ok = false; why = 'null'; }
        WF14.setLang(undefined);
        if (WF14.getLang() !== 'zh') { ok = false; why = 'undefined'; }
        WF14.setLang('EN');
        if (WF14.getLang() !== 'zh') { ok = false; why = 'EN'; }
      } catch (e) { ok = false; why = '抛异常:' + e.message; }
      A('非法语言参数回退 zh', ok, why);
    })();

    /* 11 // spec:WF14-COLLECT — collectKeys 返回全部已注册 key（含运行时 register 新增，排序去重） */
    (function () {
      var ks = WF14.collectKeys();
      var hasSeed = ks.indexOf('wf14.lang.zh') !== -1 && ks.indexOf('wf14.lang.en') !== -1;
      var hasTmp = ks.indexOf('wf14.__m') !== -1 && ks.indexOf('wf14.__zhonly') !== -1;
      var sorted = true, dup = false;
      for (var i = 1; i < ks.length; i++) {
        if (!(ks[i - 1] < ks[i])) { sorted = false; if (ks[i - 1] === ks[i]) dup = true; }
      }
      A('collectKeys 全量/排序/去重', hasSeed && hasTmp && sorted && !dup,
        'seed=' + hasSeed + ' tmp=' + hasTmp + ' sorted=' + sorted + ' dup=' + dup + ' n=' + ks.length);
    })();

    /* 12 // spec:WF14-KEY-CONSISTENCY — 自断言：片段 data-i18n key 带 wf14. 前缀、在字典中、
     *     且元素内联默认文案 === zh 字典值（任务书「key 与字典必须一致」条款） */
    (function () {
      WF14.setLang('zh');
      var re = /data-i18n="([^"]+)"[^>]*>([^<]*)</g, m, n = 0, ok = true, why = '';
      while ((m = re.exec(REG.html)) !== null) {
        n++;
        var key = m[1], inline = m[2].trim();
        if (key.indexOf('wf14.') !== 0) { ok = false; why = '前缀非法:' + key; continue; }
        var zhv = WF14.t(key, '\u0000'); // key 已注册时 fallback 不参与
        if (zhv !== inline) { ok = false; why = 'zh 字典与内联不一致:' + key + ' "' + zhv + '"≠"' + inline + '"'; }
      }
      A('片段 key 前缀/字典/内联文案一致', ok && n > 0, why || ('检查 ' + n + ' 个 key'));
    })();

    /* 13 // spec:WF14-INIT-WIRING — init 接线：按钮点击切换语言且激活态（class/aria）同步 */
    (function () {
      var host = null, ok = true, why = '';
      try {
        if (ENV.real) {
          host = document.createElement('div');
          host.innerHTML = REG.html;
          (document.body || document.documentElement).appendChild(host);
        } else {
          var z = ENV.doc.createElement('button'); z.setAttribute('id', 'wf14-btn-zh'); z.setAttribute('data-wf14-lang', 'zh');
          var e = ENV.doc.createElement('button'); e.setAttribute('id', 'wf14-btn-en'); e.setAttribute('data-wf14-lang', 'en');
          ENV.doc._byId['wf14-btn-zh'] = z; ENV.doc._byId['wf14-btn-en'] = e;
        }
        REG.init();
        var btnZh = doc.getElementById('wf14-btn-zh');
        var btnEn = doc.getElementById('wf14-btn-en');
        click(btnEn);
        var a = WF14.getLang() === 'en';
        var b = btnEn.classList.contains('wf14-active') && !btnZh.classList.contains('wf14-active')
          && btnEn.getAttribute('aria-pressed') === 'true';
        click(btnZh);
        var c = WF14.getLang() === 'zh' && btnZh.classList.contains('wf14-active');
        if (!(a && b && c)) { ok = false; why = [a, b, c].join(','); }
      } catch (err) { ok = false; why = '抛异常:' + err.message; }
      if (ENV.real && host && host.parentNode) host.parentNode.removeChild(host);
      A('init 按钮接线/激活态同步', ok, why);
    })();

    WF14.setLang(saved); // 还原语言状态（自测不改变页面现场）
    return R;
  }

  root.WF14_RUN_SELFTEST = run;
})(typeof window !== 'undefined' ? window : globalThis);
