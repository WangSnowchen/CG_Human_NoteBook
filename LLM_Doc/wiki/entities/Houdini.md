---
type: entity
aliases: [SideFX Houdini, hython, Solaris]
tags: [houdini, dcc, solaris, usd, lighting]
applies_to: ["Houdini 21.0.596"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Houdini

SideFX 的节点式 DCC。本机主要用它的 Solaris（LOP 网络，基于 [[OpenUSD]]）做镜头灯光；另外有一个自写的 MCP 服务端 [[houdini_mcp]] 让 AI 客户端驱动它（[[来源 - Claude 全局记忆]]）。

## 要点

- **本机版本**：21.0.596 装在 `/opt/hfs21.0`，另有 17.5～20.5 共 9 个版本；rez 里有 `houdini-17.5.173` … `houdini-21.0.596`。
- **用户的工作文件**是 Solaris 灯光场景（`pj2026cg005/.../lighting/.../*_lit.hip` 这一类）。
- **自带一份 USD**：Houdini 21.0 的 `pxr` 用的命名空间是 `pxrInternal_v0_25_5`。外部编译的 USD 混进它的 Python 路径就会崩溃，见 [[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]]。
- **离线官方文档**在 `$HFS/houdini/help/*.zip`：`nodes`（每个节点一页，含 `@parameters` 参数表）、`vex`、`expressions`、`commands`、`hom`（Python API）、`solaris`、`props`。[[houdini_mcp]] 的文档工具直接读这些 zip。
- **节点类型带版本**：`Lop/light::2.0` 这类名字要用 `nodeType.nameComponents()` 拆成 `(scope, namespace, name, version)`，不要按字符串切。
- **连线样式**：网络编辑器的连线只有直线和 `rounded` 两种，`rounded` 是「直段 + 正圆弧」，见 [[Houdini rounded 连线]]。

## 用法 / 关键参数

启动（参数透传）：

```bash
Music/launcher/houdini_local_2100.sh        # 裸装 /opt/hfs21.0，不走 rez
Music/launcher/houdini_pj2026cg005_2100.sh  # rez 环境
```

- 个人 package 目录 `$HOUDINI_USER_PREF_DIR/packages`（21.0 是 `~/houdini21.0/packages/`），裸装和 rez 启动都会读。
- Python 启动钩子：package 路径下的 `python3.11libs/pythonrc.py`。执行时没有 `__file__`，见 [[Houdini pythonrc 里没有 __file__]]。
- 无界面 Python 是 `hython`。`hdefereval`（把函数排到 UI 线程执行）只在图形界面的 Houdini 里存在。

## Python API 速记

| 想做的事 | 写法 | 备注 |
|---|---|---|
| 撤销是否开启 | `hou.undos.areEnabled()` | 没有 `isEnabled()` |
| 场景有没有未保存改动 | `hou.hipFile.hasUnsavedChanges()` | |
| 参数元组 | `node.parmTuples()` | 返回元组名，`size` 包含 `sizex/sizey/sizez` |
| 网络编辑器可见范围 | `hou.NetworkEditor.visibleBounds()` / `screenBounds()` | 两者合起来得到图坐标和像素的换算 |

- 多输入节点断开某一路会塌陷：`merge` 断掉 in0，原 in1 变成 in0；`copytopoints` 这类固定输入的节点才留下 `None` 空位。
- `setVisibleBounds()` 对「大小不变、只挪位置」的请求会静默忽略，且视口不是立刻到位；脚本里要先缩到全图、再框到目标、回读确认后再抓图。
- 在 Xvnc + llvmpipe 软件渲染下，Houdini 启动直接段错误；需要界面的探测只能在真实显示器上跑。

## 常见问题

- [[Houdini pythonrc 里没有 __file__]]
- [[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]]
- [[MCP 工具在会话中途启动 DCC 后接不上]]

## 相关

- 实体：[[houdini_mcp]] —— 驱动 Houdini 的 MCP 服务端
- 实体：[[OpenUSD]] —— Solaris 的底层
- 实体：[[rez]] —— 版本管理与启动
- 实体：[[Model Context Protocol]] —— AI 客户端驱动 Houdini 的协议
- 概念：[[Houdini rounded 连线]] —— 自制节点图编辑器照着它画连线
- 综述：[[节点图自动排列算法对比]] —— Houdini 的分层排法是对比对象之一
- 问题：[[Houdini pythonrc 里没有 __file__]] —— 启动钩子定位自己
- 问题：[[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]] —— pxr 被顶掉
- 问题：[[MCP 工具在会话中途启动 DCC 后接不上]] —— 先开 Houdini 再开会话
- 实体：[[Music 测试实验室]] —— 启动脚本所在目录
- 来源：[[来源 - Claude 全局记忆]]
