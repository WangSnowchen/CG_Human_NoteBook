---
type: entity
aliases: [GraphEditor, GafferUI.GraphEditor, Gaffer 节点图编辑器]
tags: [gaffer, ui, graph-editor]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer GraphEditor

[[Gaffer]] 自带的节点图编辑器（`GafferUI.GraphEditor`），用 OpenGL 画节点、接口和连线。[[gaffer_network_editor]] 就是为了替代它的外观而另做的。

## 要点

### 结构

`GraphEditor.py:107-116` 的搭法：`ViewportGadget()` + `setMaxPlanarZoom(25)` + `GadgetWidget` + `setPrimaryChild(GraphGadget)`。

- `GraphGadget`：节点图内容（相当于一组 QGraphicsItem）。
- [[ViewportGadget]]：gadget 树的根兼相机，管视口像素和图坐标换算。
- `GadgetWidget`：装它的真 QWidget，GL 在这一层；`graphGadgetWidget()` 返回它，`.getViewportGadget()` 才是相机。

### 外观改不动

画法是 OpenGL + 写死在 `src/GafferUI/StandardStyle.cpp` 里的 GLSL shader，只有纯色填充、一档圆角、一种深色描边和纹理贴图，没有渐变、阴影、多层描边、任意字号、SVG。`GafferUI.Style`、`GafferUI.GraphGadget`、`GafferUI.GraphLayout` 的 Python 绑定都没给 wrapper，不能用 Python 子类化（`NodeGadget` / `StandardNodeGadget`、`ConnectionCreator` / `PlugAdder` 可以）。

能动的只有：

- 节点元数据 5 个：`nodeGadget:color`、`nodeGadget:shape`（rectangle / oval）、`nodeGadget:minWidth`（默认 10）、`nodeGadget:padding`、`nodeGadget:icon`。
- `StandardStyle` 的 8 个全局颜色。

要现代观感只能另起 Qt 视图；每个节点画成一张 Qt 贴图再贴进 GL 的路子在节点多时会崩（[[来源 - Claude 全局记忆]]）。

### 原生尺寸（1.6.5.1 与 1.7.1.0 相同）

- 标准节点 `StandardNodeGadget.bound()` = 11.0000 x 4.1641 单位；宽度只能当下限，字体不同会截字。
- Dot 2.5、Aux 2.0。
- `Backdrop.depth` 范围 [-1, 1]。
- 缩放上限 25 像素 / 单位。
- `GraphEditor.frame()` 内部把缩放夹到 10 以下，节点少时框出来很小（见 [[Gaffer 节点图截图节点太小看不清]]）。

### 原生行为（自做编辑器时要照抄的）

- 左键拖 = 移动，中键拖 = 把节点发给别的编辑器（Sending）。
- 框选要整个框住节点（`boxContains`）；点 Backdrop 连框内节点一起选，Ctrl 只选它自己（`GraphGadget.cpp:1056`）。
- Backdrop 选中描边只画四条边和标题条、中间留洞，才能在 Backdrop 上框选它框住的节点（`BackdropNodeGadget.cpp:350`）。
- focus 后**压暗不参与的连线**（`ConnectionGadget::updateFromContextTracker`，`m_active ? NormalState : DisabledState`，暗色 `#999999` → `#4f4f4f`），参与集合来自 [[Gaffer ContextTracker]]。
- 拖连线时一进节点范围就吸到最近一个接得上的接口（`closestDragDestination` + `updateDragEndPoint`）。
- 拖到视口边缘画面自动滚（`ViewportGadget::trackDrag`）。
- 接口标签三种情况显示：悬停整个节点、`nodeGadget:input/outputNoduleLabelsVisible` 常驻、拖连线过来时把接得上的显示出来。
- ArrayPlug 上的 `+`：`resize(s+1)` 接新的一路（`NameSwitchPlugAdder::createConnection`，`src/GafferUI/NameSwitchUI.cpp`）。
- 空格「最大化」：`CompoundEditor.__keyPress` 把光标所在面板的所有祖先 SplitContainer 手柄推到两端（判据 `all(handlePosition == 1 - childIndex)`）。
- 换层时视野存在历史条目里（`GraphEditor._HistoryWidget`）。
- 「能不能进这个节点」：1.7 正式键 `ui:childNodesAreViewable`，另有两个旧键；Gaffer 自带 Box 两个都写。

