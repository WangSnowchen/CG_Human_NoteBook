---
type: problem
aliases: [_updateFromValues 空列表 IndexError]
tags: [gaffer, gafferui, plugvaluewidget]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 自写 PlugValueWidget 一直空白

## 现象

自己写的 PlugValueWidget（例如 [[MeshAttributeCollector]] 的结果表 `ResultPlugValueWidget`）在参数面板里永远是空的，输出插口明明有值。终端里可能有一条 IndexError。

## 原因

插口值需要后台计算时，PlugValueWidget 在开算之前会先收到一次 `_updateFromValues( [], None )`，表示「正在计算」。实现里直接取 `values[0]` 就会 IndexError，异常打断刷新链，之后计算完成的那次更新也不再到达，控件一直空着。

## 解决

`_updateFromValues` 开头先处理空列表：

```python
def _updateFromValues( self, values, exception ) :

	if not values :
		# 后台还在计算，先清空或显示「计算中」
		self.__tree.clear()
		return

	value = values[0]
	...
```

## 验证方法

选中节点打开参数面板，等后台计算完成后控件显示结果；改输入参数后能自动刷新。

## 相关

- 实体：[[MeshAttributeCollector]] —— 遇到问题的节点
- 实体：[[gaffer_custom_node]] —— 自写控件的所在包
- 实体：[[Gaffer NodeEditor]] —— 承载 PlugValueWidget 的参数面板
- 来源：[[来源 - Claude 全局记忆]]
