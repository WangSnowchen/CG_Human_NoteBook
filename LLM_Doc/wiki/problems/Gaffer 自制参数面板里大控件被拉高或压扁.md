---
type: problem
aliases: [参数面板行高异常, log 框只剩一行高]
tags: [gaffer, gafferui, qt, layout]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 自制参数面板里大控件被拉高或压扁

## 现象

自己排版的参数面板（[[gaffer_parameter_editor]]）里，行高和原生对不上，几种表现（[[来源 - Claude 全局记忆]]）：

1. 普通参数行被撑成 92 / 116 / 207 / 480px，原生清一色 20px。
2. InteractiveRender 的 `messages` 日志框只剩 18px 高（原生能长到约 600px）。
3. ArnoldMeshLight 的 `normalize` 小开关被撑成一大块。
4. 选中带表格的节点（或从一个表格节点跳到另一个），第一帧普通参数行被撑到约 195px，下一帧缩回 42px，底下整块往上跳约 150px。

## 原因

原生 [[Gaffer PlugLayout]] 的规则：`hasLabel()` 为假的控件包进 `PlugWidget` 并用 `SetMinAndMaxSize` 固定成 20px；自带标签的大控件不包，可以长高；页尾垫一个弹簧吃掉剩余高度。**Gaffer 控件竖向 size policy 全是 `Preferred`**（日志框、表格、数值框一样），原生靠「固定住的行长不了、没固定的那个能长」来分配高度。逐项对应：

1. 装饰件用了 `QSizePolicy.Expanding`，把整行策略拉成 Expanding；或者给本来 `hasLabel()` 为真的控件又加了一个标签。
2. 日志框所在行也被固定了尺寸，同时页尾弹簧带 stretch 把剩余高度整块拿走。
3. 「能长的行」判据写成「我们没给它加标签」太宽：`NameValuePlug`、`FilterPlugValueWidget` 自带标签却只有一行高，被当成能长 → 页尾弹簧被关掉 → 剩余高度落到同页任何一个竖向不封顶的控件上。自绘 bool 开关里那根占位 `GafferUI.Spacer( imath.V2i( 1 ) )` 不传 `maximumSize` 时最大高度是无穷，把整行布局的最大高度也顶成无穷，行虽然设了 `SetMinAndMaxSize`，`layout->maximumSize()` 本身无穷，等于没限制。
4. 行的上下限要等行里的原生大控件铺完才算得出来，比第一次布局晚一两拍；这期间页里一个 stretch 因子都没有时，`QBoxLayout` 按 size policy 把剩余高度平摊给所有还没定尺寸的行。

## 解决

- 装饰件 size policy 用 `Ignored`，行布局 `setSizeConstraint( SetMinAndMaxSize )`；`hasLabel()` 为真的控件不再加标签；有自带标签的复合控件把标签宽度固定在 `PlugWidget.labelWidth()=150`，否则和控件内部写死的宽度错开。
- 「能长的行」判据：**没有我们加的标签，并且里面含 `QAbstractItemView` / `QPlainTextEdit` / `QTextEdit`**（`MessageWidget` 的 `_TableView` 也算）：

  ```python
  growable = self.__labelWidget is None and _containsLargeView( widget )
  ```

  能长的行不固定尺寸。
- 占位弹簧一律限高：`GafferUI.Spacer( imath.V2i( 1 ), maximumSize = imath.V2i( 999999, 1 ) )`。
- 分区 `TabSection` / `Section.takeStretch()` 把 stretch 因子**明确交给能长的那一行**（含子分区递归），同时返回「这页有没有能长的行」，有就关掉页尾弹簧的 stretch。

结果：日志框 547px（Gaffer 1.7.1.0，原生约 600px，差的是头部、面包屑、工具条），同页普通行保持 20px；默认一行的 Spreadsheet 表格约 57px、30 行的约 541px（原生分别是 27px / 536px），都随内容变高、不拉满整页。

## 验证方法

- **量 Qt 几何，别看截图**：commandFile 打印每行 y / height / pitch、同名 tab 内容总高、数值列左边缘 x，原生和自制同条件各跑一遍。逐层打印 `maximumSize()` 一眼就能看出问题：正常行 `max=(524287, 20)`，出问题的行 `max=(524287, 524287)`。
- 闪烁类（第 4 种）要用毫秒抓帧验证，见 [[Gaffer NodeEditor 换节点时面板闪一下]]。
- 拿「还原了这处改动的整包副本」跑同一份新测试当对照，确认测试在旧代码上会挂。

## 相关

- 实体：[[gaffer_parameter_editor]] —— 出现问题的自制面板
- 概念：[[Gaffer PlugLayout]] —— 原生的行高规则
- 问题：[[Gaffer NodeEditor 换节点时面板闪一下]] —— 中间帧闪烁的另一半原因
- 综述：[[在 Gaffer 里另做参数面板]] —— 和原生对比时要量的几何
- 综述：[[Qt 自绘界面常见坑]] —— Qt 布局类问题汇总
- 来源：[[来源 - Claude 全局记忆]]
