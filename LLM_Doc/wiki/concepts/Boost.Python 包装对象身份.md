---
type: concept
aliases: [Boost.Python wrapper identity, isSame]
tags: [gaffer, python, boost-python]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Boost.Python 包装对象身份

## 定义

[[Gaffer]] 的 C++ 对象经 Boost.Python 暴露给 Python。同一个 C++ 对象每次经 `children()`、`parent()["x"]`、`node["plug"]` 之类访问，都会产生一个**新的 Python 包装对象**。所以 `is`、`id()`、弱引用都不能代表「同一个节点 / 插口」（[[来源 - Claude 全局记忆]]）。

## 在各软件里的对应

- Gaffer 判断同一对象：`a.isSame( b )`。`None` 没有 `isSame`，要先判空。
- 需要持久识别时按名字或相对路径比较（`node.relativeName( script )`），节点会改名时用 `isSame()` 比对象。
- 1.6.5.1 与 1.7.1.0 都如此。

## 注意事项

- **`weakref.ref( node )` 记不住 Gaffer 节点**：弱引用挂在临时包装上，构造函数一返回 `ref()` 就是 None。要「钉住」某个节点，用一个 `Gaffer.StandardSet` 存它，需要时从集合里取。
- 用节点对象做 dict 键、做 `in` 判断同样不可靠；迭代时比较要逐个 `isSame()`。
- 缓存要随结构变化迁移时（例如 Spreadsheet 行改名），按插口 `isSame()` 迁移，不按 label 重建。
- **类级注册 lambda 元数据**：`Gaffer.Metadata.registerValue( Class, key, lambda )` 存的是回调；`Metadata.value( instance, key )` 读取时用实例调用 lambda、返回结果（例如 bool），不是返回 lambda 本身。`Metadata.value( Class, key )` 读类本身会 Boost 报错（必须给实例）；`registerValue( instance, key, lambda )` 不支持（实例只收 `IECore.Data`）。lambda 不能序列化，只在当前进程有效。需要随文件保存的条件判断见 [[Gaffer layout activator 元数据]]。
- Boost.Python 的参数检查严格：Python 写的假对象传给要求 C++ 类型的信号或函数会直接 `ArgumentError`；信号回调形参个数不对会被静默吞掉，见 [[Gaffer 信号回调多写一个形参后静默无效]]。
- 没有在 Python 里绑定的 C++ 子类，Python 拿到的是最近一个已绑定基类的壳（`typeName()` 可能只报 `RunTimeTyped`）。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[gaffer_mcp]] —— 工具里节点一律按名字定位
- 实体：[[SpreadsheetOverviewEditor]] —— 比较节点和沿父链判断时用 `isSame()`
- 概念：[[Gaffer layout activator 元数据]] —— lambda 元数据不能序列化时的替代
- 问题：[[Gaffer 信号回调多写一个形参后静默无效]] —— Boost 绑定的另一处严格检查
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 两个版本都保持这一行为
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 节点 item 与节点的对应要用 `isSame()`
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— patch 原生代码时比较节点和插口的规则
- 来源：[[来源 - Claude 全局记忆]]
