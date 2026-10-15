---
type: entity
aliases: [ParameterEditor, parameterEditor, 参数面板]
tags: [gaffer, gafferui, qt, extension, lighting]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# gaffer_parameter_editor

用户自制的 [[Gaffer]] 参数面板扩展，Editor 类型名 `ParameterEditor`，和原生 [[Gaffer NodeEditor]] 并存。面向灯光日常干活：参数状态看得见、值从哪来能追、搜索更强、多选可以堆叠或批量编辑。只支持 Gaffer 1.7（`package.py` 要求 `gaffer-1.7+`）（[[来源 - Claude 全局记忆]]）。

## 要点

- **位置**：rez 包 `Music/third_party/gaffer_my_extensions/gaffer_parameter_editor/0.1.0/`；日常启动器走的是本地扩展副本 `~/gaffer/localExtensions/parameterEditor/`（见 [[ofGafferExt]]）。改完 rez 包要把 `python/` 下四个包 `rsync --delete` 进本地扩展的 `python/`，详见 [[改了 rez 包但运行的还是本地扩展副本]]。
- **四个包**，严格分层：
  - `parameterCore`：主题取色、参数状态、搜索、软范围、读原生 `layout:*` 元数据、节点图标分类（`glyph.py`）。
  - `parameterWidgets`：三个自绘控件（`Slider` / `ColorSwatch` / `SplineWidget` 的替代）、挑控件规则、图标画法（`glyph.py`）。
  - `parameterLayout`：行、分区（tab / 折叠块）、节点布局、批量布局。
  - `parameterEditor`：编辑器外壳、注册、浮动纯参数面板 `popup.py`。
- **内核复用原生**：控件一律 `PlugValueWidget.create()`，布局语义一律读原生那批 `layout:*` 元数据（[[Gaffer PlugLayout]]）。自己只做容器排版和三个自绘控件，三级改造的取舍见 [[在 Gaffer 里另做参数面板]]。
- **接管 `GafferUI.NodeEditor.acquire`**：官方 20 多处 `NodeEditor.acquire( node )`（Expression 双击、Spreadsheet Edit、EditScope、场景历史 Edit Source、变换工具、「显示输入节点」）改开本面板。关掉：`GAFFER_PARAMETER_EDITOR_ACQUIRE=native` 或 `uninstallAcquireTakeover()`。做法见 [[替换 Gaffer 原生编辑器的方法]]。
- **排版出错直接抛出**，不自动换成原生 NodeUI；要原生排版只能显式设 `GAFFER_PARAMETER_EDITOR_LAYOUT=native`。

## 功能

### 参数状态与值的来源

- 每行左边 3px 状态条标出「改过 / 被驱动 / 有动画」等状态。只读插口（材质 `name` / `type`，元数据 `readOnly:True`）不标「改过」，判据 `MetadataAlgo.getReadOnly( plug )`（只看插口自己那面旗；`MetadataAlgo.readOnly()` 会问祖先，Lock 节点后状态条会全部消失）；被驱动、有动画照常标。汇总时跳过 `plugValueWidget:type == ""` 的插口。
- 工具条 `Source` 开关打开后，每行右边写值的来源：Spreadsheet 名、Expression、Animation、提升到的 Box、EditScope 名、上游节点、团队默认值。点一下面板跳到源头并 reveal 那一行；开关关着时来源写在状态条的 tooltip 里。
- 来源判定在 `parameterCore.plugSource()`：顺着 `getInput()` 走到头，中间隔多少 Dot / BoxIO 都认得出。
  - Spreadsheet：`activeRowIndex`（当前 context 命中哪一行）+ `out.<列名>`；`enabledRowNames` 也会一路走到脚本根。
  - Expression：`getExpression()` 返回 `(文本, 语言)`。
  - 提升：源插口挂在**祖先** Box 上。
  - EditScope：源节点 `ancestor( Gaffer.EditScope )`。

### 搜索

- 递归比较每个插口及子插口的标签、名字、分区名；再把空格和 `_ : . -` 压掉比一次（输 `motionblur` 能命中 `Motion Blur`）。
- 命中的是复合插口（如 StandardOptions 的 `options`）时，把过滤条件压进那一行内部的原生 PlugLayout（`core.plugLayouts()` + `setFilter`）。
- 搜索命中时把所有分区展开；清空搜索后恢复原来的折叠状态。

### 多选：堆叠显示

- 面板显示的是**访问历史**（最近选过的节点在最上面），取前 N 个纵向堆叠，整列放进一个 `ScrolledContainer` 一起滚。N 由搜索框左边的整数框设定，是全局容量，默认 1，不跟选中数变化。
- 手感照 Nuke：
  - 取消选择时面板留着，直到选了别的节点才换。
  - 一次 node set 变化只压一个节点进历史（多选时最后一个赢），所以在节点图里框选多个不会自动摊开。
  - 单选切换时旧节点留在历史里，上限 3 时依次点三个节点就能堆出三块。
  - 换 node set（pin、面包屑、跳到源头）时清空历史；节点被删时从历史里剪掉。
