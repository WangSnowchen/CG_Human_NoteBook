---
type: entity
aliases: [lgtLib, gaffer_node 共享库, 团队共享 Gaffer 节点库]
tags: [gaffer, lighting, team-library]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# lgtLib 共享节点库

灯光组共享的 Gaffer 节点库，路径 `/mnt/ofLib/lgtLib/gaffer_node/`，约 236 个文件。里面是成员各自沉淀的可复用节点图和镜头修复配方，团队自研节点 [[ofNode]] 在这些节点图里大量出现。

## 要点

- **只读**：这是公共共享区，绝不写入、修改、创建任何文件。要试验先拷到自己的临时目录。
- **目录按成员分**：guoyang 目录最全（约 47 个通用节点，另有 eio / pj2024dy001 / pj2026cg009 / wzqml 等镜头修复子目录约 25 个）；其余成员目录（wangxuechen、rebecca、caozhenzhen 等）多为镜头修复或渲染管线组件。
- **文件格式**：
  - `.grf`：Python 序列化的节点图，内容是 `__children["X"] = GafferScene.XXX(...)` 建节点 + `setInput` 连线 + `setValue` 设值 + `Metadata.registerValue` 写 UI 元数据。可直接打开，也可用 Reference 节点引用。
  - `.txt`：同名节点的一句话中文说明。
  - `.bak`：备份，忽略。
- **ofNode 节点没有源码**：.grf 是了解 [[ofNode]] / [[ofUsdGaffer]] 用法的主要依据。

## 用法 / 关键参数

用 Reference 节点引用库里的节点图（路径相对库根目录）：

```python
reference = Gaffer.Reference()
script.addChild( reference )
reference.load( "guoyang/xxx.grf" )
```

## 节点用量统计

对库中 161 个 `.grf` 统计 Gaffer 节点出现次数（[[gaffer_zh_docs]] 用它排文档优先级）：

| 类别 | 节点（出现次数） |
|---|---|
| 场景处理 | `OpenGLAttributes`(21) `DeletePrimitiveVariables`(19) `StandardOptions`(17) `CopyPrimitiveVariables`(15) `SubTree`(14) `MergeScenes`(12) `CollectScenes`(12) `CustomAttributes`(11) `FreezeTransform`(9) `StandardAttributes`(8) `DeleteFaces`(7) `CoordinateSystem`(7) `Camera`(6) `ParentConstraint`(5) |
| 查询 | `TransformQuery`(31) `OptionQuery`(20) `FilterResults`(9) `BoundQuery`(8) `PrimitiveVariableQuery`(4) `AttributeQuery`(2) `CameraQuery`(2) |
| OSL | `OSLCode`(33) `OSLObject`(32) `OSLShader`(17) |
| Arnold | `ArnoldOptions`(21) `ArnoldAttributes`(17) `ArnoldLight`(11) |
| ofNode | `ArnoldAovManager`(21) `ArnoldAovDeleter`(17) `LightSetupManager`(15) `RenderQualityManager`(12) |

GafferScene 的 142 个节点里，库中用到 68 个，74 个从未出现。

## 库里的配方

- 场景 / 几何：[[Gaffer Box 处理器脚手架]]、[[Gaffer OSL 几何编辑套路]]、[[Gaffer 逐位置动态查询]]、[[Gaffer 按帧门控]]、[[Gaffer 查询回写闭环]]、[[Gaffer Spreadsheet 多实例与参数表]]、[[Gaffer 视口辅助物]]、[[Gaffer 程序化几何]]
- 渲染输出：[[Gaffer 渲染设置模板]]、[[Arnold AOV 表达式速查]]
- 管线：[[资产与特效 Resolver 模板]]

## 常见问题

- [[镜头 UV 错误的修复方法]]
- [[运动模糊异常的修复方法]]
- [[standin 全局缩放后相机裁剪失效]]

## 相关

- 实体：[[Gaffer]] —— 节点库所属软件
- 实体：[[ofNode]] —— 库中节点图大量使用的团队自研节点
- 实体：[[ofUsdGaffer]] —— 库中按钮回调调用的团队工具函数
- 实体：[[LightSetupManager]] —— 库中常用的灯光属性表节点
- 实体：[[ArnoldAovManager]] —— 库中用量最高的 ofNode 节点之一
- 实体：[[RenderQualityManager]] —— 库中常用的质量档切换节点
- 实体：[[OSL]] —— OSLCode / OSLObject 是库中用量最高的节点
- 实体：[[gaffer_zh_docs]] —— 按本库用量排定文档优先级
- 综述：[[Gaffer Box 处理器脚手架]] —— 库中节点的通用外壳
- 综述：[[Gaffer OSL 几何编辑套路]] —— 库中几何编辑配方
- 综述：[[Gaffer 逐位置动态查询]] —— 库中查询配方
- 综述：[[Gaffer 按帧门控]] —— 库中时间控制配方
- 综述：[[Gaffer 查询回写闭环]] —— 库中查询驱动变换的配方
- 综述：[[Gaffer Spreadsheet 多实例与参数表]] —— 库中表格用法
- 综述：[[Gaffer 视口辅助物]] —— 库中只在视口显示的辅助物
- 综述：[[Gaffer 程序化几何]] —— 库中用表达式造几何的配方
- 综述：[[Gaffer 渲染设置模板]] —— 库中渲染输出配方
- 综述：[[Arnold AOV 表达式速查]] —— 库中 AOV 配置汇总
- 综述：[[资产与特效 Resolver 模板]] —— 库中资产读入管线
- 问题：[[镜头 UV 错误的修复方法]] —— 库中镜头修复配方
- 问题：[[运动模糊异常的修复方法]] —— 库中镜头修复配方
- 问题：[[standin 全局缩放后相机裁剪失效]] —— 库中镜头修复配方
- 来源：[[来源 - Claude 全局记忆]]
