---
type: problem
aliases: [QPainterPath OddEvenFill 洞, shape() 命中不到, QGraphicsItem 点不中]
tags: [qt, ui, network-editor]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# QPainterPath 重叠区域点不中

## 现象

QGraphicsItem 的某一小块区域点了没反应，周围都正常。[[gaffer_network_editor]] 里遇到过两处：

- 材质节点卡片边线上的分栏折叠三角，点了不展开；
- Backdrop 的四个角点不中（拖不动、改不了大小）。

奇怪的是 item 自己写的命中函数（用矩形 `contains`）对这些点返回正确结果，`view.items()`、`item.contains()`、按位置找 item 的函数却都返回空。

## 原因

`shape()` 里把几块区域 `addRect` 到同一个 `QPainterPath`，而 `QPainterPath` 默认填充规则是 `Qt.OddEvenFill`：被覆盖偶数次的区域算在外面。折叠三角的命中框贴在卡片边线上和卡片矩形重叠；Backdrop 的 `shape()` 由四条边拼成，四个角是两条边的重叠处。重叠的那一块被「异或」成了洞（[[来源 - Claude 全局记忆]]）。

另一类相关原因：`QGraphicsScene.items(rect)` 默认用 `Qt.IntersectsItemShape`，按 `shape()` 判断命中。画在 `shape()` 之外的东西（卡片外侧的 `+`、悬停标签、卡片边上的三角）即使画出来了也点不中。

## 解决

- 拼接多块区域的 `QPainterPath` 一律设 `path.setFillRule(QtCore.Qt.WindingFill)`。
- 画在卡片外、又需要能点的小部件，把它自己的命中框 `addRect` 进 `shape()`，只加那一小块（把整条长文字也加进去会吃掉旁边节点的点击）。
- 或者在命中逻辑里对光标周围一小块区域再捞一遍（如 `+` 周围 28×28）。

## 验证方法

- 确诊方法：沿一条水平线逐点扫 `item.shape().contains(point)` 打表，洞的位置一目了然（实测 dx=-120 True、-130 False、-147 True）。
- `boundingRect()` 在这类问题里通常是对的，别盯着它查。
- 修好后真鼠标点一遍（xdotool），合成事件可能绕开视图的命中路径。

## 相关

- 实体：[[Qt]] —— QPainterPath 填充规则和场景命中测试
- 实体：[[gaffer_network_editor]] —— 遇到问题的编辑器
- 问题：[[QGraphicsItem 拖动或悬停后留下拖影]] —— 同样出在 `shape()` / 包围盒的写法上
- 综述：[[Qt 自绘界面常见坑]] —— 汇总
- 来源：[[来源 - Claude 全局记忆]]