- 每块堆叠面板用自己节点的类型色（`nodeGadget:color` 优先）做皮肤：把 `core.skinStyleSheet( accent )` 挂在该面板自己的 `_qtWidget()` 上，Qt 样式表子级覆盖父级，互不污染。标题行是图标 + `<b>名字</b> <small>类型</small>` + 色条 + Divider。
- 取消选择后齿轮菜单、Lock / Unlock、Revert to Defaults、复制节点路径等动作作用在面板上正显示的那个节点（`__lastNode()` 先问 `__currentNode()`，拿不到才退回 node set）。只有全新、从没选过节点的面板才显示 `/No Node Selected`。

### 批量编辑

- 默认照原生：多选时只显示最后加入选择的节点。齿轮菜单 `Batch Edit Selected Nodes` 或 `GAFFER_PARAMETER_EDITOR_MULTI=batch`（代码 `setBatchEditing()`）打开批量。
- 批量行自己拼 `LabelPlugValueWidget( plugs )` + 控件（原生 `PlugWidget` 不支持多插口）。
- 节点 `enabled` 不进批量（多选按 `D` 就是它，判据 `node.enabledPlug()`）。
- 表格节点（团队 ofNode 多是 [[Gaffer Spreadsheet]] 搭的）：显示最后选中节点的原生表格，在它的 `plugSetSignal` 里把值写到其余节点**同名行 / 同名列**。只认叶子插口（`len( plug ) == 0`），行按名字配（默认行按位置），写入并进用户那一步的 UndoScope（一次 Ctrl+Z 一起回退），带递归守卫。改名、加删行列不同步，界面上写明。

### 纯参数面与浮动面板

- `setChromeVisible( False )` 藏掉头部、面包屑、工具条，只留正文；重排时也认这个开关。
- `parameterEditor/popup.py` 的 `popupParameters( node, position=None, size=None, ... )` 弹一个无边框 `Qt.Tool` 浮动面板，给 [[gaffer_network_editor]] 的 `P` 键用：
  - 默认跟随 `script.selection()`；`follow=False` 时钉在节点上（自己一份 `Gaffer.StandardSet`，节点被删经 `parentChangedSignal` 自关）。
  - 边框可拖着改大小（`borderWidth=6` 留出只属于窗口的一圈），大小记在模块级 `_lastSize`，只在本次会话有效；拖左边时右边缘不动。
  - 圆角 6px 要再加一层窗口遮罩（`QPainterPath.addRoundedRect` → `QRegion` → `setMask`），QSS 的 `border-radius` 管不到子控件填出来的四个角。
  - 不能用 `Qt.Popup`：参数控件会再弹预设菜单、拾色器、文件浏览器，Popup 一见别的窗口激活就自己关。
  - 调用方必须留住返回的窗口引用，否则被 GC 掉一闪而过。

### 节点图标

每个节点在顶栏（16px）和堆叠标题行（14px）画一个自绘图标，分类和画法照搬 [[gaffer_network_editor]]：灯光九种、材质六种，另认容器、切换、层级、属性、全局设置、读写文件、查询、调度任务，认不出的回落成一张节点卡片。两个包各带一份、互不依赖，改一边要同步另一边。`InteractiveRender` / `ArnoldRender` 直接派生 `ComputeNode`，类名判据要用 `endswith( "Render" )`。分类加绘制合计不到 0.02ms，可以忽略。

### 界面语言

- 标签、按钮、复选框、占位符、空态、齿轮菜单条目名、来源徽标、批量表头：英文。
- `setToolTip` 和菜单项的 `description`（`GafferUI/Menu.py` 把它设成 `setStatusTip`，鼠标停上去的那句）：中文。
- `IECore.msg` 诊断留中文；参数自己的说明来自 Gaffer 元数据 `description`，保持官方英文原文。
- 标签表拆两份：`STATE_LABELS` / `SOURCE_LABELS`（英文）与 `STATE_LABELS_ZH` / `SOURCE_LABELS_ZH`（中文），`plugSource()` 同时给 `label` 和 `labelZh`。

## 和原生 NodeEditor 一致的行为

