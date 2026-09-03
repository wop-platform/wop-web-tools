#!/usr/bin/env bash
# 工厂测试门（移植四步之四：测试门命令本地化）——与 .github/workflows/ci.yml、
# .githooks/pre-commit 完全同源的五项确定性检查，零发明零放宽：
#   1. 语法门：全部 assets/*.js 过 node --check
#   2. wf14 自测（15 项，CI 同源拼接形态）
#   3. DOM 结构矩阵 dom_check.mjs（DOM-1..DOM-5）
#   4. S1/S2 禁词扫描 scan_banned.mjs（SCAN-1..SCAN-4）
#   5. 国密黄金向量 gm/test.mjs（24 向量 + 禁词 + 产物漂移）
# 用法: scripts/run_tests.sh [--no-lock]
#   --no-lock 为工厂链约定旗标（上游 run_tests.sh 的锁语义），本仓无锁，消费并忽略；
#   本仓检查器不接透传参数，其余参数一并忽略。
# 证据形态：各检查器逐项 ok/FAIL 输出，失败输出全文（门红时 judge 可审计）。
# 退出码收敛到 0/1（mutation judge 语义域）：任何非零（含 127 缺 node）= 门红。
set -u -o pipefail
for a in "$@"; do
  [ "$a" = "--no-lock" ] && continue
done
RC=0
cd "$(dirname "$0")/.." || {
  echo "run_tests.sh: cannot change to repository root" >&2
  exit 1
}

echo "== gate 1/5: syntax (assets/*.js) =="
for f in assets/*.js; do node --check "$f" || RC=1; done

echo "== gate 2/5: wf14 selftest =="
(cat assets/wf14.js assets/wf14.selftest.js; echo 'var R = WF14_RUN_SELFTEST(); var p = R.filter(function(x){return x.pass;}).length; console.log("SELFTEST " + p + "/" + R.length); R.forEach(function(x,i){ if(!x.pass) console.log("FAIL " + (i+1) + ": " + x.name + " | " + x.detail); }); process.exit(p === R.length ? 0 : 1);') | node || RC=1

echo "== gate 3/5: DOM structure matrix =="
node dom_check.mjs || RC=1

echo "== gate 4/5: S1/S2 banned token scan =="
node scan_banned.mjs || RC=1

echo "== gate 5/5: gm golden vectors =="
node gm/test.mjs || RC=1

if [ "$RC" -ne 0 ]; then
  echo "run_tests.sh: FAIL (rc=$RC)" >&2
  exit 1
fi
echo "run_tests.sh: PASS (5/5 gates)"
exit 0
