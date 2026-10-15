---
type: entity
aliases: ["@liustack/modlens", 读图插件]
tags: [ai, agent, vision]
applies_to: ["modlens 3.26.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# modlens

给没有视觉能力的文本模型加「读图」的工具（npm 包 `@liustack/modlens`）：把图片交给一个视觉模型，转成结构化 JSON（逐字转写、版面区域、语义、视觉线索）再交给文本模型。本机同时装成 dsh 插件和 Claude Code 技能（[[来源 - Claude 全局记忆]]）。

## 要点

- **dsh 插件**：装在 dsh 的 `web` profile 里（版本 3.26.1），重启后模型选择器里出现带 `(modlens vision)` 的条目，见 [[dsh-desktop]]。
- **Claude Code 技能**：`~/.claude/skills/modlens/`（官方技能 + 本机补丁）。会话里出现图片路径、URL 或粘贴图片占位符，而当前模型没有原生视觉时自动触发。
- **配置** `~/.modlens/config.json`（权限 0600，dsh 插件和 Claude Code 技能共用）：`provider=gemini-api`，并配置内网代理（Google 域名被墙，不走代理读图会超时）。本机用的 Gemini key 是 `AQ.` 开头的格式，实测可用。
- 运行需要 node 24（系统 node v10 跑不了），与 [[dsh-desktop]] 相同。

## 用法 / 关键参数

本机补丁让技能脚本能找到装在 dsh profile 里的那份 modlens，**重新拷贝官方技能会丢失，需要重打**：

- `scripts/run.sh` 新增 `find_local()`：查找 `~/.dsh/profiles/*/node_modules/.bin/modlens` 和 nvm 里的 node 24，并接进 `resolve()` / `run_cli()` / `run()` 的 local 分支。
- `collect()` / `run()` 里设了 `G_SEL=local` 之后要再执行一次 `find_local || true`：`resolve()` 在命令替换的子 shell 里运行，设置的 `LOCAL_*` 变量传不回主 shell，不重跑的话链式调用 doctor 会报 `command not found`。

## 相关

- 实体：[[dsh-desktop]] —— modlens 作为 dsh profile 插件安装
- 综述：[[与 AI agent 协作的约定]] —— 看图的方式约定
- 来源：[[来源 - Claude 全局记忆]]
