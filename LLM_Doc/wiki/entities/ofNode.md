---
type: entity
aliases: [ofNode.processorNodes, ofNode.proceduralNodes, 团队自研 Gaffer 节点]
tags: [gaffer, team-library, pipeline]
applies_to: ["gaffer_pd 1.0.354", "Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# ofNode

团队自研的 Gaffer 节点模块，随团队包 `gaffer_pd` 发布（`gaffer_pd/1.0.354/python-3.11/python/ofNode/*.so`）。只有编译好的 `.so`、没有源码，用法靠 [[lgtLib 共享节点库]] 里的 `.grf` 反推，加上实机 `dir()` 探测。

## 要点

- **`.so` 是 Cython 编译的 Python 模块**（2026-08-27 实测）：`nm -D` 只有 180 个动态符号，未定义符号里没有任何 Gaffer / IECore / boost::python，只链接 `libpython3.11`；字符串里有 `__pyx_module_is_main_ofNode__processorNodes` 和 `/mnt/of3dci/cython/...` 路径；编译器 GCC 9.4（Ubuntu 20.04）。
- **推论**：它只绑 CPython 3.11 的 ABI，不绑 Gaffer 的 C++ ABI。自己编译一版 Gaffer，只要还是 Python 3.11、Gaffer 的 Python API 不变，这些节点照常可用。
- **无头创建**：Gaffer 1.6.5.1 下在 `gaffer env python` 里创建 `LightSetupManager()` 直接 SIGABRT（`free(): invalid size`），复现只能走 screengrab 的 GUI 上下文；Gaffer 1.7.1.0 无头创建不崩。见 [[Gaffer 无头环境创建某些节点直接崩溃]]。

## 节点清单

### ofNode.processorNodes

大多数节点的用法是「Spreadsheet rows 存配置 + 场景流穿过」，内部是 [[Gaffer Spreadsheet]]。

| 节点 | 用途与要点 |
|---|---|
| [[ArnoldAovManager]] | AOV 管理，manageAovs JSON 白名单 / inheritAovs；按钮回调 `ofUsdGaffer.aovManagerDialog.AovManagerDialog` |
| `ArnoldAovDeleter` | 删 AOV：delete 列表；`invertNames=True` 反向保留（Keep）；也可先 `'*'` 删光再按白名单重建 |
| [[LightSetupManager]] | 灯光属性表 |
| [[RenderQualityManager]] | 质量档 rows low / mid / final |
| `RenderLayerManager` | 渲染层 rows `cha_10` / `cha_20` / `cha_30`…；`of3d::switch='layer'`，配 `${renderPass}` 的 NameSwitch 双保险 |
| `LightLinkManager` / `LightBlockerManager` | 灯光链接 / 灯光遮挡（配方里写作 CreateLightLinks / CreateLightBlockers） |
| `ObjectSetManager` | `setNames ← Spreadsheet.enabledRowNames`；namespace 用 PresetsPlugValueWidget 预设 `obj:` / `lgt:` / `sfx:` / `volume:` |
| [[VelocityMotionBlur]] | 按 velocity 做运动模糊；motionUnit 预设 Per Frame / Per Second，velocityScale 手调 |
| `PurposeVisibility` | previewTarget / renderTarget 预设 guide / proxy / render |
| `SetupPointInstancer` / `SetupAimConstraints` / `CoordinateSystemCreator` | Maya 交付管线 |
| `ComputePointVelocity` | 从 P 采样算速度 |
| `ShadingLayerResolver` / `ResolveLookFile` / `ResolveVolumes` | Maya 交付的材质 / 体积解析 |
| `DefineMeshSegments` / `SelectMeshSegments` | 配 `childNodesAreReadOnly=True` |
| `Replace` | filter 经 Dot 传 FilterPlug |
| `Crowd_Resolver` | 读 chore 的 `.scc` / `.usda`；内部 Set `scene:crowds:all` + Encapsulate；元数据 `of3d::updatable` |

### ofNode.proceduralNodes

- `ArnoldStandIn`：`.ass` 程序化缓存，`scale=100`（cm → m）。路径模板：

  ```text
  ${sequence}/${shot}/${step}/publish/${name}.${version}/${name}.####.ass
  ```

  路径插口用 `PathPlugValueWidget` + `path:leaf` 元数据。

## 元数据惯例

| 元数据 | 含义 |
|---|---|
| `of3d::switch` / `of3d::switch_plug` | 标出 rows 切换器（如 `of3d::switch='quality'` + `of3d::switch_plug='rows'`） |
| `of3d::updatable` | 流程可刷新 |
| `childNodesAreReadOnly=True` | 保护内部节点不被改动 |
| `icon='editScopeProcessorNode.png'` + `nodeGadget:color` | 统一外观 |
| `spreadsheet:defaultRowVisible=False` | 默认隐藏 default 行 |

## 常见问题

- [[LightSetupManager 动画编辑器只显示 row1]]
- [[Gaffer 无头环境创建某些节点直接崩溃]]

## 相关

- 实体：[[Gaffer]] —— 宿主软件
- 实体：[[lgtLib 共享节点库]] —— 用法的主要依据
- 实体：[[ofUsdGaffer]] —— 配套的工具函数模块
- 实体：[[LightSetupManager]] —— processorNodes 成员
- 实体：[[ArnoldAovManager]] —— processorNodes 成员
- 实体：[[RenderQualityManager]] —— processorNodes 成员
- 实体：[[VelocityMotionBlur]] —— processorNodes 成员
- 实体：[[Gaffer Spreadsheet]] —— 多数 ofNode 节点内部的配置表
- 问题：[[LightSetupManager 动画编辑器只显示 row1]] —— ofNode 节点的已知显示问题
- 问题：[[Gaffer 无头环境创建某些节点直接崩溃]] —— 1.6.5.1 无头建 LightSetupManager 崩溃
- 综述：[[Gaffer 渲染设置模板]] —— ofNode 节点组成的渲染设置
- 综述：[[资产与特效 Resolver 模板]] —— ArnoldStandIn、PurposeVisibility 等在资产读入中的位置
- 实体：[[gaffer_zh_docs]] —— ofNode 节点文档单独立项
- 来源：[[来源 - Claude 全局记忆]]
