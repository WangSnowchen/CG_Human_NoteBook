---
type: problem
aliases: [registerContinuableSetup, dsh plugin tree failed to load]
tags: [ai, agent, plugin, node]
applies_to: ["dsh 0.1.5-rc.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# dsh 装 agent-teams 插件后后端起不来

## 现象

在 dsh 0.1.5-rc.1 的 web profile 里装了 `@nanmicoder/dsh-agent-teams` 之后，[[dsh-desktop]] 窗口白屏，报 `ERR_CONNECTION_REFUSED`；后端启动日志里有 `plugin tree failed to load`。

## 原因

插件的 `lib/members.js:194` 调用 `ctx.subagents.registerContinuableSetup(...)`。这个 API 所在的整套机制（`SubagentActivationSetupRegistry`）在 dsh 的 commit `3091bdc257`（2026-08-30）里被整个删掉了（[[来源 - Claude 全局记忆]]）：

| dsh 版本 | 有没有 `registerContinuableSetup` |
|---|---|
| 0.1.0-rc.8 | 有 |
| 0.1.2-alpha.2 | 有 |
| 0.1.2-rc.1 及之后（0.1.3-alpha.2、0.1.5-rc.1、HEAD） | 没有 |

0.1.5 也没有提供替代的钩子（现行 `SubagentRuntime` 只有 `startContinuable` / `sendMessage` / `interrupt` / `drain*` / `list`）。

市场的兼容检查会放行：插件的 peer 依赖写的是 `^0.1.2-alpha.2`，0.x 版本的 `^` 实际含义是 `>=0.1.2-alpha.2 <0.2.0`，0.1.5-rc.1 名义上满足。插件最新的 `0.1.16-rc.3` 把 peer 收紧成 `0.1.2-rc.1 || 0.1.2-alpha.5 || 0.1.2-alpha.2`，等于整条插件线只认 0.1.2 系列。

## 解决

两条路按需要选一条：

- 不需要这个插件：卸载。
  ```bash
  cd ~/Music/deepseek-of3d-harness
  ~/.nvm/versions/node/v24.19.0/bin/node --import tsx/esm apps/cli/src/bin.ts plugin --profile web remove @nanmicoder/dsh-agent-teams
  ```
  后端起不来时也可以直接手改 `~/.dsh/profiles/web/package.json`，把它从 `dependencies` 和 `dsh.profile.bundles` 两处删掉。`node_modules/@nanmicoder/` 下残留的目录不在 lockfile、也不在 bundles 里，不会被加载。
- 必须要这个插件：宿主退回 dsh 0.1.2-alpha.2（插件 README 的兼容表：0.1.0-rc.8 对应插件 0.1.14，0.1.2-alpha.2 对应 0.1.15）。

## 验证方法

后端重新启动后日志里没有 `plugin tree failed to load`，stdout 打出带 `token` 查询参数的 `dsh web: http://127.0.0.1:3080/…` 地址，dsh-desktop 窗口正常显示。

排查同类「插件调用了宿主已删除的 API」时，先在插件里搜方法名，再在宿主仓库各个 tag 上数它出现的次数，定位 API 存活区间：

```bash
grep -rn "registerContinuableSetup" <插件>/lib/
git grep -c "registerContinuableSetup" <tag> -- packages/
```

## 相关

- 实体：[[dsh-desktop]] —— 白屏的桌面外壳
- 来源：[[来源 - Claude 全局记忆]]
