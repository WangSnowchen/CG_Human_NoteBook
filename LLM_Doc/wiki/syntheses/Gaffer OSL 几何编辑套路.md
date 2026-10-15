---
type: synthesis
aliases: [OSLObject 删点删面]
tags: [gaffer, osl, geometry]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer OSL 几何编辑套路

[[lgtLib 共享节点库]] 里编辑几何的通用链路：`OSLCode` 算出每个元素的布尔值或向量 → `OSLObject` 写进 primitiveVariable → 下游 `DeletePoints` / `DeleteFaces` 按它删除，或由 OSLObject 直接改写 P。语言细节见 [[OSL]]。

## 删点 / 删面

1. `OSLCode` 输出 `IntPlug result`，判断点是否在球形范围内：

   ```c
   result = length(center - position) < abs(radius);
   ```

   `position` 用世界空间位置 `transform("world", point(P))`。
2. `OSLObject.primitiveVariables` 加一个变量：

   ```python
   NameValuePlug("deletePoints", IntPlug, True, "primitiveVariable", Dynamic)
   ```

   这是简写，完整写法是 `Gaffer.NameValuePlug( "deletePoints", Gaffer.IntPlug(), True, "primitiveVariable", Gaffer.Plug.Flags.Default | Gaffer.Plug.Flags.Dynamic )`。

3. 中间用 `CopyPrimitiveVariables` 把结果拷回原几何。
4. `DeletePoints( invert 按需, ignoreMissingVariable=True, adjustBounds=False )`。

一个 OSLObject 的 primitiveVariable 的 **name** 可以接给下游 `DeleteFaces.faces`（删除用的属性名），**value** 接删除布尔值。

## 按索引选元素

- OSL 里取元素索引：`getattribute("shading:index", i)`。
- 面编号串支持区间写法，如 `1,3,5-8`。
- 随机删面（按百分比）：

  ```c
  getattribute("shading:index", index);
  Delete = hashnoise(index) * 100 < Percent;
  ```

## 移动点

- 沿法线位移：先用 `MeshNormals` 算出 N，再写回 P（interpretation 设 `GeometricData.Interpretation.Point`）：

  ```c
  outP = P + N * strength;
  ```

- 整体平移（offset 来自 `CoordinateSystem` 的 translate）：

  ```c
  outP = P + offset;
  ```

- 子帧位移修自穿插的公式见 [[运动模糊异常的修复方法]]。

## 注意事项

- `OutInt` / `InUV` / `InPoint` 是 ObjectProcessing 类着色器的入口 / 出口。
- 删除节点的 `adjustBounds` 默认会重算包围盒。下游需要保留原包围盒时设 False；下游要用包围盒取删剩下的点时必须设 True（[[MeasureDistance]] 就是后者）。

## 相关

- 实体：[[OSL]] —— 着色语言本身
- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 实体：[[MeasureDistance]] —— 用同一套删点链路取测量点
- 问题：[[运动模糊异常的修复方法]] —— 子帧位移也是 OSLObject 改 P
- 来源：[[来源 - Claude 全局记忆]]
