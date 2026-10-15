---
type: problem
aliases: [rqlog path, OpenCue frame log]
tags: [opencue, render-farm, log]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# OpenCue 帧日志路径找不到

## 现象

按 pycue 的 `opencue.util.logPath` 拼出来的 `{log_dir}/{job}.{frame}.rqlog` 去读帧日志，文件不存在。

## 原因

渲染节点上 `CUE_LAYER` 环境变量会把层名追加到日志目录，实际文件在**按层分的子目录**里（[[来源 - Claude 全局记忆]]）：

```text
{log_dir}/{layer}/{frame name}.rqlog
```

本环境 `log_dir` 在共享盘 `/mnt/ofLog/opencue/of3d/<show>/logs/<job uuid>/`。

## 解决

拼路径时插入层名（示意，方法名以本机 pycue 为准）：

```python
import os
path = os.path.join(job.logDir(), frame.layer(), frame.name() + ".rqlog")
```

读不到时列出 `log_dir` 下的子目录确认层名。共享盘只读，只用 `open(path, "rb")` 读，要处理的样本先拷到临时目录。

## 验证方法

对一个已完成的 job 任选一帧，按上面的路径能打开文件，且子目录名就是这一帧所在的层名。

## 相关

- 实体：[[OpenCue]] —— 日志目录结构
- 实体：[[cueMonitor]] —— 点帧行加载对应的 rqlog
- 来源：[[来源 - Claude 全局记忆]]
