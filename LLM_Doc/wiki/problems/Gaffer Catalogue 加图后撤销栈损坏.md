---
type: problem
aliases: [Catalogue Ctrl+D 撤销报错, removeChildInternal is not a child]
tags: [gaffer, catalogue, undo]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Catalogue 加图后撤销栈损坏

## 现象

往 [[Gaffer Catalogue]] 里加一张图并调整它在列表里的顺序后按 Ctrl+Z，撤销到一半抛出：

```text
GraphComponent::removeChildInternal : "in5" is not a child of "<catalogue>.__switch.in"
```

之后 `undoAvailable()` 仍是 True，再按 Ctrl+Z 报 `Action cannot be undone without being done first.`，**之前的所有操作都撤销不了**。原生快捷键 `Ctrl+D`（复制当前图）同样会触发，不需要任何自定义代码就能复现。

## 原因

加图（往 `images` 加子插口，Catalogue 内部 Switch 的 ArrayPlug 跟着长一路）和 `reorderChildren()` 放在同一个 `UndoScope` 里时，撤销按记录逆序执行，内部 Switch 的 `in` 子插口编号和重排后的顺序对不上，撤销半途失败，栈进入不一致状态。原生 `CatalogueUI.__duplicateCurrentImage` → `_duplicateImages` 正是一个 scope 里做这两件事。单独加图、单独重排都没问题。

## 解决

拆成两个 UndoScope：先加图，再重排。

```python
with Gaffer.UndoScope( script ) :
    catalogue["images"].addChild( newImage )
with Gaffer.UndoScope( script ) :
    catalogue["images"].reorderChildren( newOrder )
```

代价是撤销这一次操作要按两次 Ctrl+Z，两步都能干净撤销和重做。

## 验证方法

加图 + 重排后连续撤销到底再全部重做，过程中没有异常，`undoAvailable()` / `redoAvailable()` 与实际一致。

## 相关

- 实体：[[Gaffer Catalogue]] —— 出问题的节点
- 来源：[[来源 - Claude 全局记忆]]
