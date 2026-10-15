# 目录

每页一行。新建页面时同步更新本文件。

## 实体

### 软件与协议
- [[Gaffer]] —— 节点式灯光 / lookdev / 管线工具，团队镜头工作的主力
- [[Arnold]] —— 团队主力渲染器，Gaffer 里的接入方式与版本差异
- [[OpenUSD]] —— Pixar 场景描述格式；各 DCC 自带版本冲突，本机自编 26.11 核心版命令行工具
- [[Houdini]] —— SideFX DCC，主要用 Solaris 做灯光；版本、启动、离线帮助、Python API 坑
- [[Nuke]] —— Foundry 合成软件；NUKE_PATH 启动钩子、终端模式、Python API 坑
- [[Unreal Engine]] —— UE 5.8 跑在远程 Windows 上，本地文档 / 反射索引入口与 MCP 远程驱动
- [[OpenCue]] —— 渲染农场调度；pycue 与 proto 版本错位、枚举数值、帧日志
- [[rez]] —— 包管理与环境解析；常用命令、会重置 PYTHONPATH、包变量要追加
- [[Model Context Protocol]] —— AI 客户端调用外部工具的协议；传输方式、握手顺序、curl 探测
- [[OSL]] —— Open Shading Language 与 GafferOSL 三个常用节点
- [[Qt]] —— GafferUI 所用的界面库（Qt.py + PySide6），自制编辑器的注意点
- [[IECoreGL]] —— Cortex 的 OpenGL 渲染层，Gaffer 视口靠它转换和绘制对象

### Gaffer 原生组件
- [[Gaffer GraphEditor]] —— 原生 OpenGL 节点图：结构、为什么改不动、原生尺寸与行为
- [[Gaffer NodeEditor]] —— 原生参数面板：结构、acquire 调用点、toolMenuSignal 扩展口
- [[Gaffer Spreadsheet]] —— 表格节点：行插口结构、常用输出、提升到 Box 的规则
- [[Gaffer Catalogue]] —— 图像目录节点：images 插口、imageIndex 重映射、Viewer 工具条控件
- [[Gaffer screengrab]] —— 自带截图应用，在完整界面上下文里跑 commandFile 并抓图

### 自制 Gaffer 扩展
- [[gaffer_network_editor]] —— 用 Qt QGraphicsView 另做的节点图编辑器，外观现代、行为照原生
- [[gaffer_parameter_editor]] —— 自制参数面板：状态条、值来源追溯、深度搜索、堆叠、批量编辑
- [[gaffer_indexed_mesh]] —— 替换 IECoreGL 网格与点云转换，降低大场景视口内存、显存和帧时间
- [[gaffer_mcp]] —— 驱动运行中 Gaffer 的 MCP 工具包：插件化工具注册、热加载、桥接协议
- [[ofGafferExt]] —— 团队 Gaffer 扩展开关框架：本地扩展目录、扩展键推导、startup 钩子
- [[gaffer_custom_node]] —— 自用高级节点合集（/Noise 菜单），加 Python / Box 节点的步骤
- [[gaffer_light_skill]] —— 按 color key 给镜头搭 Arnold 灯的技能包
- [[Gaffer LogView]] —— layout 日志面板，捕获终端、IPR、dispatch 的全部日志
- [[codeCompleter]] —— Expression（Python / OSL）和 OSLCode 代码框的补全
- [[spreadsheetRowDuplicate]] —— Spreadsheet 行右键「复制并自动编号」
- [[SpreadsheetOverviewEditor]] —— 按 Box 层级列出所有表格，可按 focus 连通分量过滤
- [[gaffer-color-chooser-plus]] —— 团队拾色器色板插件的开源重写
- [[hierarchyMarkerIcons]] —— HierarchyView 按对象类型自动显示类型图标
- [[ueColorChooser]] —— 从 UE SColorPicker 移植的拾色器，含替换类的接口契约
- [[eyeDropper]] —— 跨软件屏幕取色（X11 / Windows / macOS）
- [[cueMonitor]] —— Gaffer 里的 OpenCue 渲染监控面板，含 AI 帧日志分析

### 团队节点与节点库
- [[lgtLib 共享节点库]] —— 灯光组共享 Gaffer 节点库（只读）：目录、.grf 格式、用量统计
- [[ofNode]] —— 团队自研节点模块（Cython 编译的 .so）：节点清单与元数据惯例
- [[ofUsdGaffer]] —— 团队工具函数模块：AOV 对话框、.ass 材质转换、场景遍历
- [[LightSetupManager]] —— 灯光属性表节点：结构、行名规则、light_type 取值
- [[ArnoldAovManager]] —— AOV 管理节点（含 ArnoldAovDeleter），白名单 / 黑名单两种用法
- [[RenderQualityManager]] —— 质量档切换节点，low / mid / final
- [[VelocityMotionBlur]] —— 按 velocity 出运动模糊的节点
- [[MeasureDistance]] —— 两点测距 Box 节点：取点链、两个 Expression 分工
- [[MeshAttributeCollector]] —— 统计网格属性值分布的 Python ComputeNode

