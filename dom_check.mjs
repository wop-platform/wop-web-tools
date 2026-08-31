#!/usr/bin/env node
// index.html DOM 结构回归 —— 封住两类已实际发生的缺陷：
//   咬 #1（658eda1）：div 失配 → tab-selftest 嵌进隐藏 #tab-request → 白页
//   咬 #2（19d6687 修正前）：配平正确但闭合位置错 → WF8 诊断卡被锁进 #resp-out
// （awk 配平对两类均不敏感——配平只约束数量，不约束树形）
// 用法: node dom_check.mjs [html路径，默认 index.html]
// 反向核对矩阵（条款 → 断言 → 突变体证据 → 分级；评审放行时核心条款须单独确认）:
//   DOM-1  配平=0 且无下溢          | mut2（删 tab-request 闭合）→ DOM-1+DOM-4 红 | 基础
//   DOM-2  resp-out 不在 #diag-err 祖先链 | mut1（咬#2 形状：配平仍 0，仅闭合错位）→ 仅 DOM-2 红 | ★核心
//   DOM-3  req-out 在祖先链          | mut1 下仍绿（req-out 可经 resp-out 传递成立）| 辅助
//   DOM-4  六 tab 页存在且互不嵌套   | mut2 → 红（白页根因泛化）                    | 基础
//   DOM-5  display:none + .show 铰链 | 静态存在性检查（无突变体）                   | 辅助
// ★核心依据：咬#2 类缺陷（配平正确但闭合错位）的唯一拦截线是 DOM-2 ——
//   DOM-3 因传递性在 mut1 下保持绿，不能以 DOM-3 绿替代 DOM-2 检查。
// 断言（grep 索引标签）:
//   spec:DOM-1  div 开/闭全文档配平为 0 且无下溢
//   spec:DOM-2  #diag-err 不在 #resp-out 内（WF8 诊断卡独立于验证结果容器，核心条款）
//   spec:DOM-3  #diag-err 在 #req-out 内（构造请求即 .show 可见，先于验证）
//   spec:DOM-4  六个 tab-* 页面全部存在且互不嵌套（白页根因的泛化）
//   spec:DOM-5  外链 CSS 中 #req-out/#resp-out 默认 display:none 与 .show 解锁规则存在（树形→可见性铰链）
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const file = process.argv[2] || 'index.html';
const src = readFileSync(file, 'utf8');
const fails = [];
const check = (id, cond, msg) => {
  if (cond) console.log('ok   ' + id + '  ' + msg);
  else { fails.push(id); console.error('FAIL ' + id + '  ' + msg); }
};

// 单遍 token 扫描：注释/脚本/样式块作为 skip 分支与 div/id 同场匹配（先到先得）——
// 链式剔除有重组盲区（<!-- 内嵌 script 片段可重组出新块），且 </script >（带空白）不闭合；
// 注释里有集成锚点示例 div（tab-api 注释副本），脚本字符串里有动态 div 标记（wf11-err-out）

const stack = [];
let underflow = false;
const ancestors = Object.create(null); // 元素 id -> 打开时外围 div id 列表
const re = /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<div\b[^>]*>|<\/div\s*>|id="([^"]+)"/gi;
for (const m of src.matchAll(re)) {
  const t = m[0];
  if (t.slice(0, 4) === '<div') {
    const id = (t.match(/\bid="([^"]+)"/) || [])[1] || '';
    if (id) ancestors[id] = stack.slice();
    stack.push(id);
  } else if (/^<\/div/i.test(t)) {
    if (stack.pop() === undefined) underflow = true;
  } else if (m[1]) {
    ancestors[m[1]] = stack.slice(); // 非 div 元素（如 #diag-err 按钮）记录 div 祖先链
  }
}

const diagAnc = ancestors['diag-err'] || [];
check('DOM-1', stack.length === 0 && !underflow,
  'div 配平=' + stack.length + ' 下溢=' + underflow);
// spec:DOM-2 否定式条款：resp-out 出现在祖先链即违规
check('DOM-2', diagAnc.indexOf('resp-out') < 0,
  '#diag-err 祖先 div 链 ' + JSON.stringify(diagAnc) + ' 不含 resp-out');
check('DOM-3', diagAnc.indexOf('req-out') >= 0, '#diag-err 在 #req-out 内');

const TABS = ['tab-keygen', 'tab-request', 'tab-selftest', 'tab-api', 'tab-wf12', 'tab-gm'];
let nestErr = '';
for (const t of TABS) {
  const anc = ancestors[t];
  if (!anc) { nestErr += ' [' + t + ' 缺失]'; continue; }
  const bad = anc.filter(a => a.slice(0, 4) === 'tab-');
  if (bad.length) nestErr += ' [' + t + ' ← ' + bad.join('/') + ']';
}
check('DOM-4', !nestErr, '六 tab 页存在且互不嵌套' + (nestErr || ''));

// DOM-5：CSS 外链（拆分形态）后规则不在壳 src 内 —— 解析 <link href> 读 CSS 文件检查
const cssSrc = [...src.matchAll(/<link\b[^>]*href="([^"]+\.css)"/gi)]
  .map(m => readFileSync(join(dirname(file), m[1]), 'utf8')).join('\n');
check('DOM-5',
  /#req-out,\s*#resp-out\s*\{[^}]*display:\s*none/.test(cssSrc) &&
  /#req-out\.show,\s*#resp-out\.show\s*\{[^}]*display:\s*block/.test(cssSrc),
  '外链 CSS 中 req-out/resp-out 默认隐藏与 .show 解锁规则存在');

console.log(fails.length ? 'FAILED: ' + fails.join(',') : 'ALL PASS (DOM-1..DOM-5)');
process.exit(fails.length ? 1 : 0);
