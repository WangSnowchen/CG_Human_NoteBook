---
type: entity
aliases: [spreadsheetOverviewEditor, Spreadsheet 总览编辑器]
tags: [gaffer, gafferui, spreadsheet]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# SpreadsheetOverviewEditor

用户自制的 [[Gaffer]] 编辑器，左边列出脚本里所有 [[Gaffer Spreadsheet]] 表（含提升到 Box 上的），右边编辑选中的表。左列表是按 Box 层级展开的树，并能按当前 focus 节点过滤（[[来源 - Claude 全局记忆]]）。

## 要点

- 文件：`~/gaffer/python/spreadsheetOverviewEditor.py`。
- **树化**：`Gaffer.DictPath` 嵌套 dict + `PathListingWidget`（`DisplayMode.Tree`）。值是 dict 的是分支，否则是叶子。`segmentsForRows( scope, rows )` 按 `node.relativeName( scope ).split( "." )` 每层一段，提升插口路径（`user.rows`）作叶子。内部 key 用 `/` 连接，选中路径 `p.strip( "/" )` 查表。
- **展开状态保持**：`setPath` 重建树会清掉展开状态，重建后 `setExpansion( getExpansion() )` 恢复，再 `expandTo( PathMatcher( [ "/" + currentLabel ] ) )` 展开当前表的祖先。
- **focus 过滤按「连通分量」**：focus 通常是最下游节点，装表的 Box 在上游、通过插口连线相连，按子树找不到。`connectedNodeNames( scriptNode, seed )` 以 focus 为种子 BFS `Gaffer.Plug.RecursiveRange( node )`，每个插口取 `getInput()`（上游）和 `outputs()`（下游）所属节点，按 `relativeName` 去重。`tableOnBranch` 沿节点父链上溯，任一祖先在结果里就算命中。label 一律以 script 为根。
- **提升方向**：提升出去的插口是源（`getInput() == None`），可编辑；内部 rows 被它驱动，只读。

## 注意事项

- `node.relativeName( node )` 会抛「not an ancestor of itself」，先用 `node.isSame( scope )` 判断。
- ScriptNode 也是 `Gaffer.Node` 子类，沿父链上溯会走到 ScriptNode 再调 `relativeName` 抛异常，循环条件要加 `and not node.isSame( scriptNode )`。
- 插口连线可能连到**脚本外的节点**（如 `RenderPassPlugValueWidgetSettings` 这类控件私有的 settings 节点），BFS 候选必须用 `scriptNode.isAncestorOf( candidate )`（严格祖先，自身返回 False）过滤；focus 恰好是 script 本身也要防一下。
- `RowsPlug.addRow()` 打在已连接（提升后的内部）rows 上会**清空 input**，内部表从只读变成可编辑。测试里别拿 `addRow` 当刷新触发器，用一次无害的元数据改动代替。
- 包装对象每次访问都是新的，比较节点用 `isSame()`（见 [[Boost.Python 包装对象身份]]）。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer Spreadsheet]] —— 编辑的对象
- 实体：[[spreadsheetRowDuplicate]] —— 另一个 Spreadsheet 辅助工具
- 概念：[[Boost.Python 包装对象身份]] —— 节点比较必须用 `isSame()`
- 问题：[[Gaffer 自制 Editor 同步重建界面导致卡死]] —— 这类自制编辑器从图信号重建界面时要延迟到 idle
- 来源：[[来源 - Claude 全局记忆]]
