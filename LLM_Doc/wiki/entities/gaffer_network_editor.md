---
type: entity
aliases: [NetworkEditor, networkEditor, Gaffer Qt 节点图编辑器]
tags: [gaffer, qt, ui, network-editor, extension]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# gaffer_network_editor

用 [[Qt]] 的 QGraphicsView 在 [[Gaffer]] 里另做的节点图编辑器，Editor 类型名 `NetworkEditor`。目标是看起来比原生 [[Gaffer GraphEditor]] 更现代，用起来和原生没有区别：尺寸、接口位置、配色、右键菜单、快捷键都问原生要或者照原生源码抄。只支持 Gaffer 1.7（`package.py` 写 `gaffer-1.7+`），1.6 不再支持（[[来源 - Claude 全局记忆]]）。

## 要点

### 两份副本

- rez 扩展包：`Music/third_party/gaffer_my_extensions/gaffer_network_editor/0.1.0/`（测试、README、`tests/` 都在这里）。
- 本地扩展：`~/gaffer/localExtensions/networkEditor/`。日常启动器 `Music/launcher/gaffer_pj2023dy001_1710.sh` 不带 `gaffer_my_extensions`，跑的是这一份（见 [[ofGafferExt]]）。
- 改完 rez 包要把 `python/networkEditor/` 整个拷进本地扩展的 `python/`；`extension.py`、`startup/gui/`、`README.md` 是本地骨架，不能覆盖。确认跑的是哪一份：screengrab 里打 `sys.modules["networkEditor"].__file__`，再 `GafferUI.Editor.create("NetworkEditor", script)` 真建一个。

### 代码结构

`python/networkEditor/` 是一个包，严格一层套一层，下层不回头引用上层，所以没有循环 import：

```mermaid
flowchart LR
  constants --> graph --> layout --> qt --> backdrop_item --> node_item --> edge_item --> view --> panel --> editor --> register --> init["__init__"]
```

- `graph` 只碰 Gaffer，不碰 Qt；`layout` 是自动排列；`qt` 是绘图工具和图标；`panel` 是建节点面板；`editor` 是 Editor 本体。
- 每个模块末尾 `__all__ = [name for name in dir() if not name.startswith("__")]`，把单下划线私有名（`_NodeItem`、`_matchScore`）一层层传上来，测试里 `NE._NodeItem` 这类写法照常可用。
- 这种 `from .x import *` 层层传递的包，上游的 `import os` 会漏到下游；删未用 import 前要用 AST 查有没有下游在借用。
- 模块级可变全局变量必须和读写它的函数放在同一个文件。
- 代码格式交给 `black --line-length 88`；命名保持 camelCase（Qt 虚函数覆写、Gaffer API、测试引用的公开名都是 camelCase）。

### 和原生共用的数据

两个编辑器可以同时开、互相同步，因为状态都存在节点图里：位置 `node["__uiPosition"]`（节点中心点，y 向上）、连线折叠 `__uiInputConnectionsMinimised` / `__uiOutputConnectionsMinimised`、Backdrop 框 `__uiBound`、选择 `script.selection()`、focus `script.getFocus()`、书签 / 注释 / 只读走 `Gaffer.MetadataAlgo`。详见 [[在 Gaffer 里另做 Qt 节点图编辑器]]。

### 不建原生 GraphEditor

默认一个原生 GraphEditor 实例都不建。编辑器启动时接管 `GafferUI.GraphEditor`（元类壳，`isinstance(ourEditor, GafferUI.GraphEditor)` 为 True，`acquire` 落到本编辑器），原生右键菜单、NodeMenu、项目快捷键需要的 API 由本编辑器自己提供：`graphGadget()`（自己的裸 `GraphGadget`）、`graphGadgetWidget()`（一个只实现 `getViewportGadget()` / `bound()` / `size()` / `_qtWidget()` 的壳）、`frame()`、`scriptNode()`、四个右键菜单信号。原生那套用的 [[ViewportGadget]] 由本编辑器每次调用时按真实视图同步 `setViewport` + `frame`，不需要窗口和 GL。

接管关掉时，退回一个不显示的原生 GraphEditor 当「引擎」，这条代码路径保留着。开关：

| 环境变量 | 作用 |
| --- | --- |
| `GAFFER_NETWORK_EDITOR_ENGINE=1` / `0` | 强制建 / 强制不建隐藏引擎；不设时接管装着就不建 |
| `GAFFER_NETWORK_EDITOR_GADGET=0` | 不用裸 GraphGadget（新节点没位置、接口位置差几像素，用来量依赖） |
| `GAFFER_NETWORK_EDITOR_STATE_DIR` | 建节点面板「喜爱 / 常用」记录的目录，默认 `~/.gaffer_network_editor/` |
| `LAYOUT_STRATEGY` | 自动排列每一步换实现，见 [[节点图自动排列算法对比]] |
| `LAYOUT_SIMPLEX_NODE_LIMIT` | 网络单纯形分层的节点数上限（默认 250） |