### 其他 DCC 与工具
- [[houdini_mcp]] —— 驱动 Houdini 21.0 的 MCP 服务端，可离线查官方帮助
- [[nuke_mcp]] —— 驱动 Nuke 的 MCP 服务端，一个包通吃所有 Nuke 版本
- [[nuke_api]] —— 从 Nuke 16.1v2 生成的离线文档、knob 表、NDK 头文件整合包
- [[UE ModelContextProtocol 插件]] —— UE 官方 MCP 插件，只监听本机，只暴露 3 个元工具
- [[ue_docs]] —— UE 5.8 英文官方指南离线副本与抓取要点
- [[ue_api]] —— 从 UE 头文件扫出的 C++ 反射索引，按细节面板分组查参数
- [[gaffer_zh_docs]] —— 团队 Gaffer 中文文档站：进度、文档优先级、局域网服务
- [[WeKnora]] —— 腾讯开源 RAG 知识库的 Lite 单二进制本地部署
- [[ibus-rime]] —— 自编 librime + Lua / octagram 的雾凇拼音输入法
- [[dsh-desktop]] —— 打开 dsh（DeepSeek Harness）web 界面的 Electron 外壳
- [[modlens]] —— 给文本模型加读图能力的工具
- [[Music 测试实验室]] —— ~/Music 工作区的目录约定、克隆规则与启动脚本

## 概念

### Gaffer 内部机制
- [[ViewportGadget]] —— GL gadget 树的根兼相机：frame、setViewport、坐标换算
- [[Gaffer PlugLayout]] —— NodeEditor 的排版内核和 layout:* 元数据语义
- [[Gaffer PathColumn]] —— PathListingWidget 的列抽象，Python 子类化与 CellData
- [[Gaffer ContextTracker]] —— 算出 focus 节点在当前 context 下真正参与计算的上游
- [[Gaffer layout activator 元数据]] —— 参数置灰 / 隐藏，字符串形式可随 .grf 保存
- [[Gaffer Overlay]] —— 视图上的叠加控件，放在 QGraphicsScene 里
- [[GafferUI LazyMethod]] —— 延迟去重调用装饰器，控件不可见就不更新
- [[Boost.Python 包装对象身份]] —— 同一 C++ 对象每次访问是新包装，比较用 isSame()

### 渲染
- [[AOV]] —— 额外输出通道，Arnold / Gaffer / 团队节点里的对应
- [[运动模糊]] —— StandardOptions 选项、velocity、子帧采样
- [[Deep 输出]] —— deep 图像配方：运动模糊选项 + deep AOV
- [[降噪]] —— ArnoldImager + OIDN，排除数据通道
- [[Overscan]] —— 过扫描、按物体自动 crop、分块渲染

### 视口与图形学
- [[索引式网格上传]] —— 唯一顶点表 + 索引表，split / storm 两种布局
- [[顶点属性量化]] —— 法线 10:10:10、uv 半精度、位置 4×uint16、16 位索引
- [[视锥剔除]] —— 对象级、块级、点云分块、相机分辨率门四层剔除
- [[Multi Draw Indirect 批量绘制]] —— 共享 arena + glMultiDrawElementsIndirect 合批小网格

### 界面与算法
- [[Sugiyama 分层布局]] —— 分层 / 打桩 / 定序 / 定位四步的有向图排版
- [[Houdini rounded 连线]] —— 直线段 + 正圆弧的连线画法，及从真 Houdini 量形状的方法

### 网络
- [[反向 SSH 隧道]] —— 服务所在机器主动 ssh -R，把只监听本机的端口转出来

## 问题→方案

