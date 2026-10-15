---
type: problem
aliases: [pycue states filter ignored, JobSearchCriteria max_results]
tags: [opencue, render-farm, python]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# OpenCue 查询参数被静默忽略

## 现象

用 pycue 查询 [[OpenCue]]，按文档写的参数不生效：

- `getFrames(states=[...])` 按状态过滤，返回的仍是全部帧；
- `getJobs(include_finished=True, limit=N)` 直接抛 `AttributeError`；
- 用 `offset` 翻页没有效果；
- `findJob(name)` 找不到已经完成的 job；
- 默认的 job 列表里没有 FINISHED 状态的 job。

## 原因

本环境的 pycue 和 cuebot 编译出来的 proto 版本错位：客户端认识的字段服务端没有，或者名字不一样。proto 消息对不认识的字段不报错，所以多数情况是静默忽略（[[来源 - Claude 全局记忆]]）。

## 解决

| 需求 | 写法 |
|---|---|
| 按帧状态过滤 | 单数 `state` |
| 限制返回数量 | 不传 `limit`，拿到结果后客户端自己裁剪（`JobSearchCriteria` 没有 `max_results`） |
| 帧分页 | `page` + `limit`（proto 里没有 `first_result`，所以没有 `offset`） |
| 列出已完成的 job | `getJobs(include_finished=True)` |
| 打开某个 job | 用 uuid `getJob(id)`；`findJob(name)` 只匹配 active 的 job |

状态值用整数比较时对照 [[OpenCue]] 页的枚举表（FrameState DEAD=5，JobState 没有 RUNNING）。

## 验证方法

对一个已知有 DEAD 帧的 job，用 `state` 过滤后返回的帧数应少于不过滤时；翻页时第 2 页和第 1 页的帧号不重复。

## 相关

- 实体：[[OpenCue]] —— proto 版本错位的完整对照
- 实体：[[cueMonitor]] —— 按这些写法实现查询
- 来源：[[来源 - Claude 全局记忆]]
