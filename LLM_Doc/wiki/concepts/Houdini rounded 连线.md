---
type: concept
aliases: [Houdini rounded wire, 圆角连线, rounded wire style]
tags: [houdini, gaffer, ui, network-editor]
applies_to: ["Houdini 21.0.596"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Houdini rounded 连线

## 定义

[[Houdini]] 网络编辑器的连线只有两种样式（`nodegraphhotkeys.py` 的 `change_wire_style`）：默认直线和 `'rounded'`。rounded 由**直线段和正圆弧**组成，没有贝塞尔曲线（[[来源 - Claude 全局记忆]]）：

1. 从出口沿流向直走一小段 `min(0.30 网格单位, 流向距离 / 2)`；
2. 用同样半径的小圆角拐向侧面；
3. 横着走一段；
4. 一个大圆弧拐回流向，主圆角半径 `min(侧向余量, 流向余量, 0.42 * 流向余量 + 常数)`；
5. 直着扎进入口。

两端几乎平齐时画成近乎直的横线，不绕回环；入口真在出口上游一侧时才走 5 个拐角的回环。

## 在各软件里的对应

[[gaffer_network_editor]] 照这个画法实现：

- `_wirePath` 在「流向 / 侧向」局部坐标里排折线，`_roundedPath()` 把每个拐角换成正圆弧；圆弧用三次贝塞尔近似，控制点系数 `4/3 * tan(φ/4)`（90° 时为 0.5523）。
- 常量 `WIRE_STUB` / `WIRE_TURN_SLOPE` / `WIRE_TURN_BASE`；Houdini 1 个网格单位按节点高度换算约 101 像素、约 8.4 Gaffer 单位。
- 场景流从上往下、材质流从左往右，同一套路径在两个方向上都成立。
- 验收数据 `tests/houdini_rounded_wire.json`（5 个用例 × 45 个采样点）：路径离 Houdini 那条线平均 1.7px、最大 7.1px，常数项按这个指标调出来。

## 注意事项

从真 Houdini 量连线形状的方法：

1. 起 Houdini 21.0.596，经 [[houdini_mcp]] 的桥接端口（MCP 工具没挂上时直接 TCP 连）建探针节点图。
2. `hou.NetworkEditor.visibleBounds()` / `screenBounds()` 给出图坐标和像素的精确对应。
3. `import -window root` 抓屏，按颜色和连通分量抠出连线像素，换算回图坐标拟合。拐角拟合圆的残差约 0.005 单位（约 1px），才能判定是正圆弧。

量的时候遇到的坑：

- `setVisibleBounds()` 对「大小不变、只挪位置」的请求会静默忽略，视口也不是立刻到位。每个用例要先缩到全图、再框到目标、读回 `visibleBounds()` 确认到位后再抓图，否则抓到上一个用例的画面。
- 不参与显示的支线 Houdini 画成虚线，逐像素追线要放宽连通半径。
- Xvnc + llvmpipe 软件渲染下 Houdini 启动就段错误，只能在真显示器上跑。
- `pkill -f "Xvnc-core :77"` 会匹配到发出这条命令的 shell 自己。

## 相关

- 实体：[[Houdini]] —— 这种连线样式的出处
- 实体：[[gaffer_network_editor]] —— 照它实现连线
- 实体：[[houdini_mcp]] —— 量连线时驱动 Houdini 建探针图
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 编辑器整体外观设计
- 来源：[[来源 - Claude 全局记忆]]
