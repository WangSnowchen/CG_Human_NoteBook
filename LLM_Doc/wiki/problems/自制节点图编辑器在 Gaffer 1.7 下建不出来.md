---
type: problem
aliases: [plugContextMenuSignal AttributeError, _PlugVisibilityGadget, Gaffer 1.7 右键菜单为空]
tags: [gaffer, network-editor, gaffer-1.7]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# 自制节点图编辑器在 Gaffer 1.7 下建不出来

## 现象

在 Gaffer 1.6 下正常的自制节点图编辑器（[[gaffer_network_editor]]），换到 1.7.1.0 后：

1. 打开编辑器时报 `AttributeError: plugContextMenuSignal`，编辑器面板建不出来；
2. 修好上一条后，单选一个节点右键，菜单里 `/Edit...`、`/Enabled`、`/Connections`、`/Focus`、`/Show Contents...`、`/Bookmarked` 全没有；
3. 只写了新元数据键的第三方节点，按 ↓ 进不去。

## 原因

1. **1.7 新增 `_PlugVisibilityGadget`**：`startup/gui/editor.py` 对每个 Editor 调五个 `connectToEditor`，它的判断条件是 `isinstance(editor, GraphEditor)`。自制编辑器接管了 `GafferUI.GraphEditor`，这个判断为 True，于是它去要 `editor.plugContextMenuSignal()` / `nodeContextMenuSignal(True)`，自制编辑器没有这两个方法（[[来源 - Claude 全局记忆]]）。
2. **1.7 把整套节点右键菜单搬到「多选」那一路**：这些条目注册在 `nodeContextMenuSignal(True)` 上（`startup/gui/graphEditor.py:116`，参数是节点列表），原生 `__buttonPress`（`GraphEditor.py:487-490`）不管选了几个节点都发这个信号。照 1.6 写成「选了两个以上才发」，单选菜单就整个空掉。
3. **「能不能进这个节点」的元数据键改了**：1.7 正式键是 `ui:childNodesAreViewable`，原来的两个降为旧键。Gaffer 自带 Box 新旧键都写，所以自带节点看不出问题。

## 解决

1. 把信号契约补齐：初始化时建四个 `Gaffer.Signals.Signal3()`（plug / connection / node / multiNode），再加三个访问器，签名照 `GraphEditor.py:205/216/264`。原生那三个是类级、实例级混合式（`classOrSelf`），弹菜单时类级、实例级各发一次。
2. 弹节点右键菜单时无条件发 `nodeContextMenuSignal(True)`，传当前选中节点列表。
3. 判断能否进入节点时照原生依次查 `ui:childNodesAreViewable` 和两个旧键。

附带：编辑器拆掉后 idle 回调还会响一次，报 `RuntimeError: Internal C++ object (_GraphView) already deleted`。回调开头先真去访问一次 `viewport()` 判断视图还活着（Python 属性还指着空壳，`is not None` 判断不出来）。

升到 1.7 后测试夹具也要改两处（产品代码没问题）：`OSLShader` 出厂就带一个空的 `out` 容器 `Plug`（1.6 没有）；`Show Contents...` 的原生命令换成了 `functools.partial(GraphEditor.__acquireNodes, nodeList)`。

如果改完 rez 包启动时还报同一个错，多半是日常启动跑的是本地扩展副本（见 [[改了 rez 包但运行的还是本地扩展副本]]）。

## 验证方法

- 升级大版本先原样跑一遍测试拿真实失败清单，再动手。
- 「一条 FAIL 都没有」要先确认测试跑到了结尾（中途抛异常也是 0 条 FAIL）。
- screengrab 里 `GafferUI.Editor.create("NetworkEditor", script)` 真建一个，并打印 `sys.modules["networkEditor"].__file__` 确认跑的是哪一份代码。
- 用 1.7 下没变的数值做对照：`StandardNodeGadget.bound()` 仍是 11.0000x4.1641，Dot 2.5、Aux 2.0。

## 相关

- 实体：[[gaffer_network_editor]] —— 出问题的编辑器
- 实体：[[Gaffer GraphEditor]] —— 1.7 右键菜单信号的定义处
- 问题：[[改了 rez 包但运行的还是本地扩展副本]] —— 修好后启动仍报同一个错的原因
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 1.7 的其他变化
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 不建原生窗口时要提供的原生接口
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 接管原生类之后要补齐它的接口
- 来源：[[来源 - Claude 全局记忆]]
