/**
 * WF11 — 持久断言（供集成者接入 runSelftest；契约断言契约：正/负路径都防真实 bug）。
 *
 * 断言设计为无浏览器依赖：只消费 WF11_CORE 纯函数 + 最小 DOM stub（fillRequest 注入 getEl），
 * node 与浏览器均可执行。断言渲染文案中文，不触碰网络/存储（S1/S2 纪律）。
 *
 * 断言清单（条款 → 断言反向核对矩阵，README 同步）：
 *   WF11-CONTRACT   契约合法：≥5 接口、每个有 method/path/operationId/summary、全 POST（网关事实）、含 ≥1 回调
 *   WF11-EXAMPLE    示例契约显著标注：isExample=true 且横幅文案存在（防「忘了标注示例」）
 *   WF11-RENDER     渲染一致：目录 op 条目数 == 拍平 op 数；每个 op 的 key 可在目录 HTML 中找到
 *   WF11-FORM       表单生成：填参 → body JSON 正确（含嵌套对象 callback 与数组）
 *   WF11-FILL       填充请求区：路径/加密级别正确写入目标输入框，method 返回 POST；目标缺失不抛错
 *   WF11-VALID-REQ  否定式：必填缺失 → 报错指向该字段路径
 *   WF11-VALID-TYPE 否定式：integer 字段填非整数被拒；boolean 非法值被拒
 *   WF11-VALID-ARR  否定式：array minItems 违反被拒；enum 非法值被拒
 *   WF11-I18N       动态文案回退：WF14 未加载时 t() 返回中文 fallback
 */
