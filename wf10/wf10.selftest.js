/* WF10 — 自测断言（wf10.selftest.js）
 * 由 WF_REGISTRY['wf10'].selftest() 调用（本文件定义 window.WF10RunSelftest）。
 * 断言只触达 window.WF10 纯核心 + 可选 DOM 字段（无 DOM 时跳过字段实测，不失败）；
 * 不触网、不写存储（S1/S2 纪律）。每条断言带 // spec:WF10-* 标签。 */
(function () {
  'use strict';

  window.WF10RunSelftest = function () {
    var R = [];
    function ok(name, fn) {
      try {
        var r = fn();
        R.push({ name: name, pass: r === true, detail: r === true ? '' : ((r && r.fail) || '断言失败') });
      } catch (e) {
        R.push({ name: name, pass: false, detail: '异常：' + (e && e.message ? e.message : String(e)) });
      }
    }
    function fieldVal(id) {
      var el = (typeof document !== 'undefined' && document.getElementById) ? document.getElementById(id) : null;
      return el && el.value != null ? String(el.value) : null;
    }

    var W = window.WF10;
    if (!W) return [{ name: 'wf10 核心加载', pass: false, detail: 'window.WF10 不存在（wf10.js 未加载）' }];

    // 组串优先用页面真身 buildCanonical（集成态）；独立运行时用等价拼装。
    var bc = (typeof window.buildCanonical === 'function')
      ? window.buildCanonical
      : function (auth, m, p, q, ch) { return auth + '\n' + String(m).toUpperCase() + '\n' + p + '\n' + (q || '') + '\n' + ch; };
    var EMPTY = W.EMPTY_SHA256;
    var HEADERS = 'x-wop-appkey:demo_app_key\nx-wop-content-digest:sha-256 ' + EMPTY;
    var CANON = bc('v1/1800', 'POST', '/gateway/logistics.waybill.sync', '', HEADERS);
    // 期望行序（与 buildCanonical 5 段语义一致）
    var WANT = ['v1/1800', 'POST', '/gateway/logistics.waybill.sync', '',
                'x-wop-appkey:demo_app_key', 'x-wop-content-digest:sha-256 ' + EMPTY];

    // spec:WF10-SPLIT — 拆分正确：行数、各段内容与组串输出逐行一致，round-trip 无损
    ok('拆分：6 段逐行与组串输出一致', function () {
      var r = W.splitCanonical(CANON);
      if (!r.ok) return { fail: '解析失败：' + r.error };
      if (r.lineCount !== 6) return { fail: '行数应为 6，实际 ' + r.lineCount };
      var types = ['auth', 'method', 'uri', 'qs', 'header', 'header'];
      for (var i = 0; i < 6; i++) {
        if (r.segments[i].text !== WANT[i]) return { fail: '第 ' + (i + 1) + ' 行内容不符：' + r.segments[i].text };
        if (r.segments[i].type !== types[i]) return { fail: '第 ' + (i + 1) + ' 行类型应为 ' + types[i] };
      }
      var joined = r.segments.map(function (s) { return s.text; }).join('\n');
      if (joined !== CANON) return { fail: 'round-trip 不一致：拆分再拼接 ≠ 原文' };
      return true;
    });

    // spec:WF10-SPLIT-REJECT — 否定式：非法输入被拒绝（空串 / 段数不足 / 头行无冒号 / 非字符串），不抛异常且给出原因
    ok('否定式：非法输入被拒绝', function () {
      var bad = ['', '   ', null, undefined, 123,
                 'v1/1800\nPOST\n/x\n',                      // 4 行 < 5 段
                 'v1/1800\nPOST\n/x\n\nnot-a-header-line'];  // 头行缺冒号
      for (var i = 0; i < bad.length; i++) {
        var r = W.splitCanonical(bad[i]);
        if (r.ok) return { fail: '输入 ' + JSON.stringify(bad[i]) + ' 应被拒绝却通过了' };
        if (!r.error) return { fail: '拒绝时必须给出 error 原因' };
      }
      return true;
    });

    // spec:WF10-SRC-METHOD — 来源标注：方法行 → 请求方法（HTTPMethod 徽标，值为 POST）
    ok('来源：方法行 → 请求方法', function () {
      var r = W.splitCanonical(CANON);
      if (!r.ok) return { fail: '解析失败' };
      var seg = r.segments[1], meta = W.segmentMeta(seg);
      if (seg.text !== 'POST') return { fail: '方法行应为 POST，实际 ' + seg.text };
      if (meta.typeLabel !== 'HTTPMethod') return { fail: '类型徽标应为 HTTPMethod' };
      if (String(meta.srcLabel).indexOf('请求方法') < 0) return { fail: '来源标注应含「请求方法」：' + meta.srcLabel };
      return true;
    });

    // spec:WF10-SRC-URI — 来源标注：URI 行 → 请求路径字段（#r-path），内容与字段值一致
    ok('来源：URI 行 → 请求路径字段', function () {
      var cur = fieldVal('r-path');
      var path = (cur == null || cur.trim() === '') ? '/gateway/logistics.waybill.sync' : cur.trim();
      var c2 = bc('v1/x', 'POST', path, '', 'h:v');
      var r = W.splitCanonical(c2);
      if (!r.ok) return { fail: '解析失败' };
      var seg = r.segments[2], meta = W.segmentMeta(seg);
      if (seg.text !== path) return { fail: 'URI 行应等于路径字段值 ' + path + '，实际 ' + seg.text };
      if (meta.field !== 'r-path') return { fail: '来源字段应为 #r-path' };
      if (String(meta.srcLabel).indexOf('请求路径') < 0) return { fail: '来源标注应含「请求路径」：' + meta.srcLabel };
      return true;
    });

    // spec:WF10-SRC-HEADER — 来源标注：头行 → 对应字段（appkey→#r-appkey，digest→#r-body）；未知头不崩溃
    ok('来源：头行 → 对应来源字段', function () {
      var r = W.splitCanonical(CANON);
      if (!r.ok) return { fail: '解析失败' };
      var m1 = W.segmentMeta(r.segments[4]);
      if (m1.field !== 'r-appkey') return { fail: 'x-wop-appkey 来源字段应为 #r-appkey' };
      if (String(m1.srcLabel).indexOf('appKey') < 0) return { fail: 'appkey 头来源标注应含 appKey' };
      var m2 = W.segmentMeta(r.segments[5]);
      if (m2.field !== 'r-body') return { fail: 'x-wop-content-digest 来源字段应为 #r-body' };
      if (String(m2.srcLabel).indexOf('摘要') < 0) return { fail: 'digest 头来源标注应含「摘要」' };
      var m3 = W.segmentMeta({ idx: 0, type: 'header', name: 'x-other-header', text: 'x-other-header:v' });
      if (!m3.srcLabel || m3.field !== null) return { fail: '未知头应回退通用标注且 field=null' };
      return true;
    });

    // spec:WF10-EMPTY-QS — 否定式：查询参数为空 → 恰好 1 个空行（qs 段），无多余空行；有查询串时该行为其内容
    ok('否定式：空查询参数无多余空行', function () {
      var r = W.splitCanonical(CANON);
      if (!r.ok) return { fail: '解析失败' };
      var empties = r.segments.filter(function (s) { return s.text === ''; });
      if (r.segments[3].type !== 'qs') return { fail: '第 4 段应为 qs' };
      if (r.segments[3].text !== '') return { fail: 'POST 空查询串应为空行' };
      if (empties.length !== 1) return { fail: '应恰有 1 个空行（qs 段），实际 ' + empties.length };
      if (r.lineCount !== 4 + 2) return { fail: '总行数应 = 4 段前缀 + 头行数' };
      var r2 = W.splitCanonical(bc('v1/1', 'POST', '/x', 'a=1&b=2', 'h:v'));
      if (!r2.ok || r2.segments[3].text !== 'a=1&b=2') return { fail: '有查询串时 qs 段应为其实际内容' };
      var e2 = r2.segments.filter(function (s) { return s.text === ''; });
      if (e2.length !== 0) return { fail: '有查询串时不应出现空行' };
      return true;
    });

    // spec:WF10-EMPTY-BODY — 空 body：摘要行为 'sha-256 ' + 空 SHA 常量，且哈希入参确为空串（防“跳过/错对象”回归）
    ok('空 body：摘要行为空串 SHA-256', function () {
      var seen = null;
      var spy = function (s) { seen = s; return EMPTY; };
      var got = W.digestHeaderValue('', spy);
      if (seen !== '') return { fail: '哈希入参应为空串，实际 ' + JSON.stringify(seen) };
      if (got !== 'sha-256 ' + EMPTY) return { fail: '空 body 摘要行应为 sha-256 + 空 SHA 常量，实际 ' + got };
      var seen2 = null;
      W.digestHeaderValue(undefined, function (s) { seen2 = s; return EMPTY; });
      if (seen2 !== '') return { fail: 'undefined body 应归一为空串再取摘要' };
      return true;
    });

    // spec:WF10-DIFF — 差异检测：完全一致全绿；改一字该行标红且仅 1 处；改回恢复绿；多行/缺行计入未参与
    ok('差异检测：一字之差标红、改回复绿', function () {
      var d0 = W.diffLines(CANON, CANON);
      if (d0.diffCount !== 0) return { fail: '完全一致时 diffCount 应为 0' };
      var lines = CANON.split('\n');
      lines[1] = 'PUT';
      var d1 = W.diffLines(CANON, lines.join('\n'));
      if (d1.diffCount !== 1) return { fail: '改 1 行应恰 1 处差异，实际 ' + d1.diffCount };
      if (d1.rows[1].state !== 'diff') return { fail: '被改行（L2）应标红 diff' };
      if (d1.rows[0].state !== 'same' || d1.rows[5].state !== 'same') return { fail: '其余行应保持一致' };
      var d2 = W.diffLines(CANON, CANON);
      if (d2.diffCount !== 0) return { fail: '改回后应恢复 0 差异' };
      var d3 = W.diffLines(CANON, CANON + '\nx-extra:1');
      if (d3.extraCount !== 1 || d3.rows[6].state !== 'extra') return { fail: '多出 1 行应计入 extra（灰）' };
      var d4 = W.diffLines(CANON, CANON.split('\n').slice(0, 5).join('\n'));
      if (d4.missingCount !== 1) return { fail: '缺 1 行应计入 missing（灰）' };
      return true;
    });

    return R;
  };
})();
