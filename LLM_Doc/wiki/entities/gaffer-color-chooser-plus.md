---
type: entity
aliases: [ColorChooserPlus, colorChooserPlus]
tags: [gaffer, gafferui, color, open-source]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# gaffer-color-chooser-plus

团队插件 `~/gaffer/python/colorChooserPlus.py`（预设色板 + 持久化最近颜色）的开源化重写，给 [[Gaffer]] 原生拾色器加上色板分节（[[来源 - Claude 全局记忆]]）。

## 要点

- 位置：`Music/gaffer-color-chooser-plus/`，独立 git 仓库，MIT 许可。收录时初始 commit 还没 push，等用户上传 GitHub。
- 分层的扁平包：
  - 纯逻辑 `_paths` / `_config` / `palettes` / `history`，零 Gaffer 依赖，CI 在 6 个矩阵上能跑。
  - UI `widget.py`：`ColorChooserPlus( GafferUI.ColorChooser )`，可折叠分节 + 30 色预设 + 用户 JSON 色板 + 最近颜色。
  - `integration.py` 的 `install()` 做类名替换，幂等，环境变量 `GAFFER_COLOR_CHOOSER_PLUS_DISABLE` 关掉。
- 唯一依赖的私有接口是 `_ColorChooser__column`，经 `_seamColumn()` 守卫，缺失时退回原生外观。
- 启动 shim `startup/gui/colorChooserPlus.py`。rez 环境里 `GAFFER_STARTUP_PATHS` 要**追加**：rez 的 gaffer 包自己设这个变量，命令行内联覆盖会被吞掉。
- GafferUI 测试命令和 API 坑见仓库 README 的 `## Testing`。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[ueColorChooser]] —— 另一个替换原生拾色器的实现，用同样的类名替换机制
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 类名替换的做法
- 来源：[[来源 - Claude 全局记忆]]
