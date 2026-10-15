---
type: problem
aliases: [GraphEditor 截图竞态, glReadPixels 行错位]
tags: [gaffer, screenshot, opengl, testing]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer screengrab 抓 GL 视图内容随机错乱

## 现象

用 [[Gaffer screengrab]] 抓 GraphEditor、Viewer 这类 GL 视图，场景内容完全一样，每次抓出来的图却不一样：有时完整，有时缺内容或是旧帧。改成自己读 GL 像素后，图像又出现整体斜切、行错位。

## 原因

- GL 内容画在 QOpenGLWidget（`_GLGraphicsView` 的 viewport）里，`screen.grabWindow( winId )` 和 GL 合成之间有竞态，抓到哪一帧是随机的。
- `ViewportGadget.render()` 只画进 FBO、不交换缓冲。
- 读像素时两处默认值会让数据静默损坏：`glReadPixels` 默认按 4 字节对齐每行（宽度乘 3 不是 4 的倍数时行尾错位）；`QImage` 的 4 参数构造按 4 字节对齐计算行跨度。

## 解决

在 commandFile 里离屏渲染、自己读像素：

```python
w, h = vp.getViewport()        # vp = ge.graphGadgetWidget().getViewportGadget()
ge.graphGadgetWidget()._makeCurrent()
vp.render()
GL.glPixelStorei( GL.GL_PACK_ALIGNMENT, 1 )     # 不设则行尾对齐错位
buf = GL.glReadPixels( 0, 0, w, h, GL.GL_RGB, GL.GL_UNSIGNED_BYTE )
img = QtGui.QImage( buf, w, h, w * 3, QtGui.QImage.Format_RGB888 )  # 必须 5 参数、显式 bytesPerLine
img.mirrored( False, True ).save( path )        # GL 行序自下而上
```

坐标换算：`gadgetToRasterSpace()` 给出的是 y 向下的 raster 坐标，GL 缓冲 y 向上，`gl_y = h - 1 - raster_y`。

纯 Qt（非 GL）控件用普通 grab 就稳定，不需要这套。

## 验证方法

同一场景连续抓多轮，逐像素比对结果一致；检查图像没有斜切（行错位时竖直的边会变斜）。

## 相关

- 实体：[[Gaffer screengrab]] —— 截图工具
- 概念：[[ViewportGadget]] —— `render()` 与坐标换算
- 问题：[[Gaffer 节点图截图节点太小看不清]] —— 同一类 GraphEditor 截图问题
- 综述：[[Gaffer 无头测试与截图验证方法]] —— GL 视图截图在整套方法中的做法
- 来源：[[来源 - Claude 全局记忆]]
