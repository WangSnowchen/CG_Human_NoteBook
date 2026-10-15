---
type: synthesis
aliases: [Qt custom painting pitfalls, QGraphicsView 常见坑]
tags: [qt, ui]
applies_to: []
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# Qt 自绘界面常见坑

在 [[Qt]] 里用 QGraphicsView / QPainter 自绘界面时反复遇到的问题，来自 [[gaffer_network_editor]] 的实现过程，大多和 Gaffer 无关、换个项目也成立。

## 包围盒与命中

- **`boundingRect()` 要盖住所有画出去的东西**：卡片外的角标、注释、描边外溢的半个画笔宽度。随缩放（lod）放大的绘制必须夹上限，因为包围盒只能在 `prepareGeometryChange()` 之后改。详见 [[QGraphicsItem 拖动或悬停后留下拖影]]。
- **`shape()` 自己写，别跟着 `boundingRect()`**：悬停时放大的包围盒会把旁边节点的点击和拖放都吃掉。
- **拼接 `QPainterPath` 用 `WindingFill`**：默认 `OddEvenFill` 把重叠处挖成洞。详见 [[QPainterPath 重叠区域点不中]]。
- **画在 `shape()` 外的东西点不中**：`scene.items(rect)` 默认按 shape 判断，需要能点的小部件把命中框加进 `shape()`，或在光标周围再捞一遍。
- **缓存几何的作废顺序**：先 `prepareGeometryChange()`，再清 `boundingRect` / `shape` 缓存。
- 同时改尺寸和位置时手动 `scene.update(旧区域)`。
- `setBspTreeDepth(16)`：Qt 自动深度按整个 sceneRect（含大余量）切，整张图挤在一两个叶子里，`items(QPoint)` 从 123µs 降到 23µs。

## 重绘

- 视口用 `SmartViewportUpdate` + `CacheBackground`；`FullViewportUpdate` 会让改一根线重绘整屏。
- `setSceneRect` 会让整个视口失效，没变就不设；拖动中不设。
- 给 item 开 `DeviceCoordinateCache` 不划算：平移一帧只从 11ms 降到 7.3ms，代价是每个 item 一张 pixmap、缩放时全部失效。
- **`paint()` 里抛的异常会被 Qt 吞掉**（只在日志刷一行），几何断言照样全绿、东西却没画；必须真渲染出图数亮像素。
- 1px 分隔线开抗锯齿会淡到看不见；1px 虚线 + 抗锯齿抓图后颜色是混过的，按「偏某种颜色」判断，不按精确颜色。
- `QFontMetricsF.height()` 是浮点，直接当矩形高会切掉 `g` / `y` 的下伸笔画和中文下半格，用 `ceil(height) + 3`。
- `horizontalAdvance()` 和实际排版差一两像素，宽度正好等于文字宽时会被加省略号，留 3px 余量。见 [[Qt 一行两段文字互相遮挡]]。

## 鼠标与键盘

- **自己管选择时，Qt 在按下和松手两处都会插手**（`clearSelection`、「没移动就只留一个」），前后各记一次再恢复；恢复期间暂停「写回外部选择」，否则选择顺序会被换掉。测试要断言顺序，`sorted()` 和 `len()` 抓不到。
- **拖动期间不重建 item**：Qt 的隐式鼠标抓取跟着 item 一起没了。
- **`ItemIsMovable` 漏设**时 Qt 照样接受按下、进入拖动模式，只是 item 不动；合成事件测试抓不到，只有真鼠标测得出。
- **方向键、PageUp/Down、Home/End 是 `QAbstractScrollArea` 的滚动键**，自己处理完要吞掉，否则画面会跟着滚。
- **按键自动重复**会打断「按住某键」的交互：`keyPressEvent` 和 `keyReleaseEvent` 两边都要 `if event.isAutoRepeat(): return`。只有真键盘长按测得出。
- **X11 上右键一按下就发 `ContextMenuEvent`**：做右键拖动手势（如 Alt+右键缩放）时，在 `contextMenuEvent` 里判断手势状态或修饰键，直接 accept 返回。窗口管理器还可能把 Alt+右键抢去改窗口大小。
- `AnchorUnderMouse` 锚的是 `lastMouseMoveScenePoint`，只有基类 `mouseMoveEvent` 才更新它；自己处理了平移就要自己算缩放锚点。
- 嵌套 `Qt.Popup` 的事件派发见 [[Qt 嵌套 Popup 子窗口收不到鼠标事件]]。

## 窗口与样式

- `QtGui.QGuiApplication` 在 `Qt.py` 兼容层里不存在，找屏幕用 `QtWidgets.QApplication.screenAt()`。
- QSS 的 `border-radius` 只作用于自身那一层，子控件会把四个角填成直角；要圆角窗口再加遮罩：`QPainterPath.addRoundedRect` → `QPolygon` → `QRegion` → `setMask`，尺寸变了重新切遮罩。
- `QRect.width() == right() - left() + 1`，夹最小尺寸时那个 `±1` 不能省。
- 自己加的临时 item（划线虚线、拖拽中的连线）会被 `scene.clear()` 销毁，重建前把引用置 None，访问时防 `RuntimeError`。
- 自定义 item 别用 `setActive` / `isActive` 这两个名字，`QGraphicsItem` 自带。
- 抓 `QToolTip`：`showText()` 后 `processEvents()` 泵约 1 秒、不关掉再抓；判断有没有拍到要开 / 关两张图逐像素比。
- delegate 里画 `State_MouseOver` 会在收不到事件的窗口里留高亮残留，用「当前行」表示悬停。

## 测试环境

- 无头用 `QT_QPA_PLATFORM=offscreen`；offscreen 不支持窗口遮罩、虚拟屏只有 800x800（大窗口会被夹回屏幕内）、偶尔不建立鼠标抓取，拖动类测试别依赖它。
- 计数类性能测试先泵到「一帧都不画」再计数，首帧和异步结果那一拍都会整屏重绘。
- 残影类问题只能比较屏幕真实内容（`screen.grabWindow()`）和强制 `repaint()`；`widget.grab()` 每次都重新渲染。窗口在副屏而用 `primaryScreen()` 抓会误报。

## 其他软件里的同类问题

- [[QScrollArea 内容展开后整列变窄]]：竖排布局最大宽度取子项最小值，把内容控件夹窄。
- [[QConicalGradient 色轮取色角度错位]]：渲染方向和交互取色公式要一致。

## 相关

- 实体：[[Qt]] —— 本页讲的界面库
- 实体：[[gaffer_network_editor]] —— 这些坑的出处
- 问题：[[QGraphicsItem 拖动或悬停后留下拖影]] —— 包围盒
- 问题：[[QPainterPath 重叠区域点不中]] —— 填充规则
- 问题：[[Qt 嵌套 Popup 子窗口收不到鼠标事件]] —— 嵌套 popup
- 问题：[[Qt 一行两段文字互相遮挡]] —— delegate 文字排版
- 问题：[[QScrollArea 内容展开后整列变窄]] —— 布局最大宽度
- 问题：[[QConicalGradient 色轮取色角度错位]] —— 渐变方向
- 问题：[[Gaffer 自制参数面板里大控件被拉高或压扁]] —— 行的尺寸约束和 stretch 分配
- 综述：[[在 Gaffer 里另做 Qt 节点图编辑器]] —— Gaffer 侧的设计
- 来源：[[来源 - Claude 全局记忆]]
