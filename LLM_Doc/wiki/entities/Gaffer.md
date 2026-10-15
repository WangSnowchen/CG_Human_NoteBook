---
type: entity
aliases: [GafferHQ]
tags: [gaffer, lighting, lookdev, pipeline]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: ["[[如何在Gaffer中测量距离]]"]
status: active
created: 2026-10-15
updated: 2026-10-15
---
# Gaffer

开源的节点式灯光、lookdev 与管线工具（GafferHQ），C++ 核心 + Python 绑定，界面是 GafferUI（Qt）+ 自己的 OpenGL gadget 体系。
团队灯光组用它做镜头布光、渲染设置和镜头修复，渲染器主要是 [[Arnold]]，场景数据走 [[OpenUSD]]。

## 要点

- **在用的两个版本**：1.6.5.1 和 1.7.1.0，各扩展包的目标版本不同，动哪个先确认它的目标版本。差异见 [[Gaffer 1.6 与 1.7 API 差异]]。
- **源码**：本机检出 `Music/_repos/GafferHQ/gaffer/`（1.7）。读机制看这里；版本敏感的 API 要拿装机版复核：
  `/mnt/centralizedRepo/third_party/gaffer/linux/<版本>/python/`。`python/Gaffer*Test/` 里的测试文件是最准确的 API 用法示例。
- **启动**：通过 [[rez]] 组合环境，脚本放在 `Music/launcher/`，如 `gaffer_pj2023dy001_1710.sh`
  （= `rez-env pj2023dy001 python==3.11 gaffer==1.7.1.0 -- gaffer`）。命令行标志是单横线，如 `-commandFile`。
- **无头运行**：`bin/gaffer env python <脚本>`（不跑 gui 启动脚本）；要界面上下文又不想开窗口用 [[Gaffer screengrab]]。
  方法汇总见 [[Gaffer 无头测试与截图验证方法]]。
- **扩展方式**：rez 扩展包 `gaffer_my_extensions`，以及本地扩展框架 [[ofGafferExt]]（日常启动器走本地扩展那份）。

## 子系统与编辑器

- 节点图：[[Gaffer GraphEditor]]，自制的 Qt 替代品 [[gaffer_network_editor]]
- 参数面板：[[Gaffer NodeEditor]]、[[Gaffer PlugLayout]]，自制的 [[gaffer_parameter_editor]]
- 视口：[[ViewportGadget]]、[[Gaffer Overlay]]，网格上传替换 [[gaffer_indexed_mesh]]（底层 [[IECoreGL]]）
- 其他编辑器扩展：[[Gaffer LogView]]、[[codeCompleter]]、[[hierarchyMarkerIcons]]、[[ueColorChooser]]、[[SpreadsheetOverviewEditor]]
- 驱动运行中的 Gaffer：[[gaffer_mcp]]

## 常见问题

见各子页面的「常见问题」；高频的几条：
- [[Gaffer Animation 关键帧设置后场景不动]]
- [[Gaffer 自制 Editor 同步重建界面导致卡死]]
- [[Gaffer 无头环境创建某些节点直接崩溃]]

## 相关
- 实体：[[Arnold]] —— 主要渲染器
- 实体：[[OpenUSD]] —— 场景数据格式
- 实体：[[rez]] —— 启动环境
- 实体：[[ofGafferExt]] —— 本地扩展框架
- 实体：[[Gaffer screengrab]] —— 界面上下文里跑脚本并截图
- 实体：[[gaffer_mcp]] —— 用 MCP 驱动运行中的 Gaffer
- 实体：[[Gaffer GraphEditor]] —— 原生节点图
- 实体：[[gaffer_network_editor]] —— 自制 Qt 节点图
- 实体：[[Gaffer NodeEditor]] —— 原生参数面板
- 实体：[[gaffer_parameter_editor]] —— 自制参数面板
- 实体：[[gaffer_indexed_mesh]] —— 视口网格上传替换
- 实体：[[IECoreGL]] —— 视口 OpenGL 渲染层
- 实体：[[Gaffer LogView]] —— 日志面板
- 实体：[[codeCompleter]] —— 表达式代码补全
- 实体：[[hierarchyMarkerIcons]] —— 层级视图类型图标
- 实体：[[ueColorChooser]] —— UE 风格拾色器
- 实体：[[SpreadsheetOverviewEditor]] —— 表格总览面板
- 实体：[[gaffer-color-chooser-plus]] —— 原生拾色器的色板扩展
- 实体：[[Gaffer Catalogue]] —— 图像目录节点
- 实体：[[Gaffer Spreadsheet]] —— 表格节点
- 实体：[[Qt]] —— GafferUI 建在 Qt 上
- 实体：[[OSL]] —— GafferOSL 模块用的着色语言
- 实体：[[ofNode]] —— 团队自研的节点模块
- 实体：[[lgtLib 共享节点库]] —— 团队共享的节点库与配方
- 实体：[[gaffer_zh_docs]] —— 团队 Gaffer 中文文档站
- 实体：[[cueMonitor]] —— Gaffer 里的 OpenCue 渲染监控面板
- 实体：[[OpenCue]] —— 团队提交渲染的农场调度系统
- 实体：[[Model Context Protocol]] —— AI 客户端驱动 Gaffer 用的协议
- 实体：[[Music 测试实验室]] —— Gaffer 实验、复现与扩展开发的工作区
- 概念：[[ViewportGadget]] —— gadget 树的根与相机
- 概念：[[Gaffer PlugLayout]] —— 参数面板排版
- 概念：[[Gaffer Overlay]] —— 视图上的叠加控件
- 概念：[[Gaffer ContextTracker]] —— focus 时算出真正参与计算的节点
- 概念：[[Boost.Python 包装对象身份]] —— Python 侧比较节点要用 isSame()
- 概念：[[Gaffer layout activator 元数据]] —— 参数置灰 / 隐藏，字符串形式可序列化
- 概念：[[GafferUI LazyMethod]] —— 界面代码的延迟去重调用
- 概念：[[Overscan]] —— StandardOptions 的过扫描与 crop 配方
- 问题：[[Gaffer Animation 关键帧设置后场景不动]] —— 关键帧时间单位是秒
- 问题：[[Gaffer 自制 Editor 同步重建界面导致卡死]] —— 重建要推迟到 idle
- 问题：[[Gaffer 无头环境创建某些节点直接崩溃]] —— 部分节点只能在界面上下文里建
- 问题：[[Gaffer .grf 回读报 is not a child]] —— 脚本加的插口要带 Dynamic 标志
- 问题：[[Gaffer Group 同名输入合并后为空]] —— 同名根子碰撞成空
- 问题：[[Gaffer Group 手动加输入插口产生多余插口]] —— Group.in 只按下标连线
- 问题：[[Gaffer 信号回调多写一个形参后静默无效]] —— 形参个数不对被静默吞掉
- 问题：[[GafferUI 已创建的控件放进容器后不显示]] —— 已有控件要显式 append
- 问题：[[MCP 工具在会话中途启动 DCC 后接不上]] —— 先开 Gaffer 再开 AI 会话
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 两个在用版本的差别
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 不开窗口验证功能
- 综述：[[在 Gaffer 里另做参数面板]] —— 自制参数面板的方法
- 综述：[[替换 Gaffer 原生编辑器的方法]] —— 扩展和替换原生界面的几种做法
- 综述：[[节点图自动排列算法对比]] —— 节点图自动排列的实测对比
- 来源：[[来源 - Claude 全局记忆]]
