---
type: synthesis
aliases: [帧区间开关, TimeWarp 冻结]
tags: [gaffer, expression, time]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 按帧门控

镜头修复经常只在某几帧生效，[[lgtLib 共享节点库]] 里有三类按时间控制的写法。

## 帧区间开关

OSL Expression 判断当前帧是否在区间内，结果接 `Switch.index`：

```c
float frame_in = __in.p0 - 0.5; frame_out = __in.p1 + 0.5; __out.p0 = context("frame") > frame_in && context("frame") < frame_out;
```

`__in.p0` / `__in.p1` 是区间起止帧（如节点上的 `frameRange`），`frame_out` 也要按 float 声明。

区间两端各放宽 0.5 帧，把[[运动模糊]]的子帧采样也包进来；不放宽的话区间边上那一帧的模糊采样会落到区间外，修复只生效一半。

## 指定帧列表

Python Expression，命中列表里的某一帧就输出它的序号（从 1 开始），否则 0，接 `Switch.index`：

```python
next((i+1 for i,f in enumerate(frames) if f-0.5 < frame < f+0.5), 0)
```

## TimeWarp 冻结

- 固定到整数帧：`TimeWarp(speed=0, offset=round(context("frame")))`，子帧采样都取整数帧的结果。
- 固定到某一帧：`TimeWarp(speed=0, offset=1001)`，用来从好的那帧借数据。
- 前后帧采样（洋葱皮）：`offset=±N`。

## 相关

- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 实体：[[OSL]] —— 帧区间表达式用 OSL 写
- 概念：[[运动模糊]] —— ±0.5 窗口的原因
- 问题：[[运动模糊异常的修复方法]] —— 按帧段应用修复、冻结姿势
- 问题：[[镜头 UV 错误的修复方法]] —— 从固定帧采样 UV
- 来源：[[来源 - Claude 全局记忆]]
