---
type: concept
aliases: [MDI, Multi Draw Indirect, glMultiDrawElementsIndirect, 合批, Draw Call Batching]
tags: [opengl, viewport, gaffer, performance]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Multi Draw Indirect 批量绘制

## 定义

OpenGL 4.3 的 `glMultiDrawElementsIndirect`：绘制命令（索引偏移、基顶点、实例号等）放在一个 buffer 里，一次调用提交很多条；着色器靠 `gl_DrawID` 或 `gl_BaseInstanceARB` 知道当前是哪一条，再去查这一条的矩阵、颜色等数据。用来把成千上万个小对象的 draw call 合成少数几次。前提是这些对象的几何放在同一块共享缓冲里。

## 在各软件里的对应

[[gaffer_indexed_mesh]] 在 Gaffer 视口里的做法（[[来源 - Claude 全局记忆]]）：

- **合批范围**：只合满足精简路径条件（solid、不透明、无拾取）的 `IndexedMeshPrimitive`，且三角形数 ≤ 4096（`GAFFER_INDEXED_MESH_BATCH_MAX_TRIANGLES`）；大网格和其余对象（灯光 / 相机可视化、原生占位框、非网格、拾取、选中高亮）立刻画，后者原样交 [[IECoreGL]]。
- **共享 arena（`Arena.h`）**：几何按布局分组放进大块缓冲；块大小从 128K 顶点开始翻倍，最大 2M；索引容量按已用比例分配；first-fit 空闲表；VAO 按 (GL 上下文, 块, 程序) 缓存；`ensureUploaded()` 一次送索引和全部属性。
- **队列（`Batch.h`）**：每个 GL 上下文一个 `BatchQueue`。加进 viewport 的 C++ Gadget `BatchFlushGadget` 在 Back 层开一帧，在 Main 层 SceneGadget 之后 flush；按 (块, 程序, 状态) 分组，每组一次 `glMultiDrawElementsIndirect`。
- **每条命令的数据**：实例矩阵、Cs、`vertex<name>Active`、块原点放在 UBO 里，派生顶点着色器把 `gl_ModelViewMatrix` / `gl_NormalMatrix` 换成按命令号查表。
- [[ViewportGadget]] 各层共用一个中间 FBO 且深度不清，所以延后绘制的对象仍能和先画的做深度测试；`renderToCurrentContext` 被 `glPushAttrib(GL_ALL_ATTRIB_BITS)` 包着，pop 之后灯光状态还在。

**实测要点**（长仙村场景，Gaffer 1.7.1.0）：

1. 每条命令的数据放 UBO。用 SSBO 时每个顶点真去读 12×16 B，GPU 那段 0.29 → 0.44 s。UBO 每段 340 条，用 `glBindBufferRange` 绑；段起点按 4 条对齐到 256 B，尾部补一整段空的。
2. 按 `gl_BaseInstanceARB` 从 UBO 查出来的矩阵，乘法没法像 `gl_ModelViewMatrix` 那样折成常量操作数，顶点着色器慢 30～40%，和 MDI 命令条数无关（框近时只有 5.6k 条也一样慢）。所以只合小网格，大网格单独画。
3. 批量用的派生程序按 (shader, 是否量化, 是否平直法线) 全局缓存。每个网格各跑一遍源码正则替换会让首帧多 5 s。
4. 延后画的对象深度比较用 `GL_LEQUAL`，组内按对象顺序倒排：占位框线贴在网格表面、共面网格「先画的赢」都和原生一致（判读方法见 [[视口像素对比的差异是 z-fighting 还是几何错误]]）。
5. arena 固定用 4M 顶点的块时，proxy 预留 1.34 GB 只用了 0.40 GB，所以改成翻倍增长。
6. 测试里数「画了几个对象」要把 `batchedDraws` 加上。

**结果**：proxy 全展开全景 0.265 → 0.147 s；render depth 11 全景 1.30 → 1.04 s；render depth 10 全景 GPU 已经到顶，帧时间持平。

## 注意事项

- arena 里的空块要主动回收，否则关场景后显存不降，见 [[切换场景后内存不释放]]。
- 量化网格的块原点同样走按命令查表，见 [[顶点属性量化]]。
- `BatchFlushGadget` 也负责相机分辨率门的剔除和 scissor 收尾，见 [[相机分辨率门外的物体仍在绘制]]。

## 相关

- 实体：[[gaffer_indexed_mesh]] —— 实现
- 实体：[[IECoreGL]] —— 合不了批的对象仍走原生
- 概念：[[ViewportGadget]] —— 分层绘制和中间 FBO 决定了 flush 的位置
- 概念：[[顶点属性量化]] —— 批量派生程序区分是否量化
- 问题：[[切换场景后内存不释放]] —— arena 空块回收
- 问题：[[相机分辨率门外的物体仍在绘制]] —— `BatchFlushGadget` 同时管门剔除
- 问题：[[视口像素对比的差异是 z-fighting 还是几何错误]] —— 延后绘制改变共面面的赢家
- 综述：[[Gaffer 视口每帧开销分析]] —— 合批在帧时间里的效果
- 来源：[[来源 - Claude 全局记忆]]
