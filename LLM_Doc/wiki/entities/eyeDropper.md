---
type: entity
aliases: [吸管, 屏幕取色, eye dropper]
tags: [gaffer, qt, color, x11, ctypes]
applies_to: ["Gaffer 1.6.5.1"]
sources: ["[[来源 - Claude 全局记忆]]"]
human_notes: []
status: active
created: 2026-10-15
updated: 2026-10-15
---

# eyeDropper

[[ueColorChooser]] 里的跨软件屏幕取色模块，约 200 行纯 Python，用 ctypes 调系统库，不依赖第三方包。按住吸管拖到任何软件窗口上实时预览颜色，松开提交（[[来源 - Claude 全局记忆]]）。

## 各平台后端

- **Linux / X11**：ctypes 调 libX11。`XQueryPointer( root )` 拿到光标下的子窗口，沿 reparent 链往下钻到真正的客户端窗口，再对该窗口 `XGetImage( win, 局部坐标, 1x1, ZPixmap )`。直接读根窗口在 GL 合成器下拿到的是假数据，见 [[X11 屏幕取色读到同一个灰色]]。display 连接做成进程级单例复用，见 [[X11 取色报 Maximum number of clients reached]]。
- **Windows**：ctypes `GetDC( HWND_DESKTOP )` + `GetPixel`（UE 那 10 行的直译）。
- **macOS**：pyobjc ScreenCaptureKit，需要「屏幕录制」权限，约 50ms 一次（UE 官方 Mac 实现也是这个速度），列为尽力而为。
- `QScreen.grabWindow` 不可用：X11 下抓根窗口同样被合成器影响，macOS 不支持。

## 交互（照 UE）

- 点吸管 → 按住移动实时预览 → 松开提交；按 Esc 取消并还原。
- Qt **不需要显式抓取鼠标**：按下后系统自动隐式抓取（X11 是 XGrabPointer，Windows 是 SetCapture，macOS 是 Cocoa 的 mouseDragged 语义）。按住期间移出窗口，移动和松开事件仍送到本进程，**松开那一下被吞掉，不会点到下面的软件**。
- 配一个约 30ms 的 `QTimer` 轮询 `QCursor.pos()` 并采样，实现实时预览。
- X11 按住期间 Esc 仍送到聚焦窗口，用 `QShortcut` 或事件过滤器捕获。

## 颜色空间

屏幕像素是 sRGB 8bit，Gaffer 插口存线性值（imath）→ 提交时做 sRGB → 线性的分段解码（UE 用的是 `FromPow22Color`）。

## 已知局限

同类实现都有：

- GPU / DirectX / OpenGL 直绘的窗口可能读到黑色或旧帧（UE 也一样）。
- Wayland 原生窗口（非 XWayland，如浏览器）读不到。
- 多显示器 HiDPI 下坐标要乘 `devicePixelRatio`。

## 常见问题

- [[X11 屏幕取色读到同一个灰色]]
- [[X11 取色报 Maximum number of clients reached]]

## 相关

- 实体：[[ueColorChooser]] —— 使用本模块的拾色器
- 实体：[[Qt]] —— 交互依赖 Qt 的隐式鼠标抓取
- 问题：[[X11 屏幕取色读到同一个灰色]] —— 要读客户端窗口
- 问题：[[X11 取色报 Maximum number of clients reached]] —— display 连接要复用
- 来源：[[来源 - Claude 全局记忆]]
