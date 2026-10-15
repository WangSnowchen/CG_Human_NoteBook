---
type: source
aliases: [全局记忆]
tags: [gaffer, arnold, usd, houdini, nuke, unreal, opencue, qt, ai]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: []
human_notes: []
status: active
origin: /home/wangxuechen/.claude/CLAUDE.md
ingested: 2026-10-15
created: 2026-10-15
updated: 2026-10-15
---
# 来源 - Claude 全局记忆

## 摘要

用户给 Claude Code 维护的全局记忆文件（322920 字节，1207 行，文件修改时间 2026-10-14 12:03）。
它把几个月里各项目实测得到的结论合在一份里，按节组织：

- A / B：和 AI agent 协作的规则、`~/Music` 工作区约定
- D / E / F：Gaffer 的环境、截图、MCP 工具、Python 绑定与自制编辑器（日志面板、代码补全、拾色器、节点图编辑器、参数面板、视口网格上传等）
- G：灯光组共享节点库、ofNode 团队节点、场景 / 渲染 / 镜头修复配方
- H：OpenCue 渲染监控面板
- J / K / M / N / O：dsh、UE 远程 MCP、Houdini MCP、Nuke MCP、UE 本地文档与源码索引
- L：Gaffer 中文文档站
- P / Q / R：WeKnora 部署、OpenUSD 自编译、ibus-rime 自编

原文大量是按版本推进的过程记录，收录时只保留最终结论；被后续推翻的中间做法没有写进页面。

## 收录到的页面

### 实体
- [[Gaffer]]
- [[Arnold]]
- [[OpenUSD]]
- [[Houdini]]
- [[Nuke]]
- [[Unreal Engine]]
- [[OpenCue]]
- [[rez]]
- [[Model Context Protocol]]
- [[OSL]]
- [[Qt]]
- [[IECoreGL]]
- [[Gaffer GraphEditor]]
- [[Gaffer NodeEditor]]
- [[Gaffer Spreadsheet]]
- [[Gaffer Catalogue]]
- [[Gaffer screengrab]]
- [[gaffer_network_editor]]
- [[gaffer_parameter_editor]]
- [[gaffer_indexed_mesh]]
- [[gaffer_mcp]]
- [[ofGafferExt]]
- [[gaffer_custom_node]]
- [[gaffer_light_skill]]
- [[Gaffer LogView]]
- [[codeCompleter]]
- [[spreadsheetRowDuplicate]]
- [[SpreadsheetOverviewEditor]]
- [[gaffer-color-chooser-plus]]
- [[hierarchyMarkerIcons]]
- [[ueColorChooser]]
- [[eyeDropper]]
- [[cueMonitor]]
- [[lgtLib 共享节点库]]
- [[ofNode]]
- [[ofUsdGaffer]]
- [[LightSetupManager]]
- [[ArnoldAovManager]]
- [[RenderQualityManager]]
- [[VelocityMotionBlur]]
- [[MeasureDistance]]
- [[MeshAttributeCollector]]
- [[houdini_mcp]]
- [[nuke_mcp]]
- [[nuke_api]]
- [[UE ModelContextProtocol 插件]]
- [[ue_docs]]
- [[ue_api]]
- [[gaffer_zh_docs]]
- [[WeKnora]]
- [[ibus-rime]]
- [[dsh-desktop]]
- [[modlens]]
- [[Music 测试实验室]]

### 概念
- [[ViewportGadget]]
- [[Gaffer PlugLayout]]
- [[Gaffer PathColumn]]
- [[Gaffer ContextTracker]]
- [[Gaffer layout activator 元数据]]
- [[Gaffer Overlay]]
- [[GafferUI LazyMethod]]
- [[Boost.Python 包装对象身份]]
- [[AOV]]
- [[运动模糊]]
- [[Deep 输出]]
- [[降噪]]
- [[Overscan]]
- [[索引式网格上传]]
- [[顶点属性量化]]
- [[视锥剔除]]
- [[Multi Draw Indirect 批量绘制]]
- [[Sugiyama 分层布局]]
- [[Houdini rounded 连线]]
- [[反向 SSH 隧道]]