(function () {
  'use strict';

  function run() {
    var R = [];
    function A(name, pass, detail) { R.push({ name: name, pass: !!pass, detail: pass ? '' : (detail || '') }); }
    var C = window.WF11_CORE;
    var contract = window.WF11_CONTRACT;

    if (!C || !contract) {
      A('契约与核心可用', false, 'WF11_CONTRACT / WF11_CORE 未加载（检查加载顺序：contract.js → wf11.js → wf11.selftest.js）');
      return R;
    }

    // ---- spec:WF11-CONTRACT 契约数据合法 ----
    var all = C.ops(contract);
    var structOk = all.length >= 5;
    var fieldsOk = true, badOp = '';
    var postOk = true, cbCount = 0;
    all.forEach(function (e) {
      if (!(e.op && e.op.operationId && e.op.summary && e.method && e.path)) {
        fieldsOk = false; badOp = e.key || '(未知)';
      }
      if (e.method !== 'post') postOk = false;
      if (e.op['x-wop-direction'] === 'platform-to-merchant') cbCount++;
    });
    A('契约：≥5 接口且结构完整', structOk && fieldsOk,
      '接口数=' + all.length + '，结构异常 op=' + badOp);
    A('契约：统一 POST 且含回调接口', postOk && cbCount >= 1,
      'postOk=' + postOk + '，回调接口数=' + cbCount);

    // ---- spec:WF11-EXAMPLE 示例契约标注 ----
    var bannerEl = (typeof document !== 'undefined' && document.getElementById)
      ? document.getElementById('wf11-banner') : null;
    var bannerShown = !!contract.isExample && (!!contract.exampleNote)
      && (!bannerEl || bannerEl.hidden === false || bannerEl.getAttribute('hidden') === null);
    A('示例契约：显著标注生效', bannerShown,
      'isExample=' + contract.isExample + '，exampleNote 缺失=' + !contract.exampleNote);

    // ---- spec:WF11-RENDER 渲染一致 ----
    var html = C.catalogHtml(contract);
    var rowCount = html.split('wf11-op-row').length - 1;
    var keysAllFound = all.every(function (e) { return html.indexOf(e.key) >= 0; });
    A('渲染：目录条目数与契约一致', rowCount === all.length && keysAllFound,
      '目录条目=' + rowCount + '，契约 op=' + all.length + '，key 全可寻=' + keysAllFound);

    function findOp(oid) {
      for (var i = 0; i < all.length; i++) if (all[i].op.operationId === oid) return all[i];
      return null;
    }

    // ---- spec:WF11-FORM 表单生成（含嵌套对象）----
    var subOp = findOp('trackSubscribe');
    var subModel = C.formModelFor(subOp.op);
    var subRaw = {
      waybillNos: 'SF-888, SF-889',
      'callback.url': 'https://merchant.example/cb',
      'callback.retryTimes': '3',
      expireDays: '30'
    };
    var subRes = C.bodyFromRaw(subModel, subRaw);
    var subParsed = subRes.ok ? JSON.parse(subRes.json) : null;
    A('表单：填参生成嵌套 body JSON', !!subParsed
      && subParsed.waybillNos.length === 2 && subParsed.waybillNos[0] === 'SF-888'
      && subParsed.callback && subParsed.callback.url === 'https://merchant.example/cb'
      && subParsed.callback.retryTimes === 3
      && subParsed.expireDays === 30,
      '生成结果=' + subRes.json + '，errors=' + JSON.stringify(subRes.errors));

    // 选填字段缺省时不进 body（默认值污染防御）
    var wbOp = findOp('waybillQuery');
    var wbModel = C.formModelFor(wbOp.op);
    var wbRes = C.bodyFromRaw(wbModel, { waybillNo: 'SF-888' });
    var wbParsed = wbRes.ok ? JSON.parse(wbRes.json) : null;
    A('表单：选填缺省不污染 body', !!wbParsed
      && wbParsed.waybillNo === 'SF-888'
      && wbParsed.carrierCode === undefined && wbParsed.orderNo === undefined,
      '生成结果=' + wbRes.json);

    // ---- spec:WF11-FILL 填充请求区 ----
    var els = {
      'r-path': { value: '' },
      'r-body': { value: '' },
      'r-level': { value: '' }
    };
    var fillRes = C.fillRequest(subOp, '{"waybillNos":["SF-888"]}', function (id) { return els[id] || null; });
    var fillOk = fillRes.ok && fillRes.method === 'POST'
      && els['r-path'].value === '/gateway/logistics/open-plat/track/subscribe'
      && JSON.parse(els['r-body'].value).waybillNos[0] === 'SF-888'
      && els['r-level'].value === 'L2'
      && fillRes.filled.length === 3;
    A('填充：路径/body/加密级别写入请求区', fillOk,
      'fillRes=' + JSON.stringify({ ok: fillRes.ok, method: fillRes.method, path: fillRes.path, filled: fillRes.filled })
      + ' r-path=' + els['r-path'].value + ' r-level=' + els['r-level'].value);

    // 目标缺失：不抛错、ok=false（独立预览防御）
    var missRes = C.fillRequest(subOp, '{}', function () { return null; });
    A('填充：目标缺失不抛错且报失败', missRes.ok === false && missRes.missing.length >= 2,
      'ok=' + missRes.ok + '，missing=' + missRes.missing.join(','));

    // ---- spec:WF11-VALID-REQ 否定式：必填缺失 ----
    var vReq = C.bodyFromRaw(subModel, { expireDays: '30' });
    var missWaybill = vReq.errors.some(function (e) { return e.path === 'waybillNos'; });
    var missCb = vReq.errors.some(function (e) { return e.path === 'callback' || e.path === 'callback.url'; });
    A('校验：必填缺失报错（含嵌套必填）', !vReq.ok && missWaybill && missCb,
      'errors=' + JSON.stringify(vReq.errors));

    // 嵌套对象部分填写：callback.url 空但 callback 有其它字段 → 报 callback.url
    var vNested = C.bodyFromRaw(subModel, {
      waybillNos: 'SF-888',
      'callback.retryTimes': '3'
    });
    var missUrl = vNested.errors.some(function (e) { return e.path === 'callback.url'; });
    A('校验：嵌套必填指向精确路径', !vNested.ok && missUrl,
      'errors=' + JSON.stringify(vNested.errors));

    // 嵌套对象子错误吞噬回归：retryTimes 类型错不得被「对象必填缺失」掩盖（子错误无条件上浮）
    var vSwallow = C.bodyFromRaw(subModel, {
      waybillNos: 'SF-888',
      'callback.retryTimes': 'abc'
    });
    var typeErrKept = vSwallow.errors.some(function (e) { return e.path === 'callback.retryTimes'; });
    var maskedAsMissing = vSwallow.errors.some(function (e) { return e.path === 'callback' && e.msg.indexOf(t_missing()) >= 0; });
    function t_missing() { return '必填字段缺失'; }
    A('校验：嵌套子错误不被对象必填掩盖', !vSwallow.ok && typeErrKept && !maskedAsMissing,
      'errors=' + JSON.stringify(vSwallow.errors));

    // ---- spec:WF11-VALID-TYPE 否定式：类型非法 ----
    var intField = null, boolField = null;
    subModel.forEach(function (f) {
      if (f.path === 'expireDays') intField = f;
      if (f.path === 'expireDays') boolField = boolField;
    });
    var wbInfoModel = C.formModelFor(findOp('waybillInfoQuery').op);
    wbInfoModel.forEach(function (f) { if (f.path === 'withDetails') boolField = f; });
    var intBad = C.coerceValue(intField, 'abc');
    var boolBad = C.coerceValue(boolField, 'yes');
    var intOk = C.coerceValue(intField, '30');
    var boolOk = C.coerceValue(boolField, 'true');
    A('校验：integer/boolean 非法值被拒', !intBad.ok && !boolBad.ok && intOk.ok && boolOk.ok,
      'intBad=' + JSON.stringify(intBad) + '，boolBad=' + JSON.stringify(boolBad));

    // ---- spec:WF11-VALID-ARR 否定式：数组与枚举 ----
    var arrEmpty = C.bodyFromRaw(C.formModelFor(findOp('trackLatest').op), { waybillNos: '' });
    var arrBadType = C.coerceValue({ type: 'array', itemsType: 'integer', minItems: 1, maxItems: 0 }, 'x,y');
    var enumBad = C.coerceValue({ type: 'string', enumValues: ['a', 'b'] }, 'c');
    A('校验：minItems/数组元素类型/枚举被拒', !arrEmpty.ok && !arrBadType.ok && !enumBad.ok,
      'arrEmpty=' + JSON.stringify(arrEmpty.errors) + '，arrBadType=' + JSON.stringify(arrBadType)
      + '，enumBad=' + JSON.stringify(enumBad));

    // ---- spec:WF11-I18n 动态文案回退 ----
    var hadWF14 = false;
    try { hadWF14 = !!(window.WF14 && window.WF14.t); } catch (e) { hadWF14 = false; }
    var fb = C.t('wf11.gen', '生成 body JSON');
    A('i18n：WF14 未加载回退中文', (!hadWF14 && fb === '生成 body JSON') || (hadWF14 && typeof fb === 'string'),
      'WF14 存在=' + hadWF14 + '，t()=' + fb);

    return R;
  }

  window.WF11_SELFTEST = { run: run };
})();
