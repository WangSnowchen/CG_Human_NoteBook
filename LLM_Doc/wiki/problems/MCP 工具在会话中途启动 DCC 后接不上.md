---
type: problem
aliases: [MCP tools missing after starting DCC]
tags: [mcp, agent, gaffer, houdini, nuke, unreal]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# MCP 工具在会话中途启动 DCC 后接不上

## 现象

先开了 AI 会话，再启动 Gaffer / Houdini / Nuke（或远程 UE 的 MCP 服务），会话里一直用不了这个 DCC 的工具：ToolSearch 搜 `mcp__gaffer__*`、`unreal` 之类没有结果，或者只有一份陈旧的工具列表。

## 原因

客户端在**会话启动那一刻**向 MCP 服务端要 `tools/list` 并挂载工具。那时 DCC 没开、桥接端口没人监听，服务端只能返回空表（或退回包内的种子列表），这个结果在本会话内固定下来，之后 DCC 起来也不会自动接上（[[来源 - Claude 全局记忆]]）。

## 解决

1. 先启动 DCC，并让 GUI 一直开着。
2. 确认桥接层活着：
   ```bash
   ss -tlnp | grep 24745          # Gaffer；Houdini 24746、Nuke 24747
   cat ~/.gaffer_mcp/connection.json
   ```
3. **重启 AI 会话**。

UE 的情况：先在 UE 控制台执行 `ModelContextProtocol.StartServer`，确认 `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8000/mcp` 返回 405，再重启会话。

## 验证方法

重启前想确认桥接层能回工具列表，可以直接连端口发内部 op（token 取 `connection.json` 里的值）：

```bash
python3 - <<'EOF'
import json, socket, os
info = json.load(open(os.path.expanduser("~/.gaffer_mcp/connection.json")))
s = socket.create_connection(("127.0.0.1", info["port"]))
s.sendall((json.dumps({"id": 1, "token": info["token"], "op": "__list_tools", "params": {}}) + "\n").encode())
print(s.makefile().readline()[:300])
EOF
```

重启会话后 ToolSearch 能搜到对应前缀的工具即恢复。

## 相关

- 实体：[[Model Context Protocol]] —— 工具在会话启动时挂载
- 综述：[[DCC MCP 桥接架构]] —— 服务端向桥接层要工具列表的机制
- 实体：[[gaffer_mcp]] —— 同一个问题
- 实体：[[houdini_mcp]] —— 同一个问题
- 实体：[[nuke_mcp]] —— 同一个问题
- 实体：[[UE ModelContextProtocol 插件]] —— 远程 UE 也是先起服务再开会话
- 实体：[[Gaffer]] / [[Houdini]] / [[Nuke]] / [[Unreal Engine]] —— 要先启动的 DCC
- 来源：[[来源 - Claude 全局记忆]]
