---
type: problem
aliases: [pythonrc __file__ NameError]
tags: [houdini, python, startup]
applies_to: ["Houdini 21.0.596"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Houdini pythonrc 里没有 __file__

## 现象

在 `python3.11libs/pythonrc.py` 里用 `os.path.dirname(__file__)` 找自己所在的包，Houdini 启动后启动钩子像是「根本没跑」：桥接层没起来，也看不到明显报错。

## 原因

Houdini 执行 `pythonrc.py` 时不设置 `__file__`，访问它抛 `NameError`，而这个异常被启动流程吞掉了（[[来源 - Claude 全局记忆]]）。

## 解决

包根目录不从 `__file__` 推，改由 Houdini package 文件设一个环境变量，`pythonrc.py` 读它（下面是写法示意，[[houdini_mcp]] 用的变量名是 `HOUDINI_MCP_ROOT`）：

```json
{
  "env": [{"HOUDINI_MCP_ROOT": "<包根目录>"}],
  "path": "$HOUDINI_MCP_ROOT"
}
```

```python
import os, sys
root = os.environ["HOUDINI_MCP_ROOT"]
sys.path.insert(0, os.path.join(root, "python"))
```

[[houdini_mcp]] 的个人包是 `~/houdini21.0/packages/houdini_mcp.json`。

## 验证方法

启动 Houdini 后确认桥接层在监听：`ss -tlnp | grep 24746`，且 `~/.houdini_mcp/connection.json` 已生成。

## 相关

- 实体：[[Houdini]] —— 启动钩子机制
- 实体：[[houdini_mcp]] —— 踩到这个问题的包
- 来源：[[来源 - Claude 全局记忆]]
