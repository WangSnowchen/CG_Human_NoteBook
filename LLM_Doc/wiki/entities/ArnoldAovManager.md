---
type: entity
aliases: [CreateArnoldAOVs, ArnoldAovDeleter, DeleteArnoldAOVs]
tags: [gaffer, arnold, aov, team-library]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# ArnoldAovManager

[[ofNode]] 里管理 Arnold [[AOV]] 的节点，[[lgtLib 共享节点库]] 里出现 21 次，是团队文档站访问量最高的节点页。配套的删除节点是 `ArnoldAovDeleter`（出现 17 次）。渲染设置配方里两者分别写作 `CreateArnoldAOVs` / `DeleteArnoldAOVs`。

## 要点

- **ArnoldAovManager**：用 manageAovs JSON 描述要建哪些 AOV（白名单），可勾 inheritAovs 继承上游 AOV。节点按钮回调 `ofUsdGaffer.aovManagerDialog.AovManagerDialog` 弹出 AOV 对话框，继承逻辑是 `ofUsdGaffer.manageArnoldAovs.ArnoldAovManager.from_node(...).inherit_aovs()`。
- **ArnoldAovDeleter**：
  - 黑名单删减：delete 列表里写要删的 AOV。
  - `invertNames=True`：反向保留（Keep），只留下列出的 AOV，常用来只保留 mask / crypto。
  - 白名单重建：先用 `'*'` 删光，再用 ArnoldAovManager 按白名单重建。

## 用法 / 关键参数

manageAovs JSON 每条 AOV 的 `expression` 字段是 Arnold 光路表达式，全集见 [[Arnold AOV 表达式速查]]。加一个 deep 输出的写法：

```json
{"<deep>": {"deep": {"name": "deep", "data_type": "rgba", "expression": "C.*"}}}
```

## 相关

- 实体：[[ofNode]] —— 所属模块
- 实体：[[ofUsdGaffer]] —— 对话框与继承逻辑的实现
- 实体：[[lgtLib 共享节点库]] —— 团队配方里的常用节点
- 实体：[[Arnold]] —— AOV 的渲染器
- 概念：[[AOV]] —— 本节点管理的对象
- 概念：[[Deep 输出]] —— 用本节点加 deep AOV
- 综述：[[Arnold AOV 表达式速查]] —— manageAovs JSON 的 expression 写法
- 综述：[[Gaffer 渲染设置模板]] —— 渲染设置三件套之一
- 实体：[[gaffer_zh_docs]] —— 计划单独写文档的 ofNode 节点之一
- 来源：[[来源 - Claude 全局记忆]]
