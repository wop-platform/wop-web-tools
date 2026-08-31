/* ===== wf10/wf10.js ===== */
/* WF10 — canonicalRequest 逐段解析（实现 + 注册）
 * 只读依赖现有全局：$/buildCanonical/canonicalHeaders/sha256Hex（存在则用，缺失则降级本地等价实现，不改其行为）。
 * 纯逻辑放 window.WF10（无 DOM），DOM 逻辑仅活在 init；selftest 见 wf10.selftest.js。 */
(function () {
  'use strict';

  /* ============================== 纯逻辑核心（无 DOM） ============================== */

  // 空输入串的 SHA-256 摘要（SHA-256('') 的确定值，用于空 body 摘要行的正确性断言与展示）
  var EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  // 各段类型元数据：类型徽标 / 来源标注 / 组串规则（来源标注即任务要求的「来源」徽标文案）
  var SEG_META = {
    auth: { typeLabel: 'AuthString', srcLabel: 'expiredSeconds 字段（版本前缀 v1 固定）',
            rule: '"v1/" + expiredSeconds 秒数，控制签名有效期窗口' },
    method: { typeLabel: 'HTTPMethod', srcLabel: '请求方法（本工具网关请求固定 POST）',
            rule: '方法名大写后原样放入' },
    uri: { typeLabel: 'CanonicalURI', srcLabel: '请求路径 字段',
            rule: '路径原样放入：组串不做二次编码，路径本身需已符合 URL 编码规范' },
    qs: { typeLabel: 'CanonicalQueryString', srcLabel: '查询参数（POST 查询串为空 → 空行）',
            rule: '键值按名 ASCII 升序 + Java URLEncoder 编码；本协议网关请求固定 POST，查询串为空串（保留空行）' },
    header: { typeLabel: 'CanonicalHeaders', srcLabel: '',
            rule: '头名 trim + 小写，值 trimall 压缩空白，两侧按 Java URLEncoder 编码，整块按头名 ASCII 升序排列' }
  };

  // 头行 → 来源字段映射（x-wop-* 协议头）。field 为对应输入框 id（无输入框则 null）。
  var HEADER_SRC = {
    'x-wop-appkey':         { srcLabel: 'appKey 字段', field: 'r-appkey' },
    'x-wop-content-digest': { srcLabel: 'body 摘要（HashedPayload 的等价承载：sha-256(线上请求体)）', field: 'r-body' },
    'x-wop-encrypt':        { srcLabel: 'L2 加密信封（构造请求时生成）', field: 'r-level' },
    'x-wop-nonce':          { srcLabel: '随机数（构造请求时生成，无输入字段）', field: null },
    'x-wop-timestamp':      { srcLabel: '毫秒时间戳（构造请求时生成，无输入字段）', field: null }
  };
  var HEADER_SRC_FALLBACK = { srcLabel: '该请求头（构造请求时生成 / 带入）', field: null };

  // 拆分 canonicalRequest：5 段结构 = AuthString / HTTPMethod / CanonicalURI / CanonicalQueryString(可空行) / CanonicalHeaders(多行)。
  // 成功：{ ok:true, segments:[{idx,type,text,name?}], lineCount }
  // 失败：{ ok:false, error }（不抛异常）。
  function splitCanonical(text) {
    if (typeof text !== 'string') return { ok: false, error: 'canonical 必须是字符串，收到 ' + typeof text };
    var t = text.replace(/\r\n?/g, '\n');
    if (!t.trim()) return { ok: false, error: 'canonical 为空或全空白' };
    var lines = t.split('\n');
    if (lines.length < 5) {
      return { ok: false, error: '段数不足：canonical 至少 5 段（AuthString/方法/URI/查询串/头块），当前仅 ' + lines.length + ' 行' };
    }
    var segs = [];
    var types = ['auth', 'method', 'uri', 'qs'];
    for (var i = 0; i < 4; i++) segs.push({ idx: i, type: types[i], text: lines[i] });
    for (var j = 4; j < lines.length; j++) {
      var m = /^([^:\s]+):(.*)$/.exec(lines[j]);
      if (!m) {
        return { ok: false, error: '第 ' + (j + 1) + ' 行不是合法头行（缺少冒号或头名含空白）: ' + lines[j].slice(0, 40) };
      }
      segs.push({ idx: j, type: 'header', name: m[1].toLowerCase(), text: lines[j] });
    }
    return { ok: true, segments: segs, lineCount: lines.length };
  }

  // 段 → { typeLabel, srcLabel, rule, field }（field 为来源输入框 id 或 null）
  function segmentMeta(seg) {
    if (!seg || !seg.type) return { typeLabel: '?', srcLabel: '?', rule: '', field: null };
    if (seg.type === 'header') {
      var h = HEADER_SRC[seg.name] || HEADER_SRC_FALLBACK;
      return { typeLabel: SEG_META.header.typeLabel, srcLabel: h.srcLabel, rule: SEG_META.header.rule, field: h.field };
    }
    var meta = SEG_META[seg.type];
    var fieldMap = { auth: 'r-expired', method: null, uri: 'r-path', qs: null };
    return { typeLabel: meta.typeLabel, srcLabel: meta.srcLabel, rule: meta.rule, field: fieldMap[seg.type] || null };
  }

  // 差异检测：手工串逐行 vs 自动生成串。
  // 行状态：same=一致(绿) diff=同位置不同(红) extra=手工串多出(灰) missing=手工串缺失(灰)。
  function diffLines(autoText, manualText) {
    var a = String(autoText == null ? '' : autoText).replace(/\r\n?/g, '\n').split('\n');
    var m = String(manualText == null ? '' : manualText).replace(/\r\n?/g, '\n').split('\n');
    var rows = [], diffCount = 0, extraCount = 0, i;
    for (i = 0; i < Math.max(a.length, m.length); i++) {
      if (i < m.length && i < a.length) {
        if (m[i] === a[i]) rows.push({ idx: i, text: m[i], state: 'same' });
        else { rows.push({ idx: i, text: m[i], autoText: a[i], state: 'diff' }); diffCount++; }
      } else if (i < m.length) {
        rows.push({ idx: i, text: m[i], state: 'extra' }); extraCount++; diffCount++;
      } else {
        rows.push({ idx: i, text: a[i], state: 'missing' }); diffCount++;
      }
    }
    return { rows: rows, diffCount: diffCount, extraCount: extraCount,
             missingCount: a.length > m.length ? a.length - m.length : 0 };
  }

  // body → x-wop-content-digest 头值：'sha-256 ' + hex(body)。空 body 也有确定摘要（EMPTY_SHA256）。
  // hexOfBody 必须以 body 原文（空串归一后）为入参，防止“空 body 跳过摘要/摘要错对象”类回归。
  function digestHeaderValue(bodyText, hexOfBody) {
    var input = bodyText == null ? '' : String(bodyText);
    return 'sha-256 ' + hexOfBody(input);
  }

  /* ============================== 运行时（DOM，仅 init 后触达） ============================== */

  var state = { autoText: null, mode: null, degraded: false };

  function t(key, fallback) {
    try { return (typeof window.WF14 === 'object' && window.WF14 && typeof window.WF14.t === 'function')
      ? window.WF14.t(key, fallback) : fallback; } catch (e) { return fallback; }
  }
  function fieldValue(id) {
    var el = document.getElementById(id);
    return el ? String(el.value == null ? '' : el.value) : '';
  }
  function el(id) { return document.getElementById(id); }
  function setStatus(msg, isError) {
    var s = el('wf10-status');
    if (s) { s.textContent = msg || ''; s.style.color = isError ? '#dc2626' : 'var(--success, #16a34a)'; }
  }
  function setMode(msg) { var m = el('wf10-mode'); if (m) m.textContent = msg || ''; }

  // 本地降级实现（仅当页面全局缺失时；语义镜像 index.html，不改全局）
  function localJavaUrlEncode(s) {
    return encodeURIComponent(s).replace(/[!'()~]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
  }
  function localCanonicalHeaders(map) {
    // 语义镜像全局 canonicalHeaders：逐项规范化键并携带各自值再排序（规范化键回查 map 会丢值）
    var entries = Object.keys(map).map(function (k) { return [String(k).trim().replace(/\s+/g, ' ').toLowerCase(), map[k]]; });
    entries.sort(function (a, b) { return (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0); });
    return entries.map(function (e) {
      return localJavaUrlEncode(e[0]) + ':' + localJavaUrlEncode(String(e[1] == null ? '' : e[1]).trim().replace(/\s+/g, ' '));
    }).join('\n');
  }
  function localBuildCanonical(auth, method, path, qs, ch) {
    return auth + '\n' + String(method).toUpperCase() + '\n' + path + '\n' + (qs || '') + '\n' + ch;
  }

  // 预览模式：尚未构造请求时，按当前字段预估 canonical（nonce/时间戳/加密信封为占位值，摘要按明文 body 估算）。
  function buildPreviewCanonical() {
    var appKey = fieldValue('r-appkey') || '(appKey 为空)';
    var path = fieldValue('r-path') || '/';
    var expired = String(parseInt(fieldValue('r-expired'), 10) || 1800);
    var body = fieldValue('r-body');
    var level = fieldValue('r-level');
    var headers = {
      'x-wop-appkey': appKey,
      'x-wop-content-digest': null,
      'x-wop-nonce': 'PREVIEW_NONCE',
      'x-wop-timestamp': String(Date.now())
    };
    if (level === 'L2') headers['x-wop-encrypt'] = 'L2;dek=PREVIEW';
    var ch = (typeof canonicalHeaders === 'function') ? canonicalHeaders(headers) : localCanonicalHeaders(headers);
    var canonical = (typeof buildCanonical === 'function')
      ? buildCanonical('v1/' + expired, 'POST', path, '', ch)
      : localBuildCanonical('v1/' + expired, 'POST', path, '', ch);
    var p = Promise.resolve(null);
    var hashFn = (typeof sha256Hex === 'function') ? sha256Hex : null;
    if (hashFn) {
      p = p.then(function () { return hashFn(body == null ? '' : body); }).then(function (hex) { return hex; })
            .catch(function () { return null; });
    }
    return p.then(function (hex) {
      var digestLine = 'sha-256 ' + (hex == null ? '(预览：摘要不可用)' : hex);
      headers['x-wop-content-digest'] = digestLine;
      ch = (typeof canonicalHeaders === 'function') ? canonicalHeaders(headers) : localCanonicalHeaders(headers);
      canonical = (typeof buildCanonical === 'function')
        ? buildCanonical('v1/' + expired, 'POST', path, '', ch)
        : localBuildCanonical('v1/' + expired, 'POST', path, '', ch);
      return {
        canonical: canonical,
        note: t('wf10.mode.previewNote',
          '预览模式：尚未构造请求。nonce / 时间戳为占位值；摘要按明文 body 估算（实际 x-wop-content-digest 对线上请求体取摘要，L2 时为密文信封）。构造请求后自动切换为实测解析。')
      };
    });
  }

  // 刷新：优先实测解析 #req-canonical（构造请求后的真值），否则进入预览模式。
  function refresh() {
    var pre = el('req-canonical');
    var text = pre ? String(pre.textContent || '') : '';
    if (text.trim()) {
      state.autoText = text;
      state.mode = 'built';
      renderSegments();
      runDiff();
      return;
    }
    buildPreviewCanonical().then(function (r) {
      state.autoText = r.canonical;
      state.mode = 'preview';
      renderSegments();
      setMode(t('wf10.mode.preview', '模式：预览（按当前字段估算）'));
      setStatus(r.note, false);
      runDiff();
    }).catch(function (e) {
      setStatus(t('wf10.status.error', '刷新失败：') + (e && e.message ? e.message : e), true);
    });
  }

  function hoverTitle(seg, meta) {
    var cur = meta.field ? fieldValue(meta.field) : '';
    var clip = cur.length > 120 ? cur.slice(0, 120) + '…' : cur;
    if (meta.field) {
      return t('wf10.hover.field', '来源：') + meta.srcLabel + '｜#' + meta.field + ' ' +
             t('wf10.hover.curval', '当前值：') + (clip === '' ? '(空)' : clip);
    }
    if (seg.type === 'method') return t('wf10.hover.method', '来源：请求方法｜本工具网关请求固定为 POST');
    if (seg.type === 'qs') return t('wf10.hover.qs', '来源：查询参数｜POST 请求查询串为空串（保留空行）');
    return t('wf10.hover.gen', '来源：') + meta.srcLabel;
  }

  function renderSegments() {
    var box = el('wf10-segments');
    if (!box) return;
    var res = splitCanonical(state.autoText == null ? '' : state.autoText);
    if (!res.ok) {
      box.textContent = t('wf10.split.fail', 'canonical 解析失败：') + res.error;
      box.style.color = '#dc2626';
      return;
    }
    box.style.color = '';
    box.textContent = '';
    if (state.mode === 'built') {
      setMode(t('wf10.mode.built', '模式：已构造请求（实时解析 #req-canonical）'));
    }
    var frag = document.createDocumentFragment();
    res.segments.forEach(function (seg) {
      var meta = segmentMeta(seg);
      var row = document.createElement('div');
      row.className = 'wf10-row';

      var no = document.createElement('span');
      no.className = 'wf10-lineno';
      no.textContent = 'L' + (seg.idx + 1);

      var ty = document.createElement('span');
      ty.className = 'wf10-type wf10-t-' + seg.type;
      ty.textContent = meta.typeLabel;
      ty.title = t('wf10.rule', '组串规则：') + meta.rule;

      var tx = document.createElement('code');
      tx.className = 'wf10-text';
      if (seg.text === '') {
        var em = document.createElement('i');
        em.className = 'wf10-empty-mark';
        em.textContent = t('wf10.emptyline', '(空行：POST 查询串为空)');
        tx.appendChild(em);
      } else if (state.mode === 'preview' && seg.type === 'header' && seg.name === 'x-wop-content-digest') {
        // spec:WF10 —— 预览模式摘要为估算值：渲染层加显著前缀（autoText 真值不动，diff 比对不受影响）
        var warn = document.createElement('b');
        warn.style.color = '#dc2626';
        warn.textContent = t('wf10.digest.preview', '⚠ 非最终值（预览按明文 body 估算）');
        tx.appendChild(warn);
        tx.appendChild(document.createTextNode(' ' + seg.text));
      } else {
        tx.textContent = seg.text;
      }

      var srcBadge = document.createElement('span');
      srcBadge.className = 'wf10-src';
      srcBadge.textContent = meta.srcLabel;
      srcBadge.title = hoverTitle(seg, meta);

      row.appendChild(no); row.appendChild(ty); row.appendChild(tx); row.appendChild(srcBadge);
      frag.appendChild(row);
    });
    box.appendChild(frag);
    if (state.mode === 'built') setStatus(t('wf10.status.builtok', '已解析 N 行').replace('N', String(res.lineCount)), false);
  }

  var STATE_LABEL = { same: '一致', diff: '差异', extra: '多余', missing: '缺失' };

  function runDiff() {
    var out = el('wf10-diff-out');
    var ta = el('wf10-manual');
    if (!out || !ta) return;
    var manual = ta.value;
    if (!manual.trim() || state.autoText == null) {
      out.textContent = manual.trim() ? '' : t('wf10.diff.idle', '粘贴或修改上方文本框内容后，这里逐行给出比对结果。');
      return;
    }
    var d = diffLines(state.autoText, manual);
    out.textContent = '';
    var sum = document.createElement('p');
    sum.className = 'wf10-dsum';
    var nSame = d.rows.filter(function (r) { return r.state === 'same'; }).length;
    sum.textContent = t('wf10.diff.sum', '共 N 行：一致 a、差异 b、多余 c、缺失 d')
      .replace('N', String(d.rows.length)).replace('a', String(nSame))
      .replace('b', String(d.diffCount - d.extraCount - d.missingCount))
      .replace('c', String(d.extraCount)).replace('d', String(d.missingCount));
    out.appendChild(sum);
    d.rows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'wf10-diff-row wf10-d-' + r.state;
      var st = document.createElement('span');
      st.className = 'wf10-dstate';
      st.textContent = t('wf10.diff.' + r.state, STATE_LABEL[r.state]);
      var tx = document.createElement('code');
      tx.className = 'wf10-dtext';
      tx.textContent = r.text === '' ? '(空行)' : r.text;
      row.appendChild(st); row.appendChild(tx);
      if (r.state === 'diff') row.title = t('wf10.diff.autoline', '自动生成该行为：') + (r.autoText === '' ? '(空行)' : r.autoText);
      if (r.state === 'missing') row.title = t('wf10.diff.missline', '自动生成有此行，你的文本缺失：') + r.text;
      out.appendChild(row);
    });
    var verdict = document.createElement('p');
    verdict.className = 'wf10-dsum';
    verdict.textContent = d.diffCount === 0
      ? t('wf10.diff.allok', '✓ 与自动生成的 canonicalRequest 完全一致')
      : t('wf10.diff.bad', '✗ 共 N 处不一致（红=内容差异，灰=行数不一致）').replace('N', String(d.diffCount));
    verdict.style.color = d.diffCount === 0 ? 'var(--success, #16a34a)' : '#dc2626';
    out.appendChild(verdict);
  }

  function copyCanonical() {
    var text = state.autoText;
    if (!text) { setStatus(t('wf10.status.noauto', '尚无 canonical 可复制，请先刷新'), true); return; }
    function done(okFlag) {
      setStatus(okFlag ? t('wf10.status.copied', '已复制 canonicalRequest（N 字符）').replace('N', String(text.length))
                       : t('wf10.status.copyfail', '复制失败：请展开差异检测文本框手动复制'), !okFlag);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else {
      done(fallbackCopy(text));
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.left = '-9999px'; ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    var okFlag = false;
    try { okFlag = document.execCommand('copy'); } catch (e) { okFlag = false; }
    document.body.removeChild(ta);
    return okFlag;
  }

  function init() {
    var root = el('wf10-root');
    if (!root) return;
    root.addEventListener('toggle', function () { if (root.open) refresh(); });
    var rb = el('wf10-refresh'); if (rb) rb.addEventListener('click', refresh);
    var cb = el('wf10-copy'); if (cb) cb.addEventListener('click', copyCanonical);
    var ta = el('wf10-manual'); if (ta) ta.addEventListener('input', runDiff);
    // 构造请求后自动刷新（被动监听，不改现有按钮行为；RSA 异步故延迟多刷几拍）
    document.addEventListener('click', function (e) {
      var tgt = e.target;
      if (tgt && tgt.id === 'build-req') [300, 800, 1500].forEach(function (ms) { setTimeout(refresh, ms); });
    }, false);
    var note = el('wf10-signednote');
    if (note) note.textContent = t('wf10.note',
      '说明：本协议 canonicalRequest 为 5 段结构（AuthString/HTTPMethod/CanonicalURI/CanonicalQueryString/CanonicalHeaders）。任务语境中 SignedHeaders 的等价承载是 x-wop-sign 头值第 3 段（参与签名的头名，ASCII 升序、分号连接，不在 canonical 内）；HashedPayload 的等价承载是 x-wop-content-digest 头（sha-256 + 空格 + 64 位 hex，对线上请求体取摘要）。');
    if (root.open) refresh();
  }

  /* ============================== 导出纯核心 + 注册 ============================== */

  window.WF10 = {
    version: '1.0.0',
    EMPTY_SHA256: EMPTY_SHA256,
    SEG_META: SEG_META,
    HEADER_SRC: HEADER_SRC,
    splitCanonical: splitCanonical,
    segmentMeta: segmentMeta,
    diffLines: diffLines,
    digestHeaderValue: digestHeaderValue,
    refresh: refresh,
    state: state
  };

  window.WF_REGISTRY = window.WF_REGISTRY || {};
  WF_REGISTRY['wf10'] = {
    id: 'wf10',
    title: 'canonicalRequest 逐段解析',
    css: `
/* WF10 — canonicalRequest 逐段解析（仅 wf10-* 命名空间，避免与现有样式冲突） */
.wf10-panel { margin-top: 10px; border: 1px solid var(--border, #e2e5ea); border-radius: 8px; padding: 10px 12px; background: var(--card, #fff); }
.wf10-panel > summary { font-size: 13px; color: var(--muted, #6b7280); cursor: pointer; font-weight: 600; }
.wf10-toolbar { display: flex; gap: 8px; align-items: center; margin: 10px 0 2px; flex-wrap: wrap; }
.wf10-btn { font-size: 12px; padding: 4px 12px; }
.wf10-mode { font-size: 12px; color: var(--muted, #6b7280); }
.wf10-status { font-size: 12px; color: var(--success, #16a34a); }
.wf10-hint { font-size: 12px; color: var(--muted, #6b7280); margin: 6px 0 0; }
.wf10-segments { border: 1px solid var(--border, #e2e5ea); border-radius: 8px; overflow: hidden; margin-top: 8px; }
.wf10-row { display: flex; align-items: stretch; border-bottom: 1px solid var(--border, #e2e5ea); }
.wf10-row:last-child { border-bottom: none; }
.wf10-lineno { flex: 0 0 46px; display: flex; align-items: center; font: 11px/1.4 var(--mono, monospace); color: var(--muted, #6b7280); padding: 6px 8px; background: #fafbfc; border-right: 1px solid var(--border, #e2e5ea); }
.wf10-type { flex: 0 0 168px; display: inline-flex; align-items: center; font-size: 11px; font-weight: 600; padding: 6px 8px; }
.wf10-text { flex: 1 1 auto; min-width: 0; font: 12px/1.6 var(--mono, monospace); color: var(--text, #1f2329); padding: 6px 10px; white-space: pre-wrap; word-break: break-all; }
.wf10-src { flex: 0 0 300px; display: flex; align-items: center; font-size: 12px; color: var(--muted, #6b7280); padding: 6px 10px; border-left: 1px dashed var(--border, #e2e5ea); cursor: help; }
.wf10-t-auth   { background: #f5f3ff; color: #7c3aed; }
.wf10-t-method { background: #eff6ff; color: #2563eb; }
.wf10-t-uri    { background: #ecfeff; color: #0e7490; }
.wf10-t-qs     { background: #f3f4f6; color: #6b7280; }
.wf10-t-header { background: #f0fdf4; color: #16a34a; }
.wf10-empty-mark { color: var(--muted, #6b7280); font-style: italic; }
.wf10-manual { margin-top: 12px; }
.wf10-manual summary { font-size: 13px; color: var(--muted, #6b7280); cursor: pointer; }
.wf10-manual textarea { min-height: 110px; margin-top: 8px; }
.wf10-diff-out { margin-top: 8px; }
.wf10-dsum { font-size: 12px; margin: 6px 0; color: var(--text, #1f2329); }
.wf10-diff-row { display: flex; gap: 8px; align-items: baseline; font: 12px/1.6 var(--mono, monospace); padding: 3px 8px; border-radius: 4px; }
.wf10-dstate { flex: 0 0 44px; font-size: 11px; font-weight: 600; }
.wf10-dtext { flex: 1 1 auto; min-width: 0; white-space: pre-wrap; word-break: break-all; }
.wf10-d-same .wf10-dstate { color: var(--success, #16a34a); }
.wf10-d-same .wf10-dtext { color: var(--text, #1f2329); background: #f0fdf4; }
.wf10-d-diff { background: #fef2f2; }
.wf10-d-diff .wf10-dstate { color: #dc2626; }
.wf10-d-diff .wf10-dtext { color: #b91c1c; }
.wf10-d-extra, .wf10-d-missing { background: #f3f4f6; }
.wf10-d-extra .wf10-dstate, .wf10-d-missing .wf10-dstate { color: var(--muted, #6b7280); }
.wf10-d-extra .wf10-dtext, .wf10-d-missing .wf10-dtext { color: var(--muted, #6b7280); text-decoration: line-through; }
.wf10-note { font-size: 12px; color: var(--muted, #6b7280); margin: 10px 0 0; }
@media (max-width: 900px) {
  .wf10-row { flex-wrap: wrap; }
  .wf10-src { flex: 1 1 100%; border-left: none; border-top: 1px dashed var(--border, #e2e5ea); }
  .wf10-text { flex: 1 1 100%; }
}
`,
    html: `
<!-- WF10 — canonicalRequest 逐段解析 UI 片段
     锚点建议：插入到 #tab-request 内 #req-out 的第一张 card（「构造结果」）中，
     紧跟「调试：canonicalRequest」的 details.debug 之后（#req-canonical 所在块下方）。
     集成者负责落位并在 DOM 就绪后调用 WF_REGISTRY['wf10'].init()。 -->
<details id="wf10-root" class="wf10-panel">
  <summary><span class="i18n" data-i18n="wf10.title">canonicalRequest 逐段解析</span><span class="i18n" data-i18n="wf10.subtitle">（每一行来自哪个字段）</span></summary>
  <div class="wf10-toolbar">
    <button type="button" id="wf10-refresh" class="wf10-btn"><span class="i18n" data-i18n="wf10.refresh">刷新</span></button>
    <button type="button" id="wf10-copy" class="wf10-btn"><span class="i18n" data-i18n="wf10.copy">复制 canonicalRequest</span></button>
    <span id="wf10-mode" class="wf10-mode"></span>
    <span id="wf10-status" class="wf10-status" aria-live="polite"></span>
  </div>
  <div id="wf10-segments" class="wf10-segments"></div>
  <details id="wf10-manual-box" class="wf10-manual">
    <summary><span class="i18n" data-i18n="wf10.diff.title">差异检测：粘贴 / 修改你的 canonical，实时比对</span></summary>
    <p class="wf10-hint"><span class="i18n" data-i18n="wf10.diff.hint">每行状态：绿 = 与自动生成一致；红 = 同位置内容有差异；灰 = 未参与（手工串多出的行，或自动生成有而手工串缺失的行）</span></p>
    <textarea id="wf10-manual" spellcheck="false" placeholder="v1/1800&#10;POST&#10;/gateway/...&#10;(查询串，POST 为空)&#10;x-wop-appkey:...&#10;..."></textarea>
    <div id="wf10-diff-out" class="wf10-diff-out"></div>
  </details>
  <p class="wf10-note" id="wf10-signednote"></p>
</details>
`,
    init: init,
    selftest: function () {
      if (typeof window.WF10RunSelftest !== 'function') {
        return [{ name: 'wf10 断言器加载', pass: false, detail: 'wf10.selftest.js 未加载（需与 wf10.js 一并引入）' }];
      }
      return window.WF10RunSelftest();
    }
  };
})();

