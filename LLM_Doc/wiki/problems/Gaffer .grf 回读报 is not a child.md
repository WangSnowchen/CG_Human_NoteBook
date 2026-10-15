---
type: problem
aliases: [Dynamic 标志缺失, 序列化回读失败]
tags: [gaffer, serialisation, box, plugs]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer .grf 回读报 is not a child

## 现象

用脚本搭好一个 Box（或在测试夹具里给节点加了插口），导出 .grf / 保存 .gfr 后再加载，报错：

```text
X is not a child of Y
```

加载出来的节点缺插口、连线断开。

## 原因

用代码 `addChild` 加的插口如果没有 `Gaffer.Plug.Flags.Dynamic` 标志，序列化时只写 `setValue` / `setInput`，不写「创建这个插口」的语句；回读时插口不存在，后面的语句找不到它。

## 解决

所有脚本添加、需要随文件保存的插口都带 `Dynamic`：

```python
DYN = Gaffer.Plug.Flags.Default | Gaffer.Plug.Flags.Dynamic

# Box 上的自定义输出插口
box.addChild( Gaffer.FloatPlug( "distance", Gaffer.Plug.Direction.Out, flags = DYN ) )
# 辅助节点上的 ObjectPlug / StringVectorDataPlug 输出同样要带
# CompoundDataPlug 里的 NameValuePlug 第三、四个参数是名字和 flags
plug.addChild( Gaffer.NameValuePlug( "key", value, "name", DYN ) )
```

导出给 Reference / 节点菜单用的 .grf 用 `box.exportForReference( 路径 )`。

## 验证方法

保存后新开一个 ScriptNode 加载，检查所有插口和连线都在；测试里固定做一次「保存 → 加载 → 比对插口列表」。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[MeasureDistance]] —— Box 自定义输出插口踩过
- 实体：[[gaffer_custom_node]] —— 测试夹具里的 NameValuePlug 踩过
- 综述：[[Gaffer Box 处理器脚手架]] —— 提升插口带 Dynamic 的惯例
- 来源：[[来源 - Claude 全局记忆]]
