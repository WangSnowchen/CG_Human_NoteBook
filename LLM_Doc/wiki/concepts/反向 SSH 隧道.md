---
type: concept
aliases: [Reverse SSH Tunnel, ssh -R, 远程端口转发]
tags: [network, ssh]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# 反向 SSH 隧道

## 定义

由「服务所在的机器」主动 SSH 到「想访问服务的机器」，并让对方那头开一个监听端口，访问这个端口的流量沿 SSH 连接送回来，转给服务。命令形式是 `ssh -R <对方端口>:<本地地址>:<本地端口> <用户>@<对方主机>`。

适合的场景：服务只监听 `127.0.0.1`、服务所在的机器又不能当 SSH 服务端（没有管理员权限装不了 sshd），但它能主动发起出站 SSH 连接（[[来源 - Claude 全局记忆]]）。

## 在各软件里的对应

- **远程 Windows 上的 UE → 本机 Linux**：[[UE ModelContextProtocol 插件]] 的 MCP 服务写死在 Windows 的 `127.0.0.1:8000`，Windows 没有管理员权限装 OpenSSH Server，但 Win10/11 自带 ssh 客户端。在 Windows 上执行：
  ```bash
  ssh -R 8000:127.0.0.1:8000 <Linux 用户名>@<Linux 主机地址> -N -o ServerAliveInterval=60
  ```
  Linux 这边 sshd 常开即可。之后本机访问 `http://127.0.0.1:8000/mcp` 就到了 Windows 上的 UE。

## 注意事项

- `-N` 只做转发、不开 shell，窗口挂着不动是正常的；窗口要一直开着，关掉隧道就断。
- `-o ServerAliveInterval=60` 定时发心跳，防止空闲连接被中间设备断开。
- 判断隧道是否在线：本机 `ss -tlnp | grep :8000` 有监听，且 `ss -tnp` 能看到来自远程机器的 `:22` ESTAB 连接。
- 隧道在线但远程服务没起时，本机访问会得到空响应（curl 报 `Empty reply from server`），和隧道断开的「连接被拒绝」不一样。

## 相关

- 实体：[[UE ModelContextProtocol 插件]] —— 用隧道连远程编辑器
- 实体：[[Unreal Engine]] —— 远程 Windows 上的编辑器
- 问题：[[UE MCP 服务只监听本机无法远程连接]] —— 隧道解决的问题
- 来源：[[来源 - Claude 全局记忆]]
