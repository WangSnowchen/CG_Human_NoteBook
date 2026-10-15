---
type: synthesis
aliases: [Gaffer headless testing, Gaffer 验证方法]
tags: [gaffer, testing, screenshot, headless]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer 无头测试与截图验证方法

给 [[Gaffer]] 写扩展、自制编辑器、节点时，实现完成后要自己运行、测试、迭代到正确。下面是在本机反复使用的整套方法（[[来源 - Claude 全局记忆]]）。

## 三层环境，各测各的

| 层 | 命令 | 适合测 | 不适合测 |
|---|---|---|---|
| 无头 Python | `bin/gaffer env python test.py` | 纯逻辑、节点计算、元数据、大部分 GafferUI 控件行为 | gui 启动脚本注册的东西、依赖 GUI 上下文的节点 |
| [[Gaffer screengrab]] | `bin/gaffer screengrab -commandFile x.py -image out.png` | 完整 GUI 上下文（启动脚本全跑过）、截图出图、真实布局 | 真实键鼠操作 |
| 真机真输入 | 起 GUI + `xdotool` 模拟键鼠 + 抓屏 | 鼠标抓取、窗口管理器手势、滚轮、拖动等 | — |

无头命令（在 Gaffer 安装目录下）：

```bash
cd /mnt/centralizedRepo/third_party/gaffer/linux/1.6.5.1 && \
  rez-env pj2023dy001 python==3.11 gaffer==1.6.5.1 gaffer_usd_stage -- \
  ./bin/gaffer env python /path/to/test.py
```

需要 opencue 之类 rez 提供的 PYTHONPATH 又需要 Gaffer 时，两者要同时在：rez 环境 + 安装目录里的 `bin/gaffer env python`。

### 无头层的已知假象

- `gaffer env python` 不跑 gui 启动脚本：`nodeGadget:color` 全是 None、NodeMenu 是空的、本地扩展加载不到，这些都不是回归。
- 部分节点无头构造直接 SIGABRT，只能放到 screengrab 测，见 [[Gaffer 无头环境创建某些节点直接崩溃]]。
- 控件不放进可见窗口时 LazyMethod 更新永远不跑，见 [[GafferUI LazyMethod]]。测试前 `window.setVisible( True )` + `GafferUI.EventLoop.waitForIdle()`。
- 无头 Qt 测试带 `QT_QPA_PLATFORM=offscreen`（不带时 `Qt.Popup` 的 `isVisible()` 在真 X11 上不稳定）；offscreen 虚拟屏只有 800x800，大窗口一半在屏外，位置断言用同一套计算函数算期望值；offscreen 不支持窗口遮罩（`setMask` 的值能读回、效果只能真机验）。
- 没有 GPU 的环境加 `LIBGL_ALWAYS_SOFTWARE=1`；裸 `bin/python3` 缺图形资源时设 `GAFFERUI_IMAGE_PATHS=$GAFFER/graphics`。
- 已在运行的主事件循环里（例如经 `executeOnUIThread` 派发的代码）调 `EventLoop.waitForIdle()` 会 assert 失败，改用 `QtWidgets.QApplication.processEvents()` 泵事件。
- offscreen 下 `QGraphicsScene` 偶尔不为合成的按下事件建立鼠标抓取，合成事件测拖动会随机失败。

## 报告文件规矩

screengrab 和真机测试都靠脚本写报告文件判断结果：

1. 脚本开头先删旧报告（`rm -f /tmp/xxx_report.txt` 或在脚本里删）。
2. **报告条数和上一轮完全一样 = 脚本中途抛出了异常**：跑到最后才一次性写文件的脚本，中途崩溃就不会重写，读到的是上一轮的旧报告，看起来像「新断言没生效」。常见原因是新断言引用了后面才定义的变量、少了 import、循环变量覆盖了前面的同名对象。
3. 不要把 stderr 丢进 `/dev/null`；读数字前先 `grep -c Traceback`。
4. 诊断脚本每段探测各自 try/except，一段出错不抹掉整份报告。
5. 测试跑完先确认跑到了结尾，再看 PASS / FAIL 数。

screengrab 的 commandFile 还要注意 `__name__` 不是 `"__main__"`，见 [[Gaffer screengrab 的 commandFile 主逻辑不执行]]。

## 先确认运行的是哪一份代码

- 同一模块常有 rez 包和本地扩展两份副本，测试前在 commandFile 里打印 `sys.modules["<模块>"].__file__`，见 [[改了 rez 包但运行的还是本地扩展副本]]。
- 扩展只在启动时 import 一次，关掉再开编辑器面板不会重载，改了代码要重启 Gaffer。
- 测试脚本拷到别的目录运行时，按 `__file__` 拼的 `sys.path` 会失效，脚本在第一句 import 就崩溃；只数错误条数会把「崩了」误读成「干净」。

### 不重编译 Gaffer 验证对自带 Python 源码的改动

Gaffer 启动时把自带 `python/` 插到 `sys.path` 最前面，单设 `PYTHONPATH` 覆盖不了。做法：建一个**符号链接影子包**（除了要改的文件，其余全部软链回原目录），再用 `sitecustomize.py` 在解释器启动时 `sys.path.insert( 0, overlay )`；用 `sys.modules["GafferUI.NodeEditor"].__file__` 确认命中了影子包。

## 证明测试抓得住问题（oracle）

把整个包拷一份，在副本里**只还原这次的改动**，跑同一份新测试：

