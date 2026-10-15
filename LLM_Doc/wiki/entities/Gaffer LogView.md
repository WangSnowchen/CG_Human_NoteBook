---
type: entity
aliases: [LogView, logview, 日志面板]
tags: [gaffer, gafferui, ipr, logging]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer LogView

用户自制的 [[Gaffer]] layout 编辑器，把终端、IPR、dispatch 的全部日志集中显示在布局里的一个面板上（[[来源 - Claude 全局记忆]]）。

## 要点

- 实现：`~/gaffer/python/logview.py` + `~/gaffer/startup/gui/logview.py`（薄包装）。
- 注册：`GafferUI.Editor.registerType( "LogView", cls )` + `GafferUI.Layouts.acquire( application ).registerEditor( "LogView" )`。Editor 类必须实现 `__repr__`（layout 序列化要用）。
- 所有日志都经过已安装的 `IECore.MessageHandler` 默认 handler。在原 handler 后面用 `CompoundMessageHandler` 挂一个捕获 handler。
- **`CompoundMessageHandler.addHandler()` 不持有 Python handler 的强引用**，handler 要做成模块全局变量，否则会被 GC 静默回收、日志不再进来。
- 捕获到的消息转发给活着的 `GafferUI.MessageWidget`（`widget.messageHandler().handle()`，线程安全，内部经 `executeOnUIThread` 回到 UI 线程），并保留一份历史缓冲给后建的面板。
- stdout / stderr 也 tee 进捕获 handler，`print` 和渲染器控制台输出能进日志；默认 handler 写的是 C 层 stderr，绕过 Python 的 `sys.stderr`，不会重复捕获。

## 常见问题

- [[Gaffer IPR 日志过多导致界面卡死]]：渲染线程每条消息排一次 UI 回调导致事件队列无限增长，以及历史裁剪的 O(n) 陷阱。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 问题：[[Gaffer IPR 日志过多导致界面卡死]] —— 批量合并消息的修法
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 新增 Editor 类型的注册方式
- 来源：[[来源 - Claude 全局记忆]]
