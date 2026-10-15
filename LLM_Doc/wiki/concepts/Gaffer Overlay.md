---
type: concept
aliases: [GadgetWidget overlay, addOverlay]
tags: [gaffer, gafferui, qt]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Overlay

## 定义

`GadgetWidget.addOverlay( widget )` 把一个普通 GafferUI 控件叠加显示在 GL 视口上面。实现上（`python/GafferUI/GLWidget.py`）它把控件包进 QGraphicsScene 里的 `_OverlayProxyWidget`，和 GL 内容画在同一个视图上。[[Gaffer]] Viewer 的工具条就是这样的 overlay（[[来源 - Claude 全局记忆]]）。

## 在各软件里的对应

- Viewer 工具条（View 工具条和节点工具条），见 [[Gaffer Catalogue]]。
- 自制 Viewer / GraphEditor 浮层按钮。

## 注意事项

1. **`_qtWidget().findChildren( QPushButton )` 找不到 overlay 里的按钮**：控件在 QGraphicsScene 里，不在普通 QWidget 父子树里。枚举已装的 overlay 要遍历 `gw._GLWidget__overlays`（GafferUI Widget 对象集合），再递归找子控件。
2. **Viewer 只在焦点节点存在时才建 View**：`GafferUI.Viewer( script ).view()` 返回 None 是因为 node set（`script.focusSet()`）为空；`script.setFocus( 节点 )` 后才创建。`View.create( plug )` 要求插口已在 script 里。
3. **GafferUI 容器的父子关系只在容器上下文里创建时自动建立**：`with GafferUI.ListContainer(...) :` 里写一个已存在的控件名不会把它挂进去，见 [[GafferUI 已创建的控件放进容器后不显示]]。overlay 内容是事后拼装时最容易踩到。
4. **screengrab 的离屏抓图不能判断可见性**：`grabWindow` 会把「未布局但已 setText」的过期内容画出来。验证可见性要 `window._qtWidget().show()` + `waitForIdle` 后查 `widget._qtWidget().isVisibleTo(...)`，见 [[Gaffer screengrab]]。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer Catalogue]] —— Viewer 工具条是 overlay，找控件的方法
- 实体：[[Gaffer screengrab]] —— 离屏抓图看不出可见性
- 概念：[[ViewportGadget]] —— overlay 所在的 GadgetWidget 承载的相机
- 问题：[[GafferUI 已创建的控件放进容器后不显示]] —— 拼装 overlay 内容时的父子关系
- 来源：[[来源 - Claude 全局记忆]]
