---
type: problem
aliases: [Enumeration_Knob setValue silently ignored]
tags: [nuke, python]
applies_to: ["Nuke 16.1v2"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Nuke 枚举 knob 写错值不报错

## 现象

对下拉菜单类的 knob（`Enumeration_Knob`）调用 `setValue("某个字符串")`，没有异常、返回正常，像是设成功了，但 knob 的值没变。

## 原因

`Enumeration_Knob.setValue()` 遇到不在选项列表里的值时静默保持原值，不抛异常（[[来源 - Claude 全局记忆]]）。拼写差一个字母、大小写不对、用了界面标签而选项是另一个写法，都会落到这条路上。

## 解决

写之前先拿选项列表校验，不在列表里就自己抛错：

```python
knob = node["channels"]
options = knob.values()
if value not in options:
    raise ValueError("%r 不在 %s 的选项里：%s" % (value, knob.name(), options))
knob.setValue(value)
```

[[nuke_mcp]] 的设参工具就按这个顺序做。

## 验证方法

设完后回读 `knob.value()`，和传入值比一次。

## 相关

- 实体：[[Nuke]] —— API 行为
- 实体：[[nuke_mcp]] —— 设参工具先校验选项
- 来源：[[来源 - Claude 全局记忆]]
