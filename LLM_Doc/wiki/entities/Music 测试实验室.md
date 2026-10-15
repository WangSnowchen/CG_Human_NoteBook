---
type: entity
aliases: [Music 目录, ~/Music]
tags: [workspace, pipeline]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Music 测试实验室

本机 `~/Music/` 目录，是围绕 [[Gaffer]] 和其他 DCC 做实验、复现 issue、开发扩展的工作区。每个子目录有 README 说明用途。日常 Gaffer 工作环境 `~/gaffer` 与它分开、保持独立（[[来源 - Claude 全局记忆]]）。

## 要点

| 目录 | 用途 |
|---|---|
| `_repos/<owner>/<repo>` | 克隆的开源项目，只读引用，不往里写东西 |
| `_tests/software/<软件>/` | 软件测试（Gaffer、Blender 等） |
| `_tests/repos/<repo>/` | GitHub 仓库测试 |
| `_tests/issues/<仓库>-<issue 号>/` | 反馈 / 处理 issue，复制 `_template/` 模板，记录 issue 链接、commit hash、环境、复现步骤、结论 |
| `_scratch/` | 临时实验，可随时清空 |
| `launcher/` | 启动脚本，见下 |
| `third_party/` | 自编或自写的软件与插件包：`gaffer_my_extensions/`（Gaffer 扩展总控 rez 包）、`houdini/`、`nuke/`、`unreal/`、`usd/`、`ibus/` 等 |

- **Music 根目录不建 git 仓库**（用户明确决定）。
- **克隆规则**：默认 `git clone --depth 1` 浅克隆主分支，不拉其他分支、不补全历史（大仓库全量克隆会超时）。克隆大仓库前先看顶层结构：
  ```bash
  curl "https://api.github.com/repos/<owner>/<repo>/contents/"
  ```
  多版本 / 多模块的仓库用稀疏检出：
  ```bash
  git clone --filter=blob:none --no-checkout <url>
  cd <repo> && git sparse-checkout set <需要的目录> && git checkout
  ```
- 常用的源码检出：`_repos/GafferHQ/gaffer`（Gaffer 1.7 源码）、`_repos/EpicGames/UnrealEngine`、`_repos/PixarAnimationStudios/OpenUSD`、`_repos/Tencent/WeKnora`。

## 用法 / 关键参数

**启动软件一律走 `launcher/`**，不手动拼 rez 环境。脚本命名 `软件_项目_版本.sh`，参数透传：

| 脚本 | 内容 |
|---|---|
| `gaffer_pj2023dy001_1651.sh` | `rez-env pj2023dy001 python==3.11 gaffer==1.6.5.1 -- gaffer` |
| `gaffer_pj2023dy001_1710.sh` | 同上，`gaffer==1.7.1.0`；不带 `gaffer_my_extensions`，日常跑本地扩展副本 |
| `houdini_local_2100.sh` | 裸装 Houdini 21.0（`/opt/hfs21.0`） |
| `houdini_pj2026cg005_2100.sh` | rez 环境的 Houdini 21.0 |

各个 Gaffer 扩展包目标版本不同，动哪个包之前先看它 `package.py` 的 `requires`。

## 相关

- 实体：[[rez]] —— 启动脚本背后的环境解析
- 实体：[[Gaffer]] —— 实验室的主要对象
- 实体：[[Houdini]] —— launcher 里的 Houdini 启动脚本
- 实体：[[OpenUSD]] —— 源码检出与 third_party/usd 安装区
- 实体：[[WeKnora]] —— 部署在 `Music/Docs/weknora/`
- 实体：[[ibus-rime]] —— 自编版本在 `third_party/ibus/rime/`
- 综述：[[与 AI agent 协作的约定]] —— 过程文件与目录约定
- 来源：[[来源 - Claude 全局记忆]]
