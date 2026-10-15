---
type: problem
aliases: [setAnimated only animates first component]
tags: [nuke, python, animation]
applies_to: ["Nuke 16.1v2"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Nuke setAnimated 只给第一个分量打关键帧

## 现象

给 `Blur.size` 这类多分量 knob 打关键帧，结果只有 x 分量动画了，y 保持静态。

## 原因

`knob.setAnimated()` 不带参数时只处理第 0 个分量。想用 `knob.animations()` 数分量也不行：打关键帧之前它返回空列表（[[来源 - Claude 全局记忆]]）。

## 解决

分量个数问 `arraySize()`，逐个分量处理：

```python
knob = node["size"]
for i in range(knob.arraySize()):
    knob.setAnimated(i)
    knob.setValueAt(value[i], frame, i)
```

## 验证方法

打完后 `len(knob.animations())` 应等于 `knob.arraySize()`；换几帧读 `knob.valueAt(frame, i)`，每个分量都随帧变化。

## 相关

- 实体：[[Nuke]] —— API 行为
- 实体：[[nuke_mcp]] —— 打关键帧工具按分量处理
- 来源：[[来源 - Claude 全局记忆]]
