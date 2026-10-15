---
type: problem
aliases: [QMenu 截图为空]
tags: [gaffer, screenshot, qt, testing]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer screengrab 抓不到右键菜单

## 现象

在 [[Gaffer screengrab]] 的 commandFile 里弹出右键菜单（`GafferUI.Menu.popup()`）后截图，图里没有菜单；`menu.popup()` 之后 `isVisible()` 是 False，`QMenu.grab()` 返回 0x0 的空图。

## 原因

QMenu 只有在事件循环真正运行时才会 map 窗口并绘制。commandFile 执行时主事件循环还没跑起来。

## 解决

1. 用非阻塞方式弹出：`menu.popup( parent=…, position=imath.V2i( x, y ), grabFocus=False, modal=False )`。
2. popup 之后用 `time` 循环 + `QtWidgets.QApplication.processEvents()` 泵约 0.8 秒事件。不要用 `mainEventLoop().start()`，会一直卡住。
3. `application.setGrabWidget( 菜单底下的编辑器 )`，并且**不关菜单**，让 `-delay` + grab 在菜单开着时截图。`grabWindow( winId )` 能把叠在上面的弹窗一起抓进来。
4. 多显示器下 `Menu.popup( position )` 的 position 是全局屏幕坐标，菜单可能弹到副屏；抓控件本身而不是整个主屏。

同样的办法也适用于 tooltip：`QToolTip.showText()` 后泵约 1 秒事件、不关掉，再 `setGrabWidget`。

## 验证方法

抓两张图：一张弹菜单、一张不弹，逐像素比对，差异应集中在菜单所在矩形。只看单张图容易把旧图当成新结果。

## 相关

- 实体：[[Gaffer screengrab]] —— 截图工具
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 弹窗类截图的做法
- 来源：[[来源 - Claude 全局记忆]]
