---
type: entity
aliases: [ManageRenderQuality]
tags: [gaffer, arnold, render-settings, team-library]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# RenderQualityManager

[[ofNode]] 里切换渲染质量档的节点，[[lgtLib 共享节点库]] 里出现 12 次。渲染设置配方里写作 `ManageRenderQuality`。

## 要点

- rows 有三档：`low` / `mid` / `final`。
- 元数据 `of3d::switch='quality'` + `of3d::switch_plug='rows'` 把 rows 标成质量切换器，流程工具按这对元数据找到并切换它。
- 各档的典型设置：

| 档位 | 设置 |
|---|---|
| final | `aaaSamples` 8 |
| mid | `aaaSamples` 4 |
| low | `resolutionMultiplier` 0.5 |

## 相关

- 实体：[[ofNode]] —— 所属模块
- 实体：[[Gaffer Spreadsheet]] —— rows 的存储结构
- 实体：[[Arnold]] —— 各档设置的是 Arnold 采样参数
- 实体：[[lgtLib 共享节点库]] —— 团队配方里的常用节点
- 综述：[[Gaffer 渲染设置模板]] —— 渲染设置三件套之一
- 实体：[[gaffer_zh_docs]] —— 计划单独写文档的 ofNode 节点之一
- 来源：[[来源 - Claude 全局记忆]]
