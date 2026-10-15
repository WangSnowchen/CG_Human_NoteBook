---
type: synthesis
aliases: [Query Expression Transform]
tags: [gaffer, scene-query, expression]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 查询回写闭环

[[lgtLib 共享节点库]] 里大量配方用「查询节点读数值 → Expression 做数学 → 回写到 Transform / 参数」让物体、灯光、相机自动贴到目标位置。

## 链路

```text
BoundQuery.center / BoundQuery.min.y / TransformQuery.translate / OptionQuery
  → Expression（数学计算）
  → Transform / CameraTweaks / StandardOptions 等的参数
```

- `TransformQuery(invert=True)` 直接输出逆变换，省掉表达式里求逆。
- `OptionQuery` 读 `render:camera` 等渲染选项，常用来拿当前渲染相机。

## 例子

| 用途 | 做法 |
|---|---|
| 灯贴包围盒中心（BBXtoLight） | `BoundQuery.center → Transform.translate` |
| 物体踩到地面 | `targetOffset.y = -bound.min.y` |
| 自动构图 | 两个 translate 的差值回写 Transform |
| 衰减可视化 | 由查询结果反推衰减范围再回写 |
| 测距 | [[MeasureDistance]]：两个 BoundQuery 的中心算距离 |
| 自动 crop 窗口 | BoundQuery(NDC) 投影出范围写 `renderCropWindow`，见 [[Overscan]] |
| 子帧位移参数 | TransformQuery 读辅助球、OptionQuery 读相机，见 [[运动模糊异常的修复方法]] |
| 灯约束（ConstraintToLight） | `ParentConstraint(targetMode=3)` |

## 注意事项

查询节点的输入如果又依赖同一个 Expression 的输出，会形成依赖环，进程直接崩溃。写和读分到两个 Expression 里，见 [[MeasureDistance 表达式循环依赖导致崩溃]]。

## 相关

- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 实体：[[MeasureDistance]] —— 闭环的典型例子
- 问题：[[MeasureDistance 表达式循环依赖导致崩溃]] —— 闭环里的依赖环
- 问题：[[运动模糊异常的修复方法]] —— 查询结果驱动 OSL 参数
- 概念：[[Overscan]] —— 自动 crop 窗口
- 综述：[[Gaffer 逐位置动态查询]] —— 逐位置查询的链路
- 综述：[[Gaffer 视口辅助物]] —— 回读辅助物的位置和大小当参数
- 综述：[[Gaffer 渲染设置模板]] —— 灯贴包围盒、灯约束等灯型配方
- 来源：[[来源 - Claude 全局记忆]]
