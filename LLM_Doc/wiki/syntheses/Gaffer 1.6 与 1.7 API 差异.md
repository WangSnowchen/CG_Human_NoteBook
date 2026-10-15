---
type: synthesis
aliases: [Gaffer 1.6 vs 1.7, Gaffer 版本差异]
tags: [gaffer, api, version]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 1.6 与 1.7 API 差异

本机同时在用 [[Gaffer]] 1.6.5.1 和 1.7.1.0。下面汇总写扩展、写测试时实测碰到的版本差异；凡标「实测」的都在对应装机版上跑过（[[来源 - Claude 全局记忆]]）。

## 环境与核对方法

- 两个版本都在 rez 环境 `pj2023dy001 + python 3.11` 下运行：

```bash
# 1.6.5.1
rez-env pj2023dy001 python==3.11 gaffer==1.6.5.1 -- gaffer      # 启动器 Music/launcher/gaffer_pj2023dy001_1651.sh
# 1.7.1.0
rez-env pj2023dy001 python==3.11 gaffer==1.7.1.0 -- gaffer      # 启动器 Music/launcher/gaffer_pj2023dy001_1710.sh
```

- 本地源码检出 `Music/_repos/GafferHQ/gaffer/` 是 **1.7**。读机制、看实现可以用它，版本敏感的 API 必须拿装机版复核：
  - Python 源码：`/mnt/centralizedRepo/third_party/gaffer/linux/<版本>/python/`
  - C++ 内部插口名 / 符号：对 `.../lib/libGaffer*.so` 用 `strings` + grep
- 照 1.7 源码写的代码在 1.6 上常见的失败形式是 AttributeError 刷屏；类继承关系（MRO）这类差异只能在真机上打印核对。

## 1.6.5.1 没有、1.7 才有的 API

| API / 功能 | 1.6.5.1 | 1.7.1.0 | 1.6 上的替代 |
|---|---|---|---|
| `GafferUI.Widget.currentButtons()` | 没有 | 有 | `QtWidgets.QApplication.mouseButtons()`（它本来就是这个的包装） |
| `IECoreScene.ShaderNetwork.connections()` | 没有 | 有 | 逐 shader 调 `inputConnections( name )` / `outputConnections( name )` |
| `PlugLayout.setFilter` / `getFilter` / `removeFilter`、`StandardFilterWidget` | 没有（`PlugLayout.py` 806 行，零过滤能力） | 有 | 照上游实现 backport，补丁幂等 + `hasattr` 探测 |
| `MeshLight` 独立基类 | 没有，`ArnoldMeshLight` 派生自 `FilteredSceneProcessor` | 有 `MeshLight` 基类 | 判灯光节点用 MRO 类名 `endswith( "MeshLight" )`，两个版本都覆盖 |
| 节点右键菜单的多选信号重载 `nodeContextMenuSignal( True )` | 信号访问器是只吃 `cls` 的 classmethod，传 True 直接 TypeError | 有，且整套节点菜单注册在这一路 | — |

## 1.7 改变了行为的地方

- **`GafferUI.GraphEditor` 扩展点**（影响所有冒充或替代 GraphEditor 的编辑器）：
  - 1.7 新增 `_PlugVisibilityGadget`，`startup/gui/editor.py` 对每个 Editor 调 `connectToEditor`，闸门是 `isinstance( editor, GraphEditor )`，随后要用 `editor.plugContextMenuSignal()`、`nodeContextMenuSignal( True )`。替代编辑器若通过 isinstance 却没有这些信号，构造时就失败，见 [[自制节点图编辑器在 Gaffer 1.7 下建不出来]]。
  - 1.7 把 `/Edit...`、`/Enabled`、`/Connections`、`/Focus`、`/Show Contents...`、`/Bookmarked`、注释等节点右键菜单全注册在 `nodeContextMenuSignal( True )`（参数是节点列表，`startup/gui/graphEditor.py:116`），原生 `__buttonPress`（`GraphEditor.py:487-490`）**无论选几个节点都发**。按 1.6 写「多选才发」会让单选右键菜单整个变空。
  - `Show Contents...` 的原生命令从 `GraphEditor.acquire` 换成 `functools.partial( GraphEditor.__acquireNodes, nodeList )`。按菜单路径匹配的重定向不受影响。
  - `PlugAlgo.dependsOnCompute` 那段从 `GraphEditor.py:843` 移到 `:932`。
