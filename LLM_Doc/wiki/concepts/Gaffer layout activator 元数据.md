---
type: concept
aliases: [layout:activator, layout:visibilityActivator, activator]
tags: [gaffer, gafferui, metadata]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer layout activator 元数据

## 定义

[[Gaffer]] 参数面板用 activator 元数据决定某个插口控件是否置灰或隐藏：

- 节点上注册 `layout:activator:<名字>`，值是一个条件；
- 插口上注册 `layout:activator = "<名字>"`（条件为假时置灰）或 `layout:visibilityActivator = "<名字>"`（条件为假时隐藏）。

activator 的值可以是 Python 回调，也可以是**一段会被 eval 的 Python 代码字符串**。PlugLayout 求值时（`GafferUI/PlugLayout.py` 的 `__updateActivations`）遇到字符串就执行 `eval( result, {"parent": node} )`（[[来源 - Claude 全局记忆]]）。

## 在各软件里的对应

字符串形式能存进实例元数据、随 .grf / .gfr 一起序列化，这是给**从 .grf 加载的 Box 节点**做「按模式置灰 / 隐藏」的可行做法。lambda 形式做不到：实例元数据只收 `IECore.Data`，类级 lambda 又不能序列化（见 [[Boost.Python 包装对象身份]]）。

```python
Gaffer.Metadata.registerValue( node, "layout:activator:modeIsZero", 'parent["mode"].getValue() == 0' )
Gaffer.Metadata.registerValue( node["radius"], "layout:visibilityActivator", "modeIsZero" )
```

原生 PlugLayout 在节点的 ContextTracker context 里求值 activator，值变了会刷新可见性；自做参数面板要照这个语义每次刷新时重算，见 [[Gaffer PlugLayout]]。

## 注意事项

- **activator 没注册时取 False**（`result = result if result is not None else False`）：引用它的插口会整个消失。activator 必须和插口一起存进同一个 .grf。
- **`divider` 不要挂在会被隐藏的插口上**：`__updateActivations` 只切换插口控件的可见性，不管 `Divider` 控件，分隔线会单独留在界面上。
- 字符串 eval 的行为在 1.6.5.1 实测；1.7.1.0 的原生 PlugLayout 在 `ContextTracker.acquireForFocus( node ).context( node )` 里重算 activator，值变了即刷新。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer NodeEditor]] —— activator 生效的地方
- 概念：[[Gaffer PlugLayout]] —— 读取并求值 activator 的布局器
- 概念：[[Boost.Python 包装对象身份]] —— lambda 元数据的读写限制
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 1.7 在 ContextTracker context 里重算 activator
- 综述：[[Gaffer Box 处理器脚手架]] —— Box 节点的插口元数据惯例
- 来源：[[来源 - Claude 全局记忆]]
