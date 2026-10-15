---
type: problem
aliases: [QGraphicsItem 残影, QGraphicsItem ghosting, boundingRect 太小]
tags: [qt, ui, network-editor]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# QGraphicsItem 拖动或悬停后留下拖影

## 现象

QGraphicsView 里拖动或缩放 item 时，item 后面留下一串擦不掉的痕迹。[[gaffer_network_editor]] 里实际遇到过四种：

- 框选一组节点拖着走，光标压着的那个节点留下一串金色拖影；
- 带注释的节点一拖，注释文字留拖影；
- 一直选中 Backdrop、拖它的边改大小，留下一排等间距 1px 竖线，竖线高度正好等于框高；
- 拉 Backdrop 时框自己一路变长。

## 原因

Qt 只重画 item `boundingRect()` 里面的区域。凡是画到包围盒外面的东西，item 移走后旧位置不会被擦掉。四种拖影各自的原因：

1. **按 `1/lod` 放大的绘制没有上限**：focus 角标要在屏幕上保持固定大小，在 item 坐标里按 `FOCUS_TAB_MIN_PIXELS / lod` 放大；缩到最小（`MIN_ZOOM=0.02`）时角标有 550px，包围盒只留了 222px。而且鼠标悬停时也画角标，包围盒的大余量却只在 focus 时才留。
2. **注释画在卡片右边**，包围盒没给它留地方。
3. **描边一半在框外**：Backdrop 的包围盒恰好等于框本身，选中时 2px 描边居中画在路径上，向外溢出 1px（加抗锯齿一圈），这一圈永远擦不掉；未选中只有 1px 描边所以看不出来。
4. **拖动中每帧 `setSceneRect`**：改了滚动条范围、视图跟着漂一下，而只有 item 报了脏区，大片区域不重画；同时拉框的换算经过 item 局部坐标（item 摆在框中心，中心一直在动），每帧累加偏移，框越拉越长。

`boundingRect()` 是几何信息，只能在 `prepareGeometryChange()` 之后改变；而 lod 是 `paint()` 时才知道的。所以凡是随 lod 放大的绘制都必须夹一个上限，包围盒按上限留。

## 解决

- 随 lod 放大的东西夹下限：`FOCUS_LOD_FLOOR=0.09`，包围盒按 `focusFlagVisible()`（focus 或悬停）+ `focusTabMaxSize()` 留余量。
- 注释按最长那条字宽向右留（建 item 时量一次），竖排溢出也算进去。
- 把「框本身」和「包围盒」分开：`frameRect()` 给绘制、`shape()`、边缘命中、标题矩形用；`boundingRect()` 在它外面再扩 `BACKDROP_STROKE_MARGIN=3`。通用规则：**包围盒要包含画笔宽度的一半加抗锯齿**。
- 拖动中不改 `sceneRect`，松手提交时再更新（sceneRect 本来就有余量）。拉框换算用「scene 坐标 − 节点位置插口」，不经 item 局部坐标。
- 同时改尺寸和位置时，改之前记下旧的 scene 区域，改完 `scene.update(旧区域)`（`prepareGeometryChange()` 记的是当前包围盒，紧接着 `setPos()` 会用新包围盒去标旧位置）。
- 缓存了 `boundingRect` / `shape` 的 item，作废缓存的顺序是**先 `prepareGeometryChange()` 再清缓存**（Qt 要拿旧框把 item 从 BSP 索引里摘下来）。

## 验证方法

- 拖影只能在真屏幕上验：每一步比较「屏幕真实内容 `screen.grabWindow()`」和「强制 `repaint()` 之后」逐像素差异，修好后为 0。`widget.grab()` 每次都重新渲染一遍，抓不到残留。
- 用 xdotool 照用户手法真按住拖（如：点标题条选中 → 快速拉到视口边缘 → 缓慢缩短 14 步）。
- 测量本身会触发 repaint，所以脚本每步只看到一条残留（实测 59 个采样点 = 一条 1px 竖线），用户连续拖动不重绘才攒成一排；小数字也要当真。
- 拿整包副本只还原这一处改动当对照，确认新测试在旧代码上会挂。

## 相关

- 实体：[[Qt]] —— QGraphicsItem 的重绘机制
- 实体：[[gaffer_network_editor]] —— 遇到这些拖影的编辑器
- 问题：[[QPainterPath 重叠区域点不中]] —— 同样出在 `shape()` / 包围盒的写法上
- 综述：[[Qt 自绘界面常见坑]] —— 汇总
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 残迹要用 `screen.grabWindow` 与强制 repaint 逐像素对比验证
- 来源：[[来源 - Claude 全局记忆]]
