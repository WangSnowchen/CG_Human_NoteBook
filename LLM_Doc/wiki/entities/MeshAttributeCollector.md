---
type: entity
aliases: [Mesh Attribute Collector]
tags: [gaffer, custom-node, scene-query]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# MeshAttributeCollector

[[gaffer_custom_node]] 里的 Python 节点（`Gaffer.ComputeNode`），统计场景里网格的属性值分布：每个属性有哪些取值、每个取值在哪些位置上。结果不写文件，直接放在节点的输出插口上。Tab 菜单 `/Noise/Scene/Mesh Attribute Collector`。

## 要点

- **输入**（都是 StringVectorDataPlug，一行一个）：
  - `paths`：PathFilter 写法，默认 `[ "/..." ]`。实现是 `IECore.PathMatcher( 行列表 )` + `GafferScene.SceneAlgo.matchingPaths( matcher, scene, 结果 )`。
  - `attributes`：属性名模式，逐行用 `IECore.StringAlgo.match( name, pattern )` 匹配。
  - 两者都用 **Gaffer 通配写法**（`*`、`...`），不用 Python 正则。
- **`${变量}` 要自己替换**：StringVectorDataPlug 不自动替换上下文变量，每行要 `Gaffer.Context.current().substitute()`，哈希也要用替换后的值。
- **输出**：
  - `result`：JSON 文本，结构 `{ 属性名 : { 值 : [ 路径 ] } }`。
  - `values`：StringVectorData。
- **结果表控件**：参数面板里的 `result` 显示成自写的 `ResultPlugValueWidget`（QTreeWidget，属性一行、值一行），点一行会调 `ScriptNodeAlgo.setSelectedPaths` 选中对应位置。
- **遍历整场景**：哈希用 `GafferScene.SceneAlgo.hierarchyHash( scene, "/" )`，计算用 `SceneAlgo.parallelGatherLocations( scene, locationFn, gatherFn )` 并行遍历（gather 串行执行、顺序不固定，要自己排序），hash 和 compute 的缓存策略都用 `TaskCollaboration`。

## 常见问题

- [[Gaffer Python ComputeNode 调基类 hash 报错]]
- [[Gaffer 自写 PlugValueWidget 一直空白]]

## 相关

- 实体：[[gaffer_custom_node]] —— 所在的包
- 问题：[[Gaffer Python ComputeNode 调基类 hash 报错]] —— 本节点 hash / compute 的写法
- 问题：[[Gaffer 自写 PlugValueWidget 一直空白]] —— 结果表控件的空列表处理
- 综述：[[Gaffer 逐位置动态查询]] —— 用节点图做逐位置查询的另一种方式
- 来源：[[来源 - Claude 全局记忆]]
