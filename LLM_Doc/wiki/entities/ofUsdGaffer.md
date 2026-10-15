---
type: entity
aliases: []
tags: [gaffer, team-library, pipeline]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# ofUsdGaffer

团队的 Gaffer 工具函数模块，和 [[ofNode]] 一样是编译模块、没有源码。[[lgtLib 共享节点库]] 的 `.grf` 在按钮回调和 `import` 里调用它。

## 要点

- 用途集中在 AOV 管理、`.ass` 材质转换、场景遍历这几件事上。
- 节点上的按钮通过 `buttonPlugValueWidget:clicked` 元数据调用它，写法见 [[Gaffer 渲染设置模板]] 的「按钮脚本节点」一节。

## 用法 / 关键参数

| 函数 | 用途 |
|---|---|
| `manageArnoldAovs.ArnoldAovManager.from_node(...).inherit_aovs()` | 让 [[ArnoldAovManager]] 继承上游 AOV |
| `aovManagerDialog.AovManagerDialog(plug)` | ArnoldAovManager 节点上按钮弹出的 AOV 对话框 |
| `deleteArnoldAovs` | 删除 AOV |
| `convertAssShaders.convert_ass_to_gaffer(standin_path, node)` | 从 standin 的 `.ass` 重建 Gaffer 材质 |
| `iter_scene_hierarchy(scene, root_path)` | 遍历场景层级 |

## 相关

- 实体：[[ofNode]] —— 配套的团队节点模块
- 实体：[[lgtLib 共享节点库]] —— 调用这些函数的节点图所在
- 实体：[[ArnoldAovManager]] —— AOV 对话框与继承逻辑的使用者
- 综述：[[Gaffer 渲染设置模板]] —— 按钮脚本节点里调用本模块
- 来源：[[来源 - Claude 全局记忆]]
