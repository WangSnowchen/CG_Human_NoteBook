---
type: entity
aliases: [Houdini MCP]
tags: [houdini, mcp, agent, solaris]
applies_to: ["Houdini 21.0.596"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# houdini_mcp

驱动正在运行的 [[Houdini]] 的 MCP 服务端，结构照搬 [[gaffer_mcp]]（见 [[DCC MCP 桥接架构]]）。包在 `Music/third_party/houdini/houdini_mcp/0.1.0/`，改它之前先读包内 `WORKLOG.md` 的 `## 当前状态` 和 `README.md`（[[来源 - Claude 全局记忆]]）。

## 要点

- **只做 Houdini 21.0.596 / Python 3.11**。用户实际工作是 Solaris 灯光，后续工具重点在 LOP / USD。
- **31 个工具**：会话 9、节点 8、图 5、参数 4、官方文档 4、`run_python` 1。
- **官方文档离线可查**：原地读 `$HFS/houdini/help/*.zip`（不复制进包，`HOUDINI_MCP_HELP_DIR` 可覆盖）。`nodes` 4768 页（每个节点一页，含 `@parameters`）、`vex` 1163、`expressions` 475、`commands` 439，另有 `hom`（Python API）、`solaris`、`props`。对应工具 `node_help` / `search_docs` / `read_doc` / `list_docs`。
- 端口 `127.0.0.1:24746`，连接文件 `~/.houdini_mcp/connection.json`。
- 和 gaffer_mcp 的三处差异：
  - 不需要「等计算提交后再读」：Houdini 按需 cook，撤销组里改完参数立刻读几何就是新值。
  - 不需要自己维护改动标记：直接问 `hou.hipFile.hasUnsavedChanges()`。
  - 不需要「选当前脚本」：一个进程一个 hip，节点一律按路径寻址。

## 用法 / 关键参数

启动链：个人包 `~/houdini21.0/packages/houdini_mcp.json` → `python3.11libs/pythonrc.py` → 桥接层。裸装 Houdini 和 rez 会话都读 `$HOUDINI_USER_PREF_DIR/packages`，装一次两边都生效。

```bash
Music/launcher/houdini_local_2100.sh        # 裸装 /opt/hfs21.0
Music/launcher/houdini_pj2026cg005_2100.sh  # rez 环境
```

| 环境变量 | 作用 |
|---|---|
| `HOUDINI_MCP_DISABLE=1` | 不拉起桥接层 |
| `HOUDINI_MCP_FORCE=1` | 在 hython 里也拉起 |
| `HOUDINI_MCP_ROOT` | 包根目录（`pythonrc.py` 靠它定位自己） |
| `HOUDINI_MCP_HELP_DIR` | 官方帮助 zip 所在目录 |

测试：

```bash
hython tests/test_tools.py        # 无头，覆盖全部工具
python3 tests/test_mcp_client.py  # 协议层，不需要 Houdini
python3 tests/test_live.py        # 真机，需要开着 Houdini
```

## Houdini 侧的实测坑

- `pythonrc.py` 执行时没有 `__file__`，见 [[Houdini pythonrc 里没有 __file__]]。
- `hdefereval` 只在图形界面的 Houdini 里存在，hython 里 import 直接失败 → 桥接层要有「没有 UI 就直接调用」的分支，这样无头测试也能覆盖全部工具。
- 判断撤销是否开启用 `hou.undos.areEnabled()`，没有 `isEnabled()`。
- 建出来的节点类型带版本：`create_node(type="light")` 得到 `Lop/light::2.0`（Houdini 自己的灯就是 HDA）。查文档要用 `nodeType.nameComponents()` 拆成 `(scope, namespace, name, version)`；按字符串切会找不到真正的 `lop/light.txt`，而 HDA 内嵌帮助会兜底，表面上看还是「查到了」。
- `parmTuples()` 返回的是参数元组名（`size` 包含 `sizex/sizey/sizez`）。
- 多输入节点断开某一路后会塌陷：`merge` 断掉 in0，原来的 in1 变成 in0；`copytopoints` 这种固定输入的节点才会留下 `None` 空位。
- 热加载只覆盖 `tools/*.py`；改了 `python/` 下的模块要重启 Houdini，或在 `run_python` 里 `importlib.reload`。

## 常见问题

- [[Houdini pythonrc 里没有 __file__]]
- [[MCP 工具在会话中途启动 DCC 后接不上]]
- [[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]] —— 裸装启动器不走 rez，会受全局 PYTHONPATH 影响

## 相关

- 实体：[[Houdini]] —— 被驱动的软件
- 综述：[[DCC MCP 桥接架构]] —— 共用的结构
- 实体：[[Model Context Protocol]] —— 底层协议
- 实体：[[gaffer_mcp]] —— 原型
- 实体：[[nuke_mcp]] —— 同一结构的 Nuke 版
- 实体：[[rez]] —— 两种启动方式之一
- 概念：[[Houdini rounded 连线]] —— 用它驱动 Houdini 建探针图、量连线形状
- 问题：[[Python 热加载读到旧字节码]] —— 工具文件热加载用 compile + exec 的原因
- 问题：[[Houdini pythonrc 里没有 __file__]] —— 启动钩子定位包根
- 问题：[[MCP 工具在会话中途启动 DCC 后接不上]] —— 先开 Houdini 再开会话
- 问题：[[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]] —— 裸装启动器的环境污染
- 来源：[[来源 - Claude 全局记忆]]
