---
type: problem
aliases: [Gaffer Expression 循环依赖 SIGSEGV]
tags: [gaffer, expression, crash]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# MeasureDistance 表达式循环依赖导致崩溃

## 现象

加载或计算 [[MeasureDistance]] 时 Gaffer 进程直接崩溃（SIGSEGV），退出码 139，没有任何报错输出。

## 原因

同一个 Expression 既写两个 PathFilter 的路径（`filterPathsA` / `filterPathsB`），又读 `BoundQuery.center` 算距离。而 BoundQuery 的结果依赖这两个 PathFilter，求值时形成环。Gaffer 遇到这种表达式内部的依赖环直接段错误，不给出 "Cycle detected" 之类的提示。

## 解决

把表达式拆成两个，切断回路：

- `exprPaths`：只写 PathFilter 的路径。
- `expr`：只读 BoundQuery 的结果，写 `distance`。

通用规则：一个 Expression 的输出不能反过来成为它自己输入的上游。确实需要从自身下游采样时，在采样用的 Dot 上设 `AcceptsDependencyCycles`。

## 验证方法

无头加载 `.grf` 后对 `distance` 求值，进程正常退出、退出码 0，且距离数值和手算一致。

## 相关

- 实体：[[MeasureDistance]] —— 出问题的节点
- 综述：[[Gaffer 查询回写闭环]] —— 查询结果进表达式时都要注意这个环
- 综述：[[Gaffer Box 处理器脚手架]] —— 其它常用写法里记了 AcceptsDependencyCycles
- 来源：[[来源 - Claude 全局记忆]]
