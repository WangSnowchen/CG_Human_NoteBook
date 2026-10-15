---
type: problem
aliases: [Nuke -t argument parsed as frame range]
tags: [nuke, cli, python]
applies_to: ["Nuke 16.1v2"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Nuke -t 模式传不进带值的脚本参数

## 现象

```bash
Nuke16.1 -t dump.py -- --limit 50
```

脚本里 `sys.argv` 拿不到 `--limit 50`，终端打出 `will be used as a Frame Range argument`。

## 原因

Nuke 的命令行前端会把裸数字当成帧范围吃掉，即使写在 `--` 后面也一样（[[来源 - Claude 全局记忆]]）。

## 解决

脚本参数改用环境变量传：

```bash
DUMP_LIMIT=50 Nuke16.1 -t dump.py
```

```python
import os
limit = int(os.environ.get("DUMP_LIMIT", "0"))
```

[[nuke_api]] 的重建脚本和 [[nuke_mcp]] 的无头测试都用这种方式传参。

## 验证方法

脚本开头打印收到的值，确认和环境变量一致，终端不再出现 Frame Range 提示。

## 相关

- 实体：[[Nuke]] —— 命令行行为
- 实体：[[nuke_api]] —— 重建脚本用环境变量传参
- 实体：[[nuke_mcp]] —— 无头测试同样处理
- 来源：[[来源 - Claude 全局记忆]]
