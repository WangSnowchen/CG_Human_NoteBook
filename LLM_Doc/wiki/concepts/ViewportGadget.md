---
type: concept
aliases: [GafferUI.ViewportGadget, 视口 gadget]
tags: [gaffer, gafferui, opengl]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# ViewportGadget

## 定义

[[Gaffer]] 的 GL 场景图里，`Gadget` 相当于 Qt 的 `QGraphicsItem`。`ViewportGadget` 是一棵 gadget 树的根，同时充当相机：它记着视口像素尺寸、当前看的是哪块区域，并提供像素坐标和图坐标之间的换算。装它的真 QWidget 是 `GadgetWidget`，OpenGL 在那一层（[[来源 - Claude 全局记忆]]）。

原生 GraphEditor 的结构（`GraphEditor.py:107-116`）：`ViewportGadget()` + `setMaxPlanarZoom( 25 )` + `GadgetWidget` + `setPrimaryChild( GraphGadget )`。`graphGadgetWidget()` 返回的是 GadgetWidget，`.getViewportGadget()` 才是相机。

## 在各软件里的对应

- GraphEditor：`graphEditor.graphGadgetWidget().getViewportGadget()`，主子节点是 `GraphGadget`（节点图内容）。
- Viewer：视口同样是 ViewportGadget，工具条是挂在 GadgetWidget 上的 overlay，见 [[Gaffer Overlay]]。

## 性质（1.6.5.1 实测，1.7.1.0 复核不变）

1. 默认是 2D 相机（`getPlanarMovement() == True`），默认视口尺寸 `V2i( 640, 480 )`，不调 `setViewport` 就按这个尺寸换算。
2. `frame( box )` 把整个框装进视口，宽高比不同时向长边扩展（1:1 的框放进 2:1 的视口，可见范围 x∈[-20,20]、y∈[-10,10]）。
3. 改视口尺寸不会自动重新取景：`setViewport` 只改画布，每单位像素数不变（800x400 改成 400x200，可见范围减半）。缩放、平移、改窗口大小后都要重新 `setViewport` + `frame`。
4. y 轴方向相反：raster 坐标 y 向下（左上原点），gadget 坐标 y 向上。`rasterToGadgetSpace()` 返回 `LineSegment3f`，取 `.p0`。
5. 不需要窗口和 GL 就能单独创建（`ViewportGadget( graphGadget )` + `setViewport` + `frame`），只当坐标换算工具用。
6. 一个 gadget 只有一个父：把已经挂在别处的 gadget 设成第二个 ViewportGadget 的子节点会把它抢走，原来那个的 `getPrimaryChild()` 变成 None。
7. `rasterToGadgetSpace( gadget=X )` 对不在树里的 X 也给出同样答案（顶层变换是单位矩阵）。
8. `maxPlanarZoom` 默认 25 像素每单位；`GraphEditor.frame()` 内部把缩放限制在 10 以内。

## 注意事项

- `ViewportGadget.render()` 只画进 FBO、不交换缓冲，离屏截图靠它 + `glReadPixels`，见 [[Gaffer screengrab 抓 GL 视图内容随机错乱]]。
- `gadgetToRasterSpace()` 返回 y 向下的 raster 坐标，`glReadPixels` 是 y 向上的 GL 缓冲，换算 `gl_y = h - 1 - raster_y`；`gadgetToRasterSpace` 的结果可以直接用来构造合成鼠标事件的 `LineSegment3f`，不用换算。
- `ImageGadget` 把图像居中放在 gadget 原点，bound 是 `(-w/2,-h/2)..(w/2,h/2)`，文件左上角 (0,0) 映射到局部 `(-w/2, +h/2)`。想让图像在原点居中只需均匀缩放 `M44f().scale( s, s, 1 )`，再平移 `(-w/2,-h/2)` 会错位。
- 视口未显示过时，按 raster 反算位置会得到 `nan`；需要「只算不画」时自己建一个 ViewportGadget，每次用之前同步 `setViewport` + `frame`。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer screengrab]] —— 离屏抓 GL 视图要用它渲染
- 实体：[[Gaffer GraphEditor]] —— 原生节点图的相机
- 实体：[[gaffer_network_editor]] —— 用独立 ViewportGadget 替代隐藏的原生 GraphEditor 做坐标换算
- 概念：[[Gaffer Overlay]] —— overlay 挂在装 ViewportGadget 的 GadgetWidget 上
- 概念：[[Multi Draw Indirect 批量绘制]] —— 分层绘制与中间 FBO 决定批量 flush 的位置
- 问题：[[相机分辨率门外的物体仍在绘制]] —— 分层绘制决定 scissor 只能在 Main 层开
- 问题：[[Gaffer screengrab 抓 GL 视图内容随机错乱]] —— 用 `render()` 离屏渲染再读像素
- 问题：[[Gaffer 节点图截图节点太小看不清]] —— 绕过 GraphEditor 直接 `frame( bbox )`
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 默认值在两个版本间不变
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 不建窗口时用独立 ViewportGadget 同步取景
- 来源：[[来源 - Claude 全局记忆]]
