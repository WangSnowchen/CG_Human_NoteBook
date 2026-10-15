---
type: problem
aliases: [色轮取色偏 90 度, QConicalGradient hue]
tags: [qt, color, gafferui]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# QConicalGradient 色轮取色角度错位

## 现象

用 `QConicalGradient` 画的色相环，点在红色区域取到的却是别的色相，偏差约 90°；指示器画的位置和点击位置也对不上（[[来源 - Claude 全局记忆]]）。

## 原因

`QConicalGradient( center, 0 )` 渲染出来的色相和屏幕角度的关系是 **`hue = (360 − θ) % 360`**（θ 为屏幕角，0 在右侧，顺时针增大，屏幕 y 向下）。交互取色公式如果按数学惯例直接用 `atan2` 的角度当色相，方向和起点都会和渲染不一致。

## 解决

取色、画指示器都用同一个映射：

```python
import math
theta = math.degrees( math.atan2( dy, dx ) )   # dy 用屏幕坐标（向下为正）
hue = ( 360 - theta ) % 360
```

原则：**渐变的渲染方向必须和交互取色公式严格一致**，两边从同一个函数算。

## 验证方法

在色轮上点正右、正上、正左、正下四个点，打印色相，和画面上看到的颜色比对；再把指示器画到取色结果对应的位置，确认和点击位置重合。

## 相关

- 实体：[[ueColorChooser]] —— 使用色轮的拾色器
- 实体：[[Qt]] —— `QConicalGradient` 所属框架
- 综述：[[Qt 自绘界面常见坑]] —— Qt 自绘类问题汇总
- 来源：[[来源 - Claude 全局记忆]]
