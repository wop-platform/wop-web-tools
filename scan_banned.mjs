#!/usr/bin/env node
// S1/S2 仓库级禁词门禁 —— 页面壳自扫描（assets/core.js scanSelfForBanned）的配套层。
// 分层依据：拆分为壳+assets 后，页面内无网络 API 无法读取自身外链 JS 文件内容，
// 页内断言只保壳级（DOM 无跨源 URL）；源码级网络/存储禁词由本层拦截（pre-commit + CI）。
//
// 反向核对矩阵（条款 → 断言；否定式条款均有对应断言）:
//   SCAN-1  spec:S1 跨源资源 URL 为零   | src/href 不得指向 http(s):// 或协议相对 //（同源相对路径放行）
//   SCAN-2  spec:S1 网络 API 禁词为零   | fetch(/XMLHttpRequest/WebSocket/EventSource/sendBeacon 源码为零
//   SCAN-3  spec:S2 存储 API 禁词为零   | localStorage/sessionStorage/indexedDB/document.cookie 源码为零
// 扫描对象：index.html + assets/*.js（主页交付物；gm/ 独立页有自己的门禁链 gm/test.mjs）。
// 禁词在扫描器源码里以拼接书写，防止自命中。
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const files = ['index.html', ...readdirSync('assets').filter(f => f.endsWith('.js')).map(f => join('assets', f))];
const fails = [];
const check = (id, cond, msg) => {
  if (cond) console.log('ok   ' + id + '  ' + msg);
  else { fails.push(id); console.error('FAIL ' + id + '  ' + msg); }
};

const netWords = ['fet' + 'ch(', 'X' + 'MLHttpRequest', 'Web' + 'Socket', 'Event' + 'Source', 'send' + 'Beacon'];
const storeWords = ['local' + 'Storage', 'session' + 'Storage', 'indexed' + 'DB', 'document.' + 'cookie'];
const tagRe = /<(?:script|link|img|iframe|audio|video|source|object|embed)\b[^>]*>/gi;
const crossOriginRe = /(?:src|href)\s*=\s*["']?\s*(?:https?:)?\/\//;

const hits = { cross: [], net: [], store: [] };
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  for (const w of netWords) if (s.includes(w)) hits.net.push(f + ': ' + w);
  for (const w of storeWords) if (s.includes(w)) hits.store.push(f + ': ' + w);
  for (const m of s.matchAll(tagRe)) {
    if (crossOriginRe.test(m[0])) hits.cross.push(f + ': ' + m[0].slice(0, 60));
  }
}
check('SCAN-1', !hits.cross.length, '跨源 src/href 引用为 0' + (hits.cross.length ? ' → ' + JSON.stringify(hits.cross) : ''));
check('SCAN-2', !hits.net.length, '网络 API 禁词为 0' + (hits.net.length ? ' → ' + JSON.stringify(hits.net) : ''));
check('SCAN-3', !hits.store.length, '存储 API 禁词为 0' + (hits.store.length ? ' → ' + JSON.stringify(hits.store) : ''));

console.log(fails.length ? 'FAILED: ' + fails.join(',') : 'ALL PASS (SCAN-1..SCAN-3)');
process.exit(fails.length ? 1 : 0);
