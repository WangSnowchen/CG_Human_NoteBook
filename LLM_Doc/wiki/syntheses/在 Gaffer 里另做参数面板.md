---
type: synthesis
aliases: [自制参数面板方法, custom NodeEditor]
tags: [gaffer, gafferui, qt, method]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# 在 Gaffer 里另做参数面板

从 [[gaffer_parameter_editor]] 的开发中提炼出的方法：怎么在 [[Gaffer]] 里做一个替代 / 补充原生 [[Gaffer NodeEditor]] 的参数面板，哪些必须复用原生，哪些可以自己做，以及和原生比较时要量什么（[[来源 - Claude 全局记忆]]）。方法论技能在 `~/.claude/skills/gaffer-parameter-editor/`。

## 内核必须复用原生

NodeEditor 是纯 Python + Qt，看着好改，但真正的工作量在控件层：133 个 `PlugValueWidget` 子类、582 处 `plugValueWidget:type` 注册、团队 .so 里的私有控件类。重写任何一个都意味着丢掉别人注册的控件。所以：

- 控件一律 `GafferUI.PlugValueWidget.create( plugs )`。
- 布局语义一律读原生的 `layout:*` 元数据（[[Gaffer PlugLayout]]）。
- 插口上显式注册过 `plugValueWidget:type` 的，一律用原生控件，不替换。

## 三级改造，按需选

| 级别 | 做什么 | 怎么做 |
|---|---|---|
| L1 皮肤 | 改颜色、间距、字体 | QSS 挂在自己面板的根控件上；GafferUI 给每个控件挂了 `gafferClass` / `gafferPlugValueWidget` 动态属性，可以精确选中原生控件；裸 `QWidget` 要设 `WA_StyledBackground` 才画背景 |
| L2 自己排版 | 换容器（tab、折叠块、行、状态条、来源徽标） | 容器自己写，控件仍然原生 |
| L3 自绘控件 | 只换 `Slider` / `ColorSwatch` / `SplineWidget` | 这三个是 Gaffer 用 QPainter 自己画的，QSS 管不到。只在自己排版时挑用，**不走 `registerType`**（会污染原生面板） |

## 白捡的能力

继承 `GafferUI.NodeSetEditor`：

