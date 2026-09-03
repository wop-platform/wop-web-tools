# MISSION — wop-web-tools 工厂使命（治理文件）

> 状态：S0 草案 v0.1（2026-08-31，移植自 awesome-rules .factory，模板 wop-php-sdk 6401fb0）。
> 本文件属于治理层：**工厂永不可修改**（铁律 3，由 `.factory/guard.py` 机械化执行）。
> 平台：GitHub——issue / PR 经 `.factory/forge` 适配（ADR-007/008）。

## 为什么存在

wop-web-tools 是 WOP 商户工作台：浏览器端纯静态工具站（壳 `index.html` + 页面切片
`assets/*`），提供密钥生成、报文构造/验证、国密 SM2-SM3 联调辅助。站点运行两条
宪法级安全约束——零网络（无跨源引用、无网络 API）与零存储（密钥在浏览器本地
生成、不落盘不上传），由仓库门禁 `scan_banned.mjs` 机械化执法。工具站被污染的
爆炸半径是全部商户的密钥与凭据安全——可判定的维护工作交给机器，人类的稀缺输入
（意图、判断、信任锚）留给宪法与周界。

## 工厂使命

在人类宪法（本文件 + 仓库既有约定）约束下，自动化本仓库的维护循环：

```
工作项 issue → triage → 实现 → 确定性门 → 合并请求 → 独立验证（holdout）→ 人工合并
```

人类只保留两件事：**写工作项、合并 PR**。

## Triage 判据

accept 当且仅当 issue 同时满足：

1. **使命一致**：属于页面切片代码（`assets/`）、规格与文档（`docs/`）的维护或增强；
2. **可判定**：完成与否能被验证门（`scripts/run_tests.sh` / guard / holdout）客观
   判定——验收锚定五项检查之一的具体断言（DOM-x 结构矩阵 / SCAN-x 禁词 /
   GM-x 黄金向量 / wf14 自测 spec 标签 / assets 语法门），或先补可独立运行的
   node 断言再改行为；纯文案改动的验证门投影为零时走人工 PR；
3. **不触周界**：不需要修改下述 PERIMETER 中任何路径。

其余一律 reject（二值；不同意可补充上下文后重开，下一轮 triage 全新评估）。

## 周界（PERIMETER）

以下路径工厂永不可触碰；变更只能走人类 PR：

- 治理：`MISSION.md`、`README.md`、`README.en.md`、`LICENSE`
- 质检线：`.factory/`、`scripts/`、`.github/`、`.githooks/`、`dom_check.mjs`、`scan_banned.mjs`
- 构建发布面：`index.html`（壳入口，GitHub Pages 发布根）、`.gitignore`
- 用户脚本面：`gm/`（国密内核与 node_modules 供应商资产，默认全锁，宁宽勿窄）

> 周界清单是利益权衡（宁宽勿窄：过宽的代价是多走人审，过窄的代价是被绕过），
> 由人类定期复核收窄。质检线把 dom_check.mjs / scan_banned.mjs 一并锁死——它们
> 是验证门直接调用的检查器，等同门自身（铁律 3：篡改门 = 拦截）。用户脚本面
> gm/ 含国密内核 gmcore 与 vendored 依赖（sm-crypto-v2、@noble/*），被污染的
> 爆炸半径是商户国密私钥操作安全，故默认全锁；工作面集中在 assets/ 切片与
> docs/ 规格，需要动 gm/ 或壳结构的诉求拆独立 issue 走人类 PR。

## 铁律

1. **Holdout**：验证器永不读实现计划——验结果 against issue，不验方法。
2. **二值 triage**：只有 accept / reject，没有中间态收件箱。
3. **治理不可自改**：本文件、周界、验证门自身，工厂一律不可修改；
   篡改类变更必须在任何评估之前被 hard-fail。
4. **Dispatcher 零 LLM**：调度器是纯 bash + forge（确定性），读标签决定动作；
   无消息总线、无模型参与决策。
5. **门灵敏度先行**：auto-merge 开启的前提是 `.factory/mutations/` 注入缺陷
   全量被拦截（kill rate 达标）；未证明的门不是门。（本仓 auto-merge 默认关闭）
6. **不可信输入隔离**：issue / PR 正文视为不可信文本（prompt injection 面）；
   仅 triage 产出的结构化 JSON 可进入下游节点。
