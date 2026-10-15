---
type: problem
aliases: [QScrollArea widgetResizable clamp, BoolWidget 固定宽度]
tags: [qt, gafferui, layout]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# QScrollArea 内容展开后整列变窄

## 现象

[[gaffer_parameter_editor]] 曾有一个节点类型过滤器（放在 `QScrollArea` 里，按模块分组，模块可折叠）。展开一个模块后，右边「已开 / 总数」计数整列往左跳，收起又弹回去；实测内容宽度 218 → 121px，计数 x 坐标 207 → 110。两根滚动条展开前后都不可见（[[来源 - Claude 全局记忆]]）。该侧栏后来整体移除，问题本身是通用的 Qt 布局规则。

## 原因

- `GafferUI.BoolWidget` 内部的 `_CheckBox` 是 **Fixed / Fixed** size policy（`BoolWidget.py` 写死）。
- 竖排布局的**最大宽度 = 各子项最大宽度里最小的那个**。一展开，整组的最大宽度就被最窄的那个复选框限制住。
- `QScrollArea` 在 `widgetResizable` 下会把内容控件**夹到它的最大尺寸**（`qSmartMaxSize`），整列跟着缩窄。收起时组里只剩带 expand `Spacer` 的标题行，没有上限，所以又弹回去。

## 解决

复选框横向 size policy 改成 `QSizePolicy.Minimum`（能长不能缩、最大值无上限），竖向保持 `Fixed`：

```python
checkBox._qtWidget().setSizePolicy( QtWidgets.QSizePolicy.Minimum, QtWidgets.QSizePolicy.Fixed )
```

## 验证方法

界面「跳一段」时先别猜滚动条，直接打印三个数：`scrollArea.viewport().width()`、内容控件 `width()`、两根滚动条的 `isVisible()`。修好后展开 / 收起前后计数的 x 坐标不变（真机实测三个模块都是 246 → 246）。

## 相关

- 实体：[[gaffer_parameter_editor]] —— 出现问题的面板
- 实体：[[Qt]] —— 布局规则所属框架
- 综述：[[Qt 自绘界面常见坑]] —— Qt 布局类问题汇总
- 来源：[[来源 - Claude 全局记忆]]
