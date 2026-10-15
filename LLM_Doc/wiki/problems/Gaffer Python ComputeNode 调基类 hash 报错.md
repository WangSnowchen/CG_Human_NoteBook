---
type: problem
aliases: [Gaffer.ComputeNode.hash AttributeError]
tags: [gaffer, python, computenode]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Python ComputeNode 调基类 hash 报错

## 现象

用 Python 写 `Gaffer.ComputeNode` 子类，在 `hash()` / `compute()` / `hashCachePolicy()` 里照 C++ 习惯调用基类实现（`Gaffer.ComputeNode.hash( self, ... )`），报 AttributeError。

## 原因

Gaffer 1.7 的 Python 绑定里 ComputeNode 只有 `DependencyNodeClass` + methodOverride 那一层，Python 侧没有暴露 `Gaffer.ComputeNode.hash` / `compute` / `hashCachePolicy` 这几个基类方法。

## 解决

覆写时不调基类，每个输出自己把哈希和计算写完整；缓存策略里自己处理的输出返回相应策略，其余分支返回 `Gaffer.ValuePlug.CachePolicy.Default`。

依赖整个场景的输出：

- 哈希用 `GafferScene.SceneAlgo.hierarchyHash( scene, "/" )`。
- 计算用 `GafferScene.SceneAlgo.parallelGatherLocations( scene, locationFn, gatherFn )` 并行遍历。gather 串行执行、但位置的到达顺序不固定，结果要自己排序。
- 这类输出的 hash 和 compute 缓存策略都用 `TaskCollaboration`。

```python
def hashCachePolicy( self, output ) :

	if output.isSame( self["result"] ) :
		return Gaffer.ValuePlug.CachePolicy.TaskCollaboration

	return Gaffer.ValuePlug.CachePolicy.Default
```

## 验证方法

无头创建节点，对输出 `getValue()` 拿到正确结果；改上游场景后再取值，结果随之更新（哈希包含了场景层级）。

## 相关

- 实体：[[MeshAttributeCollector]] —— 按这套写法实现的节点
- 实体：[[gaffer_custom_node]] —— 加 Python 节点的步骤
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 本条在 1.7.1.0 实测
- 来源：[[来源 - Claude 全局记忆]]
