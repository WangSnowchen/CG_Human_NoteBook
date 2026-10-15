---
type: entity
aliases: []
tags: [gaffer, arnold, motion-blur, team-library]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# VelocityMotionBlur

[[ofNode]] 里按几何的 `velocity` 属性生成[[运动模糊]]的节点。缓存没有逐帧变形、只带速度时用它出模糊，镜头修复里常放在「借速度」链条的末尾。

## 用法 / 关键参数

| 参数 | 说明 |
|---|---|
| `motionUnit` | 预设 Per Frame / Per Second，对应 velocity 的单位 |
| `velocityScale` | 手调的模糊长度系数，修复配方里用过 0.13 |

## 常见问题

- [[运动模糊异常的修复方法]]

## 相关

- 实体：[[ofNode]] —— 所属模块
- 实体：[[Arnold]] —— 渲染运动模糊的渲染器
- 概念：[[运动模糊]] —— 本节点产生的效果
- 问题：[[运动模糊异常的修复方法]] —— 借速度修复链条的最后一步
- 来源：[[来源 - Claude 全局记忆]]
