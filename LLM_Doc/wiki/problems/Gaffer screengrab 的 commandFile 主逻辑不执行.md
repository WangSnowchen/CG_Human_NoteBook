---
type: problem
aliases: [screengrab __name__ builtins]
tags: [gaffer, screenshot, python, testing]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer screengrab 的 commandFile 主逻辑不执行

## 现象

`bin/gaffer screengrab -commandFile x.py ...` 跑完，脚本里该写的报告文件没生成、该建的节点没建，终端也没有任何报错或输出。

## 原因

[[Gaffer screengrab]] 执行 commandFile 时 `__name__ == 'builtins'`，不是 `"__main__"`。脚本里带 `if __name__ == "__main__":` 守卫的主逻辑整段被跳过；screengrab 本身又不打印 commandFile 的异常或输出，所以看起来什么都没发生。

同一上下文里也没有 `__file__`，按 `__file__` 拼路径的代码会直接 NameError（同样可能看不到）。

## 解决

- commandFile 的主逻辑写在模块顶层，直接执行，不加 `__main__` 守卫。
- 需要文件位置时用环境变量或写死绝对路径。
- 想让同一个脚本既能 `gaffer env python` 跑、又能当 commandFile，按上下文判断：`if "script" not in dir() : ...`（screengrab 上下文里预先有 `script` 和 `application`）。
- 报告文件在脚本开头先删旧的；每段探测各自 try/except，异常写进报告，避免一处出错让整份报告消失。

## 验证方法

脚本第一行就往报告文件写一条标记，跑完先确认标记存在，再看后续内容。

## 相关

- 实体：[[Gaffer screengrab]] —— 执行 commandFile 的工具
- 实体：[[gaffer_mcp]] —— 真机端到端测试脚本踩过这一条
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 报告文件与「读到旧报告」的防范
- 来源：[[来源 - Claude 全局记忆]]
