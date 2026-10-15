---
type: entity
aliases: [OpenCueMonitor, gaffer_cue_monitor, 渲染监控面板]
tags: [gaffer, opencue, render-farm, qt, ai]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---
# cueMonitor

[[Gaffer]] 里的 [[OpenCue]] 渲染监控面板，layout 编辑器类型名 `OpenCueMonitor`。左边任务列表、右边帧表和帧日志，日志区另有「AI 分析」一页，用局域网里的大模型读帧日志、指出报错原因（[[来源 - Claude 全局记忆]]）。

## 要点

- **位置**：rez 包 `Music/third_party/gaffer_my_extensions/gaffer_cue_monitor/0.1.0/`（`python/` 为准，测试命令见包 README）；本地扩展副本 `~/gaffer/localExtensions/cueMonitor/`（日常启动器跑的是这份，键 `local:cuemonitor`）。改完 rez 包要把 `python/` 下五个文件拷到本地扩展，见 [[改了 rez 包但运行的还是本地扩展副本]]。
- **按需查询，不轮询**：点击时起 `threading.Thread`，结果经 `GafferUI.EventLoop.executeOnUIThread` 回到主线程。任务列表查询有防重入标记，详情和帧日志的每个请求带序号、只应用最后一次。没有 QTimer。
- **纯 Qt 原生界面**：编辑器 `__init__` 里建一个裸 `QtWidgets.QWidget()`，用 `GafferUI.Widget(qtRoot)` 包一层再交给 `GafferUI.Editor.__init__`。
- **注册**：`GafferUI.Editor.registerType("OpenCueMonitor", cls)`，并挂成 `GafferUI.OpenCueMonitorEditor`；`registerEditor(application)` 幂等。
- 独立 app `~/gaffer/apps/cueMonitor/cueMonitor-1.py`（`gaffer cueMonitor -user … -jobId …`）还指着已删除的 `~/gaffer/python/`，且 `~/gaffer/apps` 不在 Gaffer 1.7 的 `GAFFER_APP_PATHS` 里，目前跑不起来。

## 界面

| 区域 | 内容 |
|---|---|
| 左：任务列表 | 自绘 `_JobListDelegate` 单行显示；按状态着色（active 蓝、finished 绿、error 红、killed 橙），行背景是分类色按 32% 混进 `#262626`。右键菜单复制数字 jobId / 任务名 / UUID |
| 右上：任务信息 | 任务名 + 状态徽标 + id、渐变进度条、计数文字 |
| 右中：帧表 | 5 列：状态 / 帧 / 层 / 用时 / host。同状态、同层、帧号连续的合并成 `1001-1003`；区间行用时求和、host 去重（3 个以内逗号连接，多了写 `host +N`）；点区间行加载第一帧的日志；非 DEAD 置顶，失败帧红字加粗 |
| 右下：日志 | 「AI 分析 / 原始日志」两页；原始日志带搜索条（忽略大小写，可切正则，◀▶ 跳转，非法正则红框提示） |

三个区域底色不同：任务列表 `#1d212e`、帧表 `#242424`（表头 `#1c1c1c`、隔行 `#282828`）、日志 `#161619`。帧表和日志放在纵向 QSplitter 里，帧表高度按行数自适应 `32 + n*24`，夹在 70～360 像素。

## AI 帧日志分析

三个纯 Python 模块：

| 模块 | 作用 |
|---|---|
| `cueLogDigest.py` | 程序先算事实：去重报错、Arnold 统计、折叠结尾，按优先级裁到长度上限 |
| `cueLogRules.json` | 已知报错规则表：正则 + 级别（fatal / attention / ignore / optimize）+ 含义 + 处理办法；命中的报错归组只说明一次，提示词不随规则增多而变长 |
| `cueLogAssistant.py` + `cueLogAssistantPrompt.md` | 调用 OpenAI 兼容的流式接口 |

- 设置和覆盖文件放在 `~/.gaffer_cue_monitor/`：`assistant.json`（权限 600）、`prompt.md`、`rules.json`。默认接局域网里的一台 LM Studio，单份日志分析 40～180 秒。
- 方向：不训练小模型（没有标注数据，3000 份近期日志里 Arnold 失败帧只有 4 个），知识放进规则表慢慢补。
- 写提示词时得出的规则：
  - **能由程序算的事实一律程序算**：逐帧用时、被谁杀、信号含义、这份日志负责哪几帧（看 `CUE_FRAME_START` / `CUE_FRAME_END`；`CUE_RANGE` 是整层的范围）。交给模型推会出错。
  - Arnold 的 `scene creation time` 从进程启动开始累计，后面的帧要看两次渲染之间的间隔。
  - 损坏的贴图只出现在后面某一帧的 texture statistics 里，要汇总所有帧。
  - 位移的两种警告意思相反，规则表要分开写。
  - Mantra 不打印输出路径时，不能说成「没写出文件」。
- 样本日志一律从 `/mnt/ofLog` 只读拷到临时目录再用。

## Qt / 编辑器的坑

- `QMenu.exec` 在 PySide6 下用 `exec`，旧绑定用 `exec_`（PySide6 下 `exec_` 报 DeprecationWarning）。分支判断 `Qt.__binding__ == "PySide6"` 时要另外 `import Qt`，`from Qt import QtCore` 不会绑定模块名 `Qt`。
- `QProgressBar.setFormat` 不能把 Python `%` 格式化和 Qt 的 `%p%` 混用，自己拼好整串：`"%d / %d 帧  %d%%" % (...)`。
- 任务列表别用 `setItemWidget`：子控件吞掉鼠标事件导致 `itemClicked` 不触发，1000 行也太重。
- 复制走模块级 `_clipboard()`（即 `QApplication.clipboard()`），方便测试替换：无头环境的 QClipboard 不工作。
- 单独抓一个编辑器的图时，它的子控件不会布局；先放进一个可见的 `GafferUI.Window`（`setChild` + `_qtWidget().resize` + `setVisible`）。
- 测试等待线程结果要 `QApplication.processEvents()` + `waitForIdle`。

## 测试

包内三套：日志摘要 `tests/test_log_digest.py`、面板 `tests/test_cue_monitor.py`（配假模型服务 `tests/fakeChatServer.py`）、连真实 cuebot 的 `tests/test_live.py`。

## 常见问题

- [[OpenCue 查询参数被静默忽略]]
- [[OpenCue 帧日志路径找不到]]
- [[改了 rez 包但运行的还是本地扩展副本]]

## 相关

- 实体：[[OpenCue]] —— 监控的渲染农场
- 实体：[[Gaffer]] —— 宿主软件
- 实体：[[Arnold]] —— AI 分析里统计的渲染器日志
- 实体：[[Qt]] —— 界面实现
- 实体：[[ofGafferExt]] —— 本地扩展的加载框架
- 实体：[[rez]] —— 包的组织方式
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 独立 app 在 1.7 的 app 路径之外
- 问题：[[OpenCue 查询参数被静默忽略]] —— 查询写法
- 问题：[[OpenCue 帧日志路径找不到]] —— rqlog 按层分子目录
- 问题：[[改了 rez 包但运行的还是本地扩展副本]] —— 两份副本要同步
- 来源：[[来源 - Claude 全局记忆]]