### Gaffer 基础
- [[Gaffer Animation 关键帧设置后场景不动]] —— 关键帧时间单位是秒，帧号要除以 fps
- [[Gaffer 无头环境创建某些节点直接崩溃]] —— 部分节点无头 SIGABRT，放到 screengrab 测
- [[Gaffer .grf 回读报 is not a child]] —— 脚本加的插口缺 Dynamic 标志
- [[Gaffer Group 手动加输入插口产生多余插口]] —— Group.in 是自动扩展的 ArrayPlug
- [[Gaffer Group 同名输入合并后为空]] —— 同名根子碰撞成空，测试场景用不同图元
- [[Gaffer Catalogue 加图后撤销栈损坏]] —— 加图与重排放同一 UndoScope 会毁掉撤销栈
- [[Gaffer 信号回调多写一个形参后静默无效]] —— TypeError 被 EventSignalCombiner 吞掉
- [[Gaffer Python ComputeNode 调基类 hash 报错]] —— 1.7 绑定没有基类 hash，整场景哈希写法
- [[Gaffer 自写 PlugValueWidget 一直空白]] —— 后台计算前先收到空列表，不处理就断掉刷新
- [[MeasureDistance 表达式循环依赖导致崩溃]] —— 一个 Expression 同时写和读成环，进程 SIGSEGV
- [[LightSetupManager 动画编辑器只显示 row1]] —— 动画编辑器显示行的图组件名

### Gaffer 界面开发
- [[Gaffer 自制 Editor 同步重建界面导致卡死]] —— 信号里同步重建与写 __uiPosition 成环，改为 idle 重建
- [[GafferUI 已创建的控件放进容器后不显示]] —— 父子关系只在创建时建立，要显式 append
- [[Gaffer NodeEditor 换节点时面板闪一下]] —— 布局没算完就画了一帧，同一次调用里自底向上 activate
- [[Gaffer 自制参数面板里大控件被拉高或压扁]] —— 可伸长行判定、弹簧限高、takeStretch
- [[Gaffer Spreadsheet 表格滚到底差一行]] —— _LinkedScrollBar 吞掉第二次 range 变化
- [[Gaffer IPR 日志过多导致界面卡死]] —— 每条消息排一次 UI 回调，改为批量
- [[Gaffer 拾色器弹窗点 OK 不生效]] —— OK 时没发 colorChangedSignal
- [[Gaffer NameSwitch 第二路连线不显示]] —— 连线 key 用插口短名，第二路被当重复
- [[自制节点图编辑器在 Gaffer 1.7 下建不出来]] —— 1.7 新增右键菜单扩展点要求的接口没补齐

### Gaffer 截图与测试
- [[Gaffer screengrab 抓 GL 视图内容随机错乱]] —— grabWindow 与 GL 合成竞态，改 glReadPixels
- [[Gaffer screengrab 抓不到右键菜单]] —— 非阻塞弹出 + 泵事件 + 不关菜单再抓
- [[Gaffer 节点图截图节点太小看不清]] —— frame 缩放上限 10，自己算包围盒取景
- [[Gaffer screengrab 的 commandFile 主逻辑不执行]] —— __name__ 是 builtins，__main__ 守卫跳过主逻辑

### Gaffer 扩展部署
- [[ofGafferExt 本地扩展显示启用但没加载]] —— 手打的扩展键与目录名推导不一致
- [[改了 rez 包但运行的还是本地扩展副本]] —— 日常启动跑的是 localExtensions 那份
- [[Python 热加载读到旧字节码]] —— exec_module 按秒级 mtime + 大小判新旧，改 compile + exec

### 视口性能
- [[Gaffer 视口展开大场景内存暴涨]] —— 原生转换约 3 倍体积、CPU 留副本、去重只在 LRU 内成立
- [[切换场景后内存不释放]] —— 计算缓存、arena 空块、usdc 页缓存三处
- [[相机分辨率门外的物体仍在绘制]] —— 按门剔除 + Main 层 scissor
- [[IECoreGL 着色器预处理器不认 version 430]] —— 派生着色器直接构造 IECoreGL::Shader
- [[视口像素对比的差异是 z-fighting 还是几何错误]] —— 先算噪声底再按差异分布分类

### 镜头修复
- [[镜头 UV 错误的修复方法]] —— 删掉重拷、OSL 镜像、三平面投影、固定帧采样
- [[运动模糊异常的修复方法]] —— 借速度、冻结姿势、子帧位移、删错 velocity、按帧段应用
- [[standin 全局缩放后相机裁剪失效]] —— 场景缩放要同步改 clippingPlanes

### Qt
- [[QGraphicsItem 拖动或悬停后留下拖影]] —— boundingRect 没盖住画出去的东西
- [[QPainterPath 重叠区域点不中]] —— 默认 OddEvenFill 挖洞，改 WindingFill
- [[Qt 嵌套 Popup 子窗口收不到鼠标事件]] —— 事件只发最上层，自己按全局坐标派发
- [[Qt 一行两段文字互相遮挡]] —— 先分宽度再各自截断
- [[QScrollArea 内容展开后整列变窄]] —— 固定宽度子控件把内容控件夹窄
- [[QConicalGradient 色轮取色角度错位]] —— 色相是 (360−θ)%360，取色公式要和渲染一致
- [[X11 屏幕取色读到同一个灰色]] —— GL 合成器下读根窗口是假数据，下钻到客户端窗口
- [[X11 取色报 Maximum number of clients reached]] —— display 连接改单例复用

