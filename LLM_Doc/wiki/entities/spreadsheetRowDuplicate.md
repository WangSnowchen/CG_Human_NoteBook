---
type: entity
aliases: [Duplicate Row(s) and Renumber, 复制行并重新编号]
tags: [gaffer, gafferui, spreadsheet]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# spreadsheetRowDuplicate

给 [[Gaffer Spreadsheet]] 行右键菜单加一条「Duplicate Row(s) and Renumber」：把选中的行复制到表尾，并把行名改成下一个可用编号（`env/fill_10` → `env/fill_11`；没有尾部数字时 `a` → `a1`）（[[来源 - Claude 全局记忆]]）。

## 要点

- 文件：`~/gaffer/python/spreadsheetRowDuplicate.py`。
- `nextFreeName`：正则 `^(.*?)(\d+)$` 取尾部数字，前缀 + (n+1)，保持补零位数，被占用就继续 +1。
- `duplicateRowsRenumbered`：用 `_ClipboardAlgo._objectMatrixFromPlugMatrix` + `addRow()` + `pasteCells` 复制整行，**不经过系统剪贴板**；默认行拒绝复制。
- 接入：monkey-patch `GafferUI/SpreadsheetUI/_PlugTableView._PlugTableView.__prependRowMenuItems`，先调原方法，再用 `IECore.MenuDefinition.insertAfter( newPath, item, afterPath )` 插到「Paste Row(s)」之后。patch 必须幂等，用类属性 `_spreadsheetRowDuplicatePatched` 守卫。

## 注意事项

- `MenuDefinition.insertAfter` 签名是 `(path, item, afterPath)`，内部 `__pathIndex` 精确 `==` 比较；行菜单条目路径**没有前导斜杠**（`/Paste Row` 匹配不到 `Paste Row`）。
- `p.ancestor( Gaffer.Spreadsheet.RowPlug )` 不含自身：右键时拿到的插口是 `rows.row1.name`，直接把 RowPlug 传进去得到 None。
- 外部函数访问类的私有方法要写 mangled 名 `_PlugTableView__duplicateRowsRenumbered`；`Gaffer.WeakMethod(...)` 可用。
- 测试注意：
  - `_RowsPlugValueWidget` 持有子表的 C++ QWidget，测试必须保留 owner 引用，否则报 `Internal C++ object already deleted`。
  - `rows.addRow()` 会触发 model reset 清空选择，连续复制之间要重新选中。
  - screengrab 里裸调 `addRow()` 后表格 model 延迟重建，要先 `waitForIdle()` 再选，否则 `indexForPlug` 返回无效索引 → `StopIteration`。
  - 表要挂在 `ApplicationRoot` 下（`root["scripts"].addChild(...)`），否则 `__getClipboard` 返回 None。

## 相关

- 实体：[[Gaffer Spreadsheet]] —— 扩展的对象
- 实体：[[SpreadsheetOverviewEditor]] —— 另一个 Spreadsheet 辅助工具
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 给原生菜单插条目的 monkey-patch 写法
- 来源：[[来源 - Claude 全局记忆]]
