---
type: entity
aliases: [screengrab, gaffer screengrab]
tags: [gaffer, testing, screenshot]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer screengrab

[[Gaffer]] 源码自带的截图应用（`apps/screengrab/screengrab-1.py`），能在完整 GUI 上下文里跑一段 Python 命令文件，再把指定控件抓成 PNG。无头环境里需要 GUI、需要截图、需要验证界面行为时都用它，不另写截图工具（[[来源 - Claude 全局记忆]]）。

## 要点

- 抓图核心是 `python/GafferUI/WidgetAlgo.py` 的 `grab( widget, imagePath )`：主事件循环还没跑时先 `waitForIdle()`，自动建输出目录，用 Qt `screen.grabWindow( winId )` 抓。
- `_run()` 先执行全部 gui 启动脚本（自定义编辑器、扩展都已装好），再建 ScriptWindow，所以命令文件里能用到启动脚本注册的一切东西。
- 命令文件上下文里有 `application` 和 `script`（根 ScriptNode）。
- 命令文件按 `exec` 执行，`__name__` 是 `'builtins'`，带 `if __name__ == "__main__":` 守卫的主逻辑不会执行，见 [[Gaffer screengrab 的 commandFile 主逻辑不执行]]。
- 命令文件里没有 `__file__`。
- 验证结果一律由命令文件写报告文件 + 抓 PNG，交给人看图；脚本本身靠报告文件判断对错。

## 用法 / 关键参数

在 Gaffer 安装目录下、带上 rez 环境运行：

```bash
bin/gaffer screengrab -commandFile /tmp/xxx.py -image /tmp/out.png
```

Gaffer 命令行标志是单横线（`-commandFile`），不是 `--`。

| 参数 | 作用 |
|---|---|
| `-commandFile` | 截图前执行的 Python 文件 |
| `-image` | 输出 PNG 路径 |
| `-delay N` | 截图前沉淀 N 秒 |
| `-editor <模块.类名>` | 抓 layout 里已有的某个编辑器（先在 commandFile 里加进 layout） |
| `-panel` | 抓编辑器外围面板 |
| `-scene.expandedPaths "/a/b"` | HierarchyView 展开路径（commandFile 里展开会被清掉） |
| 不加目标 | 抓整个窗口 |

命令文件里选目标：`application.setGrabWidget( widget )` 可以抓任意 GafferUI 控件。抓浮动窗口前常配一个短暂停（`EventLoop.waitForIdle(1)` 循环约 0.1 秒）+ `window.parent()._qtWidget().resize( w, h )` 固定尺寸。

几类目标的抓法：

- **HierarchyView**：`script.setFocus( node )` + 命令行 `-editor GafferSceneUI.HierarchyView -scene.expandedPaths "/a/b" ...`。不能在 commandFile 里 `expandInVisibleSet`，screengrab 之后会 `setVisibleSet( script, VisibleSet() )` 清空，展开只能走命令行参数。
- **NodeEditor**：`GafferUI.NodeEditor.acquire( node, floating=True )` + `_qtWidget().setFocus()` + `setGrabWidget`。
- **GraphEditor / Viewer 这类 GL 视图**：直接 grab 有竞态，要离屏渲染再读像素，见 [[Gaffer screengrab 抓 GL 视图内容随机错乱]]；节点太小时见 [[Gaffer 节点图截图节点太小看不清]]。
- **右键菜单 / 弹窗**：见 [[Gaffer screengrab 抓不到右键菜单]]。
- **Viewer 工具条**：自己建 `GafferUI.Viewer( script )` 放进可见 `GafferUI.Window` 再 show，比用默认布局里的 Viewer 可靠，见 [[Gaffer Catalogue]]。

Gaffer 1.7 下 `~/gaffer/startup/screengrab/layouts.py` 生成的布局为空，要抓 GraphEditor 得在命令文件里自己建（[[来源 - Claude 全局记忆]]）。

## 注意事项

- 离屏 `grabWindow` 会渲染「还没布局但已经 setText」的过期内容，不能拿截图判断 Qt 可见性；判断可见性要 `window._qtWidget().show()` + `waitForIdle` 后查 `widget._qtWidget().isVisibleTo(...)`，见 [[Gaffer Overlay]]。
- `setFocus` / reveal 信号回调偶尔报 EventSignalCombiner / WeakMethod 错误，截图字节正常，不影响结果。
- 某些节点在 `gaffer env python` 里构造就崩溃，只能在 screengrab 里验证，见 [[Gaffer 无头环境创建某些节点直接崩溃]]。
- 前台 GUI 带 timeout 退出码是 0；可靠后台启动用 `setsid nohup rez-env ... < /dev/null &`。

## 常见问题

- [[Gaffer screengrab 的 commandFile 主逻辑不执行]]
- [[Gaffer screengrab 抓 GL 视图内容随机错乱]]
- [[Gaffer screengrab 抓不到右键菜单]]
- [[Gaffer 节点图截图节点太小看不清]]
- [[Gaffer 无头环境创建某些节点直接崩溃]]

## 相关

- 实体：[[Gaffer]] —— 所属软件
- 实体：[[Gaffer Catalogue]] —— 抓 Viewer 工具条要自己建 Viewer
- 实体：[[gaffer_zh_docs]] —— 节点文档的出图工具
- 实体：[[gaffer_custom_node]] —— 包的界面测试用 screengrab
- 实体：[[Gaffer NodeEditor]] —— 抓参数面板要 `acquire( node, floating=True )` 再 `setGrabWidget`
- 概念：[[ViewportGadget]] —— GL 视图离屏抓取要用它渲染和换算坐标
- 概念：[[Gaffer Overlay]] —— 离屏抓图不能判断 overlay 控件是否可见
- 问题：[[Gaffer screengrab 的 commandFile 主逻辑不执行]] —— `__name__` 不是 `"__main__"`
- 问题：[[Gaffer screengrab 抓 GL 视图内容随机错乱]] —— grabWindow 与 GL 合成有竞态
- 问题：[[Gaffer screengrab 抓不到右键菜单]] —— QMenu 要事件循环真正跑起来才绘制
- 问题：[[Gaffer 节点图截图节点太小看不清]] —— frame 有缩放上限
- 问题：[[Gaffer 无头环境创建某些节点直接崩溃]] —— 这类节点只能在 screengrab 里验证
- 问题：[[相机分辨率门外的物体仍在绘制]] —— 验证时要设 `minimumExpansionDepth`
- 问题：[[视口像素对比的差异是 z-fighting 还是几何错误]] —— 对比前要把窗口 resize 到固定尺寸
- 综述：[[Gaffer 无头测试与截图验证方法]] —— screengrab 在整套验证方法里的位置
- 综述：[[NodeReference 节点案例制作流程]] —— 节点文档的三视图截图靠 screengrab
- 来源：[[来源 - Claude 全局记忆]]
