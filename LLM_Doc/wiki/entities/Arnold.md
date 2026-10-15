---
type: entity
aliases: [Arnold Renderer, GafferArnold]
tags: [arnold, rendering]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Arnold

Autodesk 的蒙特卡洛光线追踪渲染器，团队 [[Gaffer]] 镜头渲染的主力。Gaffer 里由 GafferArnold 模块接入：
`ArnoldOptions`、`ArnoldAttributes`、`ArnoldShader`、`ArnoldLight`、`ArnoldMeshLight`、`ArnoldImager` 等节点。

## 要点

- **AOV**：团队用 [[ArnoldAovManager]] 统一管理输出通道，表达式写法见 [[AOV]] 和 [[Arnold AOV 表达式速查]]。
- **渲染质量档**：[[RenderQualityManager]] 按 final / mid / low 切采样和分辨率倍数，整体模板见 [[Gaffer 渲染设置模板]]。
- **运动模糊**：要在 `StandardOptions` 打开 transform / deformation blur 和 shutter，速度向量驱动的模糊用 [[VelocityMotionBlur]]，见 [[运动模糊]]。
- **Deep 与降噪**：见 [[Deep 输出]]、[[降噪]]。
- **灯光**：团队的灯光表节点是 [[LightSetupManager]]。

## 在 Gaffer 里的版本差异

- Gaffer 1.6.5.1 里所有 Arnold 材质 `loadShader()` 之后 `type` 都是 `ai:surface`，要按 shader 名和 `out` 插口类型区分材质类别。
- 1.6.5.1 的 `ArnoldMeshLight` 派生自 `FilteredSceneProcessor`，MRO 里没有 Light 类；1.7 才有独立的 MeshLight 基类。
- `ArnoldLight` 顶层的 `name` 插口只是 `light`，具体灯型（point / quad / spot / distant / disk / cylinder / skydome / photometric / mesh_light）在 `__shader.name`。

## 相关
- 实体：[[Gaffer]] —— 宿主软件
- 实体：[[ArnoldAovManager]] —— AOV 管理节点
- 实体：[[RenderQualityManager]] —— 质量档切换
- 实体：[[LightSetupManager]] —— 灯光属性表
- 实体：[[VelocityMotionBlur]] —— 速度向量运动模糊
- 实体：[[gaffer_light_skill]] —— 按 color key 自动搭 Arnold 灯的技能包
- 实体：[[hierarchyMarkerIcons]] —— 按 Arnold 灯光 shader 类型显示层级视图图标
- 实体：[[cueMonitor]] —— AI 帧日志分析会统计 Arnold 渲染日志
- 概念：[[AOV]] —— 输出通道
- 概念：[[运动模糊]] —— 开关与采样
- 概念：[[Deep 输出]] —— deep 图像
- 概念：[[降噪]] —— imager 降噪
- 综述：[[Arnold AOV 表达式速查]] —— LPE 写法
- 综述：[[Gaffer 渲染设置模板]] —— 常用渲染设置组合
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— ArnoldMeshLight 继承关系与材质 type 的版本差异
- 来源：[[来源 - Claude 全局记忆]]
