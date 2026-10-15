---
type: synthesis
aliases: [Gaffer viewport frame cost, 视口帧率优化]
tags: [gaffer, viewport, opengl, performance, profiling]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 视口每帧开销分析

场景对象到几万个以上时，Gaffer 视口一帧的时间主要花在逐对象的 GL 调用上。下面是 [[gaffer_indexed_mesh]] 在内存问题（[[Gaffer 视口展开大场景内存暴涨]]）解决之后做的帧时间拆分和优化（[[来源 - Claude 全局记忆]]）。

## 怎么量

- 基准脚本 `proces_scode/run_frame_bench.sh`，`DEPTHS` 用逗号分隔多个展开深度。包 README 里的口径：submit = `vp.render()` 返回的时间，total = `glFinish` 之后的时间，视口 1246×416。
- 拆层：探针 `GAFFER_INDEXED_MESH_PROBE_SKIP=render` 或 `draw` 跳过某一层，看剩下多少。
- 采样：本机没有 perf / valgrind，ptrace 被禁，用 LD_PRELOAD 注入的采样器 `proces_scode/sampler/`；ITIMER_PROF 实际 4 ms 采一次。
- 条件：长仙村 env set，Gaffer 1.7.1.0（包 README 记的显卡是 RTX 3060 12 GB）。同一天两轮的提交时间能差 15%，只信同一轮内的 A/B；GPU 同时被别的任务占用时计时不可信。

## 开销在哪

- Gaffer 自己两趟 `OpenGLObject::render`：每个场景位置 0.2～0.6 µs，这是地板，扩展层面动不了。
- 大头是 [[IECoreGL]] 的 `Primitive::render`（每个对象一次 `glPushAttrib`、两套 Setup、六次 `State::get`），以及没展开位置的包围盒（`Group` + `CurvesPrimitive`）。
- render depth 9～10 全景时 GPU 先到顶，CPU 端再省也看不出帧时间变化。
- storm 布局的几何着色器让每帧慢一倍以上（见 [[索引式网格上传]]），所以只用在少数网格上。

## 做了什么

1. **视锥剔除**：覆写 `render()`，对象级 + 块级剔除，见 [[视锥剔除]]。
2. **精简绘制路径**：solid、不透明、无拾取时只绑自己的 Setup，显式 `glDepthMask(GL_TRUE)`，VAO 按 (GL 上下文, 程序) 缓存。`shaderSetup()` 的缓存键必须带上状态那份 Setup，只按 shader 记时共享对象会串参数。
3. **占位框替换**：用 `ObjectVisualiser::registerVisualiser( Placeholder )` 把没展开位置的占位框换成只画盒子的 Renderable。盒子顶点用显式坐标；用矩阵栈缩放单位立方体会差半像素，拾取跟着偏。
4. **拖动降级**：包装 `GafferUI.View.create`，连 viewport 的 `cameraChangedSignal`，相机一动就 `setInteractive(True)`；150 ms 的 QTimer 等相机停下后关掉，再用 `renderRequestSignal` 补画一帧完整的。拖动中跳过投影小于 2 像素的对象，拾取不走这条。
5. **小网格合批**：见 [[Multi Draw Indirect 批量绘制]]。

## 结果

第一轮（视锥剔除 + 精简路径 + 占位框替换 + 拖动降级）：

| 场景 | 之前 | 之后 | 拖动中 |
|---|---|---|---|
| render depth 11 全景 | 1.34 s | 1.04 s | 0.21 s |
| proxy 全展开 | 0.31 s | 0.23 s | 0.035 s |
| 框到单个资产（框近） | — | 快 3～5 倍 | — |

第二轮（在第一轮基础上加合批，同一天连跑对比「不合批 / 合批」）：

| 场景 | 不合批 | 合批 |
|---|---|---|
| proxy 全展开全景 | 0.265 s | 0.147 s |
| render depth 11 全景 | 1.30 s | 1.04 s |
| render depth 10 全景 | GPU 到顶 | 持平 |

两轮的基准各在不同时间测得，表内只比同一轮的前后。

## 相关

- 实体：[[gaffer_indexed_mesh]] —— 优化的实现
- 实体：[[IECoreGL]] —— `Primitive::render` 的逐对象开销
- 概念：[[视锥剔除]] —— 第一项优化
- 概念：[[Multi Draw Indirect 批量绘制]] —— 第二轮优化
- 概念：[[索引式网格上传]] —— storm 布局的几何着色器开销
- 问题：[[Gaffer 视口展开大场景内存暴涨]] —— 帧时间优化之前先解决的内存问题
- 来源：[[来源 - Claude 全局记忆]]