### 其他 DCC
- [[Houdini pythonrc 里没有 __file__]] —— 包根改由环境变量给出
- [[外部 USD 进入 PYTHONPATH 导致 Houdini 崩溃]] —— 核心版 pxr 顶掉 Houdini 自带的那份
- [[Nuke 枚举 knob 写错值不报错]] —— setValue 静默保持原值，先查 values()
- [[Nuke setAnimated 只给第一个分量打关键帧]] —— 按 arraySize() 逐分量 setAnimated
- [[Nuke -t 模式传不进带值的脚本参数]] —— 裸数字被当成帧范围，改走环境变量
- [[OpenCue 查询参数被静默忽略]] —— 按 proto 实际字段改写查询
- [[OpenCue 帧日志路径找不到]] —— rqlog 在按层分的子目录里
- [[UE MCP 服务只监听本机无法远程连接]] —— 监听地址写死 127.0.0.1，用反向 SSH 隧道
- [[UE MCP 手动调用 tools list 返回空]] —— 漏带 Mcp-Session-Id；tools/call 结果是 SSE 单帧
- [[MCP 工具在会话中途启动 DCC 后接不上]] —— 工具只在会话启动时挂载

### 编译与环境
- [[gcc 9 编译 OpenUSD 报未知编译选项]] —— 编译器包装脚本滤掉 -Wmismatched-tags
- [[WeKnora 启动卡住不监听端口]] —— DuckDB 启动时联网装扩展，预放扩展文件
- [[dsh 装 agent-teams 插件后后端起不来]] —— 插件调用已删除的 API，兼容检查误放行
- [[ibus 换了引擎仍然加载旧版本]] —— 组件清单有缓存，重启要 --cache=refresh
- [[contextmanager 里 yield 包 try 报 didn't stop after throw]] —— 收尾放 finally，不要二次 yield

## 综述

### Gaffer 开发
- [[Gaffer 1.6 与 1.7 API 差异]] —— 两个在用版本的 API 与行为差异、各扩展包目标版本
- [[Gaffer 无头测试与截图验证方法]] —— 无头 / screengrab / 真输入三层分工与验证规矩
- [[替换 Gaffer 原生编辑器的方法]] —— 官方注册口、并存加接管、类名替换、局部 patch 四种
- [[在 Gaffer 里另做 Qt 节点图编辑器]] —— 节点图编辑器的整体设计和理由
- [[在 Gaffer 里另做参数面板]] —— 内核复用原生、三级改造、量几何、测试方法
- [[Qt 自绘界面常见坑]] —— 包围盒、重绘、鼠标键盘、窗口样式、测试环境问题汇总
- [[节点图自动排列算法对比]] —— 各步骤实现在 12 张图上的实测对比
- [[Gaffer 视口每帧开销分析]] —— 帧时间拆分测量、开销分布与优化结果

### Gaffer 节点配方
- [[Gaffer Box 处理器脚手架]] —— 团队处理器通用 Box 外壳与界面元数据
- [[Gaffer OSL 几何编辑套路]] —— OSLCode → OSLObject → 删点删面 / 改 P
- [[Gaffer 逐位置动态查询]] —— FilterResults → Collect → Query
- [[Gaffer 按帧门控]] —— 帧区间、指定帧列表、TimeWarp 冻结
- [[Gaffer 查询回写闭环]] —— 查询节点 → Expression → 回写变换
- [[Gaffer Spreadsheet 多实例与参数表]] —— 一行一实例与参数表、稳定随机值
- [[Gaffer 视口辅助物]] —— 只在视口显示的线框辅助物与渲染时去除
- [[Gaffer 程序化几何]] —— Expression 输出 Mesh / Curves 造几何
- [[Gaffer 渲染设置模板]] —— 渲染设置三件套、体积、灯型、双后端输出、测试场景
- [[Arnold AOV 表达式速查]] —— 团队常用光路表达式原文与 cryptomatte 设置
- [[资产与特效 Resolver 模板]] —— SFX / 资产读入链路与 primvar、材质清理
- [[NodeReference 节点案例制作流程]] —— 中文节点文档的模板规格与 7 步流程

### 工具与协作
- [[DCC MCP 桥接架构]] —— gaffer / houdini / nuke 三个 MCP 包共用的结构与差异
- [[与 AI agent 协作的约定]] —— 回复写法、看图方式、先查源码、改代码与文件权限规矩

## 来源
- [[来源 - Claude 全局记忆]] —— 用户的 Claude Code 全局记忆，几个月来各项目实测经验的汇总
