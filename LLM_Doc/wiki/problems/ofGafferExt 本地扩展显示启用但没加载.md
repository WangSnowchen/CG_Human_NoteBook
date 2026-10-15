---
type: problem
aliases: [本地扩展键拼错, user_config.json 键不匹配]
tags: [gaffer, extension, pipeline]
applies_to: ["Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# ofGafferExt 本地扩展显示启用但没加载

## 现象

`~/gaffer/customExtensions/user_config.json` 里本地扩展写着启用，但扩展的模块根本没有导入。`loadLocalExtensions()` 返回空列表，`_localErrors` 也是空的，没有任何警告。

## 原因

[[ofGafferExt]] 的扩展键只能由目录名推导：`key = "local:" + dirName.strip().lower()`。配置里的键是手打的、和推导结果差了字符（例如目录 `faceSelection` 推导出 `local:faceselection`，配置里写成 `local:facesselection`），`readConfig().get( key, False )` 取不到，按默认值 False 处理。

加载器三条跳过路径里，`if not enabled( key ) : continue` 是唯一不打印警告的一条，所以「返回空、没有错误」就等于命中了这条。

## 解决

- 用框架自己的 `ofGafferExt.writeConfig( states )` 写配置，或在 `Tools > Custom Extensions...` 面板里开关，不手改 JSON。
- 已经手改过的，把键改成 `"local:" + 目录名小写`。

## 验证方法

诊断时对 `enabled` / `readConfig` / `envOverride` 插桩，打印每个扩展实际查询的键和返回值；不要 grep 过滤诊断日志（过滤掉的往往正是缺的那条）。诊断脚本每段探测各自 try/except，报告逐步写入，避免中途出错后读到上一轮的旧报告。

## 相关

- 实体：[[ofGafferExt]] —— 扩展开关框架
- 问题：[[改了 rez 包但运行的还是本地扩展副本]] —— 另一类「改了没生效」
- 来源：[[来源 - Claude 全局记忆]]
