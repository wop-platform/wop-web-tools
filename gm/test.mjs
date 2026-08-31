// gm/test.mjs — node 验收入口：黄金向量断言 + 产物禁词扫描（S1/S2）
// 用法：node gm/test.mjs  （在仓库根或任意目录执行均可，路径相对本文件解析）
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { smGoldenSelfTest, GOLDEN_SM, SM2_USER_ID, sm2PubFromPriv } from './gmcore.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let fails = 0;

// ---- 1. gmcore 纯函数断言（黄金向量） ----
const T = smGoldenSelfTest();
for (const t of T) {
  if (t.pass) console.log('PASS  ' + t.name);
  else { fails++; console.log('FAIL  ' + t.name + '  << ' + t.detail); }
}
console.log(`gmcore: ${T.length - fails}/${T.length}`);

// ---- 2. 契约级静态断言 ----
// spec:GM-18 常量与黄金向量一致
if (SM2_USER_ID !== GOLDEN_SM.sm2UserId) { fails++; console.log('FAIL  GM-18 常量与黄金 userId 不一致'); }
// spec:GM-12a 黄金 hex 派生字段（pubHex=130 hex 04 开头 / privHex=64 hex），供页面快捷填充
if (!/^04[0-9a-f]{128}$/.test(String(GOLDEN_SM.pubHex || ''))) { fails++; console.log('FAIL  GM-12a 黄金 pubHex 派生非法: ' + GOLDEN_SM.pubHex); }
if (!/^[0-9a-f]{64}$/.test(String(GOLDEN_SM.privHex || ''))) { fails++; console.log('FAIL  GM-12a 黄金 privHex 派生非法'); }
// spec:GM-12b 私钥→公钥曲线推导与黄金向量一致（页面往返自验依赖）
if (sm2PubFromPriv(GOLDEN_SM.privHex) !== GOLDEN_SM.pubHex) { fails++; console.log('FAIL  GM-12b sm2PubFromPriv 推导与黄金公钥不一致'); }

// spec:GM-16b 禁词扫描（bundle 与页面产物；拼接书写检查项见 WF_CONTRACT S1/S2）
const FORBIDDEN = ['fetch(', 'XMLHttpRequest', 'WebSocket', 'navigator.sendBeacon',
  'local' + 'Storage', 'session' + 'Storage', 'indexedDB'];
const BAD_SRC_HREF = /(?:src|href)\s*=\s*["'](?!data:)[^"']*[:/][^"']*["']/;
const SCAN_FILES = ['gmcore.js', 'gm.js', 'gm.selftest.js', 'gm.css', 'gm.html'];
let scanned = 0;
for (const f of SCAN_FILES) {
  const p = join(here, f);
  if (!existsSync(p)) { console.log('SKIP  禁词扫描 ' + f + '（尚未产出）'); continue; }
  scanned++;
  const text = readFileSync(p, 'utf8');
  for (const w of FORBIDDEN) {
    if (text.includes(w)) { fails++; console.log(`FAIL  GM-16b 禁词命中 ${w} @ ${f}`); }
  }
  const m = BAD_SRC_HREF.exec(text);
  if (m) { fails++; console.log(`FAIL  GM-16b 网络 src/href 命中 ${m[0]} @ ${f}`); }
}
console.log(`禁词扫描: ${scanned} 个文件`);

// ---- 2b. 漂移断言：gm.html/gm.css 必须与 gm.js registry 字段字节一致 ----
// 生成方式：node -e 加载 gm.js 捕获 WF_REGISTRY['wf-gm']，写 reg.html+'\n' / reg.css+'\n'。
// spec:GM-17 产物同源（源真相 gm.js；html/css 为生成物，禁止手改）
{
  const win = {};
  new Function('window', readFileSync(join(here, 'gm.js'), 'utf8'))(win);
  const reg = win.WF_REGISTRY && win.WF_REGISTRY['wf-gm'];
  if (!reg) { fails++; console.log('FAIL  GM-17 gm.js 未注册 WF_REGISTRY["wf-gm"]（stub window）'); }
  else {
    if (reg.id !== 'wf-gm' || typeof reg.title !== 'string' || !reg.title) { fails++; console.log('FAIL  GM-17 registry id/title 非法'); }
    if (typeof reg.init !== 'function' || typeof reg.selftest !== 'function') { fails++; console.log('FAIL  GM-17 registry init/selftest 非函数'); }
    const htmlFile = readFileSync(join(here, 'gm.html'), 'utf8');
    const cssFile = readFileSync(join(here, 'gm.css'), 'utf8');
    if (reg.html + '\n' !== htmlFile) { fails++; console.log('FAIL  GM-17 gm.html 与 registry.html 漂移（重新生成：node 提取脚本）'); }
    if (reg.css + '\n' !== cssFile) { fails++; console.log('FAIL  GM-17 gm.css 与 registry.css 漂移（重新生成：node 提取脚本）'); }
    if (reg.html.indexOf('id="wf-gm-root"') < 0) { fails++; console.log('FAIL  GM-17 html 片段缺 #wf-gm-root'); }
  }
}

// ---- 2c. 模块语法扫描：浏览器产物不得含 import/export/require（S1：无模块语法） ----
// spec:GM-16c 模块语法扫描（gm.js / gm.selftest.js 为浏览器 <script> 直载产物）
{
  const MOD_ESM = /^\s*(import|export)\s/m;
  const MOD_CJS = /\brequire\s*\(/;
  for (const f of ['gm.js', 'gm.selftest.js']) {
    const text = readFileSync(join(here, f), 'utf8');
    if (MOD_ESM.test(text)) { fails++; console.log(`FAIL  GM-16c 模块语法命中（import/export）@ ${f}`); }
    if (MOD_CJS.test(text)) { fails++; console.log(`FAIL  GM-16c 模块语法命中（require()）@ ${f}`); }
  }
}

// ---- 2d. selftest 挂载静态断言：GM_PAGE_SELFTEST 定义并挂 window ----
// spec:GM-18b 页面断言入口（registry.selftest 组合调用 window.GM_PAGE_SELFTEST）
{
  const text = readFileSync(join(here, 'gm.selftest.js'), 'utf8');
  if (!/^function GM_PAGE_SELFTEST\s*\(/m.test(text)) { fails++; console.log('FAIL  GM-18b gm.selftest.js 未定义 function GM_PAGE_SELFTEST'); }
  if (!/window\.GM_PAGE_SELFTEST\s*=\s*GM_PAGE_SELFTEST/.test(text)) { fails++; console.log('FAIL  GM-18b gm.selftest.js 未挂载 window.GM_PAGE_SELFTEST'); }
  const gmJs = readFileSync(join(here, 'gm.js'), 'utf8');
  if (!/GM_PAGE_SELFTEST/.test(gmJs)) { fails++; console.log('FAIL  GM-18b gm.js selftest 未引用 GM_PAGE_SELFTEST'); }
}

// ---- 3. 目录产物清单（交付自检） ----
console.log('gm/ 产物:', readdirSync(here).filter(n => n !== 'node_modules' && n !== 'vendor').join(', '));
console.log(fails === 0 ? '\nALL GREEN' : `\n${fails} 项失败`);
process.exit(fails === 0 ? 0 : 1);