### 性能

- 增量更新：节点按名字 diff、连线按 key diff；只改一根线时不扫全图。改一根线 200 / 800 / 2000 节点都在 5ms 左右。
- 视图用 `SmartViewportUpdate` + `CacheBackground`，`setBspTreeDepth(16)`。
- 鼠标移动一次只做一次命中探针（`view.__updateHover`），`_NodeItem` 缓存 `boundingRect` / `shape` / 卡片路径。600 节点图上鼠标移动 0.13ms、全视口一帧约 51ms、首建 600 个 item 约 382ms。
- 重建一律放到 idle 回调里做，拖动期间不重建（见 [[在 Gaffer 里另做 Qt 节点图编辑器]]）。

## 用法 / 关键参数

### 外观

- 扁平卡片 + 按节点类型的矢量图标（灯光按 `__shader.name` 分九种，照官方 PNG 逐像素复刻；材质按 `name` 和 `out` 是不是 `ClosurePlug` 分六种）。
- 接口圆点颜色取插口类型注册的 `nodule:color`；连线是 [[Houdini rounded 连线]]。
- 缩放分档（LOD）：远处只画色块，focus 角标和书签按 `1/lod` 补偿、在任何缩放下都认得出（补偿有下限 `FOCUS_LOD_FLOOR=0.09`）。缩放上限和原生一样是 25 像素 / 单位。
- 分栏材质节点（有 `parameters` 子插口、侧边插口带 `layout:section` 元数据）：顶部 22px 标题条，参数名写在卡片里，按 `layout:section` 分栏、默认全部收起，点栏名行或三角展开；展开态存在非持久节点元数据 `nodeGadget:sectionCollapsed:<side>:<栏名>`（存 `BoolData(False)` 才是展开，不注册等于收起）。灯光节点不走分栏样式（判据 `isLightNode`）。
- 展开的 Color3f 输出（`compoundNumericNodule:childrenVisible`）照原生 `CompoundNumericNodule` 画成一格里三个 0.75 单位的小圆点，标签只写父接口名一条。
- focus：卡片右上角外侧画金色角标；不参与 focus 计算的节点和连线压暗到 0.20（原生只压暗连线）。参与集合来自 [[Gaffer ContextTracker]]。
- 停用节点画对角线，颜色三档：死值 0.1 灰、不参与 0.2 灰、ContextTracker 算出来关着时黄色 `#f0dc28`。

### 交互

| 操作 | 行为 |
| --- | --- |
| Tab / 右键空白 | 级联建节点面板（一列一个 `Qt.Popup` 窗口），搜索按缩写 / 词头分档；右键条目钉进「★ 喜爱」，常用按次数排前 8 |
| `B` | Find Bookmark 面板，递归找 Box 里的书签（`Metadata.nodesWithMetadata(script, "bookmarked", instanceOnly=True)`） |
| `P` | 弹浮动纯参数面板（来自 [[gaffer_parameter_editor]] 的 `popupParameters`），停在视口右上角、跟随选择、边框可拖着改大小 |
| `X` 按住 + 左键划线 | 松手断开划过的连线；X 模式里点一下线断线、点节点删节点并把上下游接起来 |
| 拖已连接的输入圆点 | 改接 / 拖到空白断开（原生 Reconnect 手感） |
| 拖到 `+` | ArrayPlug 一律 `resize(n+1)` 接新的一路，不复用空槽；还没 setup 的 Switch / NameSwitch / BoxIO 走 setup |
| 把节点拖到连线上 | 插进这根线（判据照 `GraphGadget::updateDragReconnectCandidate`） |
| 中键拖节点 | 把节点发给别的编辑器（原生语义） |
| Alt + 右键拖 | 缩放，照 `ViewportGadget.cpp` 的 Dolly：`zoom = 起始zoom * exp(1.9*d)` |
| 拖动节点 | 360px 范围内找最近一个能横平或竖直对上的节点，只吸一个轴，参考线只画两节点之间 |
| 框选 | 节点相交即选；Backdrop 要整个框住才选 |
| Backdrop | 标题条拖动搬整组，四边四角拉大小（最小 12 单位），框身留空洞可以在里面框选 |

项目自己的快捷键（`S` / `Q` / `W` / `T` / `Z` / `J` / `/`）注册在 `GraphEditor.instanceCreatedSignal` 上；接管装着时本编辑器主动发这个信号，项目的处理函数直接连本编辑器的 `keyPressSignal`。

