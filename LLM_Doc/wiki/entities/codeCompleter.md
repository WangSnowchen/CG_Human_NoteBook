---
type: entity
aliases: [代码补全, PythonCompleter, OslCompleter]
tags: [gaffer, gafferui, python, osl, expression]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# codeCompleter

用户自制的 [[Gaffer]] 代码补全，覆盖 Expression 节点（Python / OSL 两种语言）和 OSLCode 节点的代码框（[[来源 - Claude 全局记忆]]）。

## 要点

- 实现集中在 `~/gaffer/python/codeCompleter.py`；`startup/gui/expressionCompleter.py` 与 `oslCompleter.py` 是薄包装（原版留 `.bak`）。
- **`PythonCompleter`**：Expression 的 Python 命名空间是 `{imath, IECore, parent: node.parent(), context}` 加 builtins。`parent` 在运行时是 dict，`parent.x` 会 AttributeError，所以根上只补 `parent["..."]` 字典写法；`import` 语句补模块名和成员。
- **`OslCompleter`**：补 `parent.xxx` 路径段（OSL 引擎语法 `parent\.[A-Za-z_0-9\.:]+`）和 OSLCode 的 `parameters` / `out`；内置 134 个 [[OSL]] 函数签名，直接插入形如 `sin( angleInRadians )`。

## 用法 / 关键参数

- Expression：`ExpressionWidget.registerCompleter( "python" / "OSL", func )`。
- OSLCode 没有公开注册口：monkey-patch `GafferOSLUI.OSLCodeUI._CodePlugValueWidget.__init__`，构造完调 `codeWidget().setCompleter(...)`（做法见 [[替换 Gaffer 原生编辑器的方法]]）。

## 注意事项

- Boost.Python 函数的签名只能从 `__doc__` 第一行 `name( (Type)arg1, ...) -> Ret :` 解析：贪婪 `(.*)` 匹配到最后一个 `)`，再剥掉参数名前的类型。
- CodeWidget 的补全菜单只在「敲字」时弹出；`setText` 后光标在 0，不会触发，测试要模拟输入。
- Gaffer 插口只接收同方向的子插口：给 OSLCode 的 `out` 加子插口要用 `Direction.Out`。
- `V3fPlug.getInterpretation` 按 property 访问，写成 `plug.getInterpretation`。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[OSL]] —— OSL 补全的语言
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 注册口与 monkey-patch 两种接入方式
- 来源：[[来源 - Claude 全局记忆]]
