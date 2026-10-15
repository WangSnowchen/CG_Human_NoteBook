---
type: entity
aliases: [rez-env, rez 包管理]
tags: [pipeline, environment, rez]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# rez

VFX 行业常用的包管理与环境解析工具：每个软件、插件、项目配置都是一个带版本的包，`rez-env` 按需求解析出一组包，拼好环境变量后在里面启动程序。团队的 [[Gaffer]]、[[Houdini]]、[[Nuke]]、Maya 都走 rez 启动（[[来源 - Claude 全局记忆]]）。

## 要点

- **项目包**：`pj2023dy001`、`pj2026cg005` 这类是项目配置包，和软件版本一起解析。Gaffer 的复现环境是 `pj2023dy001 + python 3.11 + gaffer <版本>`。
- **rez-env 会重置 PYTHONPATH**：在外面 `export PYTHONPATH=...` 进不去，要放进 `rez-env ... -- bash -c 'export PYTHONPATH=...; <命令>'`。这一点也意味着走 rez 启动的程序不受全局 PYTHONPATH 污染，而裸装启动的程序会受，见 [[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]]。
- **包自己设的变量要追加不要覆盖**：rez 的 gaffer 包自己设置 `GAFFER_STARTUP_PATHS`，命令行里内联覆盖会被吞掉，要在 `bash -c` 里 `export GAFFER_STARTUP_PATHS=<新路径>:$GAFFER_STARTUP_PATHS`。
- **扩展的总控包**：`gaffer_my_extensions` 是一个 rez 包，按它的 `config.json` 里的 `enabled` 加载各个子扩展。日常 Gaffer 启动器故意不带它，跑的是 `~/gaffer/localExtensions/` 里的本地扩展副本，见 [[改了 rez 包但运行的还是本地扩展副本]]。
- **自写的插件包也按 rez 风格组织**：`<名字>/<版本>/package.py`，如 [[nuke_mcp]] 的 `nuke_mcp/0.1.0/`。

## 用法 / 关键参数

```bash
rez-env pj2023dy001 python==3.11 gaffer==1.6.5.1 -- gaffer
rez-env pj2023dy001 python==3.11 gaffer==1.7.1.0 -- gaffer
rez-env pj2023dy001 maya==2024 -- maya
rez-env nuke==13.1v1 nuke_pd -- Nuke13.1 --nukex

# 在 rez 环境里跑脚本，并加自己的路径（在 Gaffer 安装目录下执行）
rez-env pj2023dy001 python==3.11 gaffer==1.7.1.0 -- bash -c \
  'export PYTHONPATH=<包>/python:$PYTHONPATH; export GAFFER_STARTUP_PATHS=<包>/startup:$GAFFER_STARTUP_PATHS; ./bin/gaffer env python test.py'
```

- 不手动拼 rez 环境，统一用 `Music/launcher/` 下的启动脚本，命名 `软件_项目_版本.sh`（如 `gaffer_pj2023dy001_1710.sh`），参数透传。见 [[Music 测试实验室]]。
- 后台可靠启动 GUI：`setsid nohup rez-env ... < /dev/null &`。
- Houdini 的 rez 包从 `houdini-17.5.173` 到 `houdini-21.0.596`。

## 常见问题

- [[改了 rez 包但运行的还是本地扩展副本]]
- [[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]]

## 相关

- 实体：[[Gaffer]] —— 主要通过 rez 启动
- 实体：[[Houdini]] —— 有 rez 包也有裸装
- 实体：[[Nuke]] —— 团队环境走 rez
- 实体：[[OpenCue]] —— pycue 的 Python 路径由 rez 提供
- 实体：[[Music 测试实验室]] —— 启动脚本统一放在 launcher 目录
- 实体：[[houdini_mcp]] —— 支持裸装和 rez 两种启动
- 实体：[[nuke_mcp]] —— 按 rez 风格组织的包
- 实体：[[cueMonitor]] —— 在 gaffer_my_extensions 里的 rez 包
- 实体：[[gaffer_custom_node]] —— 在 gaffer_my_extensions 里的 rez 包
- 实体：[[ofGafferExt]] —— 同一份扩展常以 rez 包和本地扩展两种形式并存
- 问题：[[改了 rez 包但运行的还是本地扩展副本]] —— 日常启动器不带扩展总控包
- 问题：[[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]] —— 只有走 rez 的启动方式能隔离全局 PYTHONPATH
- 来源：[[来源 - Claude 全局记忆]]
