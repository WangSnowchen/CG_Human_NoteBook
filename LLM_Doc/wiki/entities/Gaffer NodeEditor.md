---
type: entity
aliases: [NodeEditor, GafferUI.NodeEditor, 节点编辑器]
tags: [gaffer, gafferui, qt]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer NodeEditor

[[Gaffer]] 原生的参数面板，显示选中节点的插口控件。和 [[Gaffer GraphEditor]] 完全相反，它 100% 是 Python + Qt，可以扩展和改皮肤，但内核体量很大，不适合重写（[[来源 - Claude 全局记忆]]）。

## 要点

- **结构**：`NodeEditor.py` 只有约 245 行外壳；排版在 `PlugLayout.py`（1.6 约 806 行，见 [[Gaffer PlugLayout]]）；控件是 **133 个 `PlugValueWidget` 子类**，由 **582 处 `plugValueWidget:type` 元数据**注册，另有团队 ofNode .so 里注册的私有控件类。自己做参数面板时这些都要复用。
- **继承自 `NodeSetEditor`**：自带 pin 控件和 `P` / `N` / `` ` `` 快捷键，默认 node set 就是 `script.selection()`。多选时只显示 `_lastAddedNode()`（node set 里最后一个）。
- **换节点就整块重建**：`NodeSetEditor.__lazyUpdate`（`@LazyMethod`）→ `NodeEditor._updateFromSet` → `NodeUI.create( node )` + `__nodeUIFrame.setChild( ... )`，每次换节点整个 NodeUI 扔掉重建，这会造成肉眼可见的闪烁，见 [[Gaffer NodeEditor 换节点时面板闪一下]]。
- **`acquire`**：`NodeEditor.acquire( node )` 在官方代码里有 24 处调用点（Expression 双击、Spreadsheet Edit、EditScope「Edit … in Node Editor」、场景历史 Edit Source、变换工具、PlugValueWidget「显示输入节点」）。它从 `NodeSetEditor` 继承而来；`NodeSetEditor.acquire` 里给浮动窗口撑高的那段判据是 `isinstance( editor, NodeEditor )`。
- **扩展缝 `NodeEditor.toolMenuSignal()`**：齿轮菜单的官方扩展点。1.6.5.1 自带四处：Spreadsheet「Create/Connect Spreadsheet」、Camera「Copy From Viewer」、OSLCode「Export OSL Shader…」、Box「Reset Default Values」；本机团队另注册 `Edit UI…`、`Go to Node`。
- **样式钩子**：GafferUI 给每个控件挂 `gafferClass` / `gafferPlugValueWidget` 动态属性，QSS 可以按它精确选中原生控件。`Slider` / `ColorSwatch` / `SplineWidget` 是 Gaffer 自己用 QPainter 画的，QSS 管不到。

## 版本差异

- Gaffer 1.6.5.1：`PlugLayout` 没有 `setFilter` / `removeFilter` / `StandardFilterWidget`，原生面板没有任何过滤能力。
- Gaffer 1.7.1.0：`PlugLayout` 原生有过滤；StandardOptions 的 `options`、CustomAttributes 的 `attributes`、CustomOptions 的 `options` 改用 `LayoutPlugValueWidget`，「+」新增按钮改成 `layout:customWidget:addButton`（`GafferUI.PlugCreationWidget`）元数据。
- 1.8.0 源码复核过，`_updateFromSet` 和 1.6.5.1 一字不差，换节点闪烁仍在。

## 用法 / 关键参数

```python
GafferUI.NodeEditor.acquire( node, floating=True )   # 打开浮动面板
editor.nodeUI().plugValueWidget( plug ).reveal()     # 官方定位到某个插口的写法
```

截图时用 `GafferUI.NodeEditor.acquire( node, floating=True )` + `_qtWidget().setFocus()` + `application.setGrabWidget(...)`（见 [[Gaffer screengrab]]）。

## 常见问题

- [[Gaffer NodeEditor 换节点时面板闪一下]]

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[gaffer_parameter_editor]] —— 并存的自制参数面板，接管了本面板的 `acquire`
- 实体：[[Gaffer GraphEditor]] —— 另一个原生编辑器，GL 实现、改不动
- 实体：[[Gaffer screengrab]] —— 给本面板截图的方法
- 概念：[[Gaffer PlugLayout]] —— 本面板的排版内核
- 概念：[[Gaffer layout activator 元数据]] —— 本面板按它置灰 / 隐藏参数
- 问题：[[Gaffer NodeEditor 换节点时面板闪一下]] —— 原生自带的闪烁和补丁
- 问题：[[Gaffer 自写 PlugValueWidget 一直空白]] —— 在本面板里显示自写控件的坑
- 综述：[[在 Gaffer 里另做参数面板]] —— 为什么内核必须复用本面板的控件
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 并存 + 接管 `acquire` 的做法
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 对照：节点图编辑器只能另起，本面板可以在原生基础上改
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 复合选项控件、过滤接口的版本差异
- 来源：[[来源 - Claude 全局记忆]]
