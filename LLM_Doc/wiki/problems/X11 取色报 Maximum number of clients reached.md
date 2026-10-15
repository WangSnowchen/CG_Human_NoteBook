---
type: problem
aliases: [XOpenDisplay 连接耗尽]
tags: [x11, linux, ctypes]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# X11 取色报 Maximum number of clients reached

## 现象

按住吸管实时取色（[[eyeDropper]]）一小会儿后，终端不停刷 `Maximum number of clients reached`，取色和其他程序打开新窗口都可能失败（[[来源 - Claude 全局记忆]]）。

## 原因

每次采样都调用 `XOpenDisplay()` 新开一个 X 连接。实时预览约 30ms 采一次，很快耗尽 X 服务器约 256 个客户端连接的上限。

## 解决

display 连接做成**进程级单例**缓存，第一次打开后一直复用：

```python
_display = None

def _getDisplay() :
	global _display
	if _display is None :
		_display = _xlib.XOpenDisplay( None )
	return _display
```

## 验证方法

连续采样几千次后，用 `xlsclients` 或观察终端，确认没有新增连接、没有报错。

## 相关

- 实体：[[eyeDropper]] —— 出问题的取色模块
- 问题：[[X11 屏幕取色读到同一个灰色]] —— 同一模块的另一个 X11 坑
- 来源：[[来源 - Claude 全局记忆]]
