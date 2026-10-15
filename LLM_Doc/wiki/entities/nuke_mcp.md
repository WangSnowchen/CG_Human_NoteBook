---
type: entity
aliases: [Nuke MCP]
tags: [nuke, mcp, agent]
applies_to: ["Nuke 16.1v2"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# nuke_mcp

驱动正在运行的 [[Nuke]] 的 MCP 服务端，结构照搬 [[gaffer_mcp]] / [[houdini_mcp]]（见 [[DCC MCP 桥接架构]]）。rez 风格包，路径 `Music/third_party/nuke/nuke_mcp/0.1.0/`，注册在 `Music/.mcp.json` 和 `Music/third_party/nuke/.mcp.json` 的 `nuke` 条目。改它之前先读包内 `WORKLOG.md` 的 `## 当前状态`（决策表、实测坑位、交接点）和 README（[[来源 - Claude 全局记忆]]）。

## 要点

- **43 个工具**：session 11、nodes 8、graph 7、knobs 9、docs 7、`run_python` 1。文档类工具读 [[nuke_api]]。
- **一个包通吃所有 Nuke 版本**：启动钩子是 `NUKE_PATH` 上的普通 Python —— `init.py` 在所有模式下只把包加进 `sys.path`，`menu.py` 只在 GUI 模式拉起桥接层。不需要像 Houdini 那样一个 Python 版本一个 `pythonNNlibs/` 目录。
- 端口 `24747`，状态目录 `~/.nuke_mcp`。
- **同时开两个 Nuke**：后启动的换随机端口并覆盖 `connection.json`（后写者赢），MCP 连到最后启动的那个。
- 热加载只覆盖 `tools/*.py`；改了包内 `python/` 下的模块必须重启 Nuke。

## 用法 / 关键参数

先开 Nuke（GUI），确认 `~/.nuke_mcp/connection.json` 生成，再开 AI 会话。测试分四层：无头（Nuke `-t` 里调全部工具）、协议（假桥接层）、真机 GUI、stdio 端到端。

## 实现时踩到的坑

- 写撤销组的上下文管理器时把 `yield` 包进了 `try/except`，见 [[contextmanager 里 yield 包 try 报 didn't stop after throw]]。
- 测试辅助函数的形参名和工具参数重名：`expectError(..., code=)` 撞上 `run_python` 的 `code` 参数、`Server.call(self, name, ...)` 撞上工具的 `name` 参数，报 `got multiple values for argument`。辅助函数的形参一律加前缀（`errorCode`、`toolName`）。
- Nuke 本身的 API 坑（`print(node)` 是 tcl 序列化、枚举 knob 静默不改、`setAnimated` 只动第一个分量、`-t` 传参等）汇总在 [[Nuke]]。

## 常见问题

- [[MCP 工具在会话中途启动 DCC 后接不上]]
- [[contextmanager 里 yield 包 try 报 didn't stop after throw]]
- [[Nuke 枚举 knob 写错值不报错]]
- [[Nuke setAnimated 只给第一个分量打关键帧]]
- [[Nuke -t 模式传不进带值的脚本参数]]

## 相关

- 实体：[[Nuke]] —— 被驱动的软件
- 实体：[[nuke_api]] —— 文档工具的数据来源
- 综述：[[DCC MCP 桥接架构]] —— 共用的结构
- 实体：[[Model Context Protocol]] —— 底层协议
- 实体：[[gaffer_mcp]] —— 原型
- 实体：[[houdini_mcp]] —— 同一结构的 Houdini 版
- 实体：[[rez]] —— 包按 rez 风格组织
- 问题：[[Python 热加载读到旧字节码]] —— 工具文件热加载用 compile + exec 的原因
- 问题：[[MCP 工具在会话中途启动 DCC 后接不上]] —— 先开 Nuke 再开会话
- 问题：[[contextmanager 里 yield 包 try 报 didn't stop after throw]] —— 撤销组实现的坑
- 问题：[[Nuke 枚举 knob 写错值不报错]] —— 工具里要先校验
- 问题：[[Nuke setAnimated 只给第一个分量打关键帧]] —— 打关键帧工具的实现要点
- 问题：[[Nuke -t 模式传不进带值的脚本参数]] —— 批量自省脚本的传参方式
- 来源：[[来源 - Claude 全局记忆]]
