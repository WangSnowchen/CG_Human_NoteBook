---
type: concept
aliases: [PlugLayout, GafferUI.PlugLayout, layout 元数据]
tags: [gaffer, gafferui, metadata]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer PlugLayout

## 定义

`GafferUI.PlugLayout` 是 [[Gaffer NodeEditor]] 的排版内核：按插口上的 `layout:*` 元数据把一组插口排成 tab、折叠块和行，每行的控件由 `PlugValueWidget.create()` 按 `plugValueWidget:type` 元数据挑。自己做参数面板时，读懂这套元数据就能复现原生的分区、顺序、显隐（[[来源 - Claude 全局记忆]]）。

## 关键元数据与语义

| 元数据 | 作用 |
|---|---|
| `layout:section` | 插口所在分区，`.` 分层（`Settings.Log`）。顶层分区是 tab，下层是折叠块 |
| `layout:index` | 排序 |
| `layout:divider` | 在该插口后画分隔线 |
| `layout:activator:<名>` + 插口上的 `layout:activator` / `layout:visibilityActivator` | 前者置灰，后者隐藏，详见 [[Gaffer layout activator 元数据]] |
| `layout:section:<分区>:collapsed` / `layout:section:<分区>:summary` | 折叠默认状态、折叠时显示的摘要 |
| `layout:section::currentTab` | 当前 tab（原生把它写成非持久实例元数据） |
| `layout:width` / `layout:minimumWidth` | 控件宽度 |
| `layout:customWidget:<名>:widgetType` | 在布局里插自定义控件（如 1.7 的 `layout:customWidget:addButton` → `GafferUI.PlugCreationWidget`） |
| `plugValueWidget:type` | 控件类型；注册成空串 `""` 表示不显示 |

- **`summary` / `collapsed` 是相对于「布局所属的那个 parent」的**：Arnold 灯的 `layout:section:Shape:collapsed=False` 注册在 `parameters` 插口上，节点上查不到。读这两项必须一路带着 `(parent, 相对名)`，否则灯的分区全默认收起、摘要全查不到。
- **嵌套布局**：控件类型是 `LayoutPlugValueWidget` 的插口（`user`、`parameters`、`transform`、`layers`）内部再建一个 PlugLayout。`transform` 的 `LayoutPlugValueWidget` 是按**插口类型**注册的，元数据里查不到，判断某插口是不是布局容器要问 `PlugValueWidget._PlugValueWidget__creator`。
- **每一层连自己 parent 的信号**（`PlugLayout.py` 约 112 行）：`ArrayPlug.resize()` 加出来的子插口只触发它所在插口的 `childAdded`，节点的信号不响。
- **不按方向过滤**：`layoutOrder` 不看插口方向，`Out` 插口只要注册了控件就显示成只读行（InteractiveRender 的 `messages` 日志框就是这样出现的）。
- **行高**：原生只把 `hasLabel()` 为假的控件包进 `PlugWidget`（加标签、标签宽 `PlugWidget.labelWidth()=150`），并用 `setSizeConstraint( SetMinAndMaxSize )` 把这一行固定成 20px；自带标签的控件（日志框、表格）不包，可以长高；页尾再垫一个弹簧。复现时的坑见 [[Gaffer 自制参数面板里大控件被拉高或压扁]]。
- **折叠 / tab 记忆**：原生把折叠状态、当前 tab 写成非持久实例元数据，读取时 `instanceOnly=True` 的实例值优先。
- **刷新**：activator / summary 在 `ContextTracker.acquireForFocus( node ).context( parent )` 里求值（[[Gaffer ContextTracker]]）；内部大量用 `@GafferUI.LazyMethod()`，控件不可见时更新不跑（[[GafferUI LazyMethod]]）。

## 在各版本里的对应

- Gaffer 1.6.5.1：没有 `setFilter` / `getFilter` / `removeFilter` / `StandardFilterWidget`，要过滤只能按 1.7 上游实现 backport（补丁写成幂等 + `hasattr` 探测）。
- Gaffer 1.7.1.0：原生带过滤接口；StandardOptions / CustomAttributes / CustomOptions 的复合插口改用 `LayoutPlugValueWidget`，可以递归进去逐项成行。

## 注意事项

- 判断插口被过滤掉要用 `visible()`；`widget.getVisible()` 只是控件自己的标记，拿它断言会假绿。
- `layout:activator` 未注册时取 `False`，引用它的插口会整行消失。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer NodeEditor]] —— 使用本排版内核的原生面板
- 实体：[[gaffer_parameter_editor]] —— 照本元数据语义自己排版的参数面板
- 概念：[[Gaffer layout activator 元数据]] —— activator 的写法与可序列化形式
- 概念：[[GafferUI LazyMethod]] —— 布局刷新依赖的延迟机制
- 概念：[[Gaffer ContextTracker]] —— activator / summary 的求值 context
- 问题：[[Gaffer 自制参数面板里大控件被拉高或压扁]] —— 复现原生行高规则时的坑
- 综述：[[在 Gaffer 里另做参数面板]] —— 读本元数据自己排版的整体方法
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 过滤接口 1.7 才有
- 来源：[[来源 - Claude 全局记忆]]
