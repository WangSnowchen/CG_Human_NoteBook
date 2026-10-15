---
type: entity
aliases: [MCP, 模型上下文协议]
tags: [ai, mcp, agent]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Model Context Protocol

让 AI 客户端（Claude Code 等）调用外部工具的协议，基于 JSON-RPC。本机用它驱动正在运行的 DCC：[[Gaffer]]、[[Houdini]]、[[Nuke]] 各有一个自写的 MCP 服务端，[[Unreal Engine]] 用官方插件（[[来源 - Claude 全局记忆]]）。

## 要点

- **两种传输**：
  - stdio —— 客户端起一个子进程，每行一条 JSON-RPC 消息。本机自写的 [[gaffer_mcp]]、[[houdini_mcp]]、[[nuke_mcp]] 都走这种。
  - HTTP（流式 HTTP）—— 客户端 POST 到一个 URL，响应可以是普通 JSON，也可以是 SSE 流。[[UE ModelContextProtocol 插件]] 走这种。
- **握手顺序**：`initialize` → `notifications/initialized` → `tools/list` → `tools/call`。
- **工具集可以动态变化**：服务端在 `initialize` 的 `capabilities` 里声明 `tools.listChanged`，工具集变了就发 `notifications/tools/list_changed`，客户端收到后重新 `tools/list`。本机三个 DCC 服务端都用这个机制做「丢一个工具文件就生效」，见 [[DCC MCP 桥接架构]]。
- **HTTP 传输的会话**：`initialize` 的响应头里带 `Mcp-Session-Id`，之后每个请求都要带上这个头，不带的话 `tools/list` 静默返回空。请求头还要有 `Accept: application/json, text/event-stream`。
- **HTTP 传输的工具调用结果是 SSE 单帧**：`content-type: text/event-stream`，正文是一行 `event: message` 加一行 `data: {...}`；`initialize`、`tools/list` 才是普通 JSON 正文。
- **客户端在会话启动那一刻挂载工具**：服务端当时连不上 DCC、拿不到工具列表，本会话就一直没有这批工具，中途把 DCC 起来也不会自动接上。见 [[MCP 工具在会话中途启动 DCC 后接不上]]。

## 用法 / 关键参数

Claude Code 的注册写在项目根的 `.mcp.json`（本机在 `Music/.mcp.json`），stdio 服务端写命令，HTTP 服务端写地址：

```json
{
  "mcpServers": {
    "gaffer": {
      "command": "/home/wangxuechen/.pyenv/versions/3.11.9/bin/python3",
      "args": ["<gaffer_mcp 包>/server/gaffer_mcp.py"]
    },
    "unreal-mcp": {"type": "http", "url": "http://127.0.0.1:8000/mcp"}
  }
}
```

改了 `.mcp.json` 或新加技能后要**重启会话**才生效。

手动用 curl 探一个 HTTP 服务端（顺序不能乱，SID 换成第一步响应头里的值）：

```bash
URL=http://127.0.0.1:8000/mcp
H1='Content-Type: application/json'
H2='Accept: application/json, text/event-stream'

# 1. initialize，记下响应头 Mcp-Session-Id
curl -si $URL -H "$H1" -H "$H2" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'

SID=<上一步的 Mcp-Session-Id>
# 2. initialized 通知
curl -s $URL -H "$H1" -H "$H2" -H "Mcp-Session-Id: $SID" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'
# 3. 列工具
curl -s $URL -H "$H1" -H "$H2" -H "Mcp-Session-Id: $SID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

## 常见问题

- [[MCP 工具在会话中途启动 DCC 后接不上]]
- [[UE MCP 手动调用 tools list 返回空]]
- [[UE MCP 服务只监听本机无法远程连接]]

## 相关

- 综述：[[DCC MCP 桥接架构]] —— 本机三个 DCC 服务端共用的设计
- 实体：[[gaffer_mcp]] —— Gaffer 的 MCP 服务端
- 实体：[[houdini_mcp]] —— Houdini 的 MCP 服务端
- 实体：[[nuke_mcp]] —— Nuke 的 MCP 服务端
- 实体：[[UE ModelContextProtocol 插件]] —— UE 官方的 MCP 服务端（HTTP）
- 实体：[[Gaffer]] / [[Houdini]] / [[Nuke]] / [[Unreal Engine]] —— 被驱动的 DCC
- 问题：[[MCP 工具在会话中途启动 DCC 后接不上]] —— 工具只在会话启动时挂载
- 问题：[[UE MCP 手动调用 tools list 返回空]] —— 漏带会话头
- 问题：[[UE MCP 服务只监听本机无法远程连接]] —— 远程 DCC 要靠隧道
- 综述：[[与 AI agent 协作的约定]] —— 实例探测只用于最后验证
- 来源：[[来源 - Claude 全局记忆]]
