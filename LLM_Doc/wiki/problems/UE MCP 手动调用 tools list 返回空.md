---
type: problem
aliases: [Mcp-Session-Id missing, MCP tools/list empty]
tags: [unreal, mcp]
applies_to: ["Unreal Engine 5.8"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# UE MCP 手动调用 tools list 返回空

## 现象

用 curl 或自写的 Python 客户端调试 [[UE ModelContextProtocol 插件]]：

- `tools/list` 返回空列表，不报错；
- 或者 `tools/call` 用 Python `urllib` 读响应，`read()` 得到空字符串，看着像「调用没有结果」。

## 原因

两个独立的原因（[[来源 - Claude 全局记忆]]）：

1. HTTP 传输的 [[Model Context Protocol]] 有会话：`initialize` 的响应头里返回 `Mcp-Session-Id`，后续请求不带这个头，`tools/list` 静默返回空。
2. `tools/call` 的响应是 SSE 单帧（`content-type: text/event-stream`，一行 `event: message` + 一行 `data: {...}`，连接 keep-alive 15 秒）。`urllib` 的 `read()` 在 keep-alive 下拿到空串。`initialize`、`tools/list` 才是普通 JSON。

## 解决

- 顺序固定为：`initialize`（存下 `Mcp-Session-Id`）→ `notifications/initialized` → `tools/list` / `tools/call`，每个请求都带 `Mcp-Session-Id` 和 `Accept: application/json, text/event-stream`。完整 curl 命令见 [[Model Context Protocol]]。
- 读 `tools/call` 的响应要按行读，读到 `data:` 开头的那一行就解析，别等连接关闭；或者直接用 curl。
- 列表里只有 `list_toolsets` / `describe_toolset` / `call_tool` 三个工具是正常的，具体能力靠 `list_toolsets` 发现。

## 验证方法

带上会话头后 `tools/list` 返回这三个元工具；`call_tool` 调 `list_toolsets` 能拿到 toolset 清单。

## 相关

- 实体：[[UE ModelContextProtocol 插件]] —— 出问题的服务端
- 实体：[[Model Context Protocol]] —— 会话头与 SSE 响应
- 实体：[[Unreal Engine]] —— 所属软件
- 来源：[[来源 - Claude 全局记忆]]
