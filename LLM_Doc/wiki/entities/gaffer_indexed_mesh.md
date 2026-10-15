---
type: entity
aliases: [indexedMesh, gaffer indexed mesh, 视口网格索引式上传]
tags: [gaffer, viewport, opengl, cpp, performance]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# gaffer_indexed_mesh

用户自己编译的 [[Gaffer]] 扩展（C++ + boost::python），替换 [[IECoreGL]] 把场景网格转成视口 GL 对象的那一步，让 Gaffer 视口展开大场景时少占内存和显存、每帧少花时间，画面和原生逐像素一致（[[来源 - Claude 全局记忆]]）。

## 要点

- 位置：rez 包 `Music/third_party/gaffer_my_extensions/gaffer_indexed_mesh/0.1.0/`，在包目录里 `./build.sh` 编译；本地扩展副本 `~/gaffer/localExtensions/indexedMesh/`，日常启动器走这一份（见 [[ofGafferExt]]）。
- 替换方式：摘掉 IECoreGL 转换器注册表里原生的 `MeshPrimitive` / `PointsPrimitive` 项，换成自己的（做法见 [[IECoreGL]]）。
- 做的事情按层次分：
  - 网格上传：索引式两种布局（split / storm）、法线按需在着色器里算、只上传 `P,N,uv,Cs` → [[索引式网格上传]]
  - 显存压缩：N 10:10:10、uv 半精度、按块 16 位索引、位置 4×uint16 量化 → [[顶点属性量化]]
  - 每帧开销：视锥剔除、块级剔除、精简绘制路径、占位框替换、拖动降级 → [[视锥剔除]]、[[Gaffer 视口每帧开销分析]]
  - 小网格合批：共享 arena + `glMultiDrawElementsIndirect` → [[Multi Draw Indirect 批量绘制]]
  - 点云（USD `PointInstancer`）按块切开并逐块剔除 → [[视锥剔除]]
  - 透过相机看时分辨率门外不画 → [[相机分辨率门外的物体仍在绘制]]
  - 关场景后回收 arena 空块 → [[切换场景后内存不释放]]
- 用户定的方向：画的对象集合和 Gaffer `RenderController` 发过来的完全一样。proxy 就画 proxy、render 就画 render（purpose 由 Gaffer 过滤）；不做按场景树切 LOD、不做远处换包围盒、不做显存预算淘汰。
- 自定义类型 id：799001 / 799002 / 799003 已占用，`ChunkedPointsPrimitive` 是 799005，`GateScissorGadget` 是 799007，新类型别撞。
- boost::python 对没绑定的 C++ 子类会返回最近的已绑定基类壳（`typeName()` 报 `RunTimeTyped`），自定义类型都要 `RunTimeTypedClass<T>()` 绑定。

## 用法 / 关键参数

文中「render depth N」指视口 purpose 选 render、`SceneView` 的 `minimumExpansionDepth` 设为 N；「全展开」是 `minimumExpansionDepth = 999`。

| 环境变量 | 作用 |
|---|---|
| `GAFFER_INDEXED_MESH_DISABLE` | 整个关掉（startup 钩子判断时 `"0"` 要当成不关） |
| `GAFFER_INDEXED_MESH_PRIMVARS` | 上传哪些 primvar，默认 `P,N,uv,Cs`；uv 不能去掉，否则 UV 显示模式整片黑 |
| `GAFFER_INDEXED_MESH_QUANTIZE_P=0` | 关位置量化 |
| `GAFFER_INDEXED_MESH_CHUNK_VERTICES` | 网格分块的顶点数，默认 16384 |
| `GAFFER_INDEXED_MESH_BATCH_MAX_TRIANGLES` | 参与合批的网格三角形数上限，默认 4096 |
| `GAFFER_INDEXED_MESH_GATE_CULL=0` | 关相机分辨率门剔除 |
| `GAFFER_INDEXED_MESH_POINT_CHUNK` / `GAFFER_INDEXED_MESH_POINTS=0` | 点云分块大小 / 关点云分块 |
| `GAFFER_INDEXED_MESH_PROBE_SKIP=render` 或 `draw` | 基准探针：跳过某一层，用来拆每帧开销 |
| `GAFFER_EXTENSIONS_DISABLE=local:indexedmesh` | 关掉本地扩展副本，测 rez 包那份 |

开发和同步的规矩：

- 改完 `python/` 下两个文件要拷到本地扩展副本；同步 `.so` 时先拷成 `.new` 再 `mv` 覆盖，正在运行的 Gaffer 映射着旧文件，不能原地覆盖写。
- 本地扩展那份 `.so` 在搜索路径里排在 rez 包前面。对照脚本一律带 `GAFFER_EXTENSIONS_DISABLE=local:indexedmesh`；统计计数全是 0 就说明量到的是旧代码（同类问题见 [[改了 rez 包但运行的还是本地扩展副本]]）。
- 后台基准跑着时别改 `python/*.py`：新的 Python 壳会 import 旧 `.so` 里没有的符号。
- 两条对照（原生 / 新实现）的环境变量写在各自命令里，别在外层 shell `export`。

验证手段：

- 视口 A/B：两个进程分别跑，离屏逐像素比（`proces_scode/run_compare.sh`），判读见 [[视口像素对比的差异是 z-fighting 还是几何错误]]。
- 转换时间和内存：无头 `RenderController` + OpenGL 渲染器。
- 每帧时间：`proces_scode/run_frame_bench.sh`（`DEPTHS` 用逗号分隔），方法见 [[Gaffer 视口每帧开销分析]]。
- 切场景内存：`tests/screengrab_scene_switch.py` + `run_scene_switch.sh`。

测量条件：文中数字都在团队镜头场景「长仙村」（env set）、Gaffer 1.7.1.0 上量得；包 README「数字」一节记的显卡是 RTX 3060 12 GB、帧时间基准视口 1246×416。

## 常见问题

- [[Gaffer 视口展开大场景内存暴涨]]
- [[切换场景后内存不释放]]
- [[相机分辨率门外的物体仍在绘制]]
- [[IECoreGL 着色器预处理器不认 version 430]]
- [[视口像素对比的差异是 z-fighting 还是几何错误]]

## 相关

- 实体：[[Gaffer]] —— 宿主软件，视口由它的 `RenderController` / `SceneView` 驱动
- 实体：[[IECoreGL]] —— 被替换的那一层（转换器注册表、`Primitive`）
- 实体：[[ofGafferExt]] —— 本地扩展副本 `indexedMesh` 由它加载
- 概念：[[索引式网格上传]] —— 核心做法
- 概念：[[顶点属性量化]] —— 显存压缩
- 概念：[[视锥剔除]] —— 对象级、块级、点云、分辨率门剔除
- 概念：[[Multi Draw Indirect 批量绘制]] —— 小网格合批
- 问题：[[Gaffer 视口展开大场景内存暴涨]] —— 这个包要解决的首要问题
- 问题：[[切换场景后内存不释放]] —— arena 空块回收
- 问题：[[相机分辨率门外的物体仍在绘制]] —— 门剔除 + scissor
- 问题：[[IECoreGL 着色器预处理器不认 version 430]] —— 派生着色器怎么编译
- 问题：[[视口像素对比的差异是 z-fighting 还是几何错误]] —— A/B 结果怎么判读
- 问题：[[改了 rez 包但运行的还是本地扩展副本]] —— 对照时量错版本的同类坑
- 综述：[[Gaffer 视口每帧开销分析]] —— 帧时间拆分与优化结果
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 各扩展包目标版本对照，本包只针对 1.7.1.0
- 来源：[[来源 - Claude 全局记忆]]
