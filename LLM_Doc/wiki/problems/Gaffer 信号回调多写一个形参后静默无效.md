---
type: problem
aliases: [EventSignalCombiner 吞异常, DragDropSignal 回调无反应]
tags: [gaffer, gafferui, signals, boost-python]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 信号回调多写一个形参后静默无效

## 现象

给 Gadget 的拖放信号或节点的插口信号连了 Python 回调，操作时完全没反应：不崩溃、不打印错误，回调像没被调用。团队 imageSticker 扩展的拖拽失效就是这个原因。

## 原因

信号的形参个数由 C++ 绑定严格确定：`Gadget::DragDropSignal` 是 2 个参数（gadget, event），`Node::UnaryPlugSignal` 是 1 个参数（plug）。Python 回调多声明一个形参，调用时抛 `TypeError`；而事件类信号用 `EventSignalCombiner` 汇总结果，它捕获异常后返回 False，所以回调静默失效。

## 解决

- 照 C++ 头文件核对信号签名：`include/Gaffer/Gadget.h`、`include/Gaffer/Node.h`（以及对应的 Python 测试文件里的连接写法）。
- 排查「没反应」先查签名，不要给回调包 try/except 吞错（会把问题藏得更深）。
- 需要额外参数时用 `functools.partial` 或闭包，不改回调形参个数。

## 验证方法

回调第一行写日志或断言，确认被调用；用正确签名重连后功能恢复。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 概念：[[Boost.Python 包装对象身份]] —— Boost 绑定的其他严格之处
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 测试里直接发信号时同样要匹配签名
- 来源：[[来源 - Claude 全局记忆]]