- activator 随值变化实时重算：在 `ContextTracker.acquireForFocus( node ).context( parent )` 里逐项求值（每层用各自 parent 的 context，见 [[Gaffer ContextTracker]]），藏着的行也先建出来，`Row.setFilterVisible` / `setActivatorVisible` 两路都为真才显示；内容全藏的 tab / 分区跟着藏。
- 连 `Metadata.plugValueChangedSignal( node )` / `nodeValueChangedSignal( node )`：布局相关 key 变了 idle 重建，其余 `layout:*` 只刷新。
- 每个布局 parent（节点本身和 `user` / `parameters` / `transform` / `layers` 这些子布局插口）各连自己的 `childAdded` / `childRemoved`（`NodeLayout.layoutParents()`），`_updateFromSet` 和 `rebuild()` 后重连。只连节点的信号时，Layers 点「+」加的新层不会出现。
- 折叠状态、当前 tab 写成和原生同 key 的非持久实例元数据（`layout:section:<相对名>:collapsed`、`layout:section::currentTab`），两种面板共享。折叠默认收起；程序展开（搜索）时阻断写回。
- 分区里直接项排在子分区前；节点「无分区」时子布局插口的分区是折叠块。
- `layout:width` / `layout:minimumWidth` 生效；自定义控件建不出来时报 Error 日志并显示警告图标。
- `Out` 方向插口照原生显示（原生 `layoutOrder` 不过滤方向）：InteractiveRender 的 `messages` 日志框、Query 节点的 `bound` / `center`、`Gaffer.Random` 的输出都在；只跳过 `plugValueWidget:type` 注册成空串的。
- 头部类型标签用 `NameLabel`（可以把节点拖出去）；色块走 `displayTransform()`；刷新与重排用原生 `LazyMethod`。
- 自建面板照样发 `NodeEditor.toolMenuSignal()`，官方和团队注册的条目（`Edit UI…`、`Go to Node` 等）都在。

故意保留的不同：取消选择时面板留着、搜索命中全展开、只读插口不标「改过」、tab 标签带计数、标签宽度自适应。

## 性能（实测）

- 刷新：Sphere 约 0.3ms，200 行 Spreadsheet 约 11ms（Gaffer 1.7.1.0）。热路径上状态 / 来源没变就不重设 `setStyleSheet` 和徽标，`plugState` 一遍递归，主题色与搜索匹配用 `lru_cache`。
- 建面板相对原生 0.9～1.8 倍（Gaffer 1.6.5.1 测，脚本 `tests/bench_vs_native.py`）：standard_surface 反而比原生快（原生多建一层嵌套 PlugLayout）。粒度更细：point_light 原生 11 个顶层插口，本面板展开成 30 行。

## 用法

- 测试：无头 472 条、真机 e2e 14 条（`tests/e2e_acquire_takeover.py`）、`black --check` 全过；过程脚本放 `proces_scode/{shell,probe,screengrab}/`（`run_headless_tests.sh`、`run_e2e.sh`、`run_probe.sh`）。
- 方法论技能：`~/.claude/skills/gaffer-parameter-editor/`。

## 常见问题

- [[Gaffer NodeEditor 换节点时面板闪一下]]
- [[Gaffer 自制参数面板里大控件被拉高或压扁]]
- [[Gaffer Spreadsheet 表格滚到底差一行]]
- [[QScrollArea 内容展开后整列变窄]]
- [[改了 rez 包但运行的还是本地扩展副本]]

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer NodeEditor]] —— 并存的原生面板，本面板接管它的 `acquire`
- 实体：[[gaffer_network_editor]] —— 节点图编辑器，`P` 键弹本面板的浮动纯参数面；图标分类照它
- 实体：[[ofGafferExt]] —— 本地扩展副本靠它加载
- 实体：[[Gaffer Spreadsheet]] —— 批量编辑表格节点的同步对象
- 实体：[[Qt]] —— 容器、QSS 皮肤、自绘控件都直接用 Qt
- 概念：[[Gaffer PlugLayout]] —— 布局语义全部照它的 `layout:*` 元数据
- 概念：[[Gaffer ContextTracker]] —— activator / summary 求值用的 context
- 问题：[[Gaffer NodeEditor 换节点时面板闪一下]] —— 换内容后同一次调用里排完布局
- 问题：[[Gaffer 自制参数面板里大控件被拉高或压扁]] —— 可伸长行的判据与 stretch 分配
- 问题：[[Gaffer Spreadsheet 表格滚到底差一行]] —— 原生表格塞进自排行的滚动问题
- 问题：[[QScrollArea 内容展开后整列变窄]] —— 侧栏类型过滤器里遇到的 Qt 布局问题
- 问题：[[改了 rez 包但运行的还是本地扩展副本]] —— 同步本地扩展
- 综述：[[在 Gaffer 里另做参数面板]] —— 设计方法和坑位
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— `acquire` 接管的做法
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 另一个自制编辑器的做法，可对照
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 只支持 1.7 的原因
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 毫秒抓帧、整包副本对照等验证方法
- 来源：[[来源 - Claude 全局记忆]]
