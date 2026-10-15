---
type: entity
aliases: [unreal-mcp, UE MCP, ModelContextProtocol plugin, AllToolsets]
tags: [unreal, mcp, agent]
applies_to: ["Unreal Engine 5.8"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# UE ModelContextProtocol 插件

[[Unreal Engine]] 自带的实验插件，在编辑器里起一个 HTTP 传输的 [[Model Context Protocol]] 服务端，让 AI 客户端调用编辑器里的各种 toolset。插件源码在 `Engine/Plugins/Experimental/ModelContextProtocol` 和 `Engine/Plugins/Experimental/Toolsets/AllToolsets`（[[来源 - Claude 全局记忆]]）。

## 要点

- **要在 `.uproject` 里显式启用两个插件**：`ModelContextProtocol` 和 `AllToolsets`。两者都是 `EnabledByDefault=false`；`AllToolsets` 还是 `EditorOnly=true`，它聚合了 21 个 toolset 插件。
- **服务地址写死 `127.0.0.1:8000`**：`ModelContextProtocolServer.cpp` 里直接 `StartAllListeners()`，日志 `Created new HttpListener on 127.0.0.1:8000`。别的机器直连不上，见 [[UE MCP 服务只监听本机无法远程连接]]。
- **只暴露 3 个元工具**：`list_toolsets` / `describe_toolset` / `call_tool`。约 52 个 toolset 要先 `list_toolsets` 发现再用 `call_tool` 调。看到只有 3 个工具是正常的。
- 端点只接受 POST / SSE，GET 返回 405。
- 手动调试必须带 `Mcp-Session-Id`，`tools/call` 的结果是 SSE 单帧，见 [[UE MCP 手动调用 tools list 返回空]]。

## 用法 / 关键参数

1. 编辑器控制台起服务、生成客户端配置：
   ```text
   ModelContextProtocol.StartServer
   ModelContextProtocol.GenerateClientConfig ClaudeCode
   ```
2. 远程机器上开 [[反向 SSH 隧道]]，把它的 8000 端口转到本机 8000。
3. 本机 `.mcp.json` 加一条：
   ```json
   "unreal-mcp": {"type": "http", "url": "http://127.0.0.1:8000/mcp"}
   ```
4. 把 unreal-mcp 技能复制到 `~/.claude/skills/unreal-mcp/`（含 `references/`），然后**重启会话**。

## 每次开工的检查顺序

```bash
ss -tlnp | grep :8000       # 有 127.0.0.1:8000 监听 = 隧道在本机这头开着
ss -tnp | grep ':22'        # 有到远程机器的 ESTAB 连接 = 隧道在线
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/mcp
```

| curl 结果 | 含义 |
|---|---|
| `405` | 通了 |
| `000` / `Empty reply from server` | 隧道在，但远程 UE 没执行 `ModelContextProtocol.StartServer`（隧道转发到一个空端口） |

服务没起时不用到 Windows 上手动敲：本机常开着一个 VNC 客户端连着远程桌面。用 `xdotool search --name` 找标题带远程主机名的那个窗口（同名的十几个小窗口是托盘 / 传输窗，别选错），**每次现问** `xdotool getwindowgeometry <id>`（位置和尺寸每次都不一样），再 `windowactivate` → 点 Output Log 控制台输入框 → `type "ModelContextProtocol.StartServer"` → `key Return`。`import -window <id> x.png` 抓图看状态。

## 常见问题

- [[UE MCP 服务只监听本机无法远程连接]]
- [[UE MCP 手动调用 tools list 返回空]]
- [[MCP 工具在会话中途启动 DCC 后接不上]]

## 相关

- 实体：[[Unreal Engine]] —— 所属软件
- 实体：[[Model Context Protocol]] —— 底层协议
- 概念：[[反向 SSH 隧道]] —— 远程连接方式
- 综述：[[DCC MCP 桥接架构]] —— 本机自写的 DCC 服务端用另一套结构
- 问题：[[UE MCP 服务只监听本机无法远程连接]] —— 只监听 127.0.0.1
- 问题：[[UE MCP 手动调用 tools list 返回空]] —— 会话头与 SSE
- 问题：[[MCP 工具在会话中途启动 DCC 后接不上]] —— 先起服务再开会话
- 来源：[[来源 - Claude 全局记忆]]
