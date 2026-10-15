---
type: problem
aliases: [Group in 幽灵插口, ArrayPlug 自动扩展]
tags: [gaffer, scene, plugs]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer Group 手动加输入插口产生多余插口

## 现象

脚本里给 `GafferScene.Group` 接多路输入，先 `group["in"].addChild( GafferScene.ScenePlug(...) )` 再连线，结果 `in` 下出现 `in0`、`ScenePlug`、`ScenePlug1` 这样名字混乱的插口，按下标连线连错位置。

## 原因

`Group.in` 是动态的 `ArrayPlug`：给最后一个子插口接上输入时，它自动在末尾补一个空槽；断开尾部输入时自动回收多余的空槽。手动 `addChild` 绕过了这套机制，造出不符合命名规则的多余插口。

## 解决

只按下标连线，让 ArrayPlug 自己长：

```python
group = GafferScene.Group()
group["in"][0].setInput( sphere["out"] )   # 自动出现 in1
group["in"][1].setInput( plane["out"] )    # 自动出现 in2
```

`group["in"][i].setInput( None )` 断开尾部会回收空槽。取个数用 `len( group["in"] )`（1.6 的 ArrayPlug 没有 `.size()`）。

## 验证方法

连完后 `[ p.getName() for p in group["in"] ]` 只有 `in0`、`in1`… 连续命名，末尾恰好一个空槽。

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[gaffer_mcp]] —— 建图工具按下标连 Group 输入
- 问题：[[Gaffer Group 同名输入合并后为空]] —— 搭 Group 测试场景的另一个坑
- 来源：[[来源 - Claude 全局记忆]]
