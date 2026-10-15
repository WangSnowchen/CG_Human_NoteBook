---
type: entity
aliases: [Gaffer 中文文档]
tags: [gaffer, documentation]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# gaffer_zh_docs

团队内部的 Gaffer 中文文档站，项目在 `Music/gaffer_zh_docs`。包括指南部分和逐节点的 NodeReference 教学页，局域网内供艺术家查阅。

## 要点

- **指南部分**：38 页，已完工（构建 0 警告、0 断链）。
- **NodeReference**：`Reference/NodeReference/GafferScene/` 有 142 个节点页，全部有中文翻译；另有 `OfNode/` 4 页。
  - 按新模板做完的 11 个：Instancer（试点）+ 第一梯队 PathFilter / Prune / Isolate / Parent / Group / Transform / ShaderAssignment / ShaderTweaks / Set / SetFilter / SceneReader。
  - 其余约 100 页还是旧模板：只有 GraphEditor + NodeEditor 全参数面板 + 少量 HierarchyView 截图，几乎没有 Viewer 图，留白多，还有调试文字漏进页面。
  - 项目 README 里的进度段已过时（还写着「NodeReference 试点进行中」），以本页为准。
- **出图管线**保留在 `gaffer_zh_docs/_work/`，不要删。制作方法见 [[NodeReference 节点案例制作流程]]，也沉淀成了 Claude Code 技能 `~/.claude/skills/gaffer-node-docs/`。

## 文档优先级

按 [[lgtLib 共享节点库]] 161 个 `.grf` 的真实用量排（GafferScene 142 个节点里库中用到 68 个、74 个零使用），括号里是出现次数：

- **第二梯队（下一步）**：`OpenGLAttributes`(21) `DeletePrimitiveVariables`(19) `StandardOptions`(17) `CopyPrimitiveVariables`(15) `SubTree`(14，缺案例) `MergeScenes`(12) `CollectScenes`(12) `CustomAttributes`(11) `FreezeTransform`(9) `StandardAttributes`(8，缺案例) `DeleteFaces`(7) `CoordinateSystem`(7) `Camera`(6) `ParentConstraint`(5)，另补统计漏掉的 `InteractiveRender` `Catalogue` `Outputs`。
- **第三梯队（查询类，没有画面，需要另一套模板）**：`TransformQuery`(31) `OptionQuery`(20) `FilterResults`(9) `BoundQuery`(8) `PrimitiveVariableQuery`(4) `AttributeQuery`(2) `CameraQuery`(2)。
- **跨模块高价值**：`GafferOSL.OSLCode`(33) / `OSLObject`(32) / `OSLShader`(17)；`GafferArnold.ArnoldOptions`(21) / `ArnoldAttributes`(17) / `ArnoldLight`(11)。
- **ofNode 单独立项（暂缓）**：[[ArnoldAovManager]](21) / `ArnoldAovDeleter`(17) / [[LightSetupManager]](15) / [[RenderQualityManager]](12)。这批文档价值最高：团队自研、外面查不到，艺术家只能问人，访问日志里 ArnoldAovManager 是最热门的页面。但 [[ofNode]] 没有源码也没有测试，案例只能靠 `.grf` 反推加实机探测，需要单独设计流程。
- **不配案例**：8 个抽象基类（`SceneNode` `SceneProcessor` `SceneElementProcessor` `FilteredSceneProcessor` `FilterProcessor` `Filter` `Parameters` `PointInstancerCore`）只保留翻译；其余零使用节点暂不处理。

## 局域网服务

```bash
cd ~/Music/gaffer_zh_docs && ./serve.sh
```

- `serve.sh` 起 `server.py`，端口 8000，没有鉴权，只在内网用。
- `/admin` 是访问监控后台，访问日志持久化在 `access_log.jsonl`。
- 不做自动重启，机器重启后要手动起。重新 build 文档不需要重启服务。

## 相关

- 实体：[[Gaffer]] —— 文档对象
- 实体：[[lgtLib 共享节点库]] —— 文档优先级的统计依据
- 实体：[[ofNode]] —— 单独立项的团队节点文档
- 实体：[[ArnoldAovManager]] —— 访问量最高的节点页
- 实体：[[LightSetupManager]] —— 待写的 ofNode 节点文档
- 实体：[[RenderQualityManager]] —— 待写的 ofNode 节点文档
- 实体：[[OSL]] —— 跨模块高价值节点
- 实体：[[Gaffer screengrab]] —— 出图工具
- 综述：[[NodeReference 节点案例制作流程]] —— 新模板节点页的制作方法
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 出图与验证的通用方法
- 问题：[[Gaffer 节点图截图节点太小看不清]] —— 节点页 GraphEditor 截图的放大办法
- 来源：[[来源 - Claude 全局记忆]]
