---
type: problem
aliases: [GraphEditor frame 缩放上限]
tags: [gaffer, screenshot, grapheditor, docs]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 节点图截图节点太小看不清

## 现象

用 [[Gaffer screengrab]] 抓 GraphEditor，只有两三个节点时调用 `graphEditor.frame()`，节点只占画面 2%-5%，名字看不清。另一种情况是截图几乎全空（PNG 只有约 2KB），或节点还没画出来。

## 原因

- `GraphEditor.__frame` 里 `adjustedPixelsPerUnit = min( pixelsPerUnit, 10 )`，frame 的缩放有上限 10。
- `script.addChild()` 之后节点的自动布局在空闲时才完成，立刻读节点位置拿到的是默认值，frame 到空白处。
- frame 之后节点重绘较慢（两个同名 Plane 节点时必现），screengrab 关得快会抓到空白。
- screengrab 自己最后还会调一次默认的 frame，把手动取景覆盖掉。

## 解决

不调 `frame()`，自己算节点组的包围盒，直接让 ViewportGadget 取景：

1. 先 `GafferUI.EventLoop.waitForIdle()`，等自动布局完成。
2. 逐节点取 `graphGadget.getNodePosition( node )`（节点中心，V2f）+ `nodeGadget.bound()`（以中心对称的局部包围盒），合成整组 bbox。
3. bbox 只往外加边距（扩 5 合适，10 太大），不要缩小（会裁掉节点）。
4. `graphEditor.frame = lambda *args, **kw : None`，防止 screengrab 的默认 frame 覆盖。
5. `graphEditor.graphGadgetWidget().getViewportGadget().frame( bbox )`。
6. 循环 2-3 秒 `QtWidgets.QApplication.processEvents()` + `waitForIdle( 1 )` 强制重绘。
7. `application.setGrabWidget( graphEditor )`。

内容要稳定的截图再配合 [[Gaffer screengrab 抓 GL 视图内容随机错乱]] 里的离屏读像素。

## 验证方法

截图文件大小明显大于空白图（约 2KB）；节点名字在图上可读；同一脚本多跑几次结果一致。

## 相关

- 实体：[[Gaffer screengrab]] —— 截图工具
- 实体：[[Gaffer GraphEditor]] —— `frame()` 缩放上限所在的编辑器
- 实体：[[gaffer_zh_docs]] —— 节点文档三视图截图用这套方法
- 概念：[[ViewportGadget]] —— 直接用它的 `frame( bbox )` 取景
- 问题：[[Gaffer screengrab 抓 GL 视图内容随机错乱]] —— 同类 GL 截图问题
- 综述：[[NodeReference 节点案例制作流程]] —— 案例截图步骤引用此方法
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 截图方法汇总
- 来源：[[来源 - Claude 全局记忆]]
