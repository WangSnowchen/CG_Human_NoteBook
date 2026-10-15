---
type: problem
aliases: [Gaffer 单位缩放 clippingPlanes]
tags: [gaffer, camera, shot-fix, standin]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# standin 全局缩放后相机裁剪失效

## 现象

镜头里 standin / 缓存的单位不一致（厘米和米），用 Transform 对整个场景缩放 0.01 之后，渲染里大片物体被相机的近 / 远裁剪面切掉，或该裁掉的没裁掉。

## 原因

`Transform` 缩放的是场景几何（包括相机的变换），相机自身的 `clippingPlanes` 参数是绝对距离，不会跟着缩放。场景整体缩小 100 倍后，原来的裁剪距离相对场景放大了 100 倍。

## 解决

全局缩放时同步改相机裁剪面：

```text
Transform(space = parent, scale = 0.01, filter = '*')
CameraTweaks: clippingPlanes 乘 0.01
```

同一类「镜头整理」里常配合使用的写法：

- **约束到目标位置**：`ParentConstraint(target=/chars, ignoreMissingTarget=True)`。
- **一个值驱动多个变换**：同一个 translate 插口 `setInput` 进多个 Transform，各用不同 `space`。
- **可见性跟随**：`SubTree → Group → CopyAttributes('scene:visible')`，让可见性跟随源头，不写死。
- **裁掉临时 / 坏资产**：`Prune` + 路径通配。

## 验证方法

缩放前后各渲一帧对比，远景和近景物体都在；在 Viewer 里透过渲染相机看，裁剪范围和缩放前一致。

## 相关

- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 综述：[[资产与特效 Resolver 模板]] —— standin 在资产读入里的处理
- 来源：[[来源 - Claude 全局记忆]]
