---
type: synthesis
aliases: [Box processor scaffold]
tags: [gaffer, box, team-library]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Box 处理器脚手架

[[lgtLib 共享节点库]] 里几乎所有自制处理器都套同一个 Box 外壳：一个场景入口、一个场景出口、一个总开关，关掉时零成本直通。[[gaffer_custom_node]] 的 Box 节点也照这个结构做。

## 结构

- `Gaffer.Box` 里放 `BoxIn` 和 `BoxOut`，各自 `setup( ScenePlug )`。
- 一个 `Dot` 接在 `BoxIn.out` 后面，`BoxOut.passThrough` 接 `Dot.out`。
- Box 顶层加一个 `enabled` BoolPlug（Dynamic），接到 `BoxOut.enabled`。关掉时输出直接走 passThrough，内部节点不参与计算。
- 提升到 Box 上的插口都带 `flags=Dynamic`，否则存盘回读报错，见 [[Gaffer .grf 回读报 is not a child]]。
- filter 输入：再加一个 `BoxIn`，`setup( GafferScene.FilterPlug(...) )`，插口控件用 `FilterPlugValueWidget`。

下面是按这个结构写的示意代码：

```python
box = Gaffer.Box( "MyProcessor" )

box["BoxIn"] = Gaffer.BoxIn()
box["BoxIn"].setup( GafferScene.ScenePlug( "out" ) )

box["BoxOut"] = Gaffer.BoxOut()
box["BoxOut"].setup( GafferScene.ScenePlug( "in" ) )

# 直通路径：BoxIn.out → Dot → BoxOut.passThrough
box["Dot"] = Gaffer.Dot()
box["Dot"].setup( box["BoxIn"]["out"] )
box["Dot"]["in"].setInput( box["BoxIn"]["out"] )
box["BoxOut"]["passThrough"].setInput( box["Dot"]["out"] )

# 总开关
box["enabled"] = Gaffer.BoolPlug( defaultValue = True, flags = Gaffer.Plug.Flags.Default | Gaffer.Plug.Flags.Dynamic )
box["BoxOut"]["enabled"].setInput( box["enabled"] )
```

## 界面元数据

| 元数据 | 作用 |
|---|---|
| `'plugValueWidget:type': ''` | 参数面板里隐藏这个插口 |
| `'nodule:type': ''` | 节点图上隐藏这个接口 |
| `layout:section` / `layout:index` | 参数面板分组和排序 |
| `'noduleLayout:customGadget:addButtonTop/Bottom/Left/Right:visible': False` | 隐藏 Box 四边的加号按钮 |

按某个参数切换显示 / 置灰其它参数，见 [[Gaffer layout activator 元数据]]（`.grf` 里的 Box 只能用字符串形式的 activator）。

## 其它常用写法

- **反向选择 / 差集**：两级 `Isolate`，第二级反选第一级的结果。
- **MergeScenes** 常配 `adjustBounds=False`、`objectMode=1`、`attributesMode=1`。
- **依赖环**：从自身下游采样时，采样用的 Dot 设 `AcceptsDependencyCycles`。表达式之间的循环依赖会让进程直接 SIGSEGV，要拆成两个 Expression 切断回路，见 [[MeasureDistance 表达式循环依赖导致崩溃]]。
- **内联路径输入**：`PathFilter.paths` 用 StringVectorDataPlug，配 `'plugValueWidget:type': 'GafferSceneUI.PathFilterUI._PathsPlugValueWidget'`。
- **调度级 Box**：用 `GafferDispatch.TaskNode.TaskPlug`（in / out）声明任务接口，`ContextVariables` 注入项目变量（如资产根目录 `proj_M`）。

## 相关

- 实体：[[lgtLib 共享节点库]] —— 这套外壳的使用范围
- 实体：[[gaffer_custom_node]] —— 自制 Box 节点的所在包
- 问题：[[MeasureDistance 表达式循环依赖导致崩溃]] —— 表达式依赖环
- 问题：[[Gaffer .grf 回读报 is not a child]] —— 提升插口缺 Dynamic 标志
- 概念：[[Gaffer layout activator 元数据]] —— Box 参数按模式显示 / 隐藏
- 来源：[[来源 - Claude 全局记忆]]