- 新测试在副本上应当失败、在正式代码上通过，证明测试真能抓住这个问题。
- 副本的总断言条数应与主干一样多；少了说明测试文件没同步进副本。
- 遇到不确定是否自己引入的噪声（随机失败、少几条），先在原始代码副本上跑同一份测试，数字一样就不是这次改动造成的。
- 多个会话并行改同一批文件时，先看 `ls -l` 的 mtime 再判断是谁弄坏的。

## 截图与像素验证

- 截图交给人看，脚本自己的判断依据是报告文件和像素统计，不靠「看图」。
- GL 视图（GraphEditor / Viewer）离屏渲染再读像素，见 [[Gaffer screengrab 抓 GL 视图内容随机错乱]]；节点图取景见 [[Gaffer 节点图截图节点太小看不清]]；菜单、tooltip 见 [[Gaffer screengrab 抓不到右键菜单]]。
- **「有没有画出来」要开 / 关两张图逐像素比**，差异集中在预期区域才算数；拿旧图比会全图都在变。
- 几何断言证明不了「画出来了」：`paint()` 里抛出的异常会被 Qt 吞掉，几何全对而内容没画。要真渲染一次数亮像素。
- 残影类问题（拖影、残迹）只能在真屏幕上验：`screen.grabWindow()` 抓屏幕上实际显示的内容，再和强制 `repaint()` 后的结果逐像素比；`widget.grab()` 每次都重新渲染，永远是干净的。
- 「闪一下」类问题用毫秒级抓帧：`QTimer( 1ms )` + `widget.grab()`（约 3ms 一帧），逐帧和最终画面比差异比例。`screen.grabWindow()` 约 12ms 一帧，会把几十毫秒的重建整个跳过。结构快照、重绘计数这类间接指标只能证明「某个机制没动」。
- 抗锯齿的细线像素颜色是混过的，按色相偏向判断（例如红减蓝 > 40），并只在目标线所在的列上取样。

## 真机真输入

- 合成 QMouseEvent 测不到窗口管理器抢走的手势（如 Alt + 右键）、Qt 的隐式鼠标抓取、`ItemIsMovable` 这类 item 标志，必须用 `xdotool` 真按：

```bash
xdotool keydown alt mousedown 3 mousemove 900 500 mousemove 950 480 mouseup 3 keyup alt
xdotool click 4    # 滚轮向上；click 5 向下
```

- 真输入脚本里右键点到节点会弹出原生 QMenu、阻塞事件循环，后续断言全部失败；右键点空白处。
- 窗口被移到副屏时，用 `primaryScreen().grabWindow()` 抓会失败，这类「平移不留残迹」断言天生不稳定，失败时原地重跑确认。

## 卡死诊断

`faulthandler.dump_traceback_later( 12, repeat=True, file=sys.stderr )` 定时打印所有线程的栈（本机 ptrace 受限，gdb 用不了），见 [[Gaffer 自制 Editor 同步重建界面导致卡死]]。

## 相关

- 实体：[[Gaffer]] —— 被测软件
- 实体：[[Gaffer screengrab]] —— GUI 上下文测试与截图工具
- 实体：[[gaffer_mcp]] —— 无头测试 + 协议测试 + 真机端到端三层的实例
- 实体：[[ofGafferExt]] —— 本地扩展只在 GUI 上下文加载
- 实体：[[gaffer_network_editor]] —— 真输入、残迹、像素统计等方法的主要实践
- 实体：[[gaffer_parameter_editor]] —— 毫秒抓帧与 oracle 副本的实践
- 实体：[[gaffer_zh_docs]] —— 节点文档出图沿用这套截图方法
- 概念：[[GafferUI LazyMethod]] —— 无头测试要先显示控件
- 问题：[[Gaffer screengrab 的 commandFile 主逻辑不执行]] —— commandFile 的执行上下文
- 问题：[[Gaffer screengrab 抓 GL 视图内容随机错乱]] —— GL 视图离屏抓取
- 问题：[[Gaffer screengrab 抓不到右键菜单]] —— 弹窗截图
- 问题：[[Gaffer 节点图截图节点太小看不清]] —— 节点图取景
- 问题：[[Gaffer 无头环境创建某些节点直接崩溃]] —— 无头层的限制
- 问题：[[Gaffer 信号回调多写一个形参后静默无效]] —— 测试里直接发信号时同样要匹配签名
- 问题：[[Gaffer 自制 Editor 同步重建界面导致卡死]] —— 卡死诊断与断言前等空闲
- 问题：[[Gaffer Group 同名输入合并后为空]] —— 搭测试场景的坑
- 问题：[[改了 rez 包但运行的还是本地扩展副本]] —— 确认运行的是哪份代码
- 问题：[[Gaffer NodeEditor 换节点时面板闪一下]] —— 毫秒抓帧的来历
- 问题：[[QGraphicsItem 拖动或悬停后留下拖影]] —— 残迹要在真屏幕上验
- 问题：[[视口像素对比的差异是 z-fighting 还是几何错误]] —— 视口像素对比的判读方法
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 升级大版本时跑测试的做法
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— 节点图编辑器的测试与出图
- 综述：[[在 Gaffer 里另做参数面板]] —— 参数面板的测试与截图
- 综述：[[NodeReference 节点案例制作流程]] —— 案例的无头断言与三视图截图
- 来源：[[来源 - Claude 全局记忆]]