### 依赖原生 GraphEditor 的代码（三层）

| 层 | 是什么 | 谁需要 |
| --- | --- | --- |
| L1 GraphEditor 窗口 | 真建 QOpenGLWidget，建一个约 7.7ms | 原生右键菜单命令的 `menu.ancestor(GafferUI.GraphEditor)`；NodeMenu 里创建函数要 `menu` 的节点（Box、Backdrop、Reference、图像滤波）；项目注册在 `GraphEditor.instanceCreatedSignal` 上的快捷键 |
| L2 裸 `GraphGadget(script)` | 不建控件、不要 GL，约 0ms | 节点尺寸、接口位置、`+`、`StandardGraphLayout.connectNode/positionNode` 自动摆位 |
| L3 菜单内容与元数据 | 纯数据 | 各种 UI |

`NodeMenu.nodeCreatorWrapper`（NodeMenu.py:98-150）要 `graphGadgetWidget()`、`graphGadget()`（`getRoot` / `getLayout().connectNode` / `positionNode`）、`scriptNode()`、`frame([node], extend=True)`、`menu.popupPosition(relativeTo=gadgetWidget)`、`getViewportGadget().rasterToGadgetSpace()`。`DotUI.__insertDot`、`BoxUI`、`BackdropUI`、`ReferenceUI` 要的是其中的子集。只要提供这几样，就可以一个 GraphEditor 实例都不建（做法见 [[在 Gaffer 里另做 Qt 节点图编辑器]]）。

## 用法 / 关键参数

右键菜单扩展信号（访问器签名见 `GraphEditor.py:205/216/264`）：

| 信号 | 1.6.5.1 | 1.7.1.0 |
| --- | --- | --- |
| `nodeContextMenuSignal()` | 只吃 cls 的 classmethod，传 True 报 TypeError | `classOrSelf` 混合式，类级、实例级各发一次 |
| `nodeContextMenuSignal(True)` | 没有 | 多选那一路，参数是节点列表；`__buttonPress`（`GraphEditor.py:487-490`）**不管选了几个都发** |
| `plugContextMenuSignal()` / `connectionContextMenuSignal()` | 有 | 有 |

1.7 起 `/Edit...`、`/Enabled`、`/Connections`、`/Focus`、`/Show Contents...`、`/Bookmarked`、注释等节点菜单条目注册在 `nodeContextMenuSignal(True)` 上（`startup/gui/graphEditor.py:116`）。1.7 新增的 `_PlugVisibilityGadget` 对每个 `isinstance(editor, GraphEditor)` 的 Editor 连这些信号。

`Show Contents...` 的命令：1.6 是 `GraphEditor.acquire`；1.7 是 `functools.partial(GraphEditor.__acquireNodes, nodeList)`。layout 里没有 GraphEditor 时它会现建一个加进去。

## 常见问题

- [[自制节点图编辑器在 Gaffer 1.7 下建不出来]]
- [[Gaffer 节点图截图节点太小看不清]]

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[gaffer_network_editor]] —— 替代它外观的 Qt 编辑器
- 实体：[[Gaffer NodeEditor]] —— 同为原生编辑器，NodeEditor 是纯 Python + Qt、能改，GraphEditor 是 GL、改不动
- 概念：[[ViewportGadget]] —— GraphEditor 的相机
- 概念：[[Gaffer ContextTracker]] —— focus 后压暗连线的依据
- 问题：[[自制节点图编辑器在 Gaffer 1.7 下建不出来]] —— 1.7 右键菜单信号变化
- 问题：[[Gaffer 节点图截图节点太小看不清]] —— `frame()` 缩放上限
- 问题：[[Gaffer NameSwitch 第二路连线不显示]] —— 和原生对拍连线数量发现的显示问题
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 右键菜单信号、`Show Contents...` 命令在两版间的变化
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 为什么不改它而另做
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 接管 `GafferUI.GraphEditor` 类
- 来源：[[来源 - Claude 全局记忆]]
