---
type: entity
aliases: [Foundry Nuke, NukeX]
tags: [nuke, dcc, compositing]
applies_to: ["Nuke 13.1v1", "Nuke 14.0v6", "Nuke 15.0v5", "Nuke 16.1v2"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Nuke

Foundry 的节点式合成软件。本机有 MCP 服务端 [[nuke_mcp]] 让 AI 客户端驱动它，另有一份离线 API 整理包 [[nuke_api]]（[[来源 - Claude 全局记忆]]）。

## 要点

- **本机版本**：16.1v2 装在 `/usr/local/Nuke16.1v2`（最新），另有 `/usr/local/Nuke14.0v6`、`/usr/local/Nuke15.0v5`；团队环境走 rez 的 13.1v1。
- **Python 启动钩子**：`NUKE_PATH` 上的 `init.py`（所有模式都执行）和 `menu.py`（只在 GUI 模式执行）。这是普通 Python，和 Python 版本无关，所以一个插件包可以通吃所有 Nuke 版本。
- **终端模式** `Nuke -t x.py`：没有 GUI、没有撤销栈（`nuke.Undo.disabled()` 为 True），`nuke.menu('Nodes')` 抛 "not in GUI mode"。
- 查 API 先翻 [[nuke_api]]：节点参考、每个类的 knob 全表、`nuke`/`nukescripts` 的 docstring 都是从 16.1v2 里自省出来的。

## 用法 / 关键参数

```bash
rez-env nuke==13.1v1 nuke_pd -- Nuke13.1 --nukex   # 团队环境
/usr/local/Nuke16.1v2/Nuke16.1 -t script.py         # 终端模式跑脚本
```

终端模式给脚本传带值的参数会被前端当成帧范围吃掉，参数改走环境变量，见 [[Nuke -t 模式传不进带值的脚本参数]]。

## Python API 速记

| 现象 / 需求 | 正确做法 |
|---|---|
| `print(node)` 打出几十行 knob | 那是整个节点的 tcl 序列化；要名字用 `node.fullName()` |
| 脚本没存过盘时取文件名 | `nuke.scriptName()` 抛 `RuntimeError`，不会返回空串 |
| `nuke.Undo` 的方法 | 是实例方法，要先建实例；`nuke.Undo.undoDescribe()` 直接调报参数个数错 |
| 列出所有节点类 | 没有 `nuke.allNodeClasses()`；`nuke.plugins()` 漏掉编进 `libDDImage.so` 的内置节点（如 `Blur`）。可靠做法是插件列表 + 内置清单 + 文档页名，再逐个真建一遍验证 |
| 给 Enumeration_Knob 设值 | 先查 `knob.values()`，写错的值不报错，见 [[Nuke 枚举 knob 写错值不报错]] |
| 给多分量 knob 打关键帧 | 按 `knob.arraySize()` 逐分量 `setAnimated(i)`，见 [[Nuke setAnimated 只给第一个分量打关键帧]] |
| 读 Format_Knob | `.value()` 返回 `nuke.Format` 对象，要取 `width()`/`height()`/`name()` |
| 读节点帮助 | `node.help()` 对不少类（如 `Grade`）返回 HTML，要清洗 |
| 枚举输入口 | `Merge2.maxInputs()` 是 101，不能按它硬循环；可变输入数的节点断掉中间一路后，后面的会往前塌陷 |
| 批量自省插件 | 少数插件构造时建 QWidget，在 `-t` 下 core dump（如 `execute_panel`、`nukev`）；批量脚本做成可续跑，记下正在处理的那个，重跑时跳过 |

## 常见问题

- [[Nuke 枚举 knob 写错值不报错]]
- [[Nuke setAnimated 只给第一个分量打关键帧]]
- [[Nuke -t 模式传不进带值的脚本参数]]
- [[MCP 工具在会话中途启动 DCC 后接不上]]

## 相关

- 实体：[[nuke_mcp]] —— 驱动 Nuke 的 MCP 服务端
- 实体：[[nuke_api]] —— 离线 API 与节点参考
- 实体：[[rez]] —— 团队环境启动
- 实体：[[Model Context Protocol]] —— AI 客户端驱动 Nuke 的协议
- 问题：[[Nuke 枚举 knob 写错值不报错]] —— 静默保持原值
- 问题：[[Nuke setAnimated 只给第一个分量打关键帧]] —— 分量个数问 arraySize
- 问题：[[Nuke -t 模式传不进带值的脚本参数]] —— 参数改走环境变量
- 问题：[[MCP 工具在会话中途启动 DCC 后接不上]] —— 先开 Nuke 再开会话
- 来源：[[来源 - Claude 全局记忆]]
