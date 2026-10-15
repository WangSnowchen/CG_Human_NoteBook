---
type: synthesis
aliases: [FilterResults Collect Query]
tags: [gaffer, scene-query]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 逐位置动态查询

需要「对每个匹配到的位置分别查一次属性，再按结果做事」时，[[lgtLib 共享节点库]] 里最通用的链路是 FilterResults → Collect → Query。

## 链路

```text
FilterResults(filter = PathFilter / SetFilter)
  → Collect(contextValues = FilterResults.outStrings)
  → AttributeQuery / PrimitiveVariableQuery(location = '${collect:value}')
  → Expression(OSL) 组合布尔结果
```

1. `FilterResults.outStrings` 列出所有匹配的路径。
2. `Collect` 把每条路径放进上下文变量 `collect:value`，对下游逐个求值。
3. Query 节点的 `location` 写 `${collect:value}`，于是每个位置各查一次。
4. 输出用 OSL Expression 做布尔组合。

## 例子

- 查 `scene:visible` 为 false 的位置，交给 `Prune` 删掉。
- 用 `!has_material && has_P` 找出有几何但没材质的对象，隔离出来检查。

## 按集合过滤

用 `SetFilter(setExpression='asset:xxx')` 作为 PathFilter 的 `roots`，只在某个集合下面查。

## 相关

- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 实体：[[MeshAttributeCollector]] —— 用 Python 节点一次统计全场景属性的另一种方式
- 综述：[[Gaffer 查询回写闭环]] —— 查询结果驱动变换
- 综述：[[Gaffer Spreadsheet 多实例与参数表]] —— 同样靠上下文变量逐个求值
- 来源：[[来源 - Claude 全局记忆]]
