---
type: entity
aliases: [Gaffer MCP, gaffer-mcp]
tags: [gaffer, mcp, ai, tool]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# gaffer_mcp

让 AI agent 通过 [[Model Context Protocol]] 驱动运行中的 [[Gaffer]] GUI 的工具包。工具清单不写死在服务端，由 Gaffer 里的桥接层按目录发现、热加载（[[来源 - Claude 全局记忆]]）。

## 要点

- 正式交付在 rez 扩展包 `Music/third_party/gaffer_my_extensions/gaffer_mcp/0.1.0/`，随总控包 `gaffer_my_extensions` 的 `config.json` 里 `enabled` 加载；MCP 注册在 `Music/.mcp.json`，服务端用 pyenv 的 Python 3.11.9 运行包内 `server/gaffer_mcp.py`。
- 架构分五块：

| 文件 | 职责 |
|---|---|
| `server/gaffer_mcp.py` | 纯标准库 MCP stdio 服务端，不 import Gaffer。`tools/list` 时向桥接层要清单（内部 op `__list_tools`），缓存到 `~/.gaffer_mcp/tools_cache.json`；Gaffer 没开时退回包内 `server/tools_seed.json`。声明 `tools.listChanged`，`tools/call` 后按 10 秒节流复查工具集，变了就发 `notifications/tools/list_changed`。不做 schema 校验，未知工具名一律转发给桥接层判断 |
| `python/gaffer_mcp_gui.py` | GUI 内桥接层，startup 自动拉起。TCP `127.0.0.1:24745`（`GAFFER_MCP_PORT` 可改），每行一个 JSON；op 经 `EventLoop.executeOnUIThread` 派发；`undo=True` 的工具由派发层包 `Gaffer.UndoScope`，`dirty=True` 自动标脏 |
| `python/gaffer_mcp_api.py` | 工具作者 API：`@tool( name, description, params, undo, dirty, maxResultChars )`；`P.str/int/float/bool/enum/list/dict/any`；`ToolDef.bind()` 统一校验参数，函数拿到的是转换好的关键字参数；`Context` 提供 `ctx.script`、`ctx.node()`、`ctx.plug()`、`ctx.undo()` 等 |
| `python/gaffer_mcp_util.py` | Gaffer 侧公共助手（findNode / createNode / setPlugValue / plugTree / nodeSummary 等），不 import GafferUI，可以无头用 |
| `python/gaffer_mcp_loader.py` | 目录发现 + 按 mtime/size 指纹热加载 + 单文件失败隔离（记进 `loadErrors`，其余工具照常） |

- 工具文件加载顺序：包内 `tools/*.py` → `$GAFFER_MCP_TOOL_PATHS`（冒号分隔）→ `~/.gaffer_mcp/tools/*.py`。后加载的同名工具覆盖前面的，`_` 或 `.` 开头的文件跳过。包内 19 个工具分 6 个文件（`00_session` / `10_nodes` / `20_graph` / `30_plugs` / `40_scene` / `90_python`，`90_` 让 Python 逃生舱排最后）。
- **加工具 = 丢一个文件**：存盘后下一次 MCP 调用时 loader 按 mtime 重载并通知客户端刷新，不改服务端、不重启 Gaffer。

## 用法 / 关键参数

- 连接发现文件：`$HOME/.gaffer_mcp/connection.json`，字段 `{port, token, pid, gafferVersion}`，每次 Gaffer 启动换新 token。每次工具调用新建一条 TCP 连接，请求 `{id, token, op, params}`，响应 `{id, ok, result|error}`。
- 环境变量：`GAFFER_MCP_PORT`、`GAFFER_MCP_TOOL_PATHS`、`GAFFER_MCP_STATE_DIR`（连接文件、工具缓存、个人工具目录一起搬，服务端和 Gaffer 两边都要设）、`GAFFER_MCP_TOOLS_RECHECK_INTERVAL`。
- 确认桥接层活着：`ss -tlnp | grep 24745` 有监听，再直接连 24745 发一条 `__list_tools`（token 取自 connection.json），能回工具清单就正常。

