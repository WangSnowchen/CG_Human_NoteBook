---
type: entity
aliases: [Catalogue, GafferImage.Catalogue]
tags: [gaffer, image, viewer]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Catalogue

[[Gaffer]] 的图像目录节点（`GafferImage.Catalogue`），收集交互渲染输出的多张图像，供 Viewer 切换和对比。团队的「快照」扩展（gaffer_catalogue_snapshot）在它上面加了一键存图和 Viewer 工具条按钮（[[来源 - Claude 全局记忆]]）。

## 要点

- 图像列表在 `images` 插口下；当前显示哪张由 `imageIndex` 决定。内部有一个 Switch，`images` 的每个子插口对应 Switch 的一路输入。
- **`images` 一个插口包含全部结构变化**：增删图、改名、重排、改 description 都会把 `images` 标脏。刷新界面只连 `plugDirtiedSignal` 一条即可，不必像 `CatalogueUI._ImagesPath` 那样逐个连 childAdded / childRemoved / nameChanged。
- 重排图像后，Catalogue 会把 `imageIndex` 重新映射回原来那张图，所以快照后视口仍停在正在渲染的源图上。`imageIndex` 被表达式驱动时这次映射写不进去，Gaffer 打印一行 `Cannot set value for plug ... except during computation`，没有影响。
- 原生快捷键 `Ctrl+D` 复制当前图（`CatalogueUI.__duplicateCurrentImage` → `_duplicateImages`）是「加图 + 重排」放在一个 UndoScope 里，会损坏撤销栈，见 [[Gaffer Catalogue 加图后撤销栈损坏]]。

## 用法 / 关键参数

### 在 Viewer 工具条里找到自定义控件

注册在 View 上的工具条控件，运行时只有一条路拿得到：`viewer._Viewer__viewToolbars` 里取出工具条 → `toolbar.getChild()` → 对它的 `_qtWidget()` 做 `findChildren( QWidget )` → 用 `GafferUI.Widget._owner()` 把每个 QWidget 映射回 GafferUI 控件。

- Viewer 的工具条是 GL overlay（`addOverlay` → QGraphicsScene），`viewer._qtWidget().findChildren()` 只看得到一个 `GadgetWidget`，见 [[Gaffer Overlay]]。
- `__viewToolbars` 装 View 的工具条，`__nodeToolbars` 装当前 focus 节点的工具条（`Viewer._updateFromSet` 里分开）；元数据注册在 ImageView 上的控件只在前者里。
- 工具条用 PlugLayout 建控件，而 PlugLayout 的自定义控件由 `deferUntilVisible` 的 LazyMethod 创建：工具条不显示就根本没有对象。测试要先把 Viewer 放进可见的 `GafferUI.Window` 再 `waitForIdle()`，见 [[GafferUI LazyMethod]]。screengrab 里自己 `GafferUI.Viewer( script )` + Window + show，比用默认布局里的 Viewer 可靠。
- 工具条元数据的 `widgetType` 用 `__import__` 解析顶层模块，自己的模块直接写 `myModule.MyWidget`，不用挂到 `GafferSceneUI` 这类别人的命名空间下。

### 其他实测限制

- `Gaffer.Metadata.value()` 不接受 Python 类作为 target（Boost.Python.ArgumentError），类级注册的元数据只能用实例回读。
- `GafferUI.View.create( scenePlug )` 在无头环境 SIGABRT（`free(): invalid size`），测「非图像视口」只能用带 ScenePlug `in` 的场景节点代替 SceneView，见 [[Gaffer 无头环境创建某些节点直接崩溃]]。

## 常见问题

- [[Gaffer Catalogue 加图后撤销栈损坏]]

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer screengrab]] —— 抓 Viewer 工具条的方法
- 概念：[[Gaffer Overlay]] —— Viewer 工具条是 GL overlay
- 概念：[[GafferUI LazyMethod]] —— 工具条控件要显示后才创建
- 问题：[[Gaffer Catalogue 加图后撤销栈损坏]] —— 加图和重排不能放在同一个 UndoScope
- 问题：[[Gaffer 无头环境创建某些节点直接崩溃]] —— `View.create( scenePlug )` 无头崩溃
- 来源：[[来源 - Claude 全局记忆]]
