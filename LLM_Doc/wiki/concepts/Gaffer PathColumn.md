---
type: concept
aliases: [PathColumn, GafferUI.PathColumn, 路径列]
tags: [gaffer, gafferui, hierarchyview]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer PathColumn

## 定义

`GafferUI.PathColumn` 是 `PathListingWidget` / `PathModel` 里「一列」的抽象：给定一个 path，返回这一格要显示的值、图标、颜色、提示。HierarchyView、LightEditor 等列表编辑器的每一列都是一个 PathColumn（[[来源 - Claude 全局记忆]]）。

## 关键事实（1.6.5.1 实测）

- **`_GafferUI.PathColumn` 可以在 Python 里子类化**：绑定带 `PathColumnWrapper`，`cellData` / `headerData` 经 methodOverride 派发到 Python。
- **`StandardPathColumn` 不能子类化**（RefCountedClass 绑定，没有 wrapper）。想改 HierarchyView 的 Name 列，要自己写 PathColumn 子类复刻名字显示，再加图标 / 前景 / 背景。
- **`PathColumn.CellData( value, icon, background, toolTip, sortValue, foreground )`**：icon / background / foreground 支持 `Color3fData` / `Color4fData`；取值器会解包 Data（getter 返回 `str` / `imath.Color3f`）。
- **刷新**：`PathModel.setColumns` 会连接每一列的 `changedSignal()`。改了列的配置后发一次 `column.changedSignal()( column )`，视图自动刷新，不用手动重建。

## 在各软件里的对应

- [[hierarchyMarkerIcons]] 用一个 PathColumn 子类替换 HierarchyView 的 Name 列，按对象类型显示图标。
- 方法论沉淀在技能 `~/.claude/skills/gaffer-hierarchy-column/`。

## 注意事项

- 自定义列要做成幂等安装，重复 `install()` 不能叠加多列。
- 图标文件名不要和官方图标同名，`GAFFERUI_IMAGE_PATHS` 是全局查找。

## 相关

- 实体：[[hierarchyMarkerIcons]] —— 用本类做自动类型图标列
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 替换原生列属于局部替换的一种
- 来源：[[来源 - Claude 全局记忆]]
