---
type: problem
aliases: [UE MCP 127.0.0.1:8000 remote access]
tags: [unreal, mcp, network]
applies_to: ["Unreal Engine 5.8"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# UE MCP 服务只监听本机无法远程连接

## 现象

UE 编辑器里执行了 `ModelContextProtocol.StartServer`，日志显示服务已启动，但从另一台机器访问 `http://<UE 机器>:8000/mcp` 连接被拒绝。

## 原因

[[UE ModelContextProtocol 插件]] 在 `ModelContextProtocolServer.cpp` 里直接调 `StartAllListeners()`，监听地址写死为 `127.0.0.1:8000`（日志 `Created new HttpListener on 127.0.0.1:8000`），没有配置项能改成对外监听（[[来源 - Claude 全局记忆]]）。

## 解决

用 [[反向 SSH 隧道]]。UE 所在的 Windows 机器上（不需要管理员权限，用系统自带 ssh 客户端）：

```bash
ssh -R 8000:127.0.0.1:8000 <Linux 用户名>@<Linux 主机地址> -N -o ServerAliveInterval=60
```

窗口保持开着。Linux 端 `.mcp.json` 写 `"url": "http://127.0.0.1:8000/mcp"`。

## 验证方法

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/mcp
```

返回 `405` 即通（端点只接受 POST / SSE，GET 405 是预期）。返回 `000` 或 `Empty reply from server` 说明隧道在、但 UE 那边服务没起。

## 相关

- 实体：[[UE ModelContextProtocol 插件]] —— 监听地址写死
- 概念：[[反向 SSH 隧道]] —— 解决方式
- 实体：[[Unreal Engine]] —— 远程编辑器
- 实体：[[Model Context Protocol]] —— HTTP 传输
- 来源：[[来源 - Claude 全局记忆]]