- 自动有原生 pin 控件和 `P` / `N` / `` ` `` 快捷键，默认 node set 就是 `script.selection()`。
- 多选批量编辑几乎免费：`PlugValueWidget.create()` 天生吃一组插口。但 `PlugWidget` 不支持多插口（内部 `getPlug()` 会抛），批量行要自己拼 `LabelPlugValueWidget( plugs )` + 控件。

## 和原生行为保持一致的清单

- **activator 实时重算**，`summary` / `collapsed` 相对布局所属的 parent 查（Arnold 灯的折叠状态注册在 `parameters` 上）。
- **每个布局 parent 各连自己的 `childAdded` / `childRemoved`**，否则 ArrayPlug 加出来的新槽（Layers 的「+」）不出现。
- **Out 插口照常显示**，只跳过 `plugValueWidget:type == ""` 的。
- **折叠 / 当前 tab 写同 key 的非持久实例元数据**，和原生面板共享状态。
- **发 `NodeEditor.toolMenuSignal()`**：这是官方扩展缝，不发的话官方四条和团队注册的齿轮菜单条目会全部静默丢失。第一个参数传自己即可。
- **`nodeUI()` 不能返回 None**：官方代码会 `editor.nodeUI().plugValueWidget( plug ).reveal()`。自己排版时返回一个只实现 `plugValueWidget()` / `node()` 的代理，查不到的插口往祖先插口的行回退（`transform.translate.x` → `transform` 行）。
- **浮动窗口高度**：`NodeSetEditor.acquire` 里撑高窗口的判据是 `isinstance( editor, NodeEditor )`，对自制面板不成立，要自己补到 400；自制面板正文在 idle 才排好，会被 sizeHint 缩回 310px，idle 后再补一次。

## 对比原生时量 Qt 几何

截图看不出问题，要写 commandFile 打印每行 y / height / pitch、同名 tab 内容总高、数值列左边缘 x，原生和自制同条件各跑一遍。第一版这样一量就发现原生行高清一色 20px，自制的有 92 / 116 / 207 / 480px，原因和修法见 [[Gaffer 自制参数面板里大控件被拉高或压扁]]。

## 塞原生大控件进自排行

- Spreadsheet 表格：三张表靠 `_LinkedScrollBar` 绑定，会吞掉第二次 range 变化，见 [[Gaffer Spreadsheet 表格滚到底差一行]]。
- 整行 hover 高亮：Qt `:hover` 在子控件上也为真，含 `QAbstractItemView` / `QPlainTextEdit` / `QTextEdit` 的行要关掉 hover 规则。
- 换节点闪烁：换完内容在同一次调用里自底向上 `layout.activate()`，见 [[Gaffer NodeEditor 换节点时面板闪一下]]。

## 搜索要比原生深

只比 label 不够：StandardOptions 的 `options` 这类「一行装一堆」的复合插口，`Motion Blur` 是子插口的分区名、`shutter` 是子插口的标签。要递归比标签 / 名字 / 分区名，再把空格和 `_ : . -` 压掉比一次，命中后把过滤压进那一行内部的原生 PlugLayout。

## 版本敏感点

- Gaffer 1.6.5.1 的 PlugLayout 没有 `setFilter` / `removeFilter` / `StandardFilterWidget`，要按上游实现 backport；1.7 原生就有。详见 [[Gaffer 1.6 与 1.7 API 差异]]。
- `Animation.isAnimated()` 的 C++ 签名只接 `ValuePlug`，普通 `Plug` 传进去报 Boost ArgumentError。
- `StringAlgo.matchMultiple()` 把空格当模式分隔符，`z min` 匹配不上 `Z Min`。
- `_StyleSheet.styleColor()` 对不存在的 key 静默返回黑色。
- `nodeGadget:color` 只在 GUI 启动脚本里注册，`bin/gaffer env python` 无头下全是 None。

## 测试方法

- **拿「还原改动的整包副本」当对照**：新测试在副本上应该挂，证明测试抓得住；判断噪声是不是自己引入的，也用副本跑同一份测试比较。测试文件拷到 `/tmp` 单独跑没有意义（测试按 `__file__` 拼 `sys.path`，会直接 `ModuleNotFoundError`）。
- 界面语言规则用**整棵控件树扫 CJK 字符**兜底（单选 / 多选堆叠 / 批量几种状态都扫），逐个控件断言总会漏掉偶尔才建出来的控件。
- 无头陷阱：`GafferScene.InteractiveRender()` 无头构造直接 SIGABRT，只能 screengrab 验（见 [[Gaffer 无头环境创建某些节点直接崩溃]]）；控件不挂进**可见窗口**就永远不刷新（`deferUntilVisible`，见 [[GafferUI LazyMethod]]）；某节测试把主窗口隐藏后，后面的节要重新 `window.setVisible( True )`。
- 自定义 Widget 子类不要起名 `_applyVisibility`：会覆盖 `GafferUI.Widget._applyVisibility`，`setVisible` 内部调它，构造就 TypeError。
- 列表推导里临时建的 `GafferUI.PlugLayout(...)` 迭代到一半会被 GC，报 `Internal C++ object already deleted`，先赋给变量。
- 按 `findChildren` 收原生控件要按 `id` 去重：Collapsible 里的子 QWidget 经 `_owner()` 一路往上都返回同一个 Collapsible。
- 脚本化改文件时，定位标记先 `assert s.count( marker ) == 1` 再动手。用注释文本 `index()` 命中靠前的同名注释，会删掉一大段不该删的代码，且没有任何备份可恢复。
- 真机 e2e：rez-env 会重置 `PYTHONPATH`，要在 `rez-env ... -- bash -c '...'` 里面 export；少了 `GAFFER_STARTUP_PATHS` 时接管不会装上。
- 截图与 screengrab 的通用方法见 [[Gaffer 无头测试与截图验证方法]]。

## 相关

- 实体：[[gaffer_parameter_editor]] —— 本方法的实现
- 实体：[[Gaffer NodeEditor]] —— 被复用内核的原生面板
- 实体：[[Gaffer]] —— 所属软件
- 概念：[[Gaffer PlugLayout]] —— 要读懂的布局元数据
- 概念：[[GafferUI LazyMethod]] —— 不可见控件不刷新
- 问题：[[Gaffer 自制参数面板里大控件被拉高或压扁]] —— 行高规则
- 问题：[[Gaffer Spreadsheet 表格滚到底差一行]] —— 原生表格塞进自排行
- 问题：[[Gaffer NodeEditor 换节点时面板闪一下]] —— 换内容后的布局时机
- 问题：[[Gaffer 无头环境创建某些节点直接崩溃]] —— 无头测试限制
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 和原生并存、接管 `acquire`
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 版本敏感 API
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 测试与截图的通用方法
- 来源：[[来源 - Claude 全局记忆]]
