---
type: concept
aliases: [LazyMethod, deferUntilVisible]
tags: [gaffer, gafferui, python]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# GafferUI LazyMethod

## 定义

`@GafferUI.LazyMethod()` 是 [[Gaffer]] 界面代码里的延迟调用装饰器（源码 `python/GafferUI/LazyMethod.py`）：被装饰的方法调用时不立刻执行，而是登记一次，等事件循环空闲时只跑最后一次，自带去重。

默认参数 `deferUntilVisible=True`：控件不可见时连空闲回调都不登记，要等控件的 `visibilityChangedSignal` 触发（变成可见）才执行（[[来源 - Claude 全局记忆]]）。

## 在各软件里的对应

依赖它的典型位置：

- `PlugValueWidget.__callUpdateFromValues`：插口值变化后刷新控件显示。
- `PlugLayout` 建自定义控件（如 Viewer 工具条里的控件），见 [[Gaffer Catalogue]]。
- `NodeSetEditor.__lazyUpdate`：选择变化后调 `_updateFromSet` 重建编辑器内容。

## 注意事项

- **无头测试的假象**：控件没 `widget._qtWidget().show()` 或没放进可见窗口时，依赖 LazyMethod 的更新永远不跑。表现像「元数据没注册上」「控件一直是空的」「状态停在旧值」。测试前把控件放进可见的 `GafferUI.Window`，再 `waitForIdle()`。
- 测试中途把主窗口 `setVisible( False )` 之后，后面的选择变化都不会触发 `_updateFromSet`，断言读到的是过期状态；后续测试节开头要重新 `setVisible( True )`。
- 要在信号回调里触发重建时，调用 LazyMethod 包装过的方法（例如 `self._NodeSetEditor__lazyUpdate()`），不要直接同步重建，见 [[Gaffer 自制 Editor 同步重建界面导致卡死]]。
- 控件拆掉后延迟回调仍可能执行一次，回调里先确认 Qt 对象还活着（访问会触发 `Internal C++ object already deleted` 的属性前先判断）。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer Catalogue]] —— Viewer 工具条控件要显示后才创建
- 概念：[[Gaffer PlugLayout]] —— 自定义控件用 LazyMethod 延迟创建
- 问题：[[Gaffer 自制 Editor 同步重建界面导致卡死]] —— 重建要推迟到空闲时
- 问题：[[GafferUI 已创建的控件放进容器后不显示]] —— 另一类「控件没显示」的原因
- 问题：[[Gaffer NodeEditor 换节点时面板闪一下]] —— NodeEditor 的整块重建由它延迟触发
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 无头测试先把控件放进可见窗口
- 综述：[[在 Gaffer 里另做参数面板]] —— 不可见的控件不刷新，参数面板测试要挂进可见窗口
- 来源：[[来源 - Claude 全局记忆]]
