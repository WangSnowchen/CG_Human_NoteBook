---
type: entity
aliases: [cuebot, pycue, CueGUI, 渲染农场]
tags: [render-farm, pipeline, opencue]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# OpenCue

开源渲染农场调度系统。服务端是 cuebot（gRPC），Python 客户端库是 pycue（`opencue` 模块），官方桌面客户端是 CueGUI。团队的渲染任务都提交到 OpenCue；本机在 [[Gaffer]] 里做了一个只读监控面板 [[cueMonitor]]（[[来源 - Claude 全局记忆]]）。

## 要点

- **层级**：job（一次提交）→ layer（一个渲染层，如 Arnold 渲染、合成）→ frame（单帧任务）。
- **cuebot 地址**：pycue 从 `opencue.cuebot.Cuebot.Hosts` 取，认环境变量 `CUEBOT_HOSTS`，比读 `default.yaml` 准。`opencue.config` 是模块，不能当函数调用。
- **Python 环境**：Gaffer 里用 pycue 要靠 rez 给 PYTHONPATH，例如
  ```bash
  rez-env pj2023dy001 python==3.11 gaffer==1.6.5.1 gaffer_usd_stage -- bash -c './bin/gaffer env python /tmp/xxx.py'
  ```
  （在 Gaffer 安装目录下执行；rez 提供 opencue，`bin/gaffer env python` 提供 Gaffer，分开都不行。）
- **帧日志在共享盘**：`/mnt/ofLog/opencue/of3d/<show>/logs/<job uuid>/<layer>/<frame>.rqlog`，按层分子目录，见 [[OpenCue 帧日志路径找不到]]。共享盘只读，样本日志拷到临时目录再处理。

## pycue 与服务端 proto 版本错位（本环境必踩）

| 需求 | 正确写法 | 错误写法的后果 |
|---|---|---|
| 限制返回数量 | 客户端自己裁剪 | `getJobs(include_finished=True, limit=N)` 抛 AttributeError（`JobSearchCriteria` 没有 `max_results`） |
| 列出已完成的 job | `getJobs(include_finished=True)` | 默认只有 active 的 |
| 按 job 打开详情 | 用 uuid 走 `getJob(id)` | `findJob(name)` 只匹配 active 的 job |
| 帧分页 | `page` / `limit` | 没有 `offset`（proto 里没有 first_result） |
| 按帧状态过滤 | 单数 `state` | 复数 `states` 被静默忽略 |

详见 [[OpenCue 查询参数被静默忽略]]。

## 枚举数值

| FrameState | 值 | JobState | 值 |
|---|---|---|---|
| WAITING | 0 | PENDING | 0 |
| SETUP | 1 | FINISHED | 1 |
| RUNNING | 2 | STARTUP | 2 |
| SUCCEEDED | 3 | SHUTDOWN | 3 |
| DEPEND | 4 | POSTED | 4 |
| DEAD | 5 | | |
| EATEN | 6 | | |
| CHECKPOINT | 7 | | |

JobState 里没有 RUNNING。取名字用 `opencue.wrappers.frame.Frame.FrameState[v].name`。

## 读帧信息的几个事实

- `frame.resource()` 是 `last_resource`，形如 `host/version/proc/cores`，第一段是主机名。
- 帧的 `killMessage` 形如 `job {…} req {…}`，是序列化的 `JobKillFramesRequest` / `JobRetryFramesRequest`，表示有人在 CueGUI 或脚本里杀掉或重试了这一帧，和内存超限无关。
- 查询时终端出现两条 `pkg_resources` DeprecationWarning，来自共享库环境里 protobuf 的 `google` 包。Gaffer GUI 自己开了 `default::DeprecationWarning`，所以只在 GUI / screengrab 里出现、`gaffer env python` 里复现不了；在模块级只过滤 `module=r"google(\.|$)"` 即可。

## 常见问题

- [[OpenCue 查询参数被静默忽略]]
- [[OpenCue 帧日志路径找不到]]

## 相关

- 实体：[[cueMonitor]] —— Gaffer 里的 OpenCue 监控面板
- 实体：[[rez]] —— 提供 pycue 的 Python 环境
- 实体：[[Gaffer]] —— 提交渲染的 DCC
- 问题：[[OpenCue 查询参数被静默忽略]] —— proto 版本错位
- 问题：[[OpenCue 帧日志路径找不到]] —— rqlog 按层分子目录
- 来源：[[来源 - Claude 全局记忆]]
