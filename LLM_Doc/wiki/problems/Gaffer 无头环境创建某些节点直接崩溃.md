---
type: problem
aliases: [free() invalid size SIGABRT, 无头 SIGABRT]
tags: [gaffer, testing, headless, crash]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 无头环境创建某些节点直接崩溃

## 现象

在 `bin/gaffer env python` 里构造某些节点或视图，进程直接 SIGABRT，终端只有一行：

```text
free(): invalid size
```

## 原因

这些对象在构造时依赖 GUI 上下文里才初始化的东西，无头环境下内存管理出错。实测会崩溃的：

| 对象 | 版本 | GUI / screengrab 里 |
|---|---|---|
| `ofNode.processorNodes.LightSetupManager()` | 1.6.5.1 | 正常 |
| `GafferScene.InteractiveRender()` | 1.6.5.1 | 正常 |
| `GafferUI.View.create( scenePlug )`（SceneView） | 1.6.5.1 | 正常 |
| Arnold 着色器 `loadShader()` | 1.6.5.1 | 正常 |

Gaffer 1.7.1.0 下无头构造 `LightSetupManager()` 不再崩溃。

## 解决

- 需要这些对象的测试放到 [[Gaffer screengrab]] 的 commandFile 里跑（有完整 GUI 上下文）。
- 只需要验证纯逻辑时，用不依赖 GUI 的替代对象：测「非图像视口」用带 ScenePlug `in` 的场景节点代替 SceneView；测 Out 方向插口的显示用 BoundQuery / Random 代替 InteractiveRender。
- 同一个脚本要兼容两种上下文时，按 `"script" in dir()` 判断，无头时用环境变量（如 `PE_NO_ARNOLD=1`）跳过 Arnold 部分。

## 验证方法

把可疑构造单独放进一个最小脚本分别在 `gaffer env python` 和 screengrab 下跑，对比退出码（SIGABRT 是 134）。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer screengrab]] —— 替代运行环境
- 实体：[[ofNode]] —— LightSetupManager 所在的团队模块
- 实体：[[LightSetupManager]] —— 1.6 无头构造崩溃的团队节点
- 实体：[[Gaffer Catalogue]] —— `View.create( scenePlug )` 无头崩溃
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 1.7 下 LightSetupManager 不再崩溃
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 无头与 screengrab 的分工
- 综述：[[在 Gaffer 里另做参数面板]] —— InteractiveRender 无头构造会崩溃，日志框只能用 screengrab 验
- 来源：[[来源 - Claude 全局记忆]]
