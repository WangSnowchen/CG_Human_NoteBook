---
type: problem
aliases: [Gaffer viewport memory blowup, 视口展开 render 内存爆, CachedConverter 去重失效]
tags: [gaffer, viewport, opengl, memory, performance]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 视口展开大场景内存暴涨

## 现象

Gaffer 视口把大场景展开到很深（render purpose、`SceneView` 的 `minimumExpansionDepth` 设大）时，进程内存和显存涨到几十上百 GB。长仙村 render 全展开（`minimumExpansionDepth = 999`）原生到 113 GB 被系统杀掉（[[来源 - Claude 全局记忆]]）。

## 原因

转换器这一层有三处：

1. [[IECoreGL]] 的 `ToGLMeshConverter` 把所有 primvar 提升成 FaceVarying 并无索引绘制，视口网格约为源数据的 3 倍（见 [[索引式网格上传]]）。
2. `IECoreGL::Primitive` 基类把顶点数据拷一份长期留在 CPU，上传 GPU 后也不释放。
3. Gaffer 的 `CachedConverter` 只在 500 MB 的 LRU 内去重。它按源网格大小记账，同一个网格的两个实例之间只要隔着转了别的网格，缓存项就被挤掉，每个实例各占一份转换结果。全展开时上百 GB 主要来自这一条。

转换器之外还有三块，不在这一层：

- Gaffer 计算缓存（`Gaffer.ValuePlug.cacheMemoryUsage()`）：Gaffer 1.7.1.0 日常启动下上限是 48 GB，由本地扩展 `local:defaultvalues` 设置（见 [[ofGafferExt]]）；团队 `gaffer_pd` 里那份 8 GB 的设置 1.7 启动器不带。
- 驱动在主存里给静态缓冲留的显存镜像。
- 每个场景位置在 `RenderController` / `OpenGLObject` 里的对象。

## 解决

用 [[gaffer_indexed_mesh]] 替换网格转换器：

- 索引式上传 + 打包（N 10:10:10、uv 半精度、16 位索引），见 [[索引式网格上传]]、[[顶点属性量化]]。
- 自己持有 GL buffer，上传后立刻释放 CPU 那份。
- 转换器自己维护「源 hash → 活着的 GL 对象」弱引用表，同一网格的所有实例共享一份，不受 LRU 挤出影响。
- 需要时再压 Gaffer 计算缓存：`Gaffer.ValuePlug.setCacheMemoryLimit(...)`。

实测（长仙村 env set，Gaffer 1.7.1.0）：

| 场景 | 原生 | gaffer_indexed_mesh |
|---|---|---|
| render 全展开 | 113 GB，被系统杀掉 | 53 GB；Gaffer 缓存上限设 4 GB 时 33 GB |
| render depth 9，RSS | 29.5 GB | 11.9 GB |
| render depth 9，显存 | 8073 MiB | 3145 MiB；加位置量化后 2665 MiB |

## 验证方法

- 验证去重：转换 A → 转换几十个别的网格 → 再转换 A，看拿回来的是不是同一个对象。
- 内存要拆开量：RssAnon、RssFile（mmap 的 usdc 文件，系统可回收）、`Gaffer.ValuePlug.cacheMemoryUsage()`、驱动显存镜像、场景位置对象数。jemalloc 释放的页要过衰减期才还给系统，同一时刻读两次再记。
- 转换时间和内存用无头 `RenderController` + OpenGL 渲染器量；视口端在 screengrab 里改 `minimumExpansionDepth` 量。
- 量之前把视口 `clippingPlanes` 设成 (0.1, 1e7)，默认远裁剪面会把大半个场景裁掉、根本不上传。

## 相关

- 实体：[[gaffer_indexed_mesh]] —— 解决方案
- 实体：[[IECoreGL]] —— 原生转换器和 `CachedConverter` 的行为
- 实体：[[ofGafferExt]] —— `local:defaultvalues` 设定 Gaffer 计算缓存上限
- 概念：[[索引式网格上传]] —— 体积降到约三分之一的主要手段
- 概念：[[顶点属性量化]] —— 显存的第二轮压缩
- 问题：[[切换场景后内存不释放]] —— 展开之后关掉场景时的另一类内存问题
- 综述：[[Gaffer 视口每帧开销分析]] —— 内存降下来之后的帧时间优化
- 来源：[[来源 - Claude 全局记忆]]
