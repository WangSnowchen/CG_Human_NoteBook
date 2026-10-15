---
type: problem
aliases: [Spreadsheet 滚动错行, _LinkedScrollBar]
tags: [gaffer, gafferui, qt, spreadsheet]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Spreadsheet 表格滚到底差一行

## 现象

把原生 [[Gaffer Spreadsheet]] 表格控件放进自己排版的行里（[[gaffer_parameter_editor]]），滚到底时左边行名表和右边单元格表错开一行；两张表滚动条状态不同，例如 `[0,20]/6` 和 `[0,19]/7`（范围 / pageStep）（[[来源 - Claude 全局记忆]]）。

## 原因

Spreadsheet 的三张 `QTableView` 靠 `_LinkedScrollBar` 互相绑定滚动。这个类有个 `__isUpdating` 守卫，**同一轮事件里的第二次 range 变化会被吞掉**。自排版容器会让表格在一轮里变两次尺寸（tab 分区一次、行的 `SetMinAndMaxSize` 一次），行名表停在旧的 pageStep 上。

## 解决

每张表手动 `updateGeometries()` 同步一次，时机有三处：表格建好时、面板刷新时、**面板每次 resize 时**。GafferUI 没有 resize 信号，要装一个 `QObject` 事件过滤器收 `QEvent.Resize`。

同一类行里还有一个附带问题：Qt 的 `:hover` 在鼠标位于子控件上时也为真，整行 hover 高亮会让一进表格整块几百像素都变亮。判据「行里有没有 `QAbstractItemView` / `QPlainTextEdit` / `QTextEdit`」，有就另挂一个动态属性关掉 hover 规则；负责背景透明的 `gafferParameterEditorRow` 属性保持不动。

## 验证方法

打印三张表各自滚动条的 `minimum()` / `maximum()` / `pageStep()`，滚到底后两边一致；调整面板大小后再比一次。

## 相关

- 实体：[[gaffer_parameter_editor]] —— 把表格塞进自排行的自制面板
- 实体：[[Gaffer Spreadsheet]] —— 出问题的原生表格
- 综述：[[在 Gaffer 里另做参数面板]] —— 塞原生大控件进自排行的注意事项
- 来源：[[来源 - Claude 全局记忆]]
