---
type: entity
aliases: [Spreadsheet, Gaffer 表格节点]
tags: [gaffer, spreadsheet]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Spreadsheet

Gaffer 的表格节点（`Gaffer.Spreadsheet`）：按 `selector` 当前的取值选中一行，把这一行各列的值输出给下游插口。团队的 [[ofNode]] 节点（[[LightSetupManager]]、[[RenderQualityManager]] 等）内部都是一张 Spreadsheet，配置存在 rows 里。

## 要点

- **行插口**：`rows` 是 RowsPlug，每行是 `row1` / `row2`…（addRow 时自增的图组件名），行名存在每行的 `name` 插口里，单元格值在 `rows.rowN.cells.<列名>.value`。
- **常用输出**：
  - `out.<列名>`：当前命中行的列值。
  - `activeRowIndex`：当前上下文命中第几行。
  - `enabledRowNames`：所有启用行的名字，常接给 PathFilter.paths、CollectScenes.rootNames、ObjectSetManager.setNames。
  - `resolvedRows`：解析后的全部行。
- **selector 常见写法**：`${scene:path}`（按位置选行）、`${collect:rootName}`（配合 CollectScenes 一行一实例）。用法见 [[Gaffer Spreadsheet 多实例与参数表]]。
- **rows 提升到 Box 上**：内部表的 `rows` 输入接到 Box 上提升出来的 RowsPlug，Box 上那份是源头、可编辑，内部那份被驱动、只读。
- **在已连接的 rows 上调 `addRow()` 会清掉它的输入**，内部表从只读变成可编辑。测试里不要拿 addRow 当刷新触发器。
- **元数据** `spreadsheet:defaultRowVisible=False` 隐藏 default 行（团队节点常用）。

## 常见问题

- [[LightSetupManager 动画编辑器只显示 row1]] —— 动画编辑器显示行的图组件名
- [[Gaffer Spreadsheet 表格滚到底差一行]] —— 塞进自制面板时的滚动问题

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[ofNode]] —— 团队节点内部普遍用 Spreadsheet 存配置
- 实体：[[LightSetupManager]] —— 内部是一张 Spreadsheet
- 实体：[[RenderQualityManager]] —— rows 存质量档
- 实体：[[spreadsheetRowDuplicate]] —— 行右键复制并重编号
- 实体：[[SpreadsheetOverviewEditor]] —— 浏览场景里所有表格的编辑器
- 实体：[[gaffer_parameter_editor]] —— 批量编辑时让一张表带着其他表同步修改
- 问题：[[LightSetupManager 动画编辑器只显示 row1]] —— 行的图组件名与行名不同
- 问题：[[Gaffer Spreadsheet 表格滚到底差一行]] —— 自排版容器里的表格滚动错行
- 综述：[[Gaffer Spreadsheet 多实例与参数表]] —— 团队配方里的两种用法
- 来源：[[来源 - Claude 全局记忆]]
