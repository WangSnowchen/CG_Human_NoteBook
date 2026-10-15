---
type: synthesis
aliases: [渲染输出配方, Render settings template]
tags: [gaffer, arnold, rendering, lighting, team-library]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 渲染设置模板

[[lgtLib 共享节点库]] 里和渲染输出有关的配方汇总：渲染设置、AOV、体积、灯型、输出后端、降噪、过扫描、按钮脚本、测试场景模板。

## 渲染设置三件套

```text
CreateLightSetup（LightSetupManager）
  + ManageRenderQuality（RenderQualityManager，rows: final / low / mid）
  + CreateArnoldAOVs / DeleteArnoldAOVs（ArnoldAovManager / ArnoldAovDeleter）
  + ArnoldOptions + StandardOptions
```

- 灯光表：[[LightSetupManager]]。
- 质量档：[[RenderQualityManager]]，final `aaaSamples` 8、mid 4、low `resolutionMultiplier` 0.5。
- AOV：[[ArnoldAovManager]]，表达式见 [[Arnold AOV 表达式速查]]。
- 渲染层：`RenderLayerManager`（rows `cha_10` / `cha_20`…，`of3d::switch='layer'`），配 `${renderPass}` 的 NameSwitch 双保险，见 [[ofNode]]。

## 相机设定

- `StandardOptions.renderCamera=/camera`。
- `CameraTweaks` 统一改 projection / aperture / filmFit。
- `OptionQuery` 查 `render:camera` 反过来喂给需要相机的节点。
- 镜头读入后先清掉自带相机 `Prune(/Render /persp)`，再 `Parent` 进自己的相机。

## Deep 与 shadow matte

见 [[Deep 输出]]：开运动模糊选项 + deep AOV；只渲 deep 时 GI 采样设 0；shadow matte 拆 `shadow` / `shadow_mask` / `shadow_diff`。

## 体积雾与 matte

- 包场景的体积：一个巨大 scale 的 Cube 包住场景 + `standard_volume`（`transparent_depth` 1000）+ `ArnoldAttributes`（cameraVisibility 关、`volumeStepSize` / `shapeStepSize` = 1）+ `OpenGLAttributes`（wireframe，视口里不挡视线）+ `MergeScenes` 合进场景；其余元素设 `matte=True` 分离。
- 大气雾：`ArnoldAtmosphere` + Fog shader。
- 自定义体积灯：`ArnoldMeshLight`（exposure 20、aov `fill_80`..`fill_85`、cameraVisibility False）+ `light_decay`。

## 灯型配方

| 效果 | 做法 |
|---|---|
| Gobo 焦散 | SpotLight + Gobo（slidemap 用 Image 序列）；多盏灯用 `_fast` 降采样版本 + `lightSamples` 2 |
| 灯光遮挡 / 链接 | `CreateLightBlockers` / `CreateLightLinks`（ofNode 的 LightBlockerManager / LightLinkManager） |
| Shadow matte | 赋给地面，或赋给一组相机不可见（cameraVisibility off）的石头，用来接投影 |
| 极光 / 光束 | 多盏灯，`light_decay` 的 `far_end` 递增（300 → 3200） |
| 灯贴包围盒（BBXtoLight） | `BoundQuery.center → Transform.translate`，见 [[Gaffer 查询回写闭环]] |
| 灯约束（ConstraintToLight） | `ParentConstraint(targetMode=3)` |

## 交互 / 批量双后端输出

```text
ContextVariables(render:filter / compression)
  → NameSwitch(index 由 __outIndex 决定：'*' → Interactive，'batch' → Batch)
  → BatchOutputs 或 ClientDisplayDriver(displayPort = ${image:catalogue:port})
  → DeleteContextVariables
```

AOV 的滤波在 Outputs 参数里加 `filter=gaussian`。

## 降噪

`ArnoldImager` + `imager_denoiser_oidn`，排除数据通道，见 [[降噪]]。

## Overscan 与 crop

BrutalOverScan、按物体自动 crop、分块渲染 RegionRenderManager，见 [[Overscan]]。

## 按钮脚本节点

节点上的按钮用元数据 `buttonPlugValueWidget:clicked` 写一段 Python，配 `GafferUI.ButtonPlugValueWidget`，没有场景流，纯粹执行 UI 操作：

- 改颜色、加注释：`Gaffer.MetadataAlgo.addAnnotation`。
- 按属性动态建 PathFilter：`GafferScene.SceneAlgo.findAllWithAttribute` + `groupby`。
- 写 visible set：`GafferSceneUI.ContextAlgo.getVisibleSet`。
- 扫目录生成下拉预设：`Gaffer.Metadata.registerValue( node[plug], "presetNames" / "presetValues", ... )`。
- 改全局 UI 字号：`GafferUI._StyleSheet._styleSheet.replace("font: 10px;", ...)`（私有 API，慎用）。
- 从 standin 重建材质：`ofUsdGaffer.convertAssShaders.convert_ass_to_gaffer`，见 [[ofUsdGaffer]]。
- 弹团队的对话框。

写法要点：`plug.node().scriptNode()` 拿到根节点；按钮回调里要求值时先进入上下文 `with Gaffer.Context( script.context() ) :`。

## 测试场景模板

- **SimpleSetup**：`StandardOptions`（renderCamera=/camera）+ Arnold 选项 + Camera + Parent + textureSearchPath + skydome + ArnoldAovManager。
- **LookDevBox**：环境图用 Image shader 读 `${GAFFER_ROOT}/resources/hdri/studio.exr` + 引用 `guoyang/ReferencePlate.grf`（Reference.load）+ Camera + 质量 / AOV 四件套。
- **stdlgt_chr_blue**：用 Backdrop 当 UI 控件；转盘动画 Expression `int(frame-1)*rotateStep % 360`；`NameSwitch(selector=${scene:renderer})` 按渲染器分流。

## 相关

- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 实体：[[ofNode]] —— 三件套里的团队节点
- 实体：[[ofUsdGaffer]] —— 按钮脚本调用的工具函数
- 实体：[[LightSetupManager]] —— 灯光表
- 实体：[[RenderQualityManager]] —— 质量档
- 实体：[[ArnoldAovManager]] —— AOV 管理
- 实体：[[Arnold]] —— 渲染器
- 概念：[[AOV]] —— 输出通道
- 概念：[[Deep 输出]] —— deep 配方
- 概念：[[降噪]] —— 降噪配方
- 概念：[[Overscan]] —— 过扫描与 crop 配方
- 综述：[[Arnold AOV 表达式速查]] —— AOV 表达式
- 综述：[[Gaffer 查询回写闭环]] —— 灯贴包围盒等配方的原理
- 来源：[[来源 - Claude 全局记忆]]
