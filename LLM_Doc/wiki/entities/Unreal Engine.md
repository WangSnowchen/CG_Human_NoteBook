---
type: entity
aliases: [UE, UE5, Unreal]
tags: [unreal, dcc, realtime]
applies_to: ["Unreal Engine 5.8"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Unreal Engine

Epic 的实时引擎。本机环境里 UE 5.8 跑在一台远程 Windows 机器上（installed build），本机 Linux 上有它的源码检出、离线文档和 C++ 反射索引，AI 客户端经 [[UE ModelContextProtocol 插件]] 驱动远程编辑器（[[来源 - Claude 全局记忆]]）。

## 要点

- **问 UE 相关的问题先查本地资料**，不上网、不凭记忆。统一入口在 `Music/third_party/unreal/`：
  ```bash
  python3 ue.py <关键词>     # 认中文别名，如「平行光」；同时给文档页和 C++ 类
  ```
  细查分别用 [[ue_docs]]（官方指南离线副本）和 [[ue_api]]（C++ 反射索引）。
- **源码检出**：`Music/_repos/EpicGames/UnrealEngine`（浅克隆）。里面几乎没有成文文档，见 [[ue_docs]]「为什么要抓在线文档」。
- **文档和源码说法不一致时以源码为准**：在线文档有滞后，反射标记里的 `Category` / `meta` 就是细节面板背后的数据。
- **远程驱动**：编辑器里启用 `ModelContextProtocol` + `AllToolsets` 两个实验插件，MCP 服务只监听远程机器的本机地址，要用 [[反向 SSH 隧道]] 转到 Linux 这边。
- **unreal-mcp 技能**：Epic 的 Claude Code 插件源码在 `Music/_repos/EpicGames/unreal-engine-skills-for-claude-code-plugin`（3 个技能 + 1 个 hook）。VSCode 扩展环境里 `/plugin` 命令不可用，把其中 `skills/unreal-mcp` 复制到 `~/.claude/skills/` 就等于装上了核心能力。
- 自制的 Gaffer 拾色器 [[ueColorChooser]] 移植自 UE 的 `SColorPicker`（`Engine/Source/Runtime/AppFramework/Private/Widgets/Colors/`）。

## 用法 / 关键参数

编辑器控制台：

```text
ModelContextProtocol.StartServer
ModelContextProtocol.GenerateClientConfig ClaudeCode
```

第二条必须带客户端名参数，裸跑只打印 Usage。

## 常见问题

- [[UE MCP 服务只监听本机无法远程连接]]
- [[UE MCP 手动调用 tools list 返回空]]
- [[MCP 工具在会话中途启动 DCC 后接不上]]

## 相关

- 实体：[[UE ModelContextProtocol 插件]] —— AI 客户端驱动编辑器的方式
- 实体：[[ue_docs]] —— 官方指南离线副本
- 实体：[[ue_api]] —— C++ 反射索引
- 概念：[[反向 SSH 隧道]] —— 把远程编辑器的 MCP 端口转到本机
- 实体：[[Model Context Protocol]] —— 底层协议
- 实体：[[ueColorChooser]] —— 移植自 UE 拾色器的 Gaffer 控件
- 问题：[[UE MCP 服务只监听本机无法远程连接]] —— 远程连接要隧道
- 问题：[[UE MCP 手动调用 tools list 返回空]] —— 手动调试要带会话头
- 问题：[[MCP 工具在会话中途启动 DCC 后接不上]] —— 先起服务再开会话
- 来源：[[来源 - Claude 全局记忆]]
