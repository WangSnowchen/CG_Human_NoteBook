---
type: synthesis
aliases: [Expression 生成几何, ObjectToScene]
tags: [gaffer, expression, geometry]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 程序化几何

不写 C++ 节点，用 Python Expression 直接造网格或曲线。[[lgtLib 共享节点库]] 里的圆柱、圆环、测量线都是这么做的。

## 链路

```text
Expression（输出接到 ObjectPlug，值是 IECoreScene.MeshPrimitive / CurvesPrimitive）
  → ObjectToScene
  → ContextVariables（给表达式提供参数）
```

- 表达式里用 `context.get("param")` 读参数。
- 承接表达式输出的 ObjectPlug 要带 Dynamic 标志，存盘才能回读（[[MeasureDistance]] 的测量线就是这样）。

## 网格

- 环形网格首尾相接（封口）：

  ```python
  ii = i+1 if i<numDivisions-1 else 0
  ```

- Torus 双重循环的四边形顶点索引：`i*j, i*jj, ii*jj, ii*j`。
- 坑：Cylinder / Torus 用 `numDivisions-1` 当角度分母时，第一个和最后一个顶点重合。角度分母用 `numDivisions`，再用上面的封口写法连回第 0 个顶点。

## 曲线

```python
CurvesPrimitive([n], catmullRom(), False, P)
```

完整写法：`IECoreScene.CurvesPrimitive( IECore.IntVectorData( [ n ] ), IECore.CubicBasisf.catmullRom(), False, P )`，`n` 是这条曲线的顶点数。

- `width` 用 Constant 插值的 PrimitiveVariable。

## 运动路径

- `MotionPath` + `Animation`（CurvePlug）。
- 烘焙清理：`DeletePrimitiveVariables('P', invertNames=True)` 删掉 P 以外的属性，再 `FreezeTransform`。

## 相关

- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 实体：[[MeasureDistance]] —— 用表达式输出测量线
- 来源：[[来源 - Claude 全局记忆]]
