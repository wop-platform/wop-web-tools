#!/usr/bin/env node
// S1/S2 仓库级禁词门禁 —— 页面壳自扫描（assets/core.js scanSelfForBanned）的配套层。
// 分层依据：拆分为壳+assets 后，页面内无网络 API 无法读取自身外链 JS 文件内容，
// 页内断言只保壳级（DOM 无跨源 URL）；源码级网络/存储禁词由本层拦截（pre-commit + CI）。
//
// 反向核对矩阵（条款 → 断言；否定式条款均有对应断言）:
//   SCAN-1  spec:S1 跨源资源 URL 为零   | src/href 不得指向 http(s):// 或协议相对 //；CSS url() 跨源同禁（同源相对路径放行）
//   SCAN-2  spec:S1 网络 API 禁词为零   | fetch(/XMLHttpRequest/WebSocket/EventSource/sendBeacon 源码为零
//   SCAN-3  spec:S2 存储 API 禁词为零   | localStorage/sessionStorage/indexedDB/document.cookie 源码为零
//   SCAN-4  使用侧 i18n 键 ⊆ DICT 键    | data-i18n 属性 + 源码 'main.|wf9..wf14.' 键引用（剥 DICT 块防自命中，排除自测假键）
// CodeRabbit PR #5 线程 evwen：主页经 <link> 加载 assets/*.css，CSS 可经
// url(//host/…) 出网而不触发标签 src/href 检测——css 并入扫描对象；
// SCAN-1 追加 url( 跨源模式（CSS 资源引用语法，非标签属性）。
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const files = ['index.html', ...readdirSync('assets').filter(f => /\.(?:js|css)$/.test(f)).map(f => join('assets', f))];
const fails = [];
const check = (id, cond, msg) => {
  if (cond) console.log('ok   ' + id + '  ' + msg);
  else { fails.push(id); console.error('FAIL ' + id + '  ' + msg); }
};

const dictBlockRe = /var DICT = \{[\s\S]*?\n\s*\};/g;
const dictKeys = new Set();
for (const f of files) {
  for (const block of readFileSync(f, 'utf8').matchAll(dictBlockRe)) {
    for (const km of block[0].matchAll(/^\s*'([A-Za-z0-9][A-Za-z0-9_.-]*)':/gm)) dictKeys.add(km[1]);
  }
}
const usedKeys = new Set();
const i18nAttrRe = /data-i18n="([^"]+)"/g;
const keyRe = /(['"])(?:main|wf9|wf10|wf11|wf12|wf-gm|wf14)\.(?:[A-Za-z0-9_]+\.)*[A-Za-z0-9_]+\1/g;
const TESTONLY = new Set(['wf14.__missing', 'wf14.__fr', 'wf14.__zhonly', 'wf14.__dom', 'wf14.__m', 'wf10.__ghost']); // 自测专用假键
const keyShape = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/; // 键形过滤：正则字面量（如 /data-i18n="([^"]+)"/）会自命中，非键形跳过
for (const f of files) {
  const s = readFileSync(f, 'utf8').replace(dictBlockRe, '\n'); // 剥 DICT 块，防其键被算作使用侧
  for (const m of s.matchAll(i18nAttrRe)) if (keyShape.test(m[1])) usedKeys.add(m[1]);
  for (const m of s.matchAll(keyRe)) {
    const k = m[0].slice(1, -1); // m[0] 全匹配，剥首尾引号
    if (keyShape.test(k)) usedKeys.add(k);
  }
}
const missKeys = [...usedKeys].filter(k => !TESTONLY.has(k) && !dictKeys.has(k));
check('SCAN-4', missKeys.length === 0, '使用侧键 ⊆ DICT（使用侧 ' + usedKeys.size + ' / DICT ' + dictKeys.size + '）' + (missKeys.length ? ' → 缺失 ' + missKeys.join(',') : ''));

const netWords = ['fet' + 'ch(', 'X' + 'MLHttpRequest', 'Web' + 'Socket', 'Event' + 'Source', 'send' + 'Beacon'];
const storeWords = ['local' + 'Storage', 'session' + 'Storage', 'indexed' + 'DB', 'document.' + 'cookie'];
const tagRe = /<(?:script|link|img|iframe|audio|video|source|object|embed)\b[^>]*>/gi;
const crossOriginRe = /(?:src|href)\s*=\s*["']?\s*(?:https?:)?\/\//;
const cssUrlRe = /url\(\s*['"]?\s*(?:https?:)?\/\//gi; // 协议相对 // 与 http(s):// 均跨源；相对同源放行

const hits = { cross: [], net: [], store: [] };
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  for (const w of netWords) if (s.includes(w)) hits.net.push(f + ': ' + w);
  for (const w of storeWords) if (s.includes(w)) hits.store.push(f + ': ' + w);
  for (const m of s.matchAll(tagRe)) {
    if (crossOriginRe.test(m[0])) hits.cross.push(f + ': ' + m[0].slice(0, 60));
  }
  // CSS 资源引用语法（url(//host/x) / url(https://host/x)）不产生标签属性。
  for (const m of s.matchAll(cssUrlRe)) {
    hits.cross.push(f + ': ' + m[0].slice(0, 60));
  }
}
check('SCAN-1', !hits.cross.length, '跨源 src/href/url() 引用为 0' + (hits.cross.length ? ' → ' + JSON.stringify(hits.cross) : ''));
check('SCAN-2', !hits.net.length, '网络 API 禁词为 0' + (hits.net.length ? ' → ' + JSON.stringify(hits.net) : ''));
check('SCAN-3', !hits.store.length, '存储 API 禁词为 0' + (hits.store.length ? ' → ' + JSON.stringify(hits.store) : ''));

console.log(fails.length ? 'FAILED: ' + fails.join(',') : 'ALL PASS (SCAN-1..SCAN-4)');
process.exit(fails.length ? 1 : 0);
