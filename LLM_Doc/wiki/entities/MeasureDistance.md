---
type: entity
aliases: [Measure Distance, 两点测距节点]
tags: [gaffer, osl, custom-node]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: ["[[如何在Gaffer中测量距离]]"]
status: active
created: 2026-10-15
updated: 2026-10-15
---

# MeasureDistance

自制的 Gaffer 测距 Box 节点，量两点之间的距离。现收在 [[gaffer_custom_node]] 里：

```text
Music/third_party/gaffer_my_extensions/gaffer_custom_node/0.1.0/python/GafferNoise/boxes/MeasureDistance.grf
```

Tab 菜单路径 `/Noise/Scene/Measure Distance`（searchText=`MeasureDistance`），由 `GafferNoiseUI/MeasureDistanceUI.py` 登记。节点自包含，只用 OSL 和 Expression，不依赖团队节点。

## 要点

- **两种测量类型**：Model to Model（两个模型上各取一点）、Camera to Model（相机到模型上一点）。
- **取点链**：

  ```text
  PathFilter → MeshToPoints(adjustBounds=True) → OSLCode(shading:index → deletePoints)
    → OSLShader(OutInt) → OSLObject(primitiveVariables = legacyClosure + Cs)
    → DeletePoints(adjustBounds=True) → BoundQuery(space=World).center
  ```

  - `adjustBounds` 必须开：关着时 BoundQuery 拿到的是缓存的整个物体的包围盒。
  - OSLObject 的两个 primitiveVariables（`legacyClosure` 和 `Cs`）缺一个，结果就静默全是 0。
- **两个 Expression 分工**：`exprPaths` 只写两个 PathFilter 的路径，`expr` 只读 BoundQuery 的结果写 `distance`。写进一个 Expression 会形成依赖环，见 [[MeasureDistance 表达式循环依赖导致崩溃]]。
- **画测量线**：表达式可以直接输出 ObjectPlug（`CurvesPrimitive` / `PointsPrimitive`），再经 ObjectToScene 变成场景里的一个位置。表达式里引用写成 `parent["measureData"]["lineObject"]`。
- **存盘要带 Dynamic 标志**，否则 `.grf` 回读报 `X is not a child of Y`：
  1. Box 上自定义的输出插口 `flags=Dynamic`；
  2. 辅助 Node 上的 ObjectPlug / StringVectorDataPlug 输出插口同样加 Dynamic；
  3. CompoundDataPlug 里的 NameValuePlug 写成 `NameValuePlug( key, value, "name", Gaffer.Plug.Flags.Default | Gaffer.Plug.Flags.Dynamic )`。

## 常见问题

- [[MeasureDistance 表达式循环依赖导致崩溃]]
- [[Gaffer .grf 回读报 is not a child]]

## 相关

- 实体：[[gaffer_custom_node]] —— 节点现在所在的包
- 实体：[[OSL]] —— 取点链用 OSLCode / OSLObject 筛点
- 问题：[[MeasureDistance 表达式循环依赖导致崩溃]] —— 表达式拆分的原因
- 问题：[[Gaffer .grf 回读报 is not a child]] —— 存盘缺 Dynamic 标志
- 综述：[[Gaffer OSL 几何编辑套路]] —— 取点链用的同一套 OSL 删点写法
- 综述：[[Gaffer 查询回写闭环]] —— BoundQuery 结果进表达式计算
- 综述：[[Gaffer 程序化几何]] —— 用表达式输出测量线几何
- 来源：[[来源 - Claude 全局记忆]]
