---
type: concept
aliases: [ContextTracker, GafferUI.ContextTracker]
tags: [gaffer, ui, focus]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer ContextTracker

## 定义

`GafferUI.ContextTracker` 回答「以当前 focus 节点为终点、在当前 context 下求值时，哪些节点和插口真正参与了计算，各自用的是什么 context」。[[Gaffer]] 界面里凡是要按 focus 显示「这个节点在不在起作用」的地方都靠它。

三个性质（[[来源 - Claude 全局记忆]]）：

1. **只算上游**：focus 节点下游的节点不算参与。
2. **只算当前 context 真正走到的那条路**：Switch 没选中的那一支不算。
3. **异步**：结果在后台算，算完发 `changedSignal()`；`updatePending()` 为真时结果是旧的。

## 在各软件里的对应

| 用在哪 | 怎么用 |
| --- | --- |
| [[Gaffer GraphEditor]] | `ConnectionGadget::updateFromContextTracker`：不参与的连线画成 `DisabledState`（`#999999` → `#4f4f4f`）。原生只压暗不参与的，不加亮参与的 |
| [[gaffer_network_editor]] | `GafferUI.ContextTracker.acquireForFocus(script)`，连 `changedSignal()`；不参与的节点和连线都压暗到 0.20；节点 `enabled` 由它算出来是关着时停用斜线画成黄色 `#f0dc28` |
| [[Gaffer PlugLayout]] / 参数面板 | `ContextTracker.acquireForFocus(node).context(node)` 拿到 node 实际求值用的 context，在这个 context 里算 `layout:activator` |

## 注意事项

- 自己沿连线 BFS 上下游算出来的集合和它不一样（会把下游和没选中的 Switch 分支算进去），位置也会对不上；要和原生一致只能用它。
- 收到 focus 变化时如果 `updatePending()` 为真就先别刷新显示，等 `changedSignal()`；否则会先按旧结果把整张图压暗一帧，看起来是「点 focus 闪一下」。
- 验证压暗效果要在截图里数像素，只断言画笔颜色不算数。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer GraphEditor]] —— 原生按它压暗连线
- 实体：[[gaffer_network_editor]] —— 按它压暗节点和连线
- 实体：[[gaffer_parameter_editor]] —— activator / summary 在它给出的 context 里求值
- 概念：[[Gaffer PlugLayout]] —— 参数面板按它给出的 context 算 activator
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— focus 显示的做法
- 来源：[[来源 - Claude 全局记忆]]
