---
type: problem
aliases: [NodeEditor flicker, 参数面板闪烁]
tags: [gaffer, gafferui, qt, performance]
applies_to: ["Gaffer 1.6.5.1", "Gaffer 1.7.1.0", "Gaffer 1.8.0"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Gaffer NodeEditor 换节点时面板闪一下

## 现象

在节点图里换选一个节点，[[Gaffer NodeEditor]] 整个正文区闪一下。毫秒级抓帧（面板 760x678）测到：换节点后有 **2 个中间帧（约 25ms）**，和最终画面分别差 24.6% / 20.8%，差异覆盖整个正文、整行整行不同。中间帧里个别行落在默认位置（某行 y 从 235 跳到 596 再回 235），整体平移比对也对不上（[[来源 - Claude 全局记忆]]）。

## 原因

原生固有行为，和自定义代码、团队包无关。干净环境（`HOME=/tmp/cleanhome`，`GAFFER_STARTUP_PATHS` 只留安装目录）逐帧数字完全一样（同样 2 帧、同样百分比、同样时序；`LayoutRequest 74 / Paint 181` 一个不差）。

调用链：`NodeSetEditor.__lazyUpdate`（`@LazyMethod`）→ `NodeEditor._updateFromSet` → `NodeUI.create( node )` + `__nodeUIFrame.setChild( ... )`，每次换节点整个 NodeUI 扔掉重建。**控件树建好了，Qt 还没把布局算完就画了一帧**。参数值的懒填充已排除：把 344 个 `PlugValueWidget.__callUpdateFromValues` 全部提前跑完，中间帧一个不少。1.8.0 源码复核过，没修。

## 解决

在 `setChild` 之后、**同一次调用里**，自底向上把新子树的布局跑完：

```python
# 示意：写在 NodeEditor._updateFromSet 里
self.__nodeUIFrame.setChild( nodeUI )
for layout in reversed( self.__nodeUIFrame._qtWidget().findChildren( QtWidgets.QLayout ) ) :
	layout.activate()
```

- `QLayout.activate()` 用子控件当前的 sizeHint，父级先算等于白算，所以要自底向上。`reversed( findChildren(...) )` 是真正的自底向上；按「后代数量」排序得到的是父在子前（自顶向下），不要用。
- `setUpdatesEnabled( False )` 冻结重绘**不起作用**：一次调用内部本来就不会发生绘制。冻结如果跨过事件循环（等 1 / 2 / 3 / 5 轮 idle 再解冻），反而会画出一整块 90% 不对的帧。

现成补丁：

- startup 版：`Music/_scratch/nodeeditor_patch/startup/gui/nodeEditorNoFlash.py`（包一层 `_updateFromSet`，`Tools` 菜单有开关可现场 A/B；文件里额外包了一层冻结，起作用的是布局那步）。
- 源码版：`gaffer_parameter_editor/0.1.0/nodeeditor_no_flicker.patch`（40 行，新增 `__layOut` 静态方法；1.6.5.1 与 1.8.0 该段相同，两边 dry-run 都干净）。说明文档 `gaffer_parameter_editor/0.1.0/NODE_EDITOR_FLICKER.md`。

效果：球 → 球 2 帧 → 1，空表格 → 空表格 1 帧 → 0，球 → 相机 3 帧 → 2，少掉的都是差异最大的那帧。[[gaffer_parameter_editor]] 用同一方法：正文换内容拆成 `__populateBody()` + `__layOutBody()`，抓帧对比球 → 球、球 → 相机都降到 0 帧。

## 验证方法

- **只信毫秒级抓帧 + 和最终画面逐像素比**：`QTimer( 1ms )` + `widget.grab()`（约 3ms 一帧）。`screen.grabWindow()` 约 12ms 一帧，会把约 40ms 的重建整个跳过去。行高快照、重绘计数、Paint 事件里记行高这类间接指标都可能是阴性而画面照样闪。
- 改动要能单独开关（临时环境变量），才能三向对比「没改 / 只改 A / 改 A+B」。
- 判断是不是原生问题，第一步先在原生 NodeEditor 里做同一操作，再用干净 HOME 排除自定义 startup。
- 不重新编译验证 Gaffer 自带 Python 的改动：Gaffer 启动时把自带 `python/` 插到 `sys.path` 最前，光设 `PYTHONPATH` 盖不住。做法是建一个符号链接影子包（除了要改的文件全部软链），在 `sitecustomize.py` 里 `sys.path.insert( 0, overlay )`，再用 `sys.modules["GafferUI.NodeEditor"].__file__` 确认命中的是哪一份。
- 本地扩展在 `Tools > Custom Extensions...` 里开着时，Gaffer 启动已经把模块 import 进 `sys.modules`，探针里 `sys.path.insert` 改不了它；探针第一行先打印 `模块.__file__`。

## 相关

- 实体：[[Gaffer NodeEditor]] —— 出现闪烁的原生面板
- 实体：[[gaffer_parameter_editor]] —— 用同一方法消除闪烁的自制面板
- 概念：[[GafferUI LazyMethod]] —— 重建由它延迟触发
- 问题：[[Gaffer 自制参数面板里大控件被拉高或压扁]] —— 表格节点中间帧行被撑高的另一个闪烁来源
- 综述：[[在 Gaffer 里另做参数面板]] —— 换内容的整体流程
- 综述：[[Gaffer 无头测试与截图验证方法]] —— 抓帧与截图验证
- 综述：[[Gaffer 1.6 与 1.7 API 差异]] —— 这段代码 1.6 到 1.8 都没变
- 来源：[[来源 - Claude 全局记忆]]