### 和原生故意不同的地方

框选节点相交即选（原生要整个框住）、注释默认只显示 `user` 模板、接口标签水平不斜 45°、focus 用角标、分栏材质参数名常驻卡片里、focus 时节点也压暗、Alt+左键是平移（原生是 Tumble）。

### 界面语言

界面标签一律英文，菜单措辞照抄原生（`/Focus`、`/Enabled`、`/Bookmarked`、`/Show Contents...` 等）；鼠标悬停的小提示框用中文（参数圆点提示写参数名、方向、插口类型、上游是谁、插口 `description`）。建节点面板一个 tooltip 都不加，因为划过一行冒一个提示会挡住下面几行。

### 测试

四套测试：无头（`tests/test_network_editor.py` 等，约 1650 条）、screengrab 出图（约 350 条）、真键盘真鼠标 `tests/e2e_panel_input.py`（xdotool，约 86 条）、接管 `tests/e2e_show_contents.py`（18 条）。

- 无头要带 `QT_QPA_PLATFORM=offscreen`，否则 `Qt.Popup` 的 `isVisible()` 在真 X11 不稳定。
- 真机 e2e 要测 rez 包那份时：`GAFFER_EXTENSIONS_DISABLE=local:networkeditor` + `GAFFER_EXTENSION_PATHS` 加包路径（`DISABLE` 里不能写 `networkeditor`，会连 rez 那份一起关掉）。
- 报告文件「跑完才一次性写」：跑前先删旧报告、不把 stderr 丢进 `/dev/null`，条数没变通常是脚本中途抛了异常。
- 「平移不留残迹」那条拿屏幕真实内容和强制重绘比，窗口在副屏或被别的窗口盖住时会误报，重跑即可。
- 检查新断言是否有效：拷一份整包副本、把改动还原，在副本上跑同一份测试，应该挂掉相应条数。

方法论技能：`~/.claude/skills/gaffer-qt-network-editor/`。

## 常见问题

- [[Gaffer NameSwitch 第二路连线不显示]]
- [[QGraphicsItem 拖动或悬停后留下拖影]]
- [[QPainterPath 重叠区域点不中]]
- [[Qt 嵌套 Popup 子窗口收不到鼠标事件]]
- [[自制节点图编辑器在 Gaffer 1.7 下建不出来]]
- [[Qt 一行两段文字互相遮挡]]
- [[改了 rez 包但运行的还是本地扩展副本]]

## 相关

- 实体：[[Gaffer]] —— 宿主软件
- 实体：[[Gaffer GraphEditor]] —— 要替代的原生编辑器，尺寸、菜单、快捷键都照它
- 实体：[[Qt]] —— 绘图和交互用的界面库
- 实体：[[gaffer_parameter_editor]] —— `P` 键弹出的纯参数面板来自它
- 实体：[[ofGafferExt]] —— 本地扩展副本靠它加载
- 概念：[[Gaffer ContextTracker]] —— focus 时哪些节点、连线参与计算
- 概念：[[Houdini rounded 连线]] —— 连线画法
- 概念：[[Sugiyama 分层布局]] —— 自动排列用的算法框架
- 概念：[[ViewportGadget]] —— 不建原生窗口时用它换算原生需要的坐标
- 问题：[[Gaffer NameSwitch 第二路连线不显示]] —— 连线 key 用插口短名导致重复
- 问题：[[QGraphicsItem 拖动或悬停后留下拖影]] —— 包围盒没盖住画出去的东西
- 问题：[[QPainterPath 重叠区域点不中]] —— 折叠三角、Backdrop 四角点不中
- 问题：[[Qt 嵌套 Popup 子窗口收不到鼠标事件]] —— 建节点面板的滚动条和滚轮
- 问题：[[自制节点图编辑器在 Gaffer 1.7 下建不出来]] —— 1.7 新增的右键菜单扩展点
- 问题：[[Qt 一行两段文字互相遮挡]] —— 建节点面板名字和层级路径重叠
- 问题：[[改了 rez 包但运行的还是本地扩展副本]] —— 两份副本要同步
- 问题：[[Gaffer 自制 Editor 同步重建界面导致卡死]] —— 重建一律推迟到 idle
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 整体设计和理由
- 综述：[[Qt 自绘界面常见坑]] —— 实现中踩到的 Qt 通用问题
- 综述：[[节点图自动排列算法对比]] —— 自动排列的对照数据
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 迁到 1.7 时要处理的 API 变化
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 接管 `GafferUI.GraphEditor` 的做法
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 真输入、残迹、像素统计等验证方法的通用整理
- 来源：[[来源 - Claude 全局记忆]]
