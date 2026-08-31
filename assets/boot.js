/* ============ WF 切片初始化（DOM 已就绪；各 init 幂等） ============ */
['wf10', 'wf9', 'wf11', 'wf12', 'wf14'].forEach(id => {
  const reg = (typeof WF_REGISTRY !== 'undefined' && WF_REGISTRY) ? WF_REGISTRY[id] : null;
  if (reg && typeof reg.init === 'function') {
    try { reg.init(); } catch (e) { console.error('WF init ' + id, e); }
  }
});
const gmReg = (typeof WF_REGISTRY !== 'undefined' && WF_REGISTRY) ? WF_REGISTRY['wf-gm'] : null;
if (gmReg && typeof gmReg.init === 'function') {
  try { gmReg.init('#tab-gm'); } catch (e) { console.error('WF init wf-gm', e); }
}
