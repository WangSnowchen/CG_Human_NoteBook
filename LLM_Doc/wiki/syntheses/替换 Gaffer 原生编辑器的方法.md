---
type: synthesis
aliases: [Gaffer monkey-patch, 接管原生编辑器]
tags: [gaffer, gafferui, python, method]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# 替换 Gaffer 原生编辑器的方法

汇总用户在 [[Gaffer]] 里扩展或替换原生界面的几种做法，按侵入程度从低到高排列（[[来源 - Claude 全局记忆]]）。共同的工程习惯：实现放 `~/gaffer/python/` 或扩展包的 `python/`，`startup/gui/` 里只放一个薄包装调用 `install()`；所有 patch 幂等；每种替换都留一个关掉的开关。

## 1. 用官方注册口

能用注册口就不 patch：

- 新增编辑器类型：`GafferUI.Editor.registerType( "名字", cls )` + `GafferUI.Layouts.acquire( application ).registerEditor( "名字" )`，Editor 类实现 `__repr__`（layout 序列化用）。[[Gaffer LogView]]、[[gaffer_parameter_editor]]（`ParameterEditor`）都是这样进的 layout 菜单。
- 代码补全：`ExpressionWidget.registerCompleter( "python" / "OSL", func )`（[[codeCompleter]]）。
- 参数面板齿轮菜单：`NodeEditor.toolMenuSignal()`。
- 节点 / 编辑器创建钩子：`NodeGadget.instanceCreatedSignal()`、`Editor.instanceCreatedSignal()`。

## 2. 并存 + 接管入口

原生编辑器在官方代码里被到处调用时，别替换它本身，做一个并存的新编辑器，再接管「打开编辑器」的入口。

- [[gaffer_parameter_editor]] 和 [[Gaffer NodeEditor]] 并存（原生 `NodeEditor.acquire()` 有 24 处调用点），只接管 `GafferUI.NodeEditor.acquire`：官方双击 Expression、Spreadsheet Edit、EditScope、场景历史 Edit Source 等都改开新面板。
- 原 `acquire` 存到 `_originalNodeEditorAcquire`，新面板的「在原生 NodeEditor 中打开」走它，否则接管后自己开自己。
- `acquire` 是从 `NodeSetEditor` **继承**来的，卸载时要 `delattr( GafferUI.NodeEditor, "acquire" )`，不要把取到的函数塞回去。
- 开关：`GAFFER_PARAMETER_EDITOR_ACQUIRE=native` 或 `uninstallAcquireTakeover()`。
- 官方代码拿到编辑器后会接着调用它的方法（`editor.nodeUI().plugValueWidget( plug ).reveal()`），新编辑器要把这些方法补齐，返回代理对象也行。
- 节点图编辑器走得更远：[[gaffer_network_editor]] 用元类让 `isinstance( 新编辑器, GafferUI.GraphEditor )` 为真，完整接管 [[Gaffer GraphEditor]]。

## 3. 运行时类名替换

适用于原生在**运行时**按名字构造的类。[[ueColorChooser]]、[[gaffer-color-chooser-plus]] 替换拾色器：

- 内联 `ColorChooserPlugValueWidget` 和弹窗 `ColorChooserDialogue` 都在运行时调用 `GafferUI.ColorChooser(...)`，startup 里 `GafferUI.ColorChooser = 新类` 一处就全部生效。别人用 `from GafferUI import ColorChooser` 绑定的是 import 时的旧类，不受影响。
- 替换类必须实现原生的完整接口契约（方法、类方法、信号一个不少），撤销合并之类的行为直接委托原生实现。
- 防递归：换名后类里写的 `GafferUI.ColorChooserDialogue.__init__` 会指回自己，类定义时先保存 `__base = GafferUI.ColorChooserDialogue`。
- 代理构造时 self 的 MRO 里没有替换类，双下划线方法找不到，回调用闭包。
- 唯一依赖的私有接口用一个函数守卫（`_seamColumn()`），环境变量（`GAFFER_COLOR_CHOOSER_PLUS_DISABLE`）可整个关掉。

## 4. 局部 monkey-patch

只改原生界面的一小块：

- **换一列**：HierarchyView 的 Name 列换成自写的 [[Gaffer PathColumn]] 子类（[[hierarchyMarkerIcons]]）。`StandardPathColumn` 不能子类化，只能整列复刻。
- **给菜单加一条**：patch `_PlugTableView.__prependRowMenuItems`，先调原方法再 `MenuDefinition.insertAfter(...)`（[[spreadsheetRowDuplicate]]）。外部访问私有方法写 mangled 名 `_PlugTableView__xxx`；类属性做幂等守卫。
- **给没有注册口的控件挂功能**：patch `GafferOSLUI.OSLCodeUI._CodePlugValueWidget.__init__`，构造完再 `setCompleter(...)`（[[codeCompleter]]）。

## 注意事项

- 自绘的替代控件只在自己的编辑器里挑用，别用 `PlugValueWidget.registerType` 全局注册，会改掉原生面板。
- patch 私有方法依赖具体版本，跨大版本（1.6 → 1.7）要重新核对源码（[[Gaffer 1.6 与 1.7 API 差异]]）。
- 包装对象身份不稳定，patch 里比较节点 / 插口一律 `isSame()`（[[Boost.Python 包装对象身份]]）。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[gaffer_parameter_editor]] —— 并存 + 接管 `acquire`
- 实体：[[Gaffer NodeEditor]] —— 被接管入口的原生面板
- 实体：[[Gaffer LogView]] —— 用 `registerType` 新增的编辑器
- 实体：[[codeCompleter]] —— 注册口 + patch `__init__`
- 实体：[[spreadsheetRowDuplicate]] —— patch 原生菜单
- 实体：[[gaffer-color-chooser-plus]] —— 类名替换
- 实体：[[hierarchyMarkerIcons]] —— 替换 HierarchyView 的列
- 实体：[[ueColorChooser]] —— 类名替换与接口契约
- 实体：[[gaffer_network_editor]] —— 元类接管 GraphEditor
- 实体：[[Gaffer GraphEditor]] —— 被完整接管的原生编辑器
- 概念：[[Gaffer PathColumn]] —— 换列用的基类
- 概念：[[Boost.Python 包装对象身份]] —— patch 里的比较规则
- 问题：[[Gaffer 拾色器弹窗点 OK 不生效]] —— 替换类没守住原生信号契约的后果
- 问题：[[Gaffer 自制 Editor 同步重建界面导致卡死]] —— 新增编辑器从图信号重建界面要延迟到 idle
- 问题：[[自制节点图编辑器在 Gaffer 1.7 下建不出来]] —— 接管原生类后要补齐它的全部接口
- 综述：[[在 Gaffer 里另做参数面板]] —— 并存式替换的完整案例
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 完整接管原生类的案例
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 私有接口随版本变化
- 来源：[[来源 - Claude 全局记忆]]
