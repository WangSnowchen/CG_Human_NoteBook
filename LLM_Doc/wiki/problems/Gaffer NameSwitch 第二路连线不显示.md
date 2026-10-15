---
type: problem
aliases: [NameSwitch 第二个圆点连不上, NameSwitch second input not drawn]
tags: [gaffer, qt, network-editor, nameswitch]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer NameSwitch 第二路连线不显示

## 现象

在自做的节点图编辑器（[[gaffer_network_editor]]）里给 NameSwitch 接第二路输入，线接上了（原生 [[Gaffer GraphEditor]] 里看得到、`getInput()` 也不为空），自做编辑器里却只画出第一根，看起来像「第二个圆点连不上」。

## 原因

自做编辑器用 `plug.getName()` 当连线 key 的一部分。NameSwitch 的每一路是一个 `NameValuePlug`，接口圆点挂在 `in.in0.value`、`in.in1.value` 上，两者 `getName()` 都是 `"value"`。两条边算出同一个 key，第二条被当成重复扔掉；增量更新做 diff 时同样漏掉（[[来源 - Claude 全局记忆]]）。

同一个错误还出现在接口指纹（`_noduleSignature()`）和辅助连线的去重 key 上。

## 解决

插口身份一律用**节点内相对名**：`plugKey(node, plug)`（即 `plug.relativeName(node)`，如 `in.in1.value`），连线 key、接口指纹、辅助连线去重三处一起改。

### 同类现象的另外两个原因

「NameSwitch 第二路接不上」还可能是交互代码的问题，排查时一并检查：

- **按在已连接的输入圆点上应该是改接 / 断开手势**：先找以这个插口为终点的那条边，走「拖起已有连线的一端」；如果直接当成新建连线，拖到空白时「断开」静默不生效，之后再往 `+` 上接就表现为接不上。
- **`+` 的语义照原生**：ArrayPlug 上的 `+` 一律 `resize(s+1)` 后接新的那一路（`NameSwitchPlugAdder::createConnection`），不复用空槽、不判断 default 那路空不空。还没 setup 过的 NameSwitch 第一次接 `+` 走 setup 路径，和这条规则无关。要接到已有的空槽，直接拖到那个圆点上（圆点周围有 28px 的吸附范围）。

## 验证方法

- 断言**自己画出来的边**（编辑器内部的边表、`collectEdges` 条数），不要只断言 `getInput() is not None`——数据层一直是对的，只有显示层错。
- 「原生有、自己没有」的问题先和原生**对拍数量**：同一张图里比较两边的连线数、每个接口在哪条边排第几。
- 回归文件：包里的 `tests/shader_nameswitch_test.gfr`、`tests/shader_nameswitch_test2.gfr`。

## 相关

- 实体：[[gaffer_network_editor]] —— 出问题的编辑器
- 实体：[[Gaffer GraphEditor]] —— 对拍用的原生编辑器
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 插口身份和增量更新的设计
- 来源：[[来源 - Claude 全局记忆]]
