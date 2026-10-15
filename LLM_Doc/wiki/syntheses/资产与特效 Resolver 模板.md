---
type: synthesis
aliases: [SFX Resolver, Asset Resolver, Material_Resolver]
tags: [gaffer, pipeline, usd, standin, team-library]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# 资产与特效 Resolver 模板

[[lgtLib 共享节点库]] 里把上游交付（资产 USD、特效缓存、群集缓存）读进灯光镜头的标准链路，以及读入后常做的属性 / 材质清理。

## 特效（SFX）Resolver

```text
SceneReader
  → TimeWarp(round(frame))
  → DeletePrimitiveVariables / ShufflePrimitiveVariables（清掉缓存里的元数据属性）
  → SubTree(enabled 由 ExistenceQuery 驱动)
  → Group（重挂到统一命名空间）
  → Switch
  → Set('scene:sfx:all' → /sfx)
  → 按分类 Isolate
```

- `ExistenceQuery` 驱动 SubTree 的开关：路径不存在时整段直通，不报错。
- 群集（crowd）缓存必须经过 `Encapsulate`，让 Arnold 按实例懒加载；不封装的话超大场景会卡死。团队节点 `Crowd_Resolver` 内部就是 `Set('scene:crowds:all')` + Encapsulate，见 [[ofNode]]。

## 资产 Resolver

```text
SceneReader
  → Material_Resolver
      CustomAttributes 记录 assetFileName / variantInfo
      Prune /*/materials /*/mtl /__class__
      Rename 归一命名
      变体 Switch
  → ProcessAssetVisibility（PurposeVisibility）
  → StandIn Box
      ArnoldStandIn(name = ${collect:rootName})
      CollectScenes
      Group(scale 100)
  → Set('scene:standin:all')
  → user:* CustomAttributes 记录 asset / material 的对应关系
```

- StandIn Box 用 rootName 一行一实例的写法见 [[Gaffer Spreadsheet 多实例与参数表]]。
- `ArnoldStandIn` 的路径模板和 cm → m 的 scale 100 见 [[ofNode]]。
- 单位缩放之后相机裁剪面也要跟着改，见 [[standin 全局缩放后相机裁剪失效]]。

## primvar 与材质清理

- **primvar 白名单**：只留需要的，其余删掉。

  ```text
  DeletePrimitiveVariables(names='P  Pref  uv  velocity ', invertNames=True)
  ```

- **改共享材质的参数**：`ShaderTweaks` + `localise=True`（复制到本地再改，避免污染共享材质）+ `ignoreMissing=True`。
- **关漫反射里的可见性**：`ArnoldAttributes(diffuseReflectionVisibility=False)`，比改 shader 轻。
- **写 Arnold 标量属性**：`CustomAttributes(ai:disp_height=0.05)`。
- **整体换材质**：`Isolate` + `DeleteAttributes(ai:surface / ai:disp_map / ai:volume)` 清掉原材质 + `ShaderAssignment` + `MergeScenes(attributesMode=1)` 只合并 attributes 层。
- **材质回填**：`CopyAttributes(attributes='ai:surface')` 从干净的 look USD 拷回来，`sourceLocation` 指向挂点。

## 相关

- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 实体：[[ofNode]] —— ArnoldStandIn、PurposeVisibility、Crowd_Resolver 等团队节点
- 实体：[[OpenUSD]] —— 资产交付格式
- 综述：[[Gaffer Spreadsheet 多实例与参数表]] —— StandIn Box 的多实例写法
- 问题：[[standin 全局缩放后相机裁剪失效]] —— standin 单位缩放
- 问题：[[镜头 UV 错误的修复方法]] —— 读入后 UV 的修复
- 来源：[[来源 - Claude 全局记忆]]
