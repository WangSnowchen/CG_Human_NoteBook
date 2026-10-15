---
type: entity
aliases: [CreateLightSetup]
tags: [gaffer, lighting, team-library, arnold]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# LightSetupManager

[[ofNode]]（`ofNode.processorNodes`）里的灯光属性表节点：一行一盏灯，列是灯光参数。团队镜头的灯光都集中写在它里面，[[gaffer_light_skill]] 自动搭灯时也把灯写进这个节点。[[lgtLib 共享节点库]] 的 161 个 `.grf` 里出现 15 次。渲染设置配方里常和 `ManageRenderQuality`、`CreateArnoldAOVs` 一起出现，写作 `CreateLightSetup`。

## 要点

- **结构**：一个 SceneProcessor 包着一张内部 [[Gaffer Spreadsheet]]。顶层 `node["rows"]` 是数据源，内部 Spreadsheet 的 `rows` 输入来自它。
- **行名** = 灯光相对 `group` 的路径。团队约定 group 是 `lgt_grp`，行名形如 `/env/key_10`。
- **打关键帧后的插口**是 `rows.row1.cells.intensity.value` 这种形式，图组件名是 `row1` / `row2`（addRow 自增），灯光名存在每行的 `name` 插口里。
- **无头创建**：
  - Gaffer 1.6.5.1：`gaffer env python` 里 `LightSetupManager()` 直接 SIGABRT（`free(): invalid size`），只能在 screengrab 的 GUI 上下文里复现。
  - Gaffer 1.7.1.0：无头创建不崩。

## 用法 / 关键参数

`light_type` 取值：

| 值 | 灯型 |
|---|---|
| 0 | point |
| 1 | distant |
| 2 | quad（默认） |
| 3 | spot |
| 4 | skydome |
| 5 | cylinder |
| 6 | disk |
| 7 | photometric |

## 常见问题

- [[LightSetupManager 动画编辑器只显示 row1]]
- [[Gaffer 无头环境创建某些节点直接崩溃]]

## 相关

- 实体：[[ofNode]] —— 所属模块
- 实体：[[Gaffer Spreadsheet]] —— 内部存储结构
- 实体：[[gaffer_light_skill]] —— 自动搭灯时写入本节点
- 实体：[[lgtLib 共享节点库]] —— 团队配方里的常用节点
- 实体：[[Arnold]] —— 灯光渲染器
- 实体：[[gaffer_zh_docs]] —— 计划单独写文档的 ofNode 节点之一
- 问题：[[LightSetupManager 动画编辑器只显示 row1]] —— 动画编辑器显示行号
- 问题：[[Gaffer 无头环境创建某些节点直接崩溃]] —— 1.6.5.1 无头创建崩溃
- 综述：[[Gaffer 渲染设置模板]] —— 渲染设置三件套之一
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 无头创建在两个版本表现不同
- 来源：[[来源 - Claude 全局记忆]]
