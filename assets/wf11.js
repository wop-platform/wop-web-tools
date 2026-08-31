/* ===== wf11/wf11.js ===== */
/**
 * WF11 — API 目录（OpenAPI 3.1 契约渲染 + 表单模板化请求）。
 *
 * 只写本目录；共享全局只读调用（$ 等）；动态文案走 WF14.t 回退中文。
 * 纯逻辑（模型构建/校验/收集/填充计算）与 DOM 渲染分离：
 *   - window.WF11_CORE.* 为纯函数（node stub 环境可直测，selftest 消费）
 *   - init() 才做 DOM 挂载与事件委托（集成者调用）
 */
(function () {
  'use strict';

  /** i18n：WF14 收口前回退中文 fallback（契约 i18n 约定） */
  function t(key, fallback) {
    try {
      return (typeof window !== 'undefined' && window.WF14 && typeof window.WF14.t === 'function')
        ? window.WF14.t(key, fallback) : fallback;
    } catch (e) { return fallback; }
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getContract() {
    return (typeof window !== 'undefined' && window.WF11_CONTRACT) || null;
  }

  /** 拍平契约 → [{ key, method, path, op, tag }]（渲染与断言的单一来源） */
  function ops(contract) {
    var c = contract || getContract();
    var out = [];
    if (!c || !c.paths) return out;
    Object.keys(c.paths).forEach(function (path) {
      var item = c.paths[path];
      Object.keys(item).forEach(function (method) {
        var op = item[method];
        if (!op || typeof op !== 'object') return;
        var tag = (op.tags && op.tags[0]) || '';
        out.push({ key: method + ' ' + path, method: method, path: path, op: op, tag: tag });
      });
    });
    return out;
  }

  /** schema 类型显示名：array<string> / object / string … */
  function typeName(schema) {
    if (!schema) return 'string';
    if (schema.type === 'array') return 'array<' + typeName(schema.items) + '>';
    return schema.type || 'string';
  }

  /** 请求体 schema 拍平成参数表行：[{name, in, type, required, description}]（嵌套用点路径） */
  function paramRows(op) {
    var rows = [];
    (op.parameters || []).forEach(function (p) {
      rows.push({
        name: p.name, in: p.in, type: typeName(p.schema),
        required: !!p.required, description: p.description || ''
      });
    });
    var schema = op.requestBody && op.requestBody.content
      && op.requestBody.content['application/json']
      && op.requestBody.content['application/json'].schema;
    if (schema && schema.type === 'object') {
      var required = schema.required || [];
      var walk = function (props, prefix) {
        Object.keys(props || {}).forEach(function (name) {
          var s = props[name];
          var full = prefix ? prefix + '.' + name : name;
          rows.push({
            name: full, in: 'body', type: typeName(s),
            required: required.indexOf(name) >= 0,
            description: s.description || ''
          });
          if (s.type === 'object') walk(s.properties, full);
        });
      };
      walk(schema.properties, '');
    }
    return rows;
  }

  /** 请求体 schema → 表单字段描述符树（纯函数） */
  /** 请求体 schema → 表单字段描述符树（纯函数；对象 required 只作用于对象本身，不传播给子字段） */
  function buildFormModel(schema, basePath) {
    var model = [];
    if (!schema || schema.type !== 'object') return model;
    var required = schema.required || [];
    Object.keys(schema.properties || {}).forEach(function (name) {
      var s = schema.properties[name];
      var f = {
        path: basePath ? basePath + '.' + name : name,
        name: name,
        type: s.type || 'string',
        itemsType: s.items ? (s.items.type || 'string') : null,
        required: required.indexOf(name) >= 0,
        description: s.description || '',
        example: (s.example !== undefined) ? String(s.example) : '',
        enumValues: s.enum || null,
        minItems: s.minItems || 0,
        maxItems: s.maxItems || 0,
        children: []
      };
      if (s.type === 'object') f.children = buildFormModel(s, f.path);
      model.push(f);
    });
    return model;
  }

  /** 顶层入口：operation → 字段树 */
  function formModelFor(op) {
    var schema = op.requestBody && op.requestBody.content
      && op.requestBody.content['application/json']
      && op.requestBody.content['application/json'].schema;
    return buildFormModel(schema, '');
  }

  /** 字段树 → 表单 HTML（boolean 用 select，其余 text；数组逗号分隔） */
  function renderFormHtml(model) {
    if (!model.length) return '';
    var html = [];
    model.forEach(function (f) {
      html.push('<div class="wf11-field">');
      html.push('<label class="wf11-label"><code>' + esc(f.path) + '</code>');
      html.push(f.required ? ' <b class="wf11-req">*</b>' : '');
      html.push(' <span class="wf11-ftype">' + esc(f.type) + '</span></label>');
      if (f.type === 'boolean') {
        html.push('<select data-wf11-path="' + esc(f.path) + '">');
        html.push('<option value="">' + t('wf11.form.unset', '（不填）') + '</option>');
        html.push('<option value="true">true</option><option value="false">false</option>');
        html.push('</select>');
      } else if (f.enumValues) {
        html.push('<select data-wf11-path="' + esc(f.path) + '">');
        html.push('<option value="">' + t('wf11.form.unset', '（不填）') + '</option>');
        f.enumValues.forEach(function (v) {
          html.push('<option value="' + esc(v) + '">' + esc(v) + '</option>');
        });
        html.push('</select>');
      } else {
        html.push('<input type="text" data-wf11-path="' + esc(f.path) + '" value="' + esc(f.example) + '">');
      }
      if (f.description) html.push('<p class="wf11-fdesc">' + esc(f.description) + '</p>');
      html.push('</div>');
      if (f.type === 'object' && f.children.length) {
        html.push('<div class="wf11-nested">');
        html.push(renderFormHtml(f.children));
        html.push('</div>');
      }
    });
    return html.join('');
  }

  /** 单字段原始字符串 → 类型化值；{ok, value, error} */
  function coerceValue(field, raw) {
    var v = String(raw === undefined || raw === null ? '' : raw).trim();
    if (v === '') return { ok: true, empty: true };
    if (field.type === 'integer') {
      if (!/^-?\d+$/.test(v)) return { ok: false, error: t('wf11.err.integer', '须为整数') };
      var n = parseInt(v, 10);
      return { ok: true, value: n };
    }
    if (field.type === 'number') {
      var f = Number(v);
      if (!isFinite(f)) return { ok: false, error: t('wf11.err.number', '须为数字') };
      return { ok: true, value: f };
    }
    if (field.type === 'boolean') {
      if (v !== 'true' && v !== 'false') return { ok: false, error: t('wf11.err.boolean', '须为 true/false') };
      return { ok: true, value: v === 'true' };
    }
    if (field.type === 'array') {
      var parts = v.split(/[,，]/).map(function (s) { return s.trim(); }).filter(function (s) { return s !== ''; });
      if (field.minItems && parts.length < field.minItems) {
        return { ok: false, error: t('wf11.err.minItems', '至少') + field.minItems + t('wf11.err.items', '项') };
      }
      if (field.maxItems && parts.length > field.maxItems) {
        return { ok: false, error: t('wf11.err.maxItems', '至多') + field.maxItems + t('wf11.err.items', '项') };
      }
      if (field.itemsType === 'integer') {
        for (var i = 0; i < parts.length; i++) {
          if (!/^-?\d+$/.test(parts[i])) {
            return { ok: false, error: t('wf11.err.arrayInt', '数组每项须为整数：') + parts[i] };
          }
          parts[i] = parseInt(parts[i], 10);
        }
      }
      return { ok: true, value: parts };
    }
    if (field.enumValues && field.enumValues.indexOf(v) < 0) {
      return { ok: false, error: t('wf11.err.enum', '取值须为：') + field.enumValues.join(' / ') };
    }
    return { ok: true, value: v };
  }

  /** 字段树 + 原始值表 → {ok, values, errors:[{path,msg}]}；必填与类型校验合一 */
  function collectValues(model, rawValues, prefix) {
    var values = {}, errors = [];
    model.forEach(function (f) {
      if (f.type === 'object') {
        var sub = collectValues(f.children, rawValues, f.path);
        var hasAny = Object.keys(sub.values).length > 0;
        if (hasAny) {
          values[f.name] = sub.values;
        } else if (f.required && sub.errors.length === 0) {
          errors.push({ path: f.path, msg: t('wf11.err.required', '必填字段缺失') });
        }
        sub.errors.forEach(function (e) { errors.push({ path: e.path, msg: e.msg }); });
        return;
      }
      var raw = rawValues[f.path];
      var r = coerceValue(f, raw);
      if (!r.ok) {
        errors.push({ path: f.path, msg: r.error });
        return;
      }
      if (r.empty) {
        if (f.required) errors.push({ path: f.path, msg: t('wf11.err.required', '必填字段缺失') });
        return;
      }
      values[f.name] = r.value;
    });
    return { ok: errors.length === 0, values: values, errors: errors };
  }

  /** 原始值表 → JSON body 字符串；校验失败返回 {ok:false, errors} */
  function bodyFromRaw(model, rawValues) {
    var r = collectValues(model, rawValues, '');
    if (!r.ok) return { ok: false, errors: r.errors, json: '' };
    return { ok: true, errors: [], json: JSON.stringify(r.values, null, 2), values: r.values };
  }

  /**
   * 填充「请求构造」Tab（只赋值现有输入框 id，不触碰其行为）。
   * getEl 可注入（selftest stub / 集成后默认 document.getElementById）。
   * 网关统一 POST（GatewayServlet 实证），现有请求区无 method 输入框 → method 仅随结果返回并在 UI 展示。
   */
  function fillRequest(opEntry, bodyJson, getEl) {
    var resolve = getEl || function (id) {
      return (typeof document !== 'undefined' && document.getElementById) ? document.getElementById(id) : null;
    };
    var op = opEntry.op;
    var fullPath = '/gateway' + opEntry.path;
    var targets = [
      { id: 'r-path', value: fullPath },
      { id: 'r-body', value: bodyJson }
    ];
    if (op['x-wop-level'] === 'L0' || op['x-wop-level'] === 'L2') {
      targets.push({ id: 'r-level', value: op['x-wop-level'] });
    }
    var filled = [], missing = [];
    targets.forEach(function (tg) {
      var el = resolve(tg.id);
      if (el && typeof el === 'object') { el.value = tg.value; filled.push(tg.id); }
      else missing.push(tg.id);
    });
    var coreOk = filled.indexOf('r-path') >= 0 && filled.indexOf('r-body') >= 0;
    return {
      ok: coreOk,
      method: String(opEntry.method).toUpperCase(),
      path: fullPath,
      filled: filled,
      missing: missing
    };
  }

  /** 目录 HTML：按 tag 分组渲染接口列表 */
  function catalogHtml(contract) {
    var c = contract || getContract();
    if (!c) return '';
    var all = ops(c);
    var html = [];
    var groups = [];
    (c.tags || []).forEach(function (tg) { groups.push(tg.name); });
    var fallbackName = t('wf11.groupOther', '其他');
    all.forEach(function (e) {
      if (groups.indexOf(e.tag) < 0 && groups.indexOf(fallbackName) < 0) groups.push(fallbackName);
    });
    groups.forEach(function (g) {
      var items = all.filter(function (e) {
        return e.tag === g || (groups.indexOf(e.tag) < 0 && g === fallbackName);
      });
      if (!items.length) return;
      html.push('<div class="wf11-group"><h3>' + esc(g) + '</h3>');
      items.forEach(function (e) {
        html.push('<div class="wf11-op-row" data-wf11-op="' + esc(e.key) + '" role="button" tabindex="0">');
        html.push('<span class="wf11-badge wf11-m-' + esc(e.method) + '">' + esc(e.method.toUpperCase()) + '</span>');
        html.push('<span class="wf11-op-name">' + esc(e.op.summary || e.op.operationId) + '</span>');
        html.push('<code class="wf11-op-path">' + esc(e.path) + '</code>');
        if (e.op['x-wop-direction'] === 'platform-to-merchant') {
          html.push('<span class="wf11-badge wf11-cb">' + t('wf11.direction.callback', '回调') + '</span>');
        }
        html.push('</div>');
      });
      html.push('</div>');
    });
    return html.join('');
  }

  /** 接口详情 HTML：摘要 + 协议头表 + 参数表 + 响应码表 + 模板化表单 */
  function detailHtml(opEntry) {
    var op = opEntry.op;
    var html = [];
    html.push('<div class="wf11-op-head">');
    html.push('<span class="wf11-badge wf11-m-' + esc(opEntry.method) + '">' + esc(opEntry.method.toUpperCase()) + '</span>');
    html.push('<code class="wf11-op-path">' + esc('/gateway' + opEntry.path) + '</code>');
    html.push('<span class="wf11-badge wf11-dir">' + esc(op['x-wop-direction'] === 'platform-to-merchant'
      ? t('wf11.direction.ptm', '平台 → 商户') : t('wf11.direction.mtp', '商户 → 平台')) + '</span>');
    html.push('</div>');
    html.push('<h2 class="wf11-op-title">' + esc(op.summary || '') + ' <small>' + esc(op.operationId) + '</small></h2>');
    if (op.description) html.push('<p class="wf11-op-desc">' + esc(op.description) + '</p>');

    html.push('<h3>' + t('wf11.sec.headers', 'WOP 协议头') + '</h3>');
    html.push('<table class="wf11-table"><tr><th>' + t('wf11.col.header', 'Header') + '</th><th>'
      + t('wf11.col.required', '必传') + '</th><th>' + t('wf11.col.when', '条件') + '</th></tr>');
    (op['x-wop-headers'] || []).forEach(function (h) {
      html.push('<tr><td><code>' + esc(h.name) + '</code></td><td>'
        + (h.required ? t('wf11.yes', '是') : t('wf11.no', '否')) + '</td><td>' + esc(h.when) + '</td></tr>');
    });
    html.push('</table>');

    var rows = paramRows(op);
    if (rows.length) {
      html.push('<h3>' + t('wf11.sec.params', '参数表') + '</h3>');
      html.push('<table class="wf11-table"><tr><th>' + t('wf11.col.name', '名称') + '</th><th>'
        + t('wf11.col.in', '位置') + '</th><th>' + t('wf11.col.type', '类型') + '</th><th>'
        + t('wf11.col.required', '必填') + '</th><th>' + t('wf11.col.desc', '说明') + '</th></tr>');
      rows.forEach(function (r) {
        html.push('<tr><td><code>' + esc(r.name) + '</code></td><td>' + esc(r.in) + '</td><td>'
          + esc(r.type) + '</td><td>' + (r.required ? t('wf11.yes', '是') : t('wf11.no', '否'))
          + '</td><td>' + esc(r.description) + '</td></tr>');
      });
      html.push('</table>');
    }

    html.push('<h3>' + t('wf11.sec.responses', '响应码') + '</h3>');
    html.push('<table class="wf11-table"><tr><th>' + t('wf11.col.code', '状态码') + '</th><th>'
      + t('wf11.col.desc', '说明') + '</th></tr>');
    Object.keys(op.responses || {}).forEach(function (code) {
      html.push('<tr><td><code>' + esc(code) + '</code></td><td>' + esc(op.responses[code].description) + '</td></tr>');
    });
    html.push('</table>');

    var model = formModelFor(op);
    if (model.length) {
      html.push('<h3>' + t('wf11.sec.form', '请求体表单（模板化生成）') + '</h3>');
      html.push('<div class="wf11-form">' + renderFormHtml(model) + '</div>');
      html.push('<div class="wf11-actions">');
      html.push('<button type="button" class="wf11-btn" id="wf11-gen-btn">' + t('wf11.gen', '生成 body JSON') + '</button>');
      html.push('<button type="button" class="wf11-btn wf11-btn-fill" id="wf11-fill-btn">' + t('wf11.fill', '填充请求区') + '</button>');
      html.push('</div>');
      html.push('<pre class="wf11-out" id="wf11-body-out" hidden></pre>');
      html.push('<div class="wf11-errors" id="wf11-err-out" hidden></div>');
      html.push('<p class="wf11-help">' + t('wf11.fill.help',
        '「填充请求区」把路径/body/加密级别写入「请求构造」Tab 对应输入框（r-path / r-body / r-level）；网关统一 POST，方法在结果中展示。') + '</p>');
    }
    return html.join('');
  }

  /** 供 selftest / 集成者使用的纯逻辑入口 */
  window.WF11_CORE = {
    t: t, esc: esc, ops: ops, paramRows: paramRows,
    buildFormModel: buildFormModel, formModelFor: formModelFor,
    renderFormHtml: renderFormHtml, coerceValue: coerceValue,
    collectValues: collectValues, bodyFromRaw: bodyFromRaw,
    fillRequest: fillRequest, catalogHtml: catalogHtml, detailHtml: detailHtml,
    getContract: getContract
  };

  /** 选中接口的运行时状态（事件处理用） */
  var selected = null;

  function readRawValues(root) {
    var raw = {};
    var els = root.querySelectorAll('[data-wf11-path]');
    for (var i = 0; i < els.length; i++) raw[els[i].getAttribute('data-wf11-path')] = els[i].value;
    return raw;
  }

  function selectOp(key) {
    var all = ops();
    for (var i = 0; i < all.length; i++) {
      if (all[i].key === key) { selected = all[i]; break; }
    }
    if (!selected) return;
    var detail = document.getElementById('wf11-detail');
    if (detail) detail.innerHTML = detailHtml(selected);
    var rows = document.querySelectorAll('#wf11-catalog .wf11-op-row');
    for (var j = 0; j < rows.length; j++) {
      rows[j].className = 'wf11-op-row' + (rows[j].getAttribute('data-wf11-op') === key ? ' wf11-active' : '');
    }
  }

  function onGen() {
    if (!selected) return;
    var out = document.getElementById('wf11-body-out');
    var err = document.getElementById('wf11-err-out');
    var root = document.getElementById('wf11-root');
    var model = formModelFor(selected.op);
    var r = bodyFromRaw(model, readRawValues(root));
    if (!out || !err) return;
    if (r.ok) {
      out.textContent = r.json;
      out.hidden = false;
      err.hidden = true;
      out.setAttribute('data-wf11-json', 'ready');
    } else {
      err.innerHTML = r.errors.map(function (e) {
        return '<div class="wf11-err-line">' + t('wf11.errLine', '字段') + ' <code>' + esc(e.path) + '</code>：' + esc(e.msg) + '</div>';
      }).join('');
      err.hidden = false;
      out.hidden = true;
      out.removeAttribute('data-wf11-json');
    }
  }

  function onFill() {
    if (!selected) return;
    var out = document.getElementById('wf11-body-out');
    var err = document.getElementById('wf11-err-out');
    var json = out && out.getAttribute('data-wf11-json') === 'ready' ? out.textContent : '';
    if (!json) {
      if (err) {
        err.innerHTML = '<div class="wf11-err-line">' + t('wf11.fill.needGen', '请先生成 body JSON（且校验通过）再填充') + '</div>';
        err.hidden = false;
      }
      return;
    }
    var r = fillRequest(selected, json);
    var msg = r.ok
      ? t('wf11.fill.ok', '已填充请求区：') + r.filled.join(', ') + '（' + r.method + ' ' + r.path + '）'
      : t('wf11.fill.miss', '未找到请求区输入框（独立预览模式）：') + r.missing.join(', ');
    if (err) { err.innerHTML = '<div class="wf11-ok-line">' + esc(msg) + '</div>'; err.hidden = false; }
  }

  /** 集成者调用：渲染目录、选中首个接口、绑定事件委托 */
  function init() {
    var root = document.getElementById('wf11-root');
    var catalog = document.getElementById('wf11-catalog');
    if (!root || !catalog) return;
    var contract = getContract();
    var banner = document.getElementById('wf11-banner');
    if (banner && contract && contract.isExample) banner.hidden = false;
    catalog.innerHTML = catalogHtml();
    if (catalog.addEventListener) {
      catalog.addEventListener('click', function (ev) {
        var el = ev.target;
        while (el && el !== catalog && !el.getAttribute('data-wf11-op')) el = el.parentNode;
        if (el && el.getAttribute && el.getAttribute('data-wf11-op')) {
          selectOp(el.getAttribute('data-wf11-op'));
        }
      });
      root.addEventListener('click', function (ev) {
        if (ev.target && ev.target.id === 'wf11-gen-btn') onGen();
        if (ev.target && ev.target.id === 'wf11-fill-btn') onFill();
      });
    }
    var all = ops();
    if (all.length) selectOp(all[0].key);
  }

  window.WF_REGISTRY = window.WF_REGISTRY || {};
  window.WF_REGISTRY['wf11'] = {
    id: 'wf11',
    title: 'API 目录',
    css: '',
    html: '',
    init: init,
    selftest: function () {
      return (window.WF11_SELFTEST && window.WF11_SELFTEST.run()) || [];
    }
  };
})();

