---
type: synthesis
aliases: [CollectScenes rootName 多实例]
tags: [gaffer, spreadsheet]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Spreadsheet 多实例与参数表

[[lgtLib 共享节点库]] 里 [[Gaffer Spreadsheet]] 的两种主要用法：一行生成一个实例，或者一行存一组参数。

## 一行一实例

```text
Spreadsheet(selector = ${collect:rootName})
  → enabledRowNames → CollectScenes.rootNames
CollectScenes(sourceRoot …) 对每个 rootName 求值一次上游
```

- 每个启用的行在 CollectScenes 里生成一个实例，行里的列值就是这个实例的参数。
- 节点 `name` 插口也可以写 `${collect:rootName}`，实例自动按行名命名（资产读入里的 ArnoldStandIn 就这么用，见 [[资产与特效 Resolver 模板]]）。
- 行名还能当数字用，例如驱动 TimeWarp 偏移：

  ```python
  4 - stof(context.get("collect:rootName","0"))
  ```

## 当参数表

- selector 写 `${scene:path}`（按位置选行）或 `${collect:rootName}`。
- 列是参数，`out.<列名>` 接给 `Transform`、`ShaderTweaks` 等节点。
- `enabledRowNames` 接 `PathFilter.paths`，表里有哪些行就处理哪些位置。
- rows 提升到 Box 上（RowsPlug），用户在 Box 的参数面板里直接编辑表格。

## 每个位置稳定的随机值

`Gaffer.Random(seedVariable='scene:path')`：以位置路径为种子，每个位置拿到固定的随机值，换帧、重开文件都不变。

## 相关

- 实体：[[Gaffer Spreadsheet]] —— 表格节点本身
- 实体：[[lgtLib 共享节点库]] —— 配方来源
- 综述：[[资产与特效 Resolver 模板]] —— StandIn Box 用 rootName 多实例
- 综述：[[Gaffer 逐位置动态查询]] —— 同样靠上下文变量逐个求值
- 来源：[[来源 - Claude 全局记忆]]
