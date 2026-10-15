---
type: synthesis
aliases: [helper 球, 视口线框辅助]
tags: [gaffer, viewport, opengl]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 视口辅助物

[[lgtLib 共享节点库]] 里常用一个只在视口显示、不参与渲染的线框球 / 网格当「手柄」：艺术家在视口里拖它，节点回读它的位置和大小当参数。

## 做法

```text
Sphere / Grid
  → OpenGLAttributes(primitiveSolid=False, primitiveWireframe=True, visualiserScale=1000)
  → USDAttributes(purpose='proxy')
  → 挂进场景
```

- 用 `TransformQuery` 回读辅助物的 translate / scale 当参数，见 [[Gaffer 查询回写闭环]]。
- 渲染时去掉：
  - `NameSwitch(selector=${scene:renderer})`，只在 OpenGL 渲染器下走辅助物那一支；或
  - `StandardAttributes(visibility=False)`。
- 临时辅助物放进 `Set('__temp__')`，链路末尾用 `Prune` 统一删掉。
- 显示相机视锥：`OpenGLAttributes(visualiserFrustum='on')` + `SetFilter('__cameras')`。

## 例子

子帧位移修自穿插时，用辅助球框住穿插区域，球心和半径就是公式里的 `center` / `radius`，见 [[运动模糊异常的修复方法]]。

## 相关

- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 综述：[[Gaffer 查询回写闭环]] —— 回读辅助物参数
- 问题：[[运动模糊异常的修复方法]] —— 辅助球定义位移范围
- 来源：[[来源 - Claude 全局记忆]]