- **「能不能进入节点内部」的元数据**：1.7 正式键是 `ui:childNodesAreViewable`，旧的两个键降为 legacy。照原生依次查这三个键；Gaffer 自带 Box 新旧键都写了，所以自带节点看不出问题，只有第三方节点只写新键时才会「按下方向键进不去」。
- **`OSLShader` 出厂就带一个空的 `out` 容器 `Plug`**（1.6 没有）。写 `if "out" not in node : node.addChild(...)` 的夹具在 1.7 会被跳过，随后裸 `Plug` 接不上 `Color3fPlug`。
- **NodeEditor 里的复合选项插口**：`StandardOptions.options`、`CustomAttributes.attributes`、`CustomOptions.options` 的控件在 1.6 是 `CompoundDataPlugValueWidget`（黑箱，「+」按钮写在控件里），1.7 换成 `LayoutPlugValueWidget`，可以直接递归进去每个选项一行；「+ 新增」在 1.7 是 `layout:customWidget:addButton` 元数据（`GafferUI.PlugCreationWidget`），不 import GafferSceneUI 也已注册。见 [[Gaffer PlugLayout]]。
- **NodeEditor 的 activator**：1.7 原生在 `ContextTracker.acquireForFocus( node ).context( node )` 里重算 activator，值变了即刷新，见 [[Gaffer layout activator 元数据]]。
- **Python ComputeNode**（1.7 实测）：绑定只有 `DependencyNodeClass` + methodOverride，没有 `Gaffer.ComputeNode.hash/compute/hashCachePolicy` 基类方法可调（AttributeError），覆写时每个输出自己处理完整，缓存策略其余分支返回 `Gaffer.ValuePlug.CachePolicy.Default`，见 [[Gaffer Python ComputeNode 调基类 hash 报错]]。
- `GafferUI.info` 在 1.7 不存在。
- 无头创建团队的 `LightSetupManager()`：1.6.5.1 SIGABRT，1.7.1.0 正常，见 [[Gaffer 无头环境创建某些节点直接崩溃]]。

## 两个版本相同的地方（1.7.1.0 复核过）

- `StandardNodeGadget.bound()` 仍是 11.0000 x 4.1641 单位；Dot 2.5、Aux 2.0。
- `Backdrop.depth` 范围仍是 [-1, 1]。
- 注释模板仍只有 `performanceMonitor:*` 和 `contextMonitor`。
- [[ViewportGadget]] 默认 2D 相机、默认视口 `V2i( 640, 480 )`。
- 包装对象身份仍不稳定，见 [[Boost.Python 包装对象身份]]。
- `BoxIO.direction()`、`Switch.inPlug()`、`Loop.inPlug()` 都没有 Python 绑定，按 `isinstance` 分支处理。
- `Metadata.value()` 把 `IECore.BoolData` 解包成 Python bool：`isinstance( value, IECore.BoolData )` 永远 False，用 `bool( value )`。
- Animation 关键帧时间单位是秒，见 [[Gaffer Animation 关键帧设置后场景不动]]。
- NodeEditor 每次换节点整块重建（`NodeEditor._updateFromSet` 在 1.6.5.1 与 1.8.0 一字不差），见 [[Gaffer NodeEditor 换节点时面板闪一下]]。

## 只在 1.6.5.1 实测过的细节

下列事实在 1.6.5.1 上实测，1.7 没有专门复核，使用前自行确认：

- `Gaffer.Node` 没有 `descendants()`；`Group.in` 是 `ArrayPlug`，取个数用 `len()`，没有 `.size()`。
- `NodeAlgo.presets()` 返回 list；`TransformPlug` 没有 `setValue`，要按子插口递归写；颜色用 `imath.Color3f/4f`（不是 `IECore.Color3f`）。
- 向量插口带 x/y/z 子元素，判断「叶子插口」按插口类型，不按子元素个数。
- `Animation.isAnimated()` 的 C++ 签名只接受 `ValuePlug`，普通 `Plug` 传进去是 Boost ArgumentError。
- `StringAlgo.matchMultiple()` 把空格当模式分隔符（`z min` 匹配不上 `Z Min`）。
- `_StyleSheet.styleColor()` 对不存在的键静默返回黑色。
- `nodeGadget:color` 只在 GUI 启动脚本里注册，`gaffer env python` 下全是 None。
- `Metadata.nodeValueChangedSignal()` 有无参数的 legacy 形式（三参回调 `(nodeTypeId, key, node)`）。
- `Metadata.nodesWithMetadata( script, "bookmarked", instanceOnly=True )` 递归查书签；`MetadataAlgo.bookmarks( script )` 只扫直接子节点。
- Arnold 着色器 `loadShader()` 之后 `type` 一律是 `ai:surface`，按类型分类只能看 `name` 和 `out` 是不是 `ClosurePlug`。
- `IECoreScene` 没有 `BoxPrimitive` / `ConePrimitive` / `PlanePrimitive`。
- `IECore.StringVectorData` 没有 `.value`，统一 `getattr( data, "value", None )` 或直接迭代。
- `Gaffer.Metadata.value()` 不接受 Python 类作为 target。
- 没有 `Gaffer.EditScopeAlgo`，判断某个值是否来自 EditScope 用源节点 `ancestor( Gaffer.EditScope )`。
- 自带 Qt 绑定是 PySide6 6.5.6。

