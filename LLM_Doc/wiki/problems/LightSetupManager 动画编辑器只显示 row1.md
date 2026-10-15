---
type: problem
aliases: [AnimationEditor 显示 row1 row2]
tags: [gaffer, animation, spreadsheet, team-library]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# LightSetupManager 动画编辑器只显示 row1

## 现象

给 [[LightSetupManager]] 里某盏灯的参数打关键帧后，AnimationEditor 左栏显示的是 `row1`、`row2`，看不出是哪盏灯。

## 原因

LightSetupManager 内部是一张 [[Gaffer Spreadsheet]]，顶层 `node["rows"]` 是数据源。打了关键帧的插口是 `rows.row1.cells.intensity.value` 这种路径。AnimationEditor 左栏显示的是图组件的 `relativeName`，而行的图组件名是 addRow 时自增的 `row1` / `row2`；灯光名存在每行的 `name` 插口的值里。这是 Gaffer Spreadsheet 的标准行为。

## 解决

三个方向，按稳妥程度从高到低：

1. **自定义 AnimationEditor 的显示映射**：显示时把 `rowN` 换成该行 `name` 的值，不改图组件名。最稳。
2. **startup 脚本监听 `name` 插口变化，同步 `setName`**。
3. **在 [[ofNode]] 的 addRow 实现里同步 `setName`**。

方向 2、3 要处理两个坑：灯名重复时 Gaffer 会自动加后缀；名字里含 `/` 或 `.` 时 `setName` 直接抛异常（行名是 `/env/key_10` 这种路径，一定会遇到）。

## 验证方法

打关键帧后打开 AnimationEditor，左栏显示灯光名；存盘重开后关键帧仍在、名字仍对。

## 相关

- 实体：[[LightSetupManager]] —— 出问题的节点
- 实体：[[Gaffer Spreadsheet]] —— 行图组件名的来源
- 实体：[[ofNode]] —— 节点所在模块
- 来源：[[来源 - Claude 全局记忆]]
