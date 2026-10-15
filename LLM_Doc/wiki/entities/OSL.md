---
type: entity
aliases: [Open Shading Language, GafferOSL]
tags: [osl, gaffer, shading]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# OSL

Open Shading Language，着色语言。Gaffer 的 GafferOSL 模块用它写着色器，也用它逐点、逐面地处理几何。[[lgtLib 共享节点库]] 里 `OSLCode`（33 次）和 `OSLObject`（32 次）是用量最高的节点。

## 要点

- **GafferOSL 三个常用节点**：
  - `OSLCode`：直接写一段 OSL 代码，插口就是代码的输入输出（如输出 `IntPlug result`）。
  - `OSLShader`：加载 OSL 着色器，ObjectProcessing 类的 `InPoint` / `InUV` / `OutInt` 等是几何处理的入出口。
  - `OSLObject`：对几何每个元素执行 OSL，把结果写进 primitiveVariable（`primitiveVariables` 里加 NameValuePlug）。
- **常用内置调用**：
  - 世界空间位置 `transform("world", point(P))`，回到物体空间 `transform("world", "object", point(outP))`。
  - 元素索引 `getattribute("shading:index", index)`。
  - 稳定随机 `hashnoise(index)`。
  - 读上下文 `context("frame")`。
- **Expression 节点的 OSL 语言**：用 `__in.p0` / `__out.p0` 这类名字读写插口，可读 `context("frame")`，见 [[Gaffer 按帧门控]]。
- 几何编辑的完整写法见 [[Gaffer OSL 几何编辑套路]]。

## 相关

- 实体：[[Gaffer]] —— GafferOSL 所属软件
- 实体：[[lgtLib 共享节点库]] —— OSL 节点是库中用量最高的节点
- 实体：[[MeasureDistance]] —— 用 OSL 筛出测量点
- 实体：[[codeCompleter]] —— Expression 与 OSLCode 里的 OSL 代码补全
- 实体：[[gaffer_zh_docs]] —— OSL 节点列为跨模块高价值文档
- 综述：[[Gaffer OSL 几何编辑套路]] —— 删点、删面、移动点的写法
- 综述：[[Gaffer 按帧门控]] —— Expression 用 OSL 判断帧区间
- 问题：[[运动模糊异常的修复方法]] —— 子帧位移公式是 OSL
- 问题：[[镜头 UV 错误的修复方法]] —— 用 OSL 镜像、平移 UV
- 来源：[[来源 - Claude 全局记忆]]