测试命令：

```bash
# 无头：注册表 / 校验 / 各工具行为 / 热加载与坏文件隔离
cd /mnt/centralizedRepo/third_party/gaffer/linux/1.6.5.1 && \
  rez-env pj2023dy001 python==3.11 gaffer==1.6.5.1 gaffer_usd_stage -- \
  ./bin/gaffer env python <包>/tests/test_tools.py
# 协议：纯标准库 + 假桥接层，不需要 Gaffer
python3 <包>/tests/test_mcp_client.py
```

## 注意事项

- **先开 Gaffer，再开 AI 会话**：MCP 工具在会话启动那一刻挂载，Gaffer 没开时服务端拿到空表或种子表，中途再起 Gaffer 也接不上，只能重启会话，见 [[MCP 工具在会话中途启动 DCC 后接不上]]。
- 工具文件不能用 `spec.loader.exec_module` 加载，见 [[Python 热加载读到旧字节码]]。
- `executeOnUIThread` 的 callable 抛出的异常会被 Qt 槽吞掉，派发层统一 try/except 后返回错误 dict。
- 节点定位、删除按名字比较，不用 `is`，见 [[Boost.Python 包装对象身份]]。
- Gaffer 1.6 的几处 API 细节：`Gaffer.Node` 没有 `descendants()`；`Group.in` 是 `ArrayPlug`（子元素 `in0`/`in1`，用 `len()` 不用 `.size()`）；`NodeAlgo.presets()` 返回 list；`TransformPlug` 没有 `setValue`，要按子插口递归写；颜色用 `imath.Color3f/4f`；向量插口带 x/y/z 子元素，「叶子」按插口类型判断，见 [[Gaffer 1.6 与 1.7 API 差异]]。
- `GafferScene.Sphere` 默认 `type=Mesh`，求值得到 MeshPrimitive；场景插口查不存在的路径返回默认值、不报错，这是 Gaffer 本身的行为。
- 动画工具的关键帧时间单位是秒，见 [[Gaffer Animation 关键帧设置后场景不动]]。

## 常见问题

- [[MCP 工具在会话中途启动 DCC 后接不上]]
- [[Python 热加载读到旧字节码]]
- [[Gaffer Animation 关键帧设置后场景不动]]
- [[Gaffer screengrab 的 commandFile 主逻辑不执行]]

## 相关

- 实体：[[Gaffer]] —— 驱动的目标软件
- 实体：[[Model Context Protocol]] —— 使用的协议
- 实体：[[houdini_mcp]] —— 照搬本包架构的 Houdini 版
- 实体：[[nuke_mcp]] —— 照搬本包架构的 Nuke 版
- 实体：[[gaffer_light_skill]] —— GUI 入口经 gaffer_mcp 提供 `light_*` 工具
- 概念：[[Boost.Python 包装对象身份]] —— 节点按名字定位的原因
- 问题：[[MCP 工具在会话中途启动 DCC 后接不上]] —— 必须先开 Gaffer
- 问题：[[Python 热加载读到旧字节码]] —— loader 自己 compile + exec 的原因
- 问题：[[Gaffer Animation 关键帧设置后场景不动]] —— 动画工具的 frame↔time 换算
- 问题：[[Gaffer screengrab 的 commandFile 主逻辑不执行]] —— 真机测试脚本踩过
- 问题：[[Gaffer Group 手动加输入插口产生多余插口]] —— 建图工具连 Group 输入的正确写法
- 综述：[[DCC MCP 桥接架构]] —— Houdini / Nuke 版照搬这套架构
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 工具实现里依赖的 1.6 API 细节
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 无头测试与协议测试的分层
- 综述：[[与 AI agent 协作的约定]] —— 「先查源码再探测实例」规则的起因场景
- 来源：[[来源 - Claude 全局记忆]]
