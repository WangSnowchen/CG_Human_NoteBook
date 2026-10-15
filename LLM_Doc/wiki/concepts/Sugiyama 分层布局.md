---
type: concept
aliases: [Sugiyama, layered graph drawing, 分层图布局, Sugiyama framework]
tags: [graph-layout, algorithm, network-editor]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Sugiyama 分层布局

## 定义

画有向图的经典四步框架，节点图编辑器的「自动排列」基本都是它的变体：

1. **分层（rank）**：给每个节点定一层，让连线尽量从上一层指向下一层。
2. **打桩（dummy nodes）**：跨多层的长边在中间每层插一个虚拟节点，变成只连相邻层的短边。
3. **定序（order）**：决定每层内节点的左右顺序，目标是相邻层之间连线交叉最少。
4. **定位（position）**：给每个节点算实际坐标，让连线尽量直、节点不重叠。

每一步都有多种实现：

| 步骤 | 常见实现 |
| --- | --- |
| 分层 | 最长路径（快）；网络单纯形（Graphviz `dot`，连线总长最短）；ALAP（尽量贴着消费者放，Houdini 的做法） |
| 定序 | 重心法（邻居位置的平均）；中位数法（`dot` 的 `medianvalue`）；之后再做相邻交换 |
| 定位 | 中位数对齐；Brandes-Köpf（四个方向各做一遍对齐再合并，长边更直） |

## 在各软件里的对应

- [[gaffer_network_editor]] 的 `layoutNodes()` 是 Sugiyama：默认最长路径分层（迭代 DFS 防爆栈）+ 长边打桩 + 重心法定序加相邻交换（保留交叉最少的那遍）+ Brandes-Köpf 定位，再把最长的流水线（主干）拉直。每一步可用 `LAYOUT_STRATEGY` 换实现。
- Gaffer 原生 `StandardGraphLayout` 是另一套做法，交叉明显更多。
- Houdini 的自动排列是 ALAP 分层 + 按插口顺序 DFS 定序 + 树式定位，不做交叉优化。

各组合的实测对比见 [[节点图自动排列算法对比]]。

## 注意事项

- **打桩不能省**：不打桩时实测交叉比原生还多（130 : 98），打桩后降到 65。
- 两层之间数交叉用两重循环是 O(边²)，相邻交换每换一次都要重数，300 节点稠密图光这一项 4.9 秒；改成树状数组数逆序对后 1.2 秒。
- 节点图有「流向」：Gaffer 的场景节点从上往下流、材质节点从左往右流，侧面挂进来的输入（PathFilter 的 `filter`、材质的 `shader`）不算主流边。分层前要按流向把图拆成组，各组分别排，再把组按连接关系贴在一起。

## 相关

- 实体：[[gaffer_network_editor]] —— 自动排列基于这个框架
- 综述：[[节点图自动排列算法对比]] —— 各步骤不同实现的实测数据
- 来源：[[来源 - Claude 全局记忆]]