### 问题→方案
- [[Gaffer Animation 关键帧设置后场景不动]]
- [[Gaffer 无头环境创建某些节点直接崩溃]]
- [[Gaffer .grf 回读报 is not a child]]
- [[Gaffer Group 手动加输入插口产生多余插口]]
- [[Gaffer Group 同名输入合并后为空]]
- [[Gaffer Catalogue 加图后撤销栈损坏]]
- [[Gaffer 信号回调多写一个形参后静默无效]]
- [[Gaffer Python ComputeNode 调基类 hash 报错]]
- [[Gaffer 自写 PlugValueWidget 一直空白]]
- [[MeasureDistance 表达式循环依赖导致崩溃]]
- [[LightSetupManager 动画编辑器只显示 row1]]
- [[Gaffer 自制 Editor 同步重建界面导致卡死]]
- [[GafferUI 已创建的控件放进容器后不显示]]
- [[Gaffer NodeEditor 换节点时面板闪一下]]
- [[Gaffer 自制参数面板里大控件被拉高或压扁]]
- [[Gaffer Spreadsheet 表格滚到底差一行]]
- [[Gaffer IPR 日志过多导致界面卡死]]
- [[Gaffer 拾色器弹窗点 OK 不生效]]
- [[Gaffer NameSwitch 第二路连线不显示]]
- [[自制节点图编辑器在 Gaffer 1.7 下建不出来]]
- [[Gaffer screengrab 抓 GL 视图内容随机错乱]]
- [[Gaffer screengrab 抓不到右键菜单]]
- [[Gaffer 节点图截图节点太小看不清]]
- [[Gaffer screengrab 的 commandFile 主逻辑不执行]]
- [[ofGafferExt 本地扩展显示启用但没加载]]
- [[改了 rez 包但运行的还是本地扩展副本]]
- [[Python 热加载读到旧字节码]]
- [[Gaffer 视口展开大场景内存暴涨]]
- [[切换场景后内存不释放]]
- [[相机分辨率门外的物体仍在绘制]]
- [[IECoreGL 着色器预处理器不认 version 430]]
- [[视口像素对比的差异是 z-fighting 还是几何错误]]
- [[镜头 UV 错误的修复方法]]
- [[运动模糊异常的修复方法]]
- [[standin 全局缩放后相机裁剪失效]]
- [[QGraphicsItem 拖动或悬停后留下拖影]]
- [[QPainterPath 重叠区域点不中]]
- [[Qt 嵌套 Popup 子窗口收不到鼠标事件]]
- [[Qt 一行两段文字互相遮挡]]
- [[QScrollArea 内容展开后整列变窄]]
- [[QConicalGradient 色轮取色角度错位]]
- [[X11 屏幕取色读到同一个灰色]]
- [[X11 取色报 Maximum number of clients reached]]
- [[Houdini pythonrc 里没有 __file__]]
- [[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]]
- [[Nuke 枚举 knob 写错值不报错]]
- [[Nuke setAnimated 只给第一个分量打关键帧]]
- [[Nuke -t 模式传不进带值的脚本参数]]
- [[OpenCue 查询参数被静默忽略]]
- [[OpenCue 帧日志路径找不到]]
- [[UE MCP 服务只监听本机无法远程连接]]
- [[UE MCP 手动调用 tools list 返回空]]
- [[MCP 工具在会话中途启动 DCC 后接不上]]
- [[gcc 9 编译 OpenUSD 报未知编译选项]]
- [[WeKnora 启动卡住不监听端口]]
- [[dsh 装 agent-teams 插件后后端起不来]]
- [[ibus 换了引擎仍然加载旧版本]]
- [[contextmanager 里 yield 包 try 报 didn't stop after throw]]

### 综述
- [[Gaffer 1.6 与 1.7 API 差异]]
- [[Gaffer 无头测试与截图验证方法]]
- [[替换 Gaffer 原生编辑器的方法]]
- [[在 Gaffer 里另做 Qt 节点图编辑器]]
- [[在 Gaffer 里另做参数面板]]
- [[Qt 自绘界面常见坑]]
- [[节点图自动排列算法对比]]
- [[Gaffer 视口每帧开销分析]]
- [[Gaffer Box 处理器脚手架]]
- [[Gaffer OSL 几何编辑套路]]
- [[Gaffer 逐位置动态查询]]
- [[Gaffer 按帧门控]]
- [[Gaffer 查询回写闭环]]
- [[Gaffer Spreadsheet 多实例与参数表]]
- [[Gaffer 视口辅助物]]
- [[Gaffer 程序化几何]]
- [[Gaffer 渲染设置模板]]
- [[Arnold AOV 表达式速查]]
- [[资产与特效 Resolver 模板]]
- [[NodeReference 节点案例制作流程]]
- [[DCC MCP 桥接架构]]
- [[与 AI agent 协作的约定]]

## 未收录的内容

- **B2、I 两节整节跳过**：代理地址、Confluence 账号密码。
- **其余各节里的内网地址**：远程 Windows 机器、本机、cuebot、LM Studio、内网代理的 IP，以及 Windows 用户名、带 token 的 URL，页面里都换成了「远程 Windows 机器」「内网代理」这类称呼。
- **过程记录**：扩展包的版本号流水（v0.32～v0.70 等）、「用户第 N 轮反馈」、每轮测试条数与截图文件名、已被推翻的中间做法（如参数面板的节点浏览器侧栏、堆叠上限跟着选中数变）。
- **只和 agent 自身有关的习惯**：模型看不了图时做 ASCII 像素渲染、gaffer 技能清单。
- **不稳定的细节**：VNC 远程窗口的坐标与尺寸（每次都变）、ibus 上屏语料统计。
- **未单独建页的节点**：ArnoldAovDeleter、RenderLayerManager、LightLinkManager 等并进了 [[ofNode]]、[[ArnoldAovManager]]、[[Gaffer 渲染设置模板]]。

## 收录时的补充与存疑

- **补充读过的文件**：[[gaffer_indexed_mesh]] 一组页面里的显卡型号、帧时间基准视口尺寸、submit / total 口径，取自
  `Music/third_party/gaffer_my_extensions/gaffer_indexed_mesh/0.1.0/README.md` 的「数字」一节，页面上已注明。这份 README 没有单独收录。
- **示意代码**：[[Gaffer Box 处理器脚手架]] 的 Python 示意、[[Gaffer Python ComputeNode 调基类 hash 报错]] 的 hashCachePolicy 片段、
  [[Gaffer 自写 PlugValueWidget 一直空白]] 的空列表处理片段、[[OpenCue 帧日志路径找不到]] 的 pycue 拼路径写法，是按原文描述写出来的，没有实际运行过，页面上标了「示意」。
- **推断项**：[[Gaffer 渲染设置模板]] 里 CreateLightSetup / ManageRenderQuality / CreateArnoldAOVs / DeleteArnoldAOVs 按命名规律对应到 ofNode 的四个节点，原文只明写了 LightLinkManager → CreateLightLinks 这一组。
- **原文内部不一致、页面按较新的说法写**：
  - gaffer_mcp 的工具数：E 节写包内 19 个工具，又写 `__list_tools` 回 86 个即正常（86 可能含个人工具目录）。页面没写具体数字。
  - LightSetupManager 无头创建：D2 说崩溃，F18 说 1.7 不崩溃。页面写成 1.6.5.1 崩溃、1.7.1.0 正常两条并列。
  - LightSetupManager 修复方向：G7 写「ofNode C++ addRow」，G2 实测 ofNode 是 Cython 编译的 Python，页面按 G2 写。
  - B1 说「其余扩展仍按 1.6.5.1 验过」，而参数面板、gaffer_custom_node、gaffer_light_skill 已写明只支持 1.7，页面按后者写。
  - 节点图编辑器：v0.67 写「多选右键菜单还没做」，v0.68 已改成无条件发 `nodeContextMenuSignal(True)`，按 v0.68 写。
  - 视口网格的两轮帧时间基准：render depth 11 全景一处写 1.34→1.04 s，另一处写 1.30→1.04 s，同配置差 0.26 s，原因不明；页面分两轮列出，只比同一轮内的前后。
- **端口占用**：gaffer_zh_docs 的局域网服务和 UE MCP 反向隧道都用本机 8000 端口，能否同时运行原文没说。

## 相关
- 综述：[[与 AI agent 协作的约定]] —— 本文件 A 节的通用部分
