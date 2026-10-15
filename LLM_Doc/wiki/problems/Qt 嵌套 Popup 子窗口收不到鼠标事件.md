---
type: problem
aliases: [Qt.Popup 嵌套, 级联面板滚动条拖不动, nested Qt.Popup mouse events]
tags: [qt, ui, network-editor]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Qt 嵌套 Popup 子窗口收不到鼠标事件

## 现象

用一列一个 `Qt.Popup` 窗口做级联面板（[[gaffer_network_editor]] 的 Tab 建节点面板），打开第二列之后：

- 第一列的滚动条拖不动；
- 鼠标划过第一列的行没有高亮，或者高亮停在最后划过的那一行清不掉；
- 鼠标压在第一列上滚滚轮没反应；
- 无头测试直接调派发函数全绿，真鼠标操作才出问题。

## 原因

- 多个 `Qt.Popup` 嵌套时，Qt 把鼠标事件全部发给**最上层**那个 popup，下面那几列自己的控件收不到原生的按下 / 移动。
- 窗口上不 `setMouseTracking(True)`，就收不到「没按键的移动」，只按全局坐标派发也拿不到悬停。
- 非最上层 popup 里 Qt 的悬停状态（`State_MouseOver`）停在最后一次收到事件的行上，delegate 按它画高亮就会留残留。

## 解决

- **一列一个窗口**：照原生 QMenu 的做法，每列 `setFixedSize(列宽, 行数×行高)` + `AlignTop`；第一列是根窗口，子列各自一个嵌套 `Qt.Popup`。子列用 `Qt.Tool` / `Qt.ToolTip` 不行——会被当成「点在 popup 外面」，第一下点击就关掉整个面板。
- **自己按全局坐标派发鼠标事件**：最上层 popup 收到事件后，判断光标在哪一列哪一行；所有窗口都 `setMouseTracking(True)`。
- **滚动条**：命中到某列滚动条时，按滚动条本地坐标现造 `QMouseEvent`，用 `QApplication.sendEvent` 直发给它，配一个「正在拖滚动条」状态记住后续移动。
- **滚轮**：面板和子列窗口都接 `wheelEvent` 走同一个路由：压着哪列滚哪列 → 没压着列表就滚光标所在窗口的列 → 都不是就滚第一列。
- **悬停高亮用「当前行」**：`itemEntered` 里 `setCurrentItem`，delegate 不画 `State_MouseOver`；新开的列 `setCurrentRow(-1)`，搜索过才预选第一条。
- **换窗口要重设父窗口**：`Qt.Popup` 在创建那一刻认下 transient parent，Gaffer 换布局时把编辑器控件整个 reparent 到别的窗口（控件对象没变）。每次弹出前比较 `view.window()`，变了就 `setParent(window, Qt.Popup)`。
- **别让弹窗跑出屏幕**：用 `QtWidgets.QApplication.screenAt()` 找屏幕（`Qt.py` 里没有 `QtGui.QGuiApplication`），问不出就不夹坐标；多显示器下 Qt 跨屏移动 popup 本身没问题。

## 验证方法

- 只有真鼠标测得出来：用 xdotool 真按住拖滚动条、真滚滚轮（`click 4` / `click 5`），在三处位置各验一次。
- 测高亮数像素：灰底 r=g=b，高亮偏蓝，数一列里有几行偏蓝。
- 量「进下一级，上一级一动不动」要逐像素比各列 `geometry()`，面板必须真的 `popupAt()` 弹出来再量（没显示的面板布局不生效）。
- 测试里 `popupAt()` 后不要 `waitForIdle()`，会把 `Qt.Popup` 关掉，改用 `processEvents()`。

## 相关

- 实体：[[Qt]] —— Popup 窗口的事件派发
- 实体：[[gaffer_network_editor]] —— 建节点面板
- 问题：[[Qt 一行两段文字互相遮挡]] —— 同一个面板的另一个问题
- 综述：[[Qt 自绘界面常见坑]] —— 汇总
- 来源：[[来源 - Claude 全局记忆]]
