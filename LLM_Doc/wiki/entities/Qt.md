---
type: entity
aliases: [PySide6, Qt.py, QGraphicsView]
tags: [qt, ui, python]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Qt

跨平台 C++ 界面库。[[Gaffer]] 的界面层 GafferUI 建在 Qt 上，Python 侧经 `Qt.py` 兼容层访问 PySide6（Gaffer 自带 PySide6 6.5.6）。自做编辑器（[[gaffer_network_editor]]、[[gaffer_parameter_editor]]）都直接用 Qt 控件和 QPainter 自绘。

## 要点

- **`Qt.py` 兼容层里没有 `QtGui.QGuiApplication`**（`hasattr` 实测 False）。找屏幕用 `QtWidgets.QApplication.screenAt()`，问不出来再遍历 `screens()`；写成 `QGuiApplication` 会每次 AttributeError。
- `from Qt import QtCore` 不会绑定模块名 `Qt`，要判断绑定（如 `Qt.__binding__ == "PySide6"`）得另写 `import Qt`。
- PySide6 的 `Signal` 必须定义在类体里，写进 `__init__` 变成实例属性就没有 `connect`。
- GafferUI 控件包着 Qt 控件：`widget._qtWidget()` 取底层 QWidget，`GafferUI.Widget._owner(qWidget)` 反查；GafferUI 的拖放不走 Qt 的 QDrag，按鼠标位置自己发 `dragEnterSignal` / `dragMoveSignal` / `dragLeaveSignal` / `dropSignal`。
- GafferUI 的全局事件过滤器只装在顶层 QWidget 上，自己的 QGraphicsView 和它的 viewport 要另外补装。

## 用法 / 关键参数

节点图编辑器用到的 Qt 部件：

| 部件 | 用途 | 注意 |
| --- | --- | --- |
| `QGraphicsScene` / `QGraphicsView` | 矢量场景，自带 BSP 索引和视口裁剪 | `setBspTreeDepth(16)`；视口更新用 `SmartViewportUpdate` + `CacheBackground` |
| `QGraphicsItem` | 节点卡片、连线、Backdrop | `boundingRect()` 要盖住所有画出去的东西；`shape()` 自己写 |
| `QPainterPath` | 卡片形状、命中区域、圆角连线 | 多块拼接要 `setFillRule(Qt.WindingFill)` |
| `Qt.Popup` 窗口 | 建节点面板每一列 | 嵌套时鼠标事件只发给最上层 |
| `QStyledItemDelegate` | 面板一行的绘制 | 一行两段文字先分宽度再画 |
| `QToolTip` | 悬停中文提示 | 抓图时 `showText()` 后泵事件约 1 秒、不关掉再抓 |

无头运行：`QT_QPA_PLATFORM=offscreen`。offscreen 平台不支持窗口遮罩（`setMask`）、虚拟屏只有 800x800、`QGraphicsScene` 偶尔不给按下建立鼠标抓取，这些只能在真显示器上验。

## 常见问题

- [[QGraphicsItem 拖动或悬停后留下拖影]]
- [[QPainterPath 重叠区域点不中]]
- [[Qt 嵌套 Popup 子窗口收不到鼠标事件]]
- [[Qt 一行两段文字互相遮挡]]
- [[QScrollArea 内容展开后整列变窄]]
- [[QConicalGradient 色轮取色角度错位]]

## 相关

- 实体：[[Gaffer]] —— GafferUI 建在 Qt 上
- 实体：[[gaffer_network_editor]] —— 用 QGraphicsView 做的节点图编辑器
- 实体：[[gaffer_parameter_editor]] —— 用 Qt 控件和 QSS 做的参数面板
- 实体：[[ueColorChooser]] —— 用 QPainter 自绘的拾色器控件
- 实体：[[eyeDropper]] —— 跨软件吸管，按住拖动靠 Qt 的隐式鼠标抓取
- 实体：[[cueMonitor]] —— 纯 Qt 原生控件实现的 Gaffer 编辑器
- 问题：[[QGraphicsItem 拖动或悬停后留下拖影]] —— 包围盒没盖住绘制内容
- 问题：[[QPainterPath 重叠区域点不中]] —— 默认奇偶填充把重叠处挖成洞
- 问题：[[Qt 嵌套 Popup 子窗口收不到鼠标事件]] —— 嵌套 popup 的事件派发
- 问题：[[Qt 一行两段文字互相遮挡]] —— delegate 里两段文字共用一个矩形
- 问题：[[QScrollArea 内容展开后整列变窄]] —— 子控件最大宽度把内容控件夹窄
- 问题：[[QConicalGradient 色轮取色角度错位]] —— 锥形渐变的角度方向
- 综述：[[Qt 自绘界面常见坑]] —— Qt 自绘时反复遇到的问题汇总
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 用 QGraphicsView 替代原生 GL 节点图
- 来源：[[来源 - Claude 全局记忆]]