## 各扩展包的目标版本

| 包 | 版本要求 |
|---|---|
| [[gaffer_network_editor]] | 只支持 1.7（`gaffer-1.7+`） |
| [[gaffer_parameter_editor]] | 只支持 1.7（`gaffer-1.7+`，1.6 的 PlugLayout 过滤 backport 已删） |
| [[gaffer_custom_node]] | 只做 1.7 |
| [[gaffer_light_skill]] | 只做 1.7 |
| [[gaffer_indexed_mesh]] | 1.7.1.0 |
| [[gaffer_mcp]] | 按 1.6.5.1 测试 |

另外：1.7 的 `GAFFER_APP_PATHS` 不含 `~/gaffer/apps`，放在那里的独立 app（如 [[cueMonitor]] 的独立启动版）在 1.7 下找不到；1.7 下 `~/gaffer/startup/screengrab/layouts.py` 生成的布局为空，screengrab 里要自己建 GraphEditor。

## 升级大版本的做法

1. 先原样把全部测试在新版本上跑一遍，拿到真实失败清单，不先猜。
2. 「没有一条 FAIL」要先确认测试跑到了结尾：报告是最后一次性写文件的脚本中途崩溃时，`grep -c FAIL` 也得 0。
3. 每处失败对照新版本的原生源码确认是 API 变了还是测试夹具的假设变了（OSLShader 的 `out` 就属于后者）。
4. 把「复核过没变」的结论也记下来，下次升级可以少查一轮。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Arnold]] —— Arnold 着色器与 MeshLight 的版本差异
- 实体：[[gaffer_mcp]] —— 工具实现依赖的 1.6 API 细节
- 实体：[[gaffer_network_editor]] —— 迁到 1.7 时碰到的右键菜单扩展点变化
- 实体：[[gaffer_parameter_editor]] —— 1.7 的 PlugLayout 过滤与复合选项控件
- 实体：[[gaffer_custom_node]] —— 1.7 Python ComputeNode 写法
- 实体：[[gaffer_light_skill]] —— 只支持 1.7
- 实体：[[gaffer_indexed_mesh]] —— 针对 1.7.1.0 编译
- 实体：[[LightSetupManager]] —— 无头构造在两个版本表现不同
- 实体：[[Gaffer GraphEditor]] —— 1.7 右键菜单信号的变化
- 实体：[[Gaffer NodeEditor]] —— 复合选项控件与换节点重建
- 实体：[[cueMonitor]] —— 独立 app 在 1.7 的 app 路径之外
- 概念：[[ViewportGadget]] —— 默认值两个版本相同
- 概念：[[Boost.Python 包装对象身份]] —— 两个版本都不稳定
- 概念：[[Gaffer PlugLayout]] —— 1.7 才有过滤接口
- 概念：[[Gaffer layout activator 元数据]] —— 1.7 在 ContextTracker context 里重算
- 问题：[[自制节点图编辑器在 Gaffer 1.7 下建不出来]] —— 1.7 的 `_PlugVisibilityGadget`
- 问题：[[Gaffer Animation 关键帧设置后场景不动]] —— 两个版本都按秒
- 问题：[[Gaffer 无头环境创建某些节点直接崩溃]] —— LightSetupManager 在 1.7 不再崩溃
- 问题：[[Gaffer Python ComputeNode 调基类 hash 报错]] —— 1.7 绑定没有基类方法
- 问题：[[Gaffer NodeEditor 换节点时面板闪一下]] —— 1.6 到 1.8 都没变
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 升级时跑测试的注意事项
- 综述：[[在 Gaffer 里另做参数面板]] —— PlugLayout 过滤接口的版本差异
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— patch 的私有接口随版本变化
- 来源：[[来源 - Claude 全局记忆]]
