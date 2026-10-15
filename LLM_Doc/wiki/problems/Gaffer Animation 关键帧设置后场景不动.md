---
type: problem
aliases: [Animation key 时间单位, 关键帧单位是秒]
tags: [gaffer, animation, python]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Animation 关键帧设置后场景不动

## 现象

用 Python 给插口打关键帧：`Animation.Key( 帧号, 值 )` 加到曲线上。`isAnimated()` 是 True，`curve.evaluate()` 看着也对，但播放时场景完全不动，`plug.getValue()` 一直返回第一个关键帧的值。

## 原因

Animation 曲线的时间单位是**秒**。`Animation` 节点计算时用的是 `context->getTime()`（= frame / fps，源码 `src/Gaffer/Animation.cpp` 里两处 `parent->evaluate( context->getTime() )`）。把帧号当时间传给 `Key`，关键帧落在几十、上百秒处，实际帧对应的时间都在第一个关键帧之前的外推区间，取到的始终是首帧值。

## 解决

所有帧和时间之间的换算都显式做：

```python
fps = script["framesPerSecond"].getValue()
curve = Gaffer.Animation.acquire( plug )
curve.addKey( Gaffer.Animation.Key( frame / fps, value ) )   # time = frame / fps
# 读回关键帧时：frame = key.getTime() * fps
```

设关键帧、读曲线、删关键帧、`curve.evaluate()`、`curve.getKey()` 都走这个换算；返回给外部的 `frame` 字段也要换算回帧。1.7 源码 `GafferTest/AnimationTest.py` 全程用秒（`c.setTime( i / 9.0 )`），可以对照。

## 验证方法

打两个关键帧后，在 Context 里设到中间帧读 `plug.getValue()`，得到插值结果；读场景 transform 也随帧变化。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[gaffer_mcp]] —— 动画类工具按秒换算
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 两个版本都是秒，同节列出相关 API 差异
- 来源：[[来源 - Claude 全局记忆]]
